
import fs from "fs";
import path from "path";

export function prepareFilePath(filePath: string): boolean {
    let directoryPath = path.dirname(filePath)
    try {
        fs.accessSync(directoryPath)
    } catch(e) {
        try {
            fs.mkdirSync(directoryPath, {recursive: true})
        } catch(e) {
            return false
        }
    }

    return true
}