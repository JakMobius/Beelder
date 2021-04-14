
import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";
import Timings from "../timings";
import Bundler from "../javascript-bundler/bundler";
import BeelderReference from "../reference";
import {concatOptionalArrays} from "../utils";

export interface BundleJavascriptActionConfig extends BaseActionConfig {
    compilerOptions: any
}

/**
 * The class that implements bundle-javascript beelder action.
 * This action may be used multiple times in single build action.
 * If "target" field is omitted, project will be rebuilt in order
 * to update caches.
 *
 * The following parameters must be the same in all dependent
 * configurations (which share common source files):
 * - `compilerOptions.babelPlugins`
 * - `compilerOptions.babelPresets`
 * - `compilerOptions.babelSourceType`
 */

export default class BundleJavascriptAction extends BaseAction {

    static readonly actionName: string = "bundle-javascript"
    readonly compilerOptions: any;
    bundler: Bundler;

    constructor(config: BundleJavascriptActionConfig, scheme: BeelderScheme) {
        super(config, scheme);
        
        this.compilerOptions = config.compilerOptions


        this.createBundler()
    }

   async runCompiler() {
        await this.bundler.build()
    }

    getDependencies(): string[] | null {
        return concatOptionalArrays(super.getDependencies(), this.bundler.getDependencies());
    }

    getTargets(): BeelderReference[] | null {
        return concatOptionalArrays(super.getTargets(), this.bundler.getTargets());
    }

    async run() {
        let sourceName = this.source.getConsoleName();

        Timings.begin("Building " + sourceName)

        await this.runCompiler()

        Timings.end("Finished building " + sourceName)
    }

    private createBundler() {
        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)

        let compilerOptions = {
            source: source,
            destination: destination,
            cache: this.cache,
            projectRoot: this.scheme.beelder.projectRoot,
            buildAction: this,
            scheme: this.scheme
        }

        if (this.compilerOptions) {
            Object.assign(compilerOptions, this.compilerOptions)
        }

        this.bundler = new Bundler(compilerOptions);
    }
}