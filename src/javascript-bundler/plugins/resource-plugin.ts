import Bundler from "../bundler";
import BundlerPlugin, {BundlerPluginConfig} from "../bundler-plugin";
import EventHandlerBlock from "../../event-handler-block";
import path from "path";
import fs from "fs";
import * as babel from "@babel/core";
import {Timings} from "../..";
import {TraverseContext} from "../packer/packer";
import {Minimatch} from "minimatch"
import {prepareFileLocation} from "../../utils";
import BeelderReference, {BeelderReferenceConfig} from "../../reference";

export class ResourceReference {
    resource: string
    line: number
}

export interface ResourcePluginRuleConfig {
    pattern: string,
    target: BeelderReferenceConfig
}

export interface BundlerResourcePluginConfig extends BundlerPluginConfig {
    rules: ResourcePluginRuleConfig[]
}

export type ResourceListEntry = [file: string, references: string[]]
export type ResourceListFile = ResourceListEntry[]

export class ResourcePluginRule {
    pattern: string
    target: BeelderReference

    constructor(config: ResourcePluginRuleConfig) {
        this.pattern = config.pattern
        this.target = new BeelderReference(config.target)
    }
}

export class ResourceSearchContext extends TraverseContext {
    foundResources: Map<string, ResourceReference[]> = new Map()
}

export default class ResourcePlugin extends BundlerPlugin {
    static resourcePrefix = "@load-resource:"

    eventHandlerBlock: EventHandlerBlock;
    config: BundlerResourcePluginConfig;
    rules: ResourcePluginRule[]

    constructor(config: BundlerResourcePluginConfig) {
        super(config)

        this.config = config
        this.eventHandlerBlock = new EventHandlerBlock()

        this.eventHandlerBlock.bind("after-build", async () => await this.findResources())

        this.rules = this.config.rules.map(config => new ResourcePluginRule(config))
    }

    setCompiler(bundler: Bundler) {
        super.setCompiler(bundler);

        this.eventHandlerBlock.setTarget(bundler.packer)
    }

    private async findResources() {
        Timings.begin("Running resource-plugin")

        let entry = this.bundler.config.source
        let context = new ResourceSearchContext()
        await this.bundler.packer.traverse(entry, context, (filePath, file) => {

            let relative = path.relative(this.bundler.config.projectRoot, filePath)

            // Using fast cache to check if we've already
            // found all resources for this file

            let storage = file.getFastPluginStorage(ResourcePlugin.getPluginName())

            if(!storage.resources) {
                // if not, we have to fetch file AST
                // to find all resources and cache them
                storage.resources = this.getCommentsFromAST(file.getAST(), relative)
            }

            if(storage.resources.length) {
                context.foundResources.set(relative, storage.resources)
            }
        })

        let resourceArray = this.getResourceMap(context.foundResources)

        for(let rule of this.rules) {
            let objectToWrite: ResourceListFile = []
            let matcher = new Minimatch(rule.pattern)

            for (let [resource, references] of resourceArray.entries()) {
                if(matcher.match(resource)) objectToWrite.push([resource, references])
            }

            let destinationPath = this.bundler.scheme.beelder.resolveReference(rule.target)

            if(prepareFileLocation(destinationPath)) {
                fs.writeFileSync(destinationPath, JSON.stringify(objectToWrite))
            }
        }

        Timings.end()
    }

    private getCommentsFromAST(ast: babel.types.File, filePath: string): ResourceReference[] {
        let dirname = path.dirname(filePath)
        let resources: ResourceReference[] = []

        for(let comment of ast.comments) {
            let commentValue = comment.value.trim()
            if(commentValue.startsWith(ResourcePlugin.resourcePrefix)) {
                let resourcePath = commentValue.substr(ResourcePlugin.resourcePrefix.length).replace(/["']/g, "").trim()
                if(resourcePath.startsWith("/")) {
                    resourcePath = resourcePath.substr(1)
                } else {
                    resourcePath = path.join(dirname, resourcePath)
                }

                let resourceToAdd: ResourceReference = {
                    resource: resourcePath,
                    line: comment.loc.start.line
                }

                resources.push(resourceToAdd)
            }
        }

        return resources
    }

    static getPluginName() {
        return "resource-plugin";
    }

    private getResourceMap(foundResources: Map<string, ResourceReference[]>): Map<string, string[]> {
        let result = new Map<string, string[]>()

        for(let [filePath, referenceList] of foundResources.entries()) {
            for (let reference of referenceList) {
                let list = result.get(reference.resource)
                let fileAndLine = filePath + ":" + reference.line
                if(!list) {
                    result.set(reference.resource, [fileAndLine])
                } else {
                    list.push(fileAndLine)
                }
            }
        }

        return result
    }

    getTargets(): BeelderReference[] | null {
        let result: BeelderReference[] | null = null

        for(let rule of this.rules) {
            if(rule.target.definesTarget) {
                if(!result) result = []
                result.push(rule.target)
            }
        }

        return result
    }
}