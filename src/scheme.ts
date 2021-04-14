import Beelder, {BeelderActionConfig} from "./beelder";
import BeelderAction from "./action";
import Timings from "./timings";
import Chalk from "chalk";
import BeelderReference, {BeelderReferenceConfig} from "./reference";
import {concatOptionalArrays} from "./utils";

export interface BeelderSchemeConfig {
    steps: [BeelderActionConfig]
    targets: [BeelderReferenceConfig]
}

export default class BeelderScheme {

    public steps: BeelderAction[] = []
    public explicitTargets: BeelderReference[] = []
    private config: BeelderSchemeConfig;
    public beelder: Beelder;
    public name: string;
    
    constructor(name: string, config: BeelderSchemeConfig, beelder: Beelder) {
        this.name = name
        this.beelder = beelder
        this.config = config

        this.loadTargets()
        this.loadSteps()
    }

    private loadTargets() {
        if(!this.config.targets) return

        for(let referenceConfig of this.config.targets) {
            let reference = new BeelderReference(referenceConfig)
            if(!reference.definesTarget) throw new Error("References listed in 'targets' must define target")
            this.explicitTargets.push(reference)
        }
    }

    private loadSteps() {
        if(!this.config.steps) return

        for(let step of this.config.steps) {
            const ActionClass = Beelder.actions.get(step.action)
            if(!ActionClass) {
                throw new Error("No such action: '" + step.action + "'")
            }
            const action = new ActionClass(step, this)
            this.steps.push(action)
        }
    }

    public getDependencies(): string[] {
        let dependencies: string[] = []

        for(let step of this.steps) {
            dependencies = concatOptionalArrays(dependencies, step.getDependencies())
        }

        return dependencies
    }

    public getTargets(): BeelderReference[] {
        let targets: BeelderReference[] = []

        for(let step of this.steps) {
            targets = concatOptionalArrays(targets, step.getTargets())
        }

        targets = concatOptionalArrays(targets, this.explicitTargets)

        return targets
    }

    public async run() {
        let coloredSchemeName = Chalk.magenta(this.name)
        Timings.begin("Running '" + coloredSchemeName + "'")

        for(let step of this.steps) {
            await step.run()
        }

        Timings.end("Finished running '" + coloredSchemeName + "'")
    }
}