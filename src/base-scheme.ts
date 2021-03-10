
import Action from "./action";
import {BeelderActionConfig} from "./beelder";
import BeelderScheme from "./scheme";
import BeelderReference from "./reference";

export interface BaseActionConfig extends BeelderActionConfig {
    source: string
    target: string
}

export default class BaseAction extends Action {

    target: BeelderReference;
    source: BeelderReference;

    constructor(config: BaseActionConfig, scheme: BeelderScheme) {
        super(config, scheme);

        this.target = new BeelderReference(config.target)
        this.source = new BeelderReference(config.source)
    }

    getDependencies(): string[] | null {
        if(this.source.isDependency) {
            return [this.source.getDependency()]
        }
        return null
    }

    getTargets(): BeelderReference[] | null {
        if(this.target.definesTarget) {
            return [this.target]
        }
        return null
    }
}