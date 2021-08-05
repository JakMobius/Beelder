import BeelderScheme from "../scheme";
import BeelderAction from "../action";
import { BeelderActionConfig } from "../beelder";
import BeelderReference from "../reference";

export interface RunCommandActionConfig extends BeelderActionConfig {

}

export default class RunCommandAction extends BeelderAction {
    static readonly actionName: string = "run-command"
    target: BeelderReference;

    constructor(config: RunCommandActionConfig, scheme: BeelderScheme) {
        super(config, scheme)
    }


}
