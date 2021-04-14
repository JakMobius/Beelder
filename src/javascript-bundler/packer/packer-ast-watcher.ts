import * as babel from "@babel/core";
import path from "path";
import traverse from "@babel/traverse";
import Packer from "./packer";
import BrowserResolve from 'browser-resolve'

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
        let relativePath = path.relative(this.config.packer.bundler.config.projectRoot, filePath)
        if(location) {
            return new Error(message + " at " + relativePath + ":" + location.line)
        } else {
            return new Error(message + " at " + relativePath)
        }
    }

    private guessFilePath(dependency: string, filePath: string): string {
        return BrowserResolve.sync(dependency, {
            filename: filePath,
            extensions: this.config.extensions
        })
    }

    findDependencies(ast: babel.types.File | babel.types.Program, filePath: string) {
        let dependencies: { [key: string]: string } = {}

        const addDependency = (dependency: string, node: babel.types.Node) => {
            if(this.config.packer.shouldWalkFile(dependency)) {
                try {
                    dependencies[dependency] = this.guessFilePath(dependency, filePath)
                } catch (e) {
                    throw this.getErrorWithMessage("No such file: " + dependency, filePath, node.loc && node.loc.start)
                }
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