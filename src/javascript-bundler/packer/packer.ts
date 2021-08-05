import Bundler from "../bundler";
import * as babel from "@babel/core";

import path from "path";
import generator from "@babel/generator"

import {Timings} from "../../index";
import AsyncEventEmitter from "../../async-event-emitter";
// @ts-ignore
import mergeSourceMap from 'merge-source-map'
import PackerCache from "./packer-cache";
import PackerFile from "./packer-file";
import PackerASTWatcher from "./packer-ast-watcher";
import {ParseResult} from "@babel/core";

export interface PackerFileCache {
    dependencies?: { [key: string]: string }
    /**
     * AST of file after babel transformations. Should never be modified
     * from bundler plugins.
     */
    originalAst?: babel.types.File | null;
    code?: string | null;
    [key: string]: any
}

export interface CachedPackerConfig {
    babelTransformConfig: babel.TransformOptions,
    extensions: string[],
    includeExternalModules: boolean | string[]
}

export interface PackerBundleFileInfo {
    id: string | number,
    source: string,
    deps?: { [key: string]: string | number },
    entry?: boolean,
    sourceFile?: string
    globalPath?: string
}

export class TraverseContext {
    metFiles: Set<string> = new Set<string>()
    cachedEntriesLoaded: number = 0
    rebuiltEntries: number = 0
    onlyCompilableFiles: boolean = true
}

export class PackerBuildContext extends TraverseContext{
    bundleCache: PackerBundleFileInfo[] = []
}

/**
 * This class provides an interface for transforming files
 */

export default class Packer extends AsyncEventEmitter {
    bundler: Bundler;
    config: CachedPackerConfig;
    babelConfig: Readonly<babel.PartialConfig>;
    cache: PackerCache;
    files: Map<string, PackerFile> = new Map<string, PackerFile>()
    astWatcher: any;
    babelConfigGenerated: boolean;

    constructor(bundler: Bundler, config: { babelTransformConfig: { presets: any; sourceType: "script" | "module"; plugins: any[]; sourceMaps: boolean }; extensions: string[]; includeExternalModules: boolean | string[] }) {
        super()
        this.bundler = bundler
        this.config = config
        this.cache = new PackerCache(this.bundler.config.cache)
        this.astWatcher = new PackerASTWatcher({
            packer: this,
            extensions: this.config.extensions
        })

        this.babelConfigGenerated = false
    }

    private updateBabelConfig(filePath: string) {
        if(!this.babelConfigGenerated) this.generateConfig()
        this.babelConfig.options.filename = filePath
        this.babelConfig.options.sourceFileName = filePath
    }

    /**
     * Transforms given data with provided sourcemap filename
     * @param data Source code to transform
     * @param filePath Path to file for sourcemap (project-relative)
     */
    transformFile(data: string, filePath: string): babel.BabelFileResult {
        this.updateBabelConfig(filePath);
        return babel.transformSync(data, this.babelConfig.options)
    }

    parseFile(data: string, filePath: string): babel.types.File {
        this.updateBabelConfig(filePath);
        return babel.parseSync(data, this.babelConfig.options) as babel.types.File
    }

    private generateConfig() {
        let options = this.config.babelTransformConfig;

        if(!options) return;

        this.babelConfig = babel.loadPartialConfig(options);

        if(!this.babelConfig) return;

        const opts = this.babelConfig.options;

        opts.ast = true
        opts.cwd = this.bundler.config.projectRoot
        opts.caller = { name: "beelder" }
    }

    private sourceMapComment(sourceMap: any) {
        const base64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64');
        return "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + base64;
    }

    /**
     * Generates code from abstract syntax tree
     * @param ast File tree
     * @param filePath Path to file for sourcemap (project-relative)
     * @param originalCode Original file code
     */
    public generateCode(ast: babel.types.File | babel.types.Program, filePath: string, originalCode: string) {
        let generated = generator(ast, {
            sourceMaps: true,
            sourceFileName: filePath,
            sourceRoot: this.bundler.config.projectRoot
        })

        generated.map.sourcesContent = [ originalCode ]

        return generated.code + "\n" + this.sourceMapComment(generated.map)
    }

    async bundleSubtree(entry: string): Promise<PackerBundleFileInfo[]> {

        let context = new PackerBuildContext()
        context.onlyCompilableFiles = false
        await this.traverse(entry, context, (filePath: string, data: PackerFile) => {
            context.bundleCache.push({
                id: filePath,
                source: data.getTransformedCode(),
                deps: Object.assign({ }, data.getDependencies()),
                entry: context.bundleCache.length == 0,
                sourceFile: path.relative(this.bundler.config.projectRoot, filePath),
                globalPath: filePath
            })
        })

        return context.bundleCache
    }

    /**
     * @param entry
     * @returns true if at least one file was modified
     */
    async rebuildSubtree(entry: string): Promise<boolean> {
        Timings.begin("Rebuilding files")
        await this.emit("before-build")
        let context = await this.traverse(entry)
        await this.emit("after-build")
        Timings.end("Finished rebuilding files (had to rebuild " + context.rebuiltEntries + " / " + (context.cachedEntriesLoaded + context.rebuiltEntries) + " files)")
        return context.rebuiltEntries > 0
    }

    public static collapseBundleIDs(cache: PackerBundleFileInfo[]) {
        let fileNames = new Map<string | number, number>()
        let fileIndex = 0

        for(let fileInfo of cache) {
            fileNames.set(fileInfo.id, fileIndex)
            fileInfo.id = fileIndex

            fileIndex++
        }

        for(let fileInfo of cache) {
            for(let [key, value] of Object.entries(fileInfo.deps)) {
                let identifier = fileNames.get(value)
                if (identifier === undefined) continue

                fileInfo.deps[key] = identifier
            }
        }
    }

    /**
     * Get file meta-information and cache
     * @param filePath global file path
     */
    getFile(filePath: string) {
        let file = this.files.get(filePath)
        if(file) return file
        file = new PackerFile(this, filePath)
        this.files.set(filePath, file)
        return file
    }

    shouldWalkFile(path: string) {
        if(path.startsWith(".")) return true

        if(this.config.includeExternalModules === true) {
            return true
        } else if(Array.isArray(this.config.includeExternalModules)) {
            return this.config.includeExternalModules.indexOf(path) != -1
        }
    }

    /**
     * Traverses the project tree with given callback function
     * @param filePath Project entry point to traverse from
     * @param context Traverse context object to store some useful information. May be null
     * @param callback Traverse function which will be called for each project file. May be either sync or async
     */
    public async traverse(filePath: string, context?: null, callback?: (filePath: string, file: PackerFile) => Promise<void>): Promise<TraverseContext>
    public async traverse(filePath: string, context?: null, callback?: (filePath: string, file: PackerFile) => Promise<void>): Promise<TraverseContext>
    public async traverse<T extends TraverseContext>(filePath: string, context?: T, callback?: (filePath: string, file: PackerFile, context: T) => Promise<T>): Promise<void>
    public async traverse<T extends TraverseContext>(filePath: string, context?: T, callback?: (filePath: string, file: PackerFile, context: T) => void): Promise<T>

    public async traverse<T extends TraverseContext | null>(filePath: string, context?: T, callback?: (filePath: string, file: PackerFile, context: T) => any): Promise<T> {

        let tempContext: TraverseContext = context
        if(!tempContext) tempContext = new TraverseContext()
        if(tempContext.metFiles.has(filePath)) return;
        tempContext.metFiles.add(filePath)

        let file = this.getFile(filePath)

        if(file.cacheIsUpToDate()) {
            tempContext.cachedEntriesLoaded++
        } else {
            tempContext.rebuiltEntries++
        }

        if(callback) {
            let result = callback(filePath, file, context)
            if (result instanceof Promise) {
                await result
            }
        }

        // getDependencies method tries to use the most
        // efficient method to fetch file dependencies,
        // but it will rebuild each modified file
        // automatically. See getDependencies
        // documentation
        for(let [name, absolute] of Object.entries(file.getDependencies())) {
            if(!this.shouldWalkFile(name))
                continue;
            if(tempContext.onlyCompilableFiles && !this.getFile(absolute).shouldBeCompiled)
                continue;

            await this.traverse(absolute, tempContext, callback);
        }

        return tempContext as T
    }
}