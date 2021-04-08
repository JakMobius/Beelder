import BundlerPlugin from "./bundler-plugin"
// @ts-ignore
import incremental from "browserify-incremental"
import exorcist from "exorcist"
import {concatOptionalArrays, prepareFileLocation} from "../utils";
import * as fs from "fs";
import {BundlerPluginConfig} from "./bundler-plugin";
import BundlerPluginFactory from "./bundler-plugin-factory";
import BundleJavascriptAction from "../schemes/bundle-javascript"
import BuildCache from "../build-cache";
import Packer from "./packer/packer";
import { Timings } from "..";
import BeelderReference from "../reference";
import BeelderScheme from "../scheme";

export interface BundlerConfig {
    scheme: BeelderScheme

    source: string;
    destination: string;
    projectRoot: string;

    babelPlugins?: any[]
    babelPresets?: any;
    babelSourceType?: "script" | "module";
    generateSourceMaps?: boolean;
    debug?: boolean;
    cache: BuildCache;
    externalLibraries?: string[];

    plugins?: BundlerPluginConfig[]
    buildAction?: BundleJavascriptAction
    extensions?: string[]
}

/**
 * A class that generalises TypeScript compilation.
 */

export default class Bundler {
    public readonly config: BundlerConfig;
    public plugins: BundlerPlugin[] = [];
    packer: Packer
    scheme: BeelderScheme;

    constructor(config: BundlerConfig) {
        this.config = config

        if(!this.config.extensions) this.config.extensions = [".ts", ".ts", ".json"]
        if(!this.config.babelSourceType) this.config.babelSourceType = "module"
        if(!this.config.babelPresets) this.config.babelPresets = this.getDefaultBabelifyPresets()

        this.scheme = config.scheme
        this.packer = this.createPacker()
        this.loadPlugins()
    }

    loadPlugins(): void {
        if(!this.config.plugins) return;

        for(let pluginConfig of this.config.plugins) {
            let plugin = BundlerPluginFactory.getPlugin(pluginConfig)
            if(!plugin) throw new Error("Plugin not found: " + pluginConfig.plugin)
            this.plugins.push(plugin)
            plugin.setCompiler(this)
        }
    }

    private createPacker(): Packer {
        return new Packer(this, {
            babelTransformConfig: {
                plugins: this.getBabelPluginList(),
                presets: this.config.babelPresets,
                sourceMaps: this.config.generateSourceMaps,
                sourceType: this.config.babelSourceType,
            },
            extensions: this.config.extensions
        })
    }

    private getDefaultBabelifyPresets() {
        return [
            ['@babel/preset-env', {
                "debug": this.config.debug,
                "targets": "node 7"
            }]
        ]
    }

    async build() {
        if(this.config.destination) {
            let stream = await this.packer.bundleSubtree(this.config.source)
            await this.listen(stream)
            //stream.pipe(fs.createWriteStream(this.config.destination))
        } else {
            await this.packer.rebuildSubtree(this.config.source)
        }

        Timings.begin("Saving cache")
        await this.packer.cache.saveCaches()
        Timings.end()
    }

    private getBabelPluginList(): any[] {

        // Default plugin list
        let result: any[] = [
            ["@babel/plugin-syntax-class-properties"],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
            ["@babel/plugin-transform-typescript"],
            ["@babel/plugin-transform-runtime"],
        ]

        result = concatOptionalArrays(result, this.config.babelPlugins)

        for (let plugin of this.plugins) {
            let babelPlugins = plugin.getBabelPlugins()
            if (babelPlugins) result = result.concat(babelPlugins)
        }

        return result;
    }

    private listen(stream: NodeJS.ReadableStream): Promise<boolean> {
        return new Promise<boolean>((resolve) => {

            let errorHandler = (error: any) => {
                console.error(error.message)
                if(error.annotated) console.error(error.annotated)
                resolve(true)
            }

            if(!prepareFileLocation(this.config.destination)) {
                errorHandler(new Error("Cannot create parent directories for '" + this.config.destination + "'"))
            } else {
                stream.on("error", errorHandler)
                stream = stream.pipe(this.getExorcist())
                stream.on("error", errorHandler)
                let writeStream = fs.createWriteStream(this.config.destination)
                stream.pipe(writeStream)
                writeStream.on("error", errorHandler)
                writeStream.on("close", resolve)
            }
        })
    }

    private getExorcist() {
        return exorcist(
            this.config.destination + ".map",
            null,
            this.config.projectRoot,
            this.config.projectRoot
        )
    }

    getTargets(): BeelderReference[] | null {
        let result: BeelderReference[] | null = null

        for(let plugin of this.plugins) {
            result = concatOptionalArrays(result, plugin.getTargets())
        }

        return result
    }

    getDependencies(): string[] | null {
        let result: string[] | null = null

        for(let plugin of this.plugins) {
            result = concatOptionalArrays(result, plugin.getDependencies())
        }

        return result
    }
}