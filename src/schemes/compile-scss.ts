import BeelderScheme from "../scheme";
import fs from "fs"
import {ResourceListEntry, ResourceListFile } from "../javascript-bundler/plugins/resource-plugin";
import BaseAction, { BaseActionConfig } from "../base-scheme";
import BuildCache from "../build-cache";
import SASS from "sass"
import {compareArrayValues, prepareFileLocation} from "../utils";
import { Timings } from "..";

export interface CompileSCSSActionConfig extends BaseActionConfig {

}

// TODOS:
// Handle file read errors

/**
 * Scheme action which compiles all SCSS files from resource list
 * into single CSS file.
 */

export default class CompileSCSSSchemeAction extends BaseAction {
    static readonly actionName: string = "compile-scss"
    config: CompileSCSSActionConfig;

    constructor(config: CompileSCSSActionConfig, scheme: BeelderScheme) {
        super(config, scheme)
        this.config = config
    }

    async run(): Promise<void> {
        Timings.begin("Updating CSS resources")

        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)
        let resourceFile = JSON.parse(fs.readFileSync(source, "utf8")) as ResourceListFile
        let resourceList = resourceFile.map(file => file[0]);

        let cacheJSON = this.cache.getJSON()
        let cacheForCurrentResourceList = cacheJSON[source]

        if(!cacheForCurrentResourceList) {
            cacheForCurrentResourceList = {}
            cacheJSON[source] = cacheForCurrentResourceList
        }

        if(!cacheForCurrentResourceList.files) cacheForCurrentResourceList.files = {}
        if(!cacheForCurrentResourceList.resultCache) cacheForCurrentResourceList.resultCache = {}

        let resultCache = cacheForCurrentResourceList.resultCache[destination]
        if(!resultCache) {
            resultCache = {}
            cacheForCurrentResourceList.resultCache[destination] = resultCache
        }


        let shouldUpdate = this.schemeFileCacheOutdated(resultCache, resourceList);

        if(!shouldUpdate) shouldUpdate = this.anyFilesUpdated(cacheForCurrentResourceList.files, resourceList);

        if(shouldUpdate) {
            Timings.begin("Recompiling SCSS files")
            if(prepareFileLocation(destination)) {
                fs.writeFileSync(destination, this.recompileFiles(resourceFile, cacheForCurrentResourceList.files), "utf8")
            } else {
                console.error("Could not create target directory. Please, check permissions")
            }
            resultCache.resourceList = resourceList
            this.cache.setJSON(cacheForCurrentResourceList)
            Timings.end()
        }

        Timings.end()
    }

    private schemeFileCacheOutdated(resultCache: any, resourceList: string[]) {
        if(resultCache && resultCache.resourceList) {
            return !compareArrayValues(resultCache.resourceList, resourceList)
        }
        return true
    }

    private anyFilesUpdated(fileCache: any, resourceList: string[]) {
        for(let resource of resourceList) {
            if(BuildCache.fileRequiresRefresh(fileCache, resource)) return true
        }
        return false
    }

    private recompileFiles(resourceFile: ResourceListFile, fileCache: any) {
        let compiledStylesheets: string[] = [];

        for(let resourceInfo of resourceFile) {
            let resourcePath = resourceInfo[0]
            // TODO: print error if file does not exist
            //let resourceReferences = resourceInfo[1]
            let compiledSource: string

            if(BuildCache.fileRequiresRefresh(fileCache, resourcePath)) {
                compiledSource = this.compileCSS(resourceInfo)
                BuildCache.refreshFileData(fileCache, resourcePath, compiledSource)
            } else {
                compiledSource = BuildCache.getFileData(fileCache, resourcePath)
            }

            compiledStylesheets.push(compiledSource);
        }

        return compiledStylesheets.reverse().join("\n")
    }

    private compileCSS(resourceInfo: ResourceListEntry): string {
        let file = fs.readFileSync(resourceInfo[0], "utf8")
        let rendered = SASS.renderSync({
            data: file,
            outputStyle: "expanded"
        })

        return rendered.css.toString("utf8")
    }
}