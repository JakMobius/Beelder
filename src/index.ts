import Beelder from "./beelder"
import * as fs from 'fs'

if(require.main == module) {
    let string = fs.readFileSync("./build-schemes.json", 'utf8')

    let json = JSON.parse(string)

    new Beelder(json, __dirname).runScheme(process.argv[2])
}

import Timings from './timings'; export { Timings }
export default Beelder