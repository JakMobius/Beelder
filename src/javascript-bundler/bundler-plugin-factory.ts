import BundlerPlugin, { BundlerPluginConfig } from "./bundler-plugin";
import BasePlugin from "./plugins/base";
import ResourcePlugin from "./plugins/resource-plugin";
import JSONCommentReplacerBundlerPlugin from "./plugins/json-comment-replacer";

export default class BundlerPluginFactory {

    static plugins: Map<string, typeof BundlerPlugin> = new Map();

    static register(plugin: typeof BundlerPlugin) {
        this.plugins.set(plugin.getPluginName(), plugin);
    }

    static getPlugin(config: BundlerPluginConfig) {
        const Plugin = this.plugins.get(config.plugin);

        if(!Plugin) return null;
        return new Plugin(config);
    }
}

BundlerPluginFactory.register(JSONCommentReplacerBundlerPlugin)
BundlerPluginFactory.register(BasePlugin)
BundlerPluginFactory.register(ResourcePlugin)