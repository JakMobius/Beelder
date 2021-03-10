
const Beelder = require("../../bin/beelder").default
const schemes = require("./build-schemes.json")
const Chalk = require("chalk")

let beelder = new Beelder(schemes, __dirname)
module.exports = beelder.runScheme("build").then(() => {
    let passed = false
    try {
        require("./dist/index.js")
    } catch(error) {
        if(error === "ouch!") passed = true
    }

    if(passed) console.log(Chalk.green.bold("Test passed"))
    else console.error(Chalk.red.bold("Test failed"))
    return passed
})