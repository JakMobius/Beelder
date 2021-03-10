import Chalk from "chalk";

export type BeelderReferenceConfig = string & {
    targetName?: string
    path?: string

}

export default class BeelderReference {
    public readonly isDependency: boolean = false
    public readonly definesTarget: boolean = false
    public readonly path: string
    public config: BeelderReferenceConfig;

    constructor(config: BeelderReferenceConfig) {
        this.config = config

        if(typeof config === "object") {
            if(config.targetName) {
                if(config.path) this.definesTarget = true
                else this.isDependency = true
            }
            this.path = config.path
        } else {
            this.path = config
        }

        if(!this.path) this.path = null
    }

    public getDependency(): string | null {
        if(!this.isDependency) return null
        return this.config.targetName
    }

    public getDefinedTarget(): string | null {
        if(!this.definesTarget) return null
        return this.config.targetName
    }

    public getPath(): string | null {
        return this.path
    }

    public getConsoleName(): string {
        if(this.definesTarget || this.isDependency) {
            return Chalk.green(this.config.targetName)
        } else {
            return Chalk.blueBright(this.path)
        }
    }
}