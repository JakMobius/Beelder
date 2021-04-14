#!/usr/bin/env node

const Chalk = require("chalk")
const Beelder = require("./index.js").Beelder
const fs = require("fs")
const json5 = require("json5")
const path = require("path")

function getSchemes() {
    if(fs.existsSync("./build-schemes.json")) {
        return json5.parse(fs.readFileSync("./build-schemes.json", 'utf8'))
    } else if(fs.existsSync("./build-schemes.js")) {
        return require(path.join(process.cwd(), "build-schemes.js"))
    }
    return null
}

if(!process.argv[2]) {
    console.error(Chalk.red.bold("Please, specify which scheme to build"))
} else {
    let schemes = getSchemes()

    if(!schemes) {
        console.error(Chalk.red.bold("Missing build-schemes.json file"))
    } else {
        new Beelder(schemes, process.cwd()).runScheme(process.argv[2]).catch(error => {
            console.error(Chalk.red.bold("Error: " + error.message))
        })
    }
}