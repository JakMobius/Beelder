
import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";
import Timings from "../timings";
import Bundler from "../javascript-bundler/bundler";

export interface BundleJavascriptActionConfig extends BaseActionConfig {
    compilerOptions: any
}

export default class BundleJavascriptAction extends BaseAction {

    static readonly actionName: string = "bundle-javascript"
    private compilerOptions: any;

    constructor(config: BundleJavascriptActionConfig, scheme: BeelderScheme) {
        super(config, scheme);
        
        this.compilerOptions = config.compilerOptions
    }

   async runCompiler() {

        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)

        let compilerOptions = {
            source: source,
            destination: destination,
            cacheFile: this.scheme.beelder.getAbsolutePath("beelder-cache/browserify-cache.json"),
            projectRoot: this.scheme.beelder.projectRoot
        }

        if (this.compilerOptions) {
            Object.assign(compilerOptions, this.compilerOptions)
        }

        let bundler = new Bundler(compilerOptions);

        await bundler.build()

    }

    async run() {
        let sourceName = this.source.getConsoleName();

        Timings.begin("Building " + sourceName)

        await this.runCompiler()

        Timings.end("Finished building " + sourceName)
    }
}