
import BundlerPlugin, {BundlerPluginConfig} from '../bundler-plugin'

export interface BabelPluginInserterPluginConfig extends BundlerPluginConfig {
    babelPlugins: any[]
}

export default class UseBabelPluginBundlerPlugin extends BundlerPlugin {

    config: BabelPluginInserterPluginConfig

    constructor(config: BabelPluginInserterPluginConfig) {
        super(config)
        this.config = config
    }

    getBabelPlugins(): any[] | null {
        return this.config.babelPlugins
    }

    static getPluginName() {
        return "use-babel-plugin"
    }
}