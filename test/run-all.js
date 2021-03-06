
const fs = require("fs")
const path = require("path")
const Timings = require("../bin/beelder/index").Timings
const Chalk = require("chalk")

function unlinkDirectory(path) {
    if(fs.existsSync(path)) {
        fs.rmdirSync(path, { recursive: true })
    }
}

async function runTests(files) {
    const state = Timings.getStackState()

    let testsPassed = 0
    let testsTotal = 0

    for(let file of files) {
        let fullPath = path.join(__dirname, file);
        if(!fs.statSync(fullPath).isDirectory()) continue;

        fullPath = path.join(fullPath, "test.js")
        if(!fs.existsSync(fullPath)) continue;

        process.chdir(path.join(__dirname, file))

        const testName = Chalk.white("'") + Chalk.magenta(file) + Chalk.white("'")

        Timings.begin("Running " + testName);
        Timings.muteSubtasks()

        testsTotal++
        let result = null
        try {
            result = await require(fullPath)
        } catch(error) {
            result = error
        }

        if(result instanceof Error) {
            Timings.unmuteSubtasks()
            console.error(result)
            Timings.setStackState(state, Chalk.red.bold("Test " + testName + " failed: " + result.message))
        } else if(result === false) {
            Timings.unmuteSubtasks()
            Timings.setStackState(state, Chalk.red.bold("Test " + testName + " failed"))
        } else {
            Timings.end(Chalk.green("Test " + testName + " passed"))
            testsPassed++
        }
    }

    return {
        passed: testsPassed,
        total: testsTotal
    }
}

async function cleanBuildCaches(files) {
    Timings.begin(Chalk.bold.blue("Cleaning test caches"))
    for(let file of files) {
        let fullPath = path.join(__dirname, file);
        unlinkDirectory(path.join(fullPath, "dist"));
        unlinkDirectory(path.join(fullPath, "cache"));
        unlinkDirectory(path.join(fullPath, "beelder-cache"));
    }
    Timings.end()
}

async function prepareAndRunTests() {
    const files = fs.readdirSync(__dirname)

    await cleanBuildCaches(files)

    Timings.begin(Chalk.bold.blue("Running tests"))
    let testsResult = await runTests(files);
    Timings.end(Chalk.blue.bold("Passed " + testsResult.passed + " of " + testsResult.total + " tests"))

    await cleanBuildCaches(files)
}

prepareAndRunTests().then(() => {})