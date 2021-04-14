import BeelderScheme from "../scheme";
import BaseAction, {BaseActionConfig} from "../base-scheme";
import path from "path";
import {copyDirectory, prepareDirectory} from "../utils";
import fs from "fs"
import Timings from "../timings";

export interface CopyActionConfig extends BaseActionConfig {
    source: string
    target: string
}

export default class CopyAction extends BaseAction {

    static readonly actionName: string = "copy"

    constructor(config: CopyActionConfig, scheme: BeelderScheme) {
        super(config, scheme);
    }

    async run(): Promise<void> {
        Timings.begin("Copying " + this.source.getConsoleName() + " to " + this.target.getConsoleName())

        let source = this.scheme.beelder.resolveReference(this.source)
        let destination = this.scheme.beelder.resolveReference(this.target)

        let sourceStat;

        try {
            sourceStat = await fs.promises.stat(source)
        } catch(e) {
            throw new Error("Copying failed: " + e.message)
        }

        let dirname: string

        if(destination.endsWith("/")) {
            // Copying something in directory, adding filename explicitly

            dirname = destination
            destination = path.join(destination, path.basename(source))
        } else {
            // Copying file on exact new location

            dirname = path.dirname(destination)
        }

        if(!await prepareDirectory(dirname)) {
            throw new Error("Could not create destination directory")
        }

        if(sourceStat.isDirectory()) {
            await copyDirectory(source, destination)
        } else {
            await fs.promises.copyFile(source, destination)
        }

        Timings.end()
    }
}