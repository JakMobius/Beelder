import PackerStorage from "./packer-storage";
import {hashToUUIDString32, murmurhash3_32_gc} from "../../utils";
import BuildCache from "../../build-cache";

export default class PackerFileStorage extends PackerStorage {

    getFileNameHash(fileName: string): number {
        return murmurhash3_32_gc(fileName, 0xBEEF);
    }

    private getSection(filePath: string) {
        let hash = this.getFileNameHash(filePath)
        let hashString = hashToUUIDString32(hash)

        return this.cache.getSection(hashString)
    }

    accessFileData(filePath: string) {
        let section = this.getSection(filePath).getJSON()
        if(!section.files) section.files = {}

        if(BuildCache.fileRequiresRefresh(section.files, filePath)) {
            return {}
        }

        return BuildCache.getFileData(section.files, filePath)
    }

    save() {

    }

    writeFileData(filePath: string, data: any) {
        let section = this.getSection(filePath)
        let json = section.getJSON()
        if(!json.files) json.files = {}

        BuildCache.refreshFileData(json.files, filePath, data)
        section.setJSON(json)
    }
}