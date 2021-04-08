
const babelify = require('babelify')
const browserify = require("browserify")
const exorcist = require('exorcist')
const fs = require('fs')
const path = require('path')

fs.copyFileSync("./cli.js", "../bin/beelder/cli.js")

const compiler = browserify({
    paths: [__dirname],
    extensions: ['.ts'],
    detectGlobals: false,
    standalone: "beelder"
}, { debug: true })

const babel = babelify.configure({
    plugins: [
        ["@babel/plugin-syntax-dynamic-import"],
        ["@babel/plugin-syntax-class-properties"],
        ["@babel/plugin-proposal-class-properties", { loose: true }],
        ["@babel/plugin-transform-typescript"],
        ["@babel/plugin-transform-runtime"],
        ["@babel/plugin-proposal-export-default-from"],
    ],
    "presets": [
        ['@babel/preset-env', {
            // "debug": true,
            "targets": "node 7"
        }]
    ],
    sourceMaps: true,
    sourceType: "module",
    extensions: ['.ts', '.js']
})

compiler.transform(babel)
compiler.require("index.ts")

let external = [
    "util",
    "events",
    "fs",
    "path",
    "atlaspack",
    "babelify",
    "browserify",
    "browserify-incremental",
    "canvas",
    "chalk",
    "exorcist",
    "source-map-support",
    "typescript",
    "@babel",
    "browser-pack",
    "stream"
]

for(let babelDependency of fs.readdirSync(path.join(__dirname, "../node_modules/@babel"))) {
    external.push("@babel/" + babelDependency);
}

for(let module of external) {
    compiler.external(module)
}

try {
    !fs.accessSync("../bin/beelder")
} catch (e) {
    fs.mkdirSync("../bin/beelder", { recursive: true })
}

compiler.bundle()
    .on("error", (error) => {
        console.error(error.message, error.stack)
    })
    .pipe(exorcist(
        path.resolve(__dirname, "../bin/beelder/index.js.map")),
        null,
        "../",
        __dirname
    )
    .pipe(fs.createWriteStream(path.resolve(__dirname, '../bin/beelder/index.js'), 'utf8'))