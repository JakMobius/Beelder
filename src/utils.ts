
import fs from "fs";
import path from "path";

export async function readdirDeep(directory: string): Promise<string[]>
export async function readdirDeep(directory: string, array: string[], base: string): Promise<string[]>
export async function readdirDeep(directory: string, array: string[] = [], base: string = ""): Promise<string[]> {

    if (!array) array = []
    if (!base) base = ""

    if (fs.statSync(directory).isDirectory()) {
        await fs.readdirSync(directory).map(async file => {
            let item = path.join(directory, file)
            let subbase = path.join(base, file)
            array.push(subbase)

            await readdirDeep(item, array, subbase)
        })
    }
    return array
}

export function trimExtension(fileName: string): string {
    const fragments = fileName.split(".");
    if(fragments.length > 1) fragments.pop()
    return fragments.join(".")
}

export function prepareDirectory(directory: string): boolean {
    try {
        fs.accessSync(directory)
    } catch(e) {
        try {
            fs.mkdirSync(directory, {recursive: true})
        } catch(e) {
            return false
        }
    }

    return true
}

export function prepareFileLocation(filePath: string): boolean {
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

export function compareArrayValues(arr1: any[], arr2: any[]): boolean {
    let dictionary = new Map<any, number>()

    for(let element of arr1) dictionary.set(element, 1)
    for(let element of arr2) {
        let existed = dictionary.get(element)
        if(!existed) return false
        dictionary.set(element, 2)
    }

    for(let value of dictionary.values()) {
        if(value === 1) return false
    }

    return true
}