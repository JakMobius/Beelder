
import fs from "fs";
import path from "path";

export function readdirDeep(directory: string): string[]
export function readdirDeep(directory: string, array: string[], base: string): string[]
export function readdirDeep(directory: string, array: string[] = [], base: string = ""): string[] {

    if (!array) array = []
    if (!base) base = ""

    if (fs.statSync(directory).isDirectory()) {
        fs.readdirSync(directory).map(async file => {
            let item = path.join(directory, file)
            let subbase = path.join(base, file)
            array.push(subbase)

            readdirDeep(item, array, subbase)
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
            fs.mkdirSync(directoryPath, { recursive: true })
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

export function copyDirectoryContents(from: string, to: string) {
    try {
        fs.mkdirSync(to);
    } catch (e) {}

    for (let element of fs.readdirSync(from)) {
        const stat = fs.lstatSync(path.join(from, element));
        if (stat.isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else if (stat.isSymbolicLink()) {
            fs.symlinkSync(fs.readlinkSync(path.join(from, element)), path.join(to, element));
        } else if (stat.isDirectory()) {
            copyDirectoryContents(path.join(from, element), path.join(to, element));
        }
    }
}

export function copyDirectory(from: string, to: string) {
    if (to.endsWith(path.sep)) {
        to = path.join(to, path.basename(from))
    }
    copyDirectoryContents(from, to)
}

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

export function murmurhash3_32_gc(key: string, seed: number) {
    let remainder, bytes, h1, h1b, c1, c2, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    // noinspection FallThroughInSwitchStatementJS
    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}

export function hashToUUIDString32(hash: number) {
    let result = "";

    for(let i = 7; i >= 0; i--) {
        result += Math.abs(hash % 16).toString(16);
        hash >>= 4;
        if((i % 4 == 0) && i > 0) result += '-';
    }

    return result;
}

export function mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
    const obj: { [key: string]: T } = { };
    for (const [key, value] of map.entries()) {
        obj[key] = value;
    }
    return obj
}

export function concatOptionalArrays<T>(arrayA: T[] | null, arrayB: T[] | null) {

    if(arrayB && arrayB.length) {
        if(!arrayA) arrayA = []
        for(let target of arrayB) {
            arrayA.push(target)
        }
    }

    return arrayA
}

export function escapeRegExp(string: string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}