import Bundler from "./bundler";
import EventEmitter from "events";
import Babelify from "babelify";

export default class Plugin extends EventEmitter {

    public bundler?: Bundler = null

    constructor() {
        super()


    }

    setCompiler(bundler: Bundler) {

    }

    getBabelPlugins(): any[] | null {
        return null
    }

    getBrowserifyPlugins(): any[] | null {
        return null
    }
}