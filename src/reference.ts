import Chalk from "chalk";

export type BeelderReferenceConfig = string & {
    targetName?: string
    path?: string

}

export default class BeelderReference {
    public isDependency: boolean = false
    public definesTarget: boolean = false
    private path: string
    private targetName?: string
    public config: BeelderReferenceConfig;

    constructor(config: BeelderReferenceConfig) {
        this.config = config

        if(typeof config === "object") {
            if(config.targetName) {
                if(config.path) this.definesTarget = true
                else this.isDependency = true
                this.targetName = config.targetName
            }
            this.path = config.path
        } else {
            this.parseInlineFormat(config)
        }

        if(!this.path) this.path = null
    }

    private parseInlineFormat(text: string) {
        if(/^#[^ =]*$/.test(text)) {
            this.targetName = text.substr(1)
            this.isDependency = true
        } else if(/^#[^ =]* *=.*$/.test(text)) {
            let equalitySignIndex = text.indexOf("=")
            this.targetName = text.substring(1, equalitySignIndex).replace(/ *$/,"")
            this.path = text.substr(equalitySignIndex + 1).replace(/^ */,"")
            this.definesTarget = true
        } else {
            this.path = text
        }
    }


    public getDependency(): string | null {
        if(!this.isDependency) return null
        return this.targetName
    }

    public getDefinedTarget(): string | null {
        if(!this.definesTarget) return null
        return this.targetName
    }

    public getPath(): string | null {
        return this.path
    }

    public getConsoleName(): string {
        if(this.definesTarget || this.isDependency) {
            return Chalk.green(this.targetName)
        } else {
            return Chalk.blueBright(this.path)
        }
    }
}