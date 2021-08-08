
import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";
//@ts-ignore
import atlaspack from "atlaspack";
import Canvas from "canvas";
import fs from "fs"
import path from "path"
import Timings from "../timings";
import Chalk from "chalk";
import {readdirDeep, compareArrayValues, trimExtension, prepareDirectory} from "../utils"
import BuildCache, {FileListCache} from "../build-cache";

export interface TextureAtlasActionConfig extends BaseActionConfig {
    atlasSize: number
}

export interface AtlasCreationTexture {
    name: string
    image: Canvas.Image
}

export class AtlasCreationSession {
    imagePaths: string[]
    
    canvases: Canvas.Canvas[] = []
    contexts: Canvas.CanvasRenderingContext2D[] = []
    atlases: atlaspack.Atlas[] = []
    atlasDescriptors: atlaspack.Rect[] = []
    texturesRoot: string
    atlasSize: number
    texturesToPack: AtlasCreationTexture[]

    constructor(texturesRoot: string, atlasSize: number) {
        this.texturesRoot = texturesRoot
        this.atlasSize = atlasSize
    }

    async readTextureList() {
        this.imagePaths = (await readdirDeep(this.texturesRoot)).filter(file => file.endsWith(".png"))
    }

    async checkCacheRelevance(cache: TextureAtlasActionCache): Promise<boolean> {
        if(!cache.directorySubtrees) return false
        if(!cache.textureInfo) return false

        let cachedSubtree = cache.directorySubtrees[this.texturesRoot]
        if(!cachedSubtree) return false

        if(!compareArrayValues(cachedSubtree, this.imagePaths)) return false

        for(let imagePath of this.imagePaths) {
            let absolutePath = path.join(this.texturesRoot, imagePath)
            if(await BuildCache.fileRequiresRefresh(cache.textureInfo, absolutePath)) return false
        }

        return true
    }

    writeCache(cache: TextureAtlasActionCache) {
        if(!cache.directorySubtrees) cache.directorySubtrees = {}
        if(!cache.textureInfo) cache.textureInfo = {}

        cache.directorySubtrees[this.texturesRoot] = this.imagePaths
        for(let imagePath of this.imagePaths) {
            let absolutePath = path.join(this.texturesRoot, imagePath)

            BuildCache.refreshFileData(cache.textureInfo, absolutePath)
        }
    }

    static webglRect(rect: atlaspack.Rect, canvas: Canvas.Canvas) {
        return {
            x: (rect.x + 1) / canvas.width,
            y: (rect.y + 1) / canvas.height,
            w: (rect.w - 2) / canvas.width,
            h: (rect.h - 2) / canvas.height
        }
    }

    createCanvases() {
        let size = this.atlasSize
        do {
            let canvas = Canvas.createCanvas(size, size);
            let ctx = canvas.getContext('2d');
            let atlas = atlaspack(canvas);

            atlas.tilepad = true

            this.canvases.push(canvas)
            this.contexts.push(ctx)
            this.atlases.push(atlas)

            size >>= 1
        } while(size > 64)
    }

    drawTextures() {
        for(let image of this.texturesToPack) {
            let mipMapSize = this.atlasSize
            let scale = 1

            for(let j = 0; this.canvases[j]; j++) {
                const rect = this.atlases[j].pack({
                    width: image.image.width * scale + 2,
                    height: image.image.height * scale + 2
                }).rect;

                if(!rect) {
                    this.canvases[j] = null
                    break
                }

                if(!this.atlasDescriptors[j]) this.atlasDescriptors[j] = {}
                this.atlasDescriptors[j][image.name] = AtlasCreationSession.webglRect(rect, this.canvases[j])

                AtlasCreationSession.drawTexture(this.canvases[j], this.contexts[j], image, rect)

                mipMapSize >>= 1
                scale /= 2
            }
        }
    }

    async readTextures() {
        let textures: AtlasCreationTexture[] = []

        await Promise.all(this.imagePaths.map(file => new Promise<void>((resolve, reject) => {
            const image = new Canvas.Image();

            image.onload = () => {
                textures.push({
                    name: trimExtension(file),
                    image: image
                })
                resolve()
            }

            // node-canvas sometimes throws ENOENT without
            // any reason on Windows, so we help him by
            // reading the file for him.

            const texturePath = path.resolve(this.texturesRoot, file)
            const buffer = fs.readFileSync(texturePath)

            image.onerror = reject
            image.src = buffer
        })))

        textures.sort((left, right) => {
            return right.image.width * right.image.height - left.image.width * left.image.height
        })

        this.texturesToPack = textures
    }

    static drawTexture(canvas: Canvas.Canvas, ctx: Canvas.CanvasRenderingContext2D, img: AtlasCreationTexture, rect: atlaspack.Rect) {
        // Internal
        ctx.drawImage(img.image, rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2)

        // Left
        ctx.drawImage(canvas, rect.x + 1, rect.y + 1, 1, rect.h - 2, rect.x, rect.y + 1, 1, rect.h - 2)
        // Right
        ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + 1, 1, rect.h - 2, rect.x + rect.w - 1, rect.y + 1, 1, rect.h - 2)
        // Top
        ctx.drawImage(canvas, rect.x + 1, rect.y + 1, rect.w - 2, 1, rect.x + 1, rect.y, rect.w - 2, 1)
        // Bottom
        ctx.drawImage(canvas, rect.x + 1, rect.y + rect.h - 2, rect.w - 2, 1, rect.x + 1, rect.y + rect.h - 1, rect.w - 2, 1)

        // Left-top
        ctx.drawImage(canvas, rect.x + 1, rect.y + 1, 1, 1, rect.x, rect.y, 1, 1)
        // Right-top
        ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + 1, 1, 1, rect.x + rect.w - 1, rect.y, 1, 1)
        // Left-bottom
        ctx.drawImage(canvas, rect.x + 1, rect.y + rect.h - 2, 1, 1, rect.x, rect.y + rect.h - 1, 1, 1)
        // Right-bottom
        ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + rect.h - 2, 1, 1, rect.x + rect.w - 1, rect.y + rect.h - 1, 1, 1)
    }

    async writeTextures(destination: string) {
        for(let j = 0; j < this.canvases.length; j++) {
            if(!this.canvases[j]) break

            await fs.promises.writeFile(path.resolve(destination, "atlas-mipmap-level-" + j + ".png"), this.canvases[j].toBuffer());
            await fs.promises.writeFile(path.resolve(destination, "atlas-mipmap-level-" + j + ".json"), JSON.stringify(this.atlasDescriptors[j]));
        }
    }
}

export interface TextureAtlasActionCache {
    directorySubtrees: { [key: string]: string[] | null }
    textureInfo: FileListCache
}

export default class TextureAtlasAction extends BaseAction {

    config: TextureAtlasActionConfig

    static readonly actionName: string = "texture-atlas"

    constructor(config: TextureAtlasActionConfig, scheme: BeelderScheme) {
        super(config, scheme);
        this.config = config
    }

    async run(): Promise<any> {

        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)

        if(!prepareDirectory(destination)) throw new Error("Unable to create destination folder")

        Timings.begin("Creating texture atlases of " + this.source.getConsoleName())

        let cacheJSON = await this.cache.getJSON() as TextureAtlasActionCache

        let context = new AtlasCreationSession(source, this.config.atlasSize ?? 1024)

        Timings.begin("Reading directory")
        await context.readTextureList()
        Timings.end()

        Timings.begin("Checking cache")
        if(await context.checkCacheRelevance(cacheJSON)) {
            Timings.end()
            Timings.end("Textures has not been updated, used cached result")
            return
        } else {
            Timings.end("Textures has been updated, should refresh atlas")
        }

        Timings.begin("Reading textures")
        await context.readTextures()
        Timings.end()

        Timings.begin("Allocating canvases")
        context.createCanvases()
        Timings.end()

        Timings.begin("Drawing atlases")
        context.drawTextures()
        Timings.end()

        Timings.begin("Writing atlases")
        await context.writeTextures(destination)
        Timings.end()

        Timings.begin("Saving caches")
        context.writeCache(cacheJSON)
        await this.cache.setJSON(cacheJSON)
        Timings.end()

        Timings.end("Finished creating texture atlas");
    }
}