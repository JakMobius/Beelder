import PackerStorage from "./packer-storage";
import {hashToUUIDString32} from "../../utils";
import BuildCache from "../../build-cache";

export default class PackerProjectStorage extends PackerStorage {

    private cachedJSON: any = null

    private getSection() {
        if(this.cachedJSON) return this.cachedJSON

        this.cachedJSON = this.cache.getJSON()
        if(!this.cachedJSON.files) this.cachedJSON.files = {}
        return this.cachedJSON
    }

    accessFileData(filePath: string) {
        let section = this.getSection()

        if(BuildCache.fileRequiresRefresh(section.files, filePath)) {
            let object = {}
            BuildCache.refreshFileData(section.files, filePath, object)
            return object
        }

        return BuildCache.getFileData(section.files, filePath)
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