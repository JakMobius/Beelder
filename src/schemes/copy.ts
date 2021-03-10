import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";

export interface CopyActionConfig extends BaseActionConfig {
    source: string
    target: string
}

export default class CopyAction extends BaseAction {

    static readonly actionName: string = "copy"

    constructor(config: CopyActionConfig, scheme: BeelderScheme) {
        super(config, scheme);

    }
}