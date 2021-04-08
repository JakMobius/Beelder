import Bundler from "./bundler";
import EventEmitter from "events";
import BeelderReference from "../reference";

export interface BundlerPluginConfig {
    plugin: string
}

/**
 * A base bundler plugin class.
 * The builder plugin can traverse the project
 * tree and modify it during build. See native
 * builder plugins for examples.
 *
 * Bundler plugin **should** handle cases when
 * it's called in the same build scheme with
 * different options within a single build
 * procedure. I.e, it should not cache its
 * results if they can be influenced with
 * plugin/scheme input options.
 *
 * To store file-related data, PackerFileCache
 * interface should be inherited, so you may
 * store your data in your custom fields. Be
 * sure to use unique field names. (i.e, you
 * may prefix them with your plugin identifier)
 */
export default class BundlerPlugin extends EventEmitter {

    public bundler?: Bundler = null

    constructor(config: BundlerPluginConfig) {
        super()
    }

    setCompiler(bundler: Bundler) {
        this.bundler = bundler
    }


    /* TODO: As babelPlugins may not change
        from build to build, maybe it's better
        to make this method static. */

    /**
     * Babel plugins which are required to run before build.
     * Please, note that this method should ensure that it
     * will return the same babel plugins with the same
     * options, as long as the scheme configuration
     * is not changed.
     *
     * The reason for this restriction is that because
     * of the build cache, the files are not re-transformed
     * through babel unless they got changed. Beelder will
     * not detect if your babel plugin config has been
     * changed.
     */
    getBabelPlugins(): any[] | null {
        return null
    }

    static getPluginName(): string {
        return "invalid"
    }

    /**
     * Returns targets that should be built before this plugin runs
     */
    public getDependencies(): string[] | null {
        return []
    }

    /**
     * Returns targets that this plugin exposes
     */
    public getTargets(): BeelderReference[] | null {
        return []
    }
}