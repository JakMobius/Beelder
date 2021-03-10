
import util from 'util'
import Chalk from 'chalk'

class Entry {
    hasInlinedText: boolean
    public date: number;
    public title: string;

    constructor(title: string) {
        this.title = title
        this.date = Date.now()
        this.hasInlinedText = false
    }
}

export default class Timings {
    private static mutedStackIndex?: number = null;

    static stdoutWriteHandler?: (data: any) => boolean = null
    static stderrWriteHandler?: (data: any) => boolean = null

    static stdoutShouldLinefeed = false
    static stdoutMarkMessage = false

    static logPrefix: string = Chalk.yellow.bold("[ LOG ]") + Chalk.gray(": ")
    static errPrefix: string = Chalk.red.bold("[ ERR ]") + Chalk.gray(": ")

    static timingColor: Chalk.Chalk = Chalk.cyan

    static stack: Entry[] = []

    private static tab() {
        return new Array(this.stack.length + 1).join(Chalk.gray("- "))
    }

    static muteSubtasks() {
        if(this.mutedStackIndex === null)
            this.mutedStackIndex = this.stack.length
    }

    static unmuteSubtasks() {
        if(this.stack.length === this.mutedStackIndex) this.mutedStackIndex = null
    }

    static begin(title: string) {
        this.stdoutMarkMessage = false

        if(this.stack.length === 0) {
            this.bindStdout();
        }

        process.stdout.write(title + Chalk.gray(":"))

        this.stdoutMarkMessage = true
        this.stdoutShouldLinefeed = true

        this.stack.push(new Entry(title))
    }

    static getStackState(): number {
        return this.stack.length
    }

    static setStackState(length: number, reason?: string): void {
        while(this.stack.length > length) {
            if(reason) {
                this.end(reason.replace("%s", this.stack[this.stack.length - 1].title))
            } else {
                this.end()
            }
        }
    }

    static perform(title: string, task: () => void): void
    static perform(title: string, task: () => Promise<void>): Promise<void>
    static perform(title: string, task: (() => void) | (() => Promise<void>)): void | Promise<void> {
        this.begin(title)

        if(util.types.isAsyncFunction(task)) {
            return (task() as Promise<void>).then(() => this.end())
        }

        task()
        this.end()
    }

    static end(description?: string) {
        if(this.stack.length === this.mutedStackIndex) this.mutedStackIndex = null
        let task = this.stack.pop()

        let time = ((Date.now() - task.date) / 1000).toFixed(3)

        this.stdoutMarkMessage = false

        if (task.hasInlinedText) {
            if(!description) {
                description = task.title
            }
            process.stdout.write(description + Chalk.gray(": ") + this.timingColor("[" + time + "s]"))
            this.stdoutShouldLinefeed = true
        } else {
            this.stdoutShouldLinefeed = false
            if(description) {
                this.stdoutShouldLinefeed = false
                process.stdout.write("\r\x1b[K" + this.tab() + description + Chalk.gray(":"))
            }
            process.stdout.write(this.timingColor(" [" + time + "s]"))
            this.stdoutShouldLinefeed = true
        }

        this.stdoutMarkMessage = true

        if(this.stack.length === 0) {
            this.unbindStdout();
        }
    }

    static bindStdout() {
        this.stdoutWriteHandler = process.stdout.write
        this.stderrWriteHandler = process.stderr.write

        process.stdout.write = (data: any): boolean => {
            this.writeHandler(data, false)
            return true
        }

        process.stderr.write = (data: any): boolean => {
            this.writeHandler(data, true)
            return true
        }
    }

    private static writeHandler(text: string, isError: boolean) {

        if(this.mutedStackIndex !== null) return

        if(this.stack.length)
            this.stack[this.stack.length - 1].hasInlinedText = true

        if (this.stdoutShouldLinefeed) {
            text = "\n" + text;
            this.stdoutShouldLinefeed = false;
        } else if(this.stdoutMarkMessage) {
            if (isError) text = this.errPrefix + text;
            else         text = this.logPrefix + text;
        }

        if(text[text.length - 1] === "\n") {
            text = text.substr(0, text.length - 1)
            this.stdoutShouldLinefeed = true
        }

        if(this.stdoutMarkMessage) {
            text = text.replace(/\n(?!$)/g, "\n" + this.tab() + (isError ? this.errPrefix : this.logPrefix));
        } else {
            text = text.replace(/\n/g, "\n" + this.tab());
        }

        this.stdoutWriteHandler.call(process.stdout, text);
    }

    private static unbindStdout() {
        process.stdout.write = this.stdoutWriteHandler
        process.stderr.write = this.stderrWriteHandler

        if(this.stdoutShouldLinefeed) {
            process.stdout.write("\n")
            this.stdoutShouldLinefeed = false
        }
    }
}