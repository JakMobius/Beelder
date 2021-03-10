import Plugin from "./plugin"
import Babelify from 'babelify'
// @ts-ignore
import incremental from "browserify-incremental"
import browserify from "browserify"
import exorcist from "exorcist"
import StreamToFile from "./stream-to-file";

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

        let errorCount = await this.listen(this.browserify.bundle())

        this.emitPluginEvent("afterbuild");

        if(errorCount) {
            throw new Error("Build finished with " + errorCount + " error(s)")
        }

    }

    private getBabelPluginList(): any[] {
        let result: any[] = []

        for (let plugin of this.plugins) {
            let babelPlugins = plugin.getBabelPlugins()
            if (babelPlugins) result = result.concat(babelPlugins)
        }

        return result;
    }

    private listen(stream: NodeJS.ReadableStream): Promise<number> {
        stream = stream.pipe(this.getExorcist())

        return new StreamToFile(stream, this.config.destination).on("error", (error) => {
            console.error(error.message)
            if(error.annotated) console.error(error.annotated)
        }).waitUntilComplete()
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