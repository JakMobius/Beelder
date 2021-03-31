

/*
 * use-babel-plugin plugin test
 *
 * This test aims to check if Beelder is calling Babel
 * and creates correct executable bundle which can be
 * invoked from pure node.js environment
 */

const Beelder = require("../../bin/beelder").Beelder
const schemes = require("./build-schemes.json")
const Chalk = require("chalk")

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