
import BundlerPlugin, {BundlerPluginConfig} from '../bundler-plugin'
import EventHandlerBlock from "../../event-handler-block";
import Bundler from "../bundler";
import traverse, { NodePath } from "@babel/traverse";
import * as parser from "@babel/parser"
import { ObjectExpression, Expression, cloneNode } from '@babel/types';
import PackerFile from "../packer/packer-file";
import { Timings } from '../..';
import BeelderReference, {BeelderReferenceConfig} from "../../reference";
import fs from "fs"

export interface CommentReplacerPluginConfig extends BundlerPluginConfig {
    replacements: CommentReplacementConfig[]
}

export interface CommentReplacementConfig {
    comment: string
    json?: any
    file?: BeelderReferenceConfig
}

export class CommentReplacement {
    public readonly comment: string
    private ast: Expression
    private readonly json: any;
    private readonly file: BeelderReference;
    private readonly plugin: CommentReplacerBundlerPlugin;

    constructor(config: CommentReplacementConfig, plugin: CommentReplacerBundlerPlugin) {
        this.plugin = plugin
        this.comment = config.comment
        if(config.json) this.json = config.json
        else if(config.file) this.file = new BeelderReference(config.file)
        else throw new Error("Must either provide .file or .json field for json-comment-replacer plugin")
    }

    getDependency(): string | null {
        if(this.file && this.file.isDependency) {
            return this.file.getDependency()
        }
        return null
    }

    getReplacement() {
        if(this.json) return parser.parseExpression(JSON.stringify(this.json))

        let reference = this.plugin.bundler.scheme.beelder.resolveReference(this.file)
        return parser.parseExpression(fs.readFileSync(reference, "utf8"))
    }

    getAST(): Expression {
        if(!this.ast) {
            this.ast = this.getReplacement()
        }
        return cloneNode(this.ast)
    }
}

export interface CommentReplacerFileCache {
    cachedComments?: string[]
}

/**
 * Replaces objects with special comments with pre-defined JSON
 *
 * @example:
 *
 * // before transform:
 * let a = {
 *  // exact-special-comment
 * }
 * // after transform, it's possible to achieve this:
 * let a = { key: "value" }
 */
export default class CommentReplacerBundlerPlugin extends BundlerPlugin {

    eventHandlerBlock: EventHandlerBlock;
    replacements: Map<string, CommentReplacement> = new Map()

    constructor(config: CommentReplacerPluginConfig) {
        super(config)

        this.readConfig(config)

        this.eventHandlerBlock = new EventHandlerBlock()
        this.eventHandlerBlock.bind("after-build", async () => await this.replaceComments())
    }

    getDependencies(): string[] | null {
       let result: string[] | null = null

        for(let [, rule] of this.replacements.entries()) {
            let dependency = rule.getDependency()
            if(dependency) {
                if(!result) result = []
                result.push(dependency)
            }
        }

        return result
    }

    private readConfig(config: CommentReplacerPluginConfig){
        if(config.replacements) {
            for (let replacementConfig of config.replacements) {
                let replacement = new CommentReplacement(replacementConfig, this)
                this.replacements.set(replacement.comment, replacement)
            }
        }
    }

    private maybeReplace(path: NodePath<ObjectExpression>, fileCache: CommentReplacerFileCache) {
        let node = path.node

        if(!node.properties || !node.innerComments || node.properties.length !== 0 || node.innerComments.length !== 1) {
            return
        }

        let comment = node.innerComments[0].value.trim()

        fileCache.cachedComments.push(comment)

        let replacement = this.replacements.get(comment)
        if(!replacement) return

        path.replaceWith(replacement.getAST())

        path.node.innerComments = []
    }

    private async replaceComments() {
        Timings.begin("Running json-comment-replacer plugin")
        if(this.replacements.size) {


            let entry = this.bundler.config.source

            await this.bundler.packer.traverse(entry, null, (filePath: string, file: PackerFile) => {

                // Using fast cache to filter out files
                // that we definitely don't want to transform.

                let storage = file.getFastPluginStorage(CommentReplacerBundlerPlugin.getPluginName()) as CommentReplacerFileCache
                if (storage.cachedComments) {
                    let flag = false
                    for (let comment of storage.cachedComments) {
                        if (this.replacements.has(comment))
                            flag = true;
                    }
                    if (!flag) return
                }

                // Transforming file

                storage.cachedComments = []
                file.clearCodeCache()

                traverse(file.getAST(), {
                    ObjectExpression: (path: NodePath<ObjectExpression>) => this.maybeReplace(path, storage)
                })
            })
        }

        Timings.end()
    }

    setCompiler(bundler: Bundler) {
        super.setCompiler(bundler);

        this.eventHandlerBlock.setTarget(bundler.packer)
    }

    static getPluginName() {
        return "json-comment-replacer"
    }
}