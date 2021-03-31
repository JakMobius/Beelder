import Bundler from "./bundler";
import EventEmitter from "events";

export interface BundlerPluginConfig {
    plugin: string
}

export default class BundlerPlugin extends EventEmitter {

    public bundler?: Bundler = null

    constructor(config: BundlerPluginConfig) {
        super()
    }

    setCompiler(bundler: Bundler) {
        this.bundler = bundler
    }

    getBabelPlugins(): any[] | null {
        return null
    }

    getBrowserifyPlugins(): any[] | null {
        return null
    }

    static getPluginName(): string {
        return "invalid"
    }
}