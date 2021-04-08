

/*
 * resource-plugin plugin test
 *
 * This text is aims to check whether resource-plugin
 * detects @load-resource comments.
 */

const fs = require("fs");
const Beelder = require("../../bin/beelder").Beelder
const Chalk = require("chalk")
const path = require("path")

const schemeText = fs.readFileSync(path.join(__dirname, "build-schemes.json"), "utf8")
const schemes = require("json5").parse(schemeText)

let beelder = new Beelder(schemes, __dirname)
module.exports = beelder.runScheme("build").then(() => {
    let passed = false
    try {
        require("./dist/index.js")
        passed = true
    } catch(error) {
        console.error(error)
    }

    if(passed) console.log(Chalk.green.bold("Test passed"))
    else console.error(Chalk.red.bold("Test failed"))
    return passed
}).catch((error) => {
    console.error(Chalk.red.bold("Test failed"))
    return error
})