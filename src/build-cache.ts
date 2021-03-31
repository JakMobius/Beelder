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

    async getJSON() {
        if (!prepareFileLocation(this.cacheFilePath)) {
            throw new Error("Impossible to create cache file");
        }

        return await fs.promises.readFile(this.cacheFilePath, "utf-8").then((text) => {
            return JSON.parse(text)
        }).catch(async () => {
            console.error("Cache file is missing or corrupted, clearing the cache")
            await fs.promises.writeFile(this.cacheFilePath, "{}")
            return {}
        })
    }

    async setJSON(json: any) {
        if (!prepareFileLocation(this.cacheFilePath)) {
            throw new Error("Impossible to create cache file");
        }

        try {
            let data = JSON.stringify(json)
            await fs.promises.writeFile(this.cacheFilePath, data).catch((error) => {
                console.error("Could not save cache file for section " + this.sectionPath);
                console.error(error.message)
            })
        } catch(error) {
            console.error("Coult not save cache file")
            console.error(error.message)
        }
    }

    static async fileRequiresRefresh(cache: FileListCache, fileName: string): Promise<boolean> {
        let cacheEntry = cache[fileName];

        if(!cacheEntry) return true

        try { await fs.promises.access(fileName) }
        catch(error) { return true}

        let stats = await fs.promises.stat(fileName)

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
