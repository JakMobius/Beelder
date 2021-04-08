import BeelderScheme from "../scheme";
import BeelderAction from "../action";
import { BeelderActionConfig } from "../beelder";

export interface RunCommandPluginConfig extends BeelderActionConfig {

}

export default class RunCommandAction extends BeelderAction {
    static readonly actionName: string = "run-command"

    constructor(config: RunCommandPluginConfig, scheme: BeelderScheme) {
        super(config, scheme)
    }


}
