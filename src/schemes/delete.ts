import BeelderScheme from "../scheme";
import fs from "fs"
import Timings from "../timings";
import BeelderReference from "../reference";
import {BeelderActionConfig} from "../beelder";
import BeelderAction from "../action";

export interface DeleteActionConfig extends BeelderActionConfig {
    target: string
}

export default class DeleteAction extends BeelderAction {

    static readonly actionName: string = "delete"
    target: BeelderReference;

    constructor(config: DeleteActionConfig, scheme: BeelderScheme) {
        super(config, scheme);

        this.target = new BeelderReference(config.target)
    }

    private deleteFile(file: string) {
        try {
            let stat = fs.statSync(file)

            if (stat.isDirectory()) {
                fs.rmdirSync(file, { recursive: true })
            } else {
                fs.rmSync(file)
            }
        } catch(ignored) {}
    }

    async run(): Promise<void> {
        Timings.begin("Deleting " + this.target.getConsoleName())

        let target = this.scheme.beelder.resolveReference(this.target)

        this.deleteFile(target)

        Timings.end()
    }
}