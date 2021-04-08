import BeelderScheme from "../scheme";
import fs from "fs"
import { ResourceListFile } from "../javascript-bundler/plugins/resource-plugin";
import BaseAction, { BaseActionConfig } from "../base-scheme";

export interface CompileSCSSActionConfig extends BaseActionConfig {

}

export default class CompileSCSSSchemeAction extends BaseAction {
    static readonly actionName: string = "compile-scss"
    config: CompileSCSSActionConfig;

    constructor(config: CompileSCSSActionConfig, scheme: BeelderScheme) {
        super(config, scheme)
        this.config = config
    }

    async run(): Promise<void> {
        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)
        let resourceArray = JSON.parse(fs.readFileSync(source, "utf8")) as ResourceListFile


    }
}