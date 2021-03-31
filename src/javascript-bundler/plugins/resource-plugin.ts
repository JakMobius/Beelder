import Bundler from "../bundler";
import BundlerPlugin, {BundlerPluginConfig} from "../bundler-plugin";
import EventHandlerBlock from "../../event-handler-block";
import path from "path";
import fs from "fs";
import * as babelParser from "@babel/parser";
import { Timings } from "../..";
import BuildCache from "../../build-cache";
import traverse, { NodePath } from "@babel/traverse";

interface SourcePosition {
    line: number;
    column: number;
}

export interface ResourceFileCacheInfo {
    dependencies: string[]
    resources: ResourceReference[]
}

export class ResourceReference {
    resourcePath: string
    locationLine: number
    locationFile?: string // not presented in cache file
}

export class ResourceSearchContext {
    resources: ResourceReference[]
    cache: any
    metFiles: Set<string>

    constructor(cacheJSON: any) {
        this.resources = []
        this.cache = cacheJSON
        this.metFiles = new Set()
    }
}

export interface BundlerResourcePluginConfig extends BundlerPluginConfig {
    extensions?: string[]
}

export default class ResourcePlugin extends BundlerPlugin {
    static resourcePrefix = "@load-resource:"

    eventHandlerBlock: EventHandlerBlock;
    config: BundlerResourcePluginConfig;

    constructor(config: BundlerResourcePluginConfig) {
        super(config)

        if(!config.extensions) config.extensions = ['.ts', '.js', '.json']

        this.config = config
        this.eventHandlerBlock = new EventHandlerBlock()

        this.eventHandlerBlock.bind("before-build", async () => await this.findResources())
    }

    setCompiler(bundler: Bundler) {
        super.setCompiler(bundler);

        this.eventHandlerBlock.setTarget(bundler)
    }

    private async findResources() {
        Timings.begin("Finding resources")

        let actionCache = this.bundler.config.buildAction.cache.getSection("bundler")
        let cacheJSON = await actionCache.getJSON()

        let context = new ResourceSearchContext(cacheJSON)

        await this.getFileResources(this.bundler.config.source, context)

        await actionCache.setJSON(cacheJSON)

        Timings.end()
    }

    private guessFilePath(filePath: string) {
        let fileExtension = path.extname(filePath)

        if(fileExtension) {
            if(fs.existsSync(filePath)) {
                return filePath
            }
            return null
        }

        for(let extension of this.config.extensions) {
            let extendedPath = filePath + extension
            if(fs.existsSync(extendedPath)) {
                return extendedPath
            }
        }

        return null
    }

    private getErrorWithMessage(message: string, filePath: string, location: SourcePosition) {
        return new Error(message + " at " + path.relative(this.bundler.config.projectRoot, filePath) + ":" + location.line)
    }

    private getFileData(filePath: string): ResourceFileCacheInfo {
        let dirname = path.dirname(filePath)
        let file = fs.readFileSync(filePath, 'utf-8')

        let ast = null

        try {
            ast = babelParser.parse(file, {
                sourceType: "module"
            })
        } catch(e) {
            throw this.getErrorWithMessage(e.message, filePath, e.loc)
        }

        let resources: ResourceReference[] = []
        let dependencies: string[] = []

        traverse(ast, {
            ImportDeclaration: (nodePath) => {
                let source = nodePath.node.source.value

                if(source.startsWith('.')) {
                    let fullPath = path.join(dirname, source)
                    fullPath = this.guessFilePath(fullPath)
                    if(!fullPath) {
                        throw this.getErrorWithMessage("No such file: " + source, filePath, nodePath.node.loc.start)
                    }
                    dependencies.push(fullPath)
                }
            }
        })

        for(let comment of ast.comments) {
            let commentValue = comment.value.trim()
            if(commentValue.startsWith(ResourcePlugin.resourcePrefix)) {
                let resourcePath = commentValue.substr(ResourcePlugin.resourcePrefix.length).replace(/["']/g, "").trim()
                if(resourcePath.startsWith("/")) {
                    resourcePath = path.join(this.bundler.config.projectRoot, resourcePath.substr(1))
                } else {
                    resourcePath = path.join(dirname, resourcePath)
                }

                let resourceToAdd: ResourceReference = {
                    resourcePath: resourcePath,
                    locationLine: comment.loc.start.line
                }

                resources.push(resourceToAdd)
            }
        }

        return {
            dependencies: dependencies,
            resources: resources
        }
    }

    private async getFileResources(filePath: string, context: ResourceSearchContext): Promise<void> {

        if(context.metFiles.has(filePath)) return;

        context.metFiles.add(filePath);

        let data: ResourceFileCacheInfo

        if(await BuildCache.fileRequiresRefresh(context.cache, filePath)) {
            data = this.getFileData(filePath)
            BuildCache.refreshFileData(context.cache, filePath, data)
        } else {
            data = BuildCache.getFileData(context.cache, filePath) as ResourceFileCacheInfo
        }

        for(let resource of data.resources) {
            context.resources.push({
                resourcePath: resource.resourcePath,
                locationLine: resource.locationLine,
                locationFile: filePath
            })
        }

        for(let reference of data.dependencies) {
            await this.getFileResources(reference, context)
        }
    }

    static getPluginName() {
        return "resource-plugin";
    }
}