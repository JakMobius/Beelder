import Packer from "./packer";
import fs from "fs"
import path from "path";

//
// To clarify:
//
// There will be two types of permanent data buffers: per-file and per-project.
//
// The more effective way to store light data that we will have to access at least
// once per build is to store it on the per-project storage.
//
// The most effective way to store heavy data is per-file storage,
// especially if we won't always need it.
//
// The dependency tree should be stored in per-project storage since it's the first
// thing that should be analyzed when project is building
//
// Since bundler plugin may not change AST tree cache, it's necessary to
// save its original version. AST tree is heavy to store in memory and parse,
// but we won't always want to read it. (only when file has been modified or
// will be processed by some plugin)
//
// Even thou transformed code is huge, the file that stores it will not be much larger
// than the bundle file, and it's three times lighter than AST in average, so we will
// store it in per-project storage.
//

/**
 * Interface for accessing file cache and metadata
 */
export default class PackerFile {
    public readonly filePath: string
    public readonly fastStorage: any
    public readonly projectPath: string
    public readonly packer: Packer;
    private ast: babel.types.File
    shouldBeCompiled: boolean;
    isJSON: boolean;
    inOriginalPackage: boolean;

    constructor(packer: Packer, filePath: string) {
        this.packer = packer
        this.filePath = filePath
        this.projectPath = path.relative(this.packer.bundler.config.projectRoot, filePath)
        this.fastStorage = this.packer.cache.fastStorage.accessFileData(this.filePath)

        // TODO: make this more smart
        let extension = path.extname(this.projectPath)
        this.shouldBeCompiled = extension == ".ts" || extension == ".js"
        this.inOriginalPackage = !this.projectPath.startsWith("..") && this.projectPath.indexOf("node_modules") == -1
        this.isJSON = extension == ".json"
    }

    /**
     * Fetch file dependencies with most efficient available way
     *
     * - **Fast case**: File dependencies has already been found
     * in a previous build. If file has not been modified,
     * cached version will be returned. This way, no requests to
     * the file system will be made.
     *
     * - **Slow case**: Сache is outdated or missing. The file will
     * be rebuilt and its dependencies will be retrieved from
     * its AST. Two requests to the file system will be made:
     * one to read file contents and another one to write the AST
     * cache.
     * <br/>
     * **File system calls**:
     * <table width="200">
     *     <tr><td>Average case:</td><td>0 requests</td></tr>
     *     <tr><td>Worst case:</td><td>2 requests</td></tr>
     * </table>
     *
     */
    getDependencies(): { [key: string]: string } {
        if (!this.fastStorage.dependencies) {
            this.fastStorage.dependencies = this.determineDependencies()
        }

        return this.fastStorage.dependencies
    }

    /**
     * Returns file text contents
     */
    getContents(): string {
        return fs.readFileSync(this.filePath, "utf8")
    }

    private compile(): babel.types.File {
        let contents = this.getContents()

        if(this.shouldBeCompiled) {
            if(this.inOriginalPackage) {
                return this.packer.transformFile(contents, this.projectPath).ast
            } else {
                return this.packer.parseFile(contents, this.projectPath)
            }
        } else {
            return null
        }
    }

    /**
     * Fetch AST tree for this file after babel-transformed file
     * with most efficient available way
     *
     * **Please note** that this method is likely to be **slow**.
     * Reading the AST for each file can make the build process
     * slow.
     *
     * - **Fastest case**: If file AST tree has been already loaded,
     * it will just be returned. No file system requests will be made.
     *
     * - **Fast case**: Most common case for incremental rebuild,
     * when AST tree has been created in a previous build and file
     * cache is up to date. To read AST cache, a single request to
     * the file system will be made
     *
     * - **Slow case**: Cache is outdated or missing. The file will
     * be rebuilt and its dependencies will be retrieved from
     * its AST. Two requests to the file system will be made:
     * one to read file contents and another one to write the AST
     * cache.
     * <br/>
     * **File system calls**:
     * <table width="200">
     *     <tr><td>Best case:</td><td>0 requests</td></tr>
     *     <tr><td>Average case:</td><td>1 request</td></tr>
     *     <tr><td>Worst case:</td><td>2 requests</td></tr>
     * </table>
     *
     * @returns: AST tree of babel-transformed file
     */
    getAST(ignoreCache: boolean = false): babel.types.File {
        if(!ignoreCache) {
            if (this.ast) return this.ast
            this.ast = this.packer.cache.astStorage.accessFileData(this.filePath)

            // accessFileData returns empty object
            // if entry was not found, so we have
            // to check if we've got a valid AST
            // tree from cache.
            if (this.ast && this.ast.type) return this.ast
        }
        this.ast = this.compile()
        this.packer.cache.astStorage.writeFileData(this.filePath, this.ast)

        return this.ast
    }

    /**
     * Generated code after babel and plugin transformations.
    *
     * **Please note** that this method should not be called
     * from plugins, as it will cause packer to ignore following
     * AST transformations.
     *
     * - **Fastest case**: If code has been already generated in
     * a previous build, a cached version will be returned.
     * As the code cache is stored in a fast storage, no
     * file system requests will be made
     *
     * - **Fast case**: If code cache was cleared by some plugin,
     * but AST cache is up-to-date, code will be regenerated from
     * this tree without rebuilding the file.
     */
    getTransformedCode() {
        if(this.fastStorage.code) return this.fastStorage.code

        if(this.shouldBeCompiled) {
            this.fastStorage.code = this.packer.generateCode(this.getAST(), this.projectPath, this.getContents())
        } else if(this.isJSON) {
            this.fastStorage.code = "module.exports = " + this.getContents()
        } else {
            this.fastStorage.code = this.getContents()
        }

        this.fastStorage.rebuildDate = Date.now()

        return this.fastStorage.code
    }

    /**
     * Clears transformed code cache. Plugins should call this method
     * for each file they transform.
     */
    clearCodeCache() {
        this.fastStorage.code = null
        this.fastStorage.rebuildDate = 0
    }

    private determineDependencies(): { [key: string]: string } {
        // Ignoring cache here to avoid unnecessary querying
        // of the file system. This method is called only
        // when cache is outdated or missing.
        let ast = this.getAST(true)
        if(!ast) return {}
        return this.packer.astWatcher.findDependencies(ast, this.filePath)
    }

    getFastPluginStorage(plugin: string) {
        if(!this.fastStorage.pluginData) {
            this.fastStorage.pluginData = {}
        }

        let pluginData = this.fastStorage.pluginData[plugin]

        if(!pluginData) {
            pluginData = {}
            this.fastStorage.pluginData[plugin] = pluginData
        }
        return pluginData;
    }

    cacheIsUpToDate() {
        return !!this.fastStorage.dependencies
    }

    getRebuildDate() {
        return this.fastStorage.rebuildDate || 0
    }
}