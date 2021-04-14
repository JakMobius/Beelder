import PackerStorage from "./packer-storage";
import {hashToUUIDString32} from "../../utils";
import BuildCache from "../../build-cache";

export interface PackerProjectStorageConfig {
    skipFileModificationDateCheck?: boolean
}

export default class PackerProjectStorage extends PackerStorage {

    private cachedJSON: any = null
    config: PackerProjectStorageConfig

    constructor(cache: BuildCache, config: PackerProjectStorageConfig = {}) {
        super(cache);
        this.config = config
    }

    private getSection() {
        if(this.cachedJSON) return this.cachedJSON

        this.cachedJSON = this.cache.getJSON()
        if(!this.cachedJSON.files) this.cachedJSON.files = {}
        return this.cachedJSON
    }

    accessFileData(filePath: string) {
        let section = this.getSection()

        let data = null

        if(this.config.skipFileModificationDateCheck || !BuildCache.fileRequiresRefresh(section.files, filePath)) {
            data = BuildCache.getFileData(section.files, filePath)
        }

        if(!data) {
            data = {}
            BuildCache.refreshFileData(section.files, filePath, data)
        }

        return data
    }

    save() {
        if(this.cachedJSON) {
            this.cache.setJSON(this.cachedJSON)
        }
    }

    writeFileData(filePath: string, object: any) {
        BuildCache.refreshFileData(this.getSection().files, filePath, object)
    }
}