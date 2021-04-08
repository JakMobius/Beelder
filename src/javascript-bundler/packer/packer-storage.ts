import BuildCache from "../../build-cache";

/**
 * Abstract file data storage system.
 */
export default abstract class PackerStorage {
    cache: BuildCache;

    constructor(cache: BuildCache) {
        this.cache = cache;
    }

    abstract accessFileData(filePath: string): any;
    abstract writeFileData(filePath: string, data: any): void;
    abstract save(): void;
}
