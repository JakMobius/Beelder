import PackerProjectStorage from "./packer-project-storage";
import PackerFileStorage from "./packer-file-storage";
import BuildCache from "../../build-cache";

export default class PackerCache {
    /**
     * Storage that should be used for storing data
     * that may not be left unattended on each build.
     * Large amounts of data will make this storage
     * slow to read and write.
     */
    fastStorage: PackerProjectStorage

    /**
     * Storage that should be used for storing
     * large amounts of data that you won't read
     * at each build.
     */
    largeStorage: PackerFileStorage

    /**
     * Storage for caching abstract syntax trees
     */
    astStorage: PackerFileStorage

    constructor(cache: BuildCache) {

        this.fastStorage = new PackerProjectStorage(cache.getSection("fast-storage"))
        this.largeStorage = new PackerFileStorage(cache.getSection("large-storage"))
        this.astStorage = new PackerFileStorage(cache.getSection("ast-storage"))
    }

    async saveCaches() {
        await this.fastStorage.save()
        // await this.largeStorage.save() - unused
        // await this.astStorage.save() - unused. AST storage also will only be saved when file is rebuilt
    }
}