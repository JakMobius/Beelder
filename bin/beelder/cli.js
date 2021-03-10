#!/usr/bin/env node

const Chalk = require("chalk")
const Beelder = require("./index.js").Beelder
const fs = require("fs")

if(!process.argv[2]) {
    console.error(Chalk.red.bold("Please, specify which scheme to build"))
} else if(!fs.existsSync("./build-schemes.json")) {
    console.error(Chalk.red.bold("Missing build-schemes.json file"))
} else {
    let string = fs.readFileSync("./build-schemes.json", 'utf8')

    let json = JSON.parse(string)

    new Beelder(json, process.cwd()).runScheme(process.argv[2]).catch(error => {
        console.error(Chalk.red.bold("Error: " + error.message))
    })

}