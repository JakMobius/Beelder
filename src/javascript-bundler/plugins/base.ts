
import BundlerPlugin from "../bundler-plugin";

export default class BasePlugin extends BundlerPlugin {
    getBabelPlugins(): any[] | null {
        return []
        // return [
        //     ["module-resolver", {
        //         extensions: [".js", ".ts", ".json"],
        //         alias: {
        //             "src": Compiler.path("src")
        //         }
        //     }],
        //     BabelPluginImportDir,
        //     ["@babel/plugin-syntax-dynamic-import"],
        //     ["@babel/plugin-syntax-class-properties"],
        //     ["@babel/plugin-proposal-class-properties", { loose: true }],
        //     ["@babel/plugin-transform-typescript"],
        //     ["@babel/plugin-transform-runtime"],
        //     ["@babel/plugin-proposal-export-default-from"]
        // ]
    }
}