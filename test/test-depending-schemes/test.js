
/*
 * Depending schemes test
 *
 * This test aims to check the dependency resolution system.
 */

const Beelder = require("../../bin/beelder").Beelder
const schemes = require("./build-schemes.json")
const Chalk = require("chalk");

let beelder = new Beelder(schemes, __dirname)
module.exports = beelder.runScheme("build").then(() => {
    console.log(Chalk.green.bold("Test passed"))
}).catch((error) => {
    console.error(Chalk.red.bold("Test failed"))
    return error
})



