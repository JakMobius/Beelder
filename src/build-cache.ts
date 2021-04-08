import {prepareFileLocation} from "./utils";
import fs from "fs"
import path from "path";

export type FileListCache = { [key: string]: {
    modificationDate: number,
    data?: any
} | null}

export default class BuildCache {
    sectionPath: string;
    cacheFilePath: any;

    constructor(sectionPath: string) {
        this.sectionPath = sectionPath
        this.cacheFilePath = path.join(this.sectionPath, "section.json")
    }

    getSection(section: string): BuildCache {
        let sectionPath = path.join(this.sectionPath, section)

        return new BuildCache(sectionPath)
    }

    getJSON() {
        if (!prepareFileLocation(this.cacheFilePath)) {
            throw new Error("Could not create cache file");
        }

        try {
            let text = fs.readFileSync(this.cacheFilePath, "utf-8")
            return JSON.parse(text)
        } catch(error) {
            if(error.code != "ENOENT") {
                console.error("Cache file is corrupted, clearing the cache")
            }
            fs.writeFileSync(this.cacheFilePath, "{}")
            return {}
        }
    }

    setJSON(json: any) {
        if (!prepareFileLocation(this.cacheFilePath)) {
            throw new Error("Could not create cache file");
        }

        try {
            let data = JSON.stringify(json)
            fs.writeFileSync(this.cacheFilePath, data)
        } catch(error) {
            console.error("Could not save cache file for section " + this.sectionPath);
            console.error(error.message)
        }
    }

    static fileRequiresRefresh(cache: FileListCache, fileName: string): boolean {
        let cacheEntry = cache[fileName];

        if(!cacheEntry) return true

        try { fs.accessSync(fileName) }
        catch(error) { return true }

        let stats = fs.statSync(fileName)

        return cacheEntry.modificationDate < stats.mtime.getTime()
    }

    static getFileData(cache: FileListCache, fileName: string): any {
        let cacheEntry = cache[fileName]
        if(!cacheEntry) return null
        return cacheEntry.data
    }

    static refreshFileData(cache: FileListCache, fileName: string): void
    static refreshFileData(cache: FileListCache, fileName: string, data: any): void
    static refreshFileData(cache: FileListCache, fileName: string, data?: any) {
        let cacheEntry = cache[fileName]
        if (cacheEntry) {
            cacheEntry.modificationDate = Date.now()
            cacheEntry.data = data
        } else {
            cache[fileName] = {
                modificationDate: Date.now(),
                data: data
            }
        }
    }
}
