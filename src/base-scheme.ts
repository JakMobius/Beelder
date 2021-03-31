
import Action from "./action";
import {BeelderActionConfig} from "./beelder";
import BeelderScheme from "./scheme";
import BeelderReference from "./reference";
import BuildCache from "./build-cache";

export interface BaseActionConfig extends BeelderActionConfig {
    source: string
    target: string
}

export default class BaseAction extends Action {

    target: BeelderReference;
    source: BeelderReference;
    cache: BuildCache;

    constructor(config: BaseActionConfig, scheme: BeelderScheme) {
        super(config, scheme);

        this.target = new BeelderReference(config.target)
        this.source = new BeelderReference(config.source)
        this.cache = scheme.beelder.cache.getSection((this.constructor as typeof BaseAction).actionName)
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