import EventEmitter from "events";
import fs from "fs";
import {prepareFilePath} from "../utils";

export default class StreamToFile extends EventEmitter {
    errors = 0

    constructor(stream: NodeJS.ReadableStream, file: string) {
        super()

        if(!prepareFilePath(file)) {
            this.errorHandler(new Error("Cannot create parent directories for '" + file + "'"))
            this.emit("comlete", this)
        } else {
            stream.on("error", (error) => this.errorHandler(error))
            stream.on("end", (event) => this.emit("complete", this))
            stream.pipe(fs.createWriteStream(file).on("error", (error) => this.errorHandler(error)))
        }
    }

    errorHandler(error: Error) {
        this.errors ++
        this.emit("error", error)
    }

    waitUntilComplete(): Promise<number> {
        return new Promise(resolve => {
            this.on("complete", () => {
                resolve(this.errors)
            })
        })
    }
}