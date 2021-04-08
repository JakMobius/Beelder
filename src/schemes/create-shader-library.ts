import BeelderScheme from "../scheme";
import fs from "fs";
import {ResourceListFile} from "../javascript-bundler/plugins/resource-plugin";
import path from "path";
import BaseAction, { BaseActionConfig } from "../base-scheme";

export interface CreateShaderLibraryActionConfig extends BaseActionConfig {

}

export default class CreateShaderLibraryAction extends BaseAction {
    static readonly actionName: string = "create-shader-library"
    config: CreateShaderLibraryActionConfig;

    constructor(config: CreateShaderLibraryActionConfig, scheme: BeelderScheme) {
        super(config, scheme)
        this.config = config
    }

    async run(): Promise<void> {
        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)
        let resourceArray = JSON.parse(fs.readFileSync(source, "utf8")) as ResourceListFile

        let library: { [key: string]: string } = {}

        for(let resourceInfo of resourceArray) {
            let resourcePath = resourceInfo[0]
            //let resourceReferences = resourceInfo[1]

            let absolutePath = path.join(this.scheme.beelder.getAbsolutePath(resourcePath))

            library[resourcePath] = fs.readFileSync(absolutePath, "utf8")
        }

        let code = JSON.stringify(library)
        fs.writeFileSync(destination, code, "utf8")
    }
}