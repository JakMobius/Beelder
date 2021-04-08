import * as babel from "@babel/core";
import path from "path";
import traverse from "@babel/traverse";
import fs from "fs";
import Packer from "./packer";

interface SourcePosition {
    line: number;
    column: number;
}

interface PackerASTWatcherConfig {
    extensions: string[]
    packer: Packer
}

export default class PackerASTWatcher {
    config: PackerASTWatcherConfig;

    constructor(config: PackerASTWatcherConfig) {
        this.config = config
    }

    private getErrorWithMessage(message: string, filePath: string, location: SourcePosition) {
        return new Error(message + " at " + path.relative(this.config.packer.bundler.config.projectRoot, filePath) + ":" + location.line)
    }

    private guessFilePath(filePath: string) {
        let fileExtension = path.extname(filePath)

        if(fileExtension) {
            if(fs.existsSync(filePath)) {
                return filePath
            }
            return null
        }

        for(let extension of this.config.extensions) {
            let extendedPath = filePath + extension
            if(fs.existsSync(extendedPath)) {
                return extendedPath
            }
        }

        return null
    }

    findDependencies(ast: babel.types.File, filePath: string) {
        let dirname = path.dirname(filePath)

        let dependencies: { [key: string]: string } = {}

        const addDependency = (dependency: string, node: babel.types.Node) => {
            if(dependency.startsWith('.')) {
                let fullPath = path.join(dirname, dependency)
                fullPath = this.guessFilePath(fullPath)
                if(!fullPath) {
                    throw this.getErrorWithMessage("No such file: " + dependency, filePath, node.loc.start)
                }
                dependencies[dependency] = fullPath
            } else {
                dependencies[dependency] = dependency
            }
        }

        traverse(ast, {
            CallExpression: (nodePath) => {
                let callee = nodePath.node.callee
                if(callee.type != "Identifier" || callee.name != "require") return
                let args = nodePath.node.arguments
                if(args.length != 1 || args[0].type != "StringLiteral") return
                addDependency(args[0].value, nodePath.node)
            },
            ImportDeclaration: (nodePath) => {
                let source = nodePath.node.source.value
                addDependency(source, nodePath.node)
            }
        })

        return dependencies
    }
}