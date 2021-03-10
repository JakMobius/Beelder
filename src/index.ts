import Beelder from "./beelder"
import * as fs from 'fs'
import Chalk from 'chalk'

if(!module.parent) {
    if(!process.argv[2]) {
        console.error(Chalk.red.bold("Please, specify which scheme to build"))
    } else if(!fs.existsSync("./build-schemes.json")) {
        console.error(Chalk.red.bold("Missing build-schemes.json file"))
    } else {
        let string = fs.readFileSync("./build-schemes.json", 'utf8')

        let json = JSON.parse(string)

        new Beelder(json, process.cwd()).runScheme(process.argv[2])
    }
}

import Timings from './timings'; export { Timings }
export default Beelder