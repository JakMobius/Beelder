
/*
 * Depending schemes test
 *
 * This test aims to check the dependency resolution system.
 */

const Beelder = require("../../bin/beelder").Beelder
const schemes = require("./build-schemes.json")
const Chalk = require("chalk");
const fs = require("fs")
const path = require("path")

const distFolder = path.join(__dirname, "dist")

function unlinkDist() {
    if(fs.existsSync(distFolder)) fs.rmdirSync(distFolder, { recursive: true })
}

function ensureExists(filePath) {
    if(!fs.existsSync(path.join(__dirname, filePath))) {
        throw new Error("Expected Beelder to create '" + filePath + "'")
    }
}

let beelder = new Beelder(schemes, __dirname)
module.exports = (beelder.runScheme("build").then(() => {
        try {
            ensureExists("dist")
            ensureExists("dist/index.ts")
            ensureExists("dist/index-renamed.ts")
            ensureExists("dist/directory")
            ensureExists("dist/directory-renamed")
            ensureExists("dist/directory/nested-file.ts")
            ensureExists("dist/directory-renamed/nested-file.ts")
        } catch (e) {
            return e
        }
    }).catch((error) => {
        return error
    })).then((result) => {
        unlinkDist()
        if(result) console.error(Chalk.red.bold("Test failed"))
        else console.log(Chalk.green.bold("Test passed"))
        return result
    })



