import {BeelderActionConfig} from "./beelder";
import BeelderScheme from "./scheme";
import BeelderReference from "./reference";

export default class BeelderAction {

    static readonly actionName: string;
    scheme: BeelderScheme;

    constructor(config: BeelderActionConfig, scheme: BeelderScheme) {
        this.scheme = scheme
    }

    public getDependencies(): string[] | null {
        return null
    }

    public getTargets(): BeelderReference[] | null {
        return null
    }

    public async run() {

    }
}