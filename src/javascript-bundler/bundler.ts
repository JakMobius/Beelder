import Plugin from "./plugin"
import Babelify from 'babelify'
// @ts-ignore
import incremental from "browserify-incremental"
import browserify from "browserify"
import exorcist from "exorcist"
import {prepareFilePath} from "../utils";
import * as fs from "fs";

export interface BundlerConfig {
    source: string;
    destination: string;
    projectRoot: string;

    babelPresets?: any;
    babelSourceType?: "script" | "module";
    generateSourceMaps?: boolean;
    debug?: boolean;
    cacheFile?: string;
    externalLibraries?: string[];
}

export default class Bundler {
    public readonly config: BundlerConfig;
    public plugins: Plugin[] = [];
    public babelify: (filename: string) => Babelify.BabelifyObject;
    public browserify: browserify.BrowserifyObject;

    constructor(config: BundlerConfig) {
        this.config = config
    }

    plugin(plugin: Plugin) {
        plugin.setCompiler(this)
        this.plugins.push(plugin)
        return this
    }

    private createBabelify(): (filename: string) => Babelify.BabelifyObject {
        return Babelify.configure({
            plugins: this.getBabelPluginList(),
            presets: this.config.babelPresets ?? this.getDefaultBabelifyPresets(),
            sourceMaps: this.config.generateSourceMaps,
            sourceType: this.config.babelSourceType ?? "module",
            extensions: ['.ts', '.js']
        })
    }

    private createBrowserify() {
        let config = Object.assign({}, incremental.args, {
            paths: [this.config.projectRoot + "/"],
            extensions: ['.ts'],
            detectGlobals: false
        })

        let result = browserify(config, { debug: this.config.debug });

        if(this.config.externalLibraries) {
            for (let externalLibrary of this.config.externalLibraries) {
                result.external(externalLibrary)
            }
        }

        for(let plugin of this.plugins) {
            let pluginList = plugin.getBrowserifyPlugins()

            if(pluginList) for(let plugin of pluginList) {
                result.plugin(plugin)
            }
        }

        return result
    }

    private getDefaultBabelifyPresets() {
        return [
            ['@babel/preset-env', {
                "debug": this.config.debug,
                "targets": "node 7"
            }]
        ]
    }

    private emitPluginEvent(event: string) {
        for(let plugin of this.plugins) {
            plugin.emit(event);
        }
    }

    async build() {
        this.babelify = this.createBabelify()
        this.browserify = this.createBrowserify()

        this.emitPluginEvent("init");

        this.browserify.transform(this.babelify)
        this.browserify.require(this.config.source, { entry: true })

        this.emitPluginEvent("beforebuild");

        let wasError = await this.listen(this.browserify.bundle())

        this.emitPluginEvent("afterbuild");

        if(wasError) {
            throw new Error("Build finished with errors")
        }

    }

    private getBabelPluginList(): any[] {

        // Default plugin list
        let result: any[] = [
            ["@babel/plugin-syntax-class-properties"],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
            ["@babel/plugin-transform-typescript"],
            ["@babel/plugin-transform-runtime"],
        ]

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

            if(!prepareFilePath(this.config.destination)) {
                errorHandler(new Error("Cannot create parent directories for '" + this.config.destination + "'"))
            } else {
                stream.on("error", errorHandler)
                stream = stream.pipe(this.getExorcist())
                stream.on("error", errorHandler)
                let writeStream = fs.createWriteStream(this.config.destination)
                stream.pipe(writeStream)
                writeStream.on("error", errorHandler)
                writeStream.on("finish", resolve)
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
}