import BeelderScheme from "../scheme";
import BeelderAction from "../action";
import { BeelderActionConfig } from "../beelder";
import BeelderReference from "../reference";

export interface RequireTargetActionConfig extends BeelderActionConfig {
    target: string
}

export default class RequireTargetAction extends BeelderAction {
    static readonly actionName: string = "require-target"
    target: BeelderReference;

    constructor(config: RequireTargetActionConfig, scheme: BeelderScheme) {
        super(config, scheme)
        this.target = new BeelderReference(config.target)

        if(this.target.definesTarget) {
            throw new Error("run-command target field must specify existing target")
        }
        if(!this.target.isDependency) {
            throw new Error("run-command target field must specify dependency target")
        }
    }

    getDependencies(): string[] | null {
        return [this.target.getDependency()]
    }
}
