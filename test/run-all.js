
const fs = require("fs")
const path = require("path")
const Timings = require("../bin/beelder/index").Timings
const Chalk = require("chalk")

async function runTests() {
    Timings.begin(Chalk.bold.blue("Running tests"))

    const files = fs.readdirSync(__dirname)
    const state = Timings.getStackState()

    let testsPassed = 0
    let testsTotal = 0

    for(let file of files) {
        let fullPath = path.join(__dirname, file);
        if(!fs.statSync(fullPath).isDirectory()) continue;

        fullPath = path.join(fullPath, "test.js")
        if(!fs.existsSync(fullPath)) continue;

        const testName = Chalk.white("'") + Chalk.magenta(file) + Chalk.white("'")

        Timings.begin("Running " + testName);
        Timings.muteSubtasks()

        testsTotal++
        const result = await require(fullPath)

        if(result instanceof Error) {
            Timings.unmuteSubtasks()
            console.error(result)
            Timings.setStackState(state, Chalk.red.bold("Test " + testName + " failed"))
        } else if(result === false) {
            Timings.unmuteSubtasks()
            Timings.setStackState(state, Chalk.red.bold("Test " + testName + " failed"))
        } else {
            Timings.end(Chalk.green("Test " + testName + " passed"))
            testsPassed++
        }
    }


    Timings.end(Chalk.blue.bold("Passed " + testsPassed + " of " + testsTotal + " tests"))
}

runTests()