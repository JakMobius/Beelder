import Beelder, {BeelderActionConfig} from "./beelder";
import BeelderAction from "./action";
import Timings from "./timings";
import Chalk from "chalk";
import BeelderReference from "./reference";

export interface BeelderSchemeConfig {
    steps: [BeelderActionConfig]
}

export default class BeelderScheme {

    public steps: BeelderAction[] = []
    private config: BeelderSchemeConfig;
    public beelder: Beelder;
    public name: string;
    
    constructor(name: string, config: BeelderSchemeConfig, beelder: Beelder) {
        this.name = name
        this.beelder = beelder
        this.config = config
        this.loadSteps()
    }

    private loadSteps() {
        for(let step of this.config.steps) {
            const ActionClass = Beelder.actions.get(step.action)
            if(!ActionClass) throw new Error("No such action: '" + step.action + "'")
            const action = new ActionClass(step, this)
            this.steps.push(action)
        }
    }

    public getDependencies(): string[] {
        let dependencies: string[] = []

        for(let step of this.steps) {
            const stepDependencies = step.getDependencies()
            if(stepDependencies) {
                for(let dep of stepDependencies) {
                    dependencies.push(dep)
                }
            }
        }

        return dependencies
    }

    public getTargets(): BeelderReference[] {
        let targets: BeelderReference[] = []

        for(let step of this.steps) {
            const stepTargets = step.getTargets()
            if(stepTargets) {
                for(let target of stepTargets) {
                    targets.push(target)
                }
            }
        }

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