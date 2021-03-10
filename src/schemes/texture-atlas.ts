
import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";

export interface TextureAtlasActionConfig extends BaseActionConfig {
    atlasSize: number
}

export default class TextureAtlasAction extends BaseAction {

    static readonly actionName: string = "texture-atlas"

    constructor(config: TextureAtlasActionConfig, scheme: BeelderScheme) {
        super(config, scheme);
    }
}