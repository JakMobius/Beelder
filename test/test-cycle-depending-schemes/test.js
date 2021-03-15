
/*
 * Depending schemes test
 *
 * This test checks if the dependency resolve system
 * finds and reports cyclic dependencies properly.
 */

const Beelder = require("../../bin/beelder").Beelder
const schemes = require("./build-schemes.json")
const Chalk = require("chalk")

let beelder = new Beelder(schemes)
let passed = false
module.exports = beelder.runScheme("build").catch((error) => {
    if(error.message === "Cycle dependency: build -> build-2 -> build") {
        passed = true
    }
}).finally(() => {
    if(passed) console.log(Chalk.green.bold("Test passed"))
    else console.error(Chalk.red.bold("Test failed"))
    return passed
})



