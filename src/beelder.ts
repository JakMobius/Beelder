import BeelderScheme, {BeelderSchemeConfig} from "./scheme";
import BundleJavascriptAction from "./schemes/bundle-javascript";
import CopyAction from "./schemes/copy";
import TextureAtlasAction from "./schemes/texture-atlas";
import BeelderAction from "./action";
import Timings from "./timings";
import BeelderReference from "./reference";
import path from "path";
import Chalk from "chalk"
import BuildCache from "./build-cache";

export interface BeelderActionConfig {
    action: string
    targetName?: string
}

export interface BeelderConfig {
    cacheDirectory?: string;
    schemes: { [key: string]: BeelderSchemeConfig }
}

export default class Beelder {

    private config: BeelderConfig
    public static actions: Map<string, typeof BeelderAction> = new Map()
    public schemes: Map<string, BeelderScheme> = new Map()
    public targetMap: Map<string, BeelderScheme> = new Map()
    public referenceMap: Map<string, BeelderReference> = new Map()
    public readonly projectRoot: string;
    public readonly cacheDirectory: string;
    public cache: BuildCache;

    constructor(config: BeelderConfig, projectRoot?: string) {
        this.config = config

        this.projectRoot = projectRoot ?? '/'
        this.cacheDirectory = path.resolve(this.projectRoot, config.cacheDirectory ?? "beelder-cache")
        this.cache = new BuildCache(this.cacheDirectory)

        this.loadSchemes()
    }

    loadSchemes(): void {
        for(let [name, scheme] of Object.entries(this.config.schemes)) {
            this.schemes.set(name, new BeelderScheme(name, scheme, this))
        }
        for(let scheme of this.schemes.values()) {
            for(let target of scheme.getTargets()) {
                this.targetMap.set(target.getDefinedTarget(), scheme)
                this.referenceMap.set(target.getDefinedTarget(), target);
            }
        }
    }

    static registerAction(actionClass: typeof BeelderAction) {
        this.actions.set(actionClass.actionName, actionClass);
    }

    async runScheme(schemeName: string) {
        let scheme = this.schemes.get(schemeName)
        if (!scheme) throw new Error("No such scheme: '" + schemeName + "'")

        let state = Timings.getStackState()
        try {

            Timings.begin("Building")

            let list: BeelderScheme[] = []
            let stack: BeelderScheme[] = []

            this.enqueueScheme(list, scheme, stack)
            await this.runSchemeList(list)

            Timings.end("Build finished")

        } catch(e) {
            console.error(e.message)
            Timings.setStackState(state, "%s " + Chalk.red("failed due to error"))
            throw e
        }
    }

    private enqueueScheme(list: BeelderScheme[], scheme: BeelderScheme, stack: BeelderScheme[]) {

        let dependencies = scheme.getDependencies()

        if(stack.indexOf(scheme) != -1) {
            let arrow = " -> "
            let path = stack.slice(stack.indexOf(scheme)).map(a => a.name).join(arrow)
            throw new Error("Cycle dependency: " + path + arrow + scheme.name);
        }

        stack.push(scheme)

        for(let dependencyName of dependencies) {
            let dependency = this.targetMap.get(dependencyName)
            if(!dependency) throw new Error("Scheme '" + scheme.name + "' have an unknown dependency: '" + dependencyName + "'")
            this.enqueueScheme(list, dependency, stack)
        }

        stack.pop()
        list.push(scheme)
    }

    private async runSchemeList(list: BeelderScheme[]) {
        for(let scheme of list) {
            await scheme.run()
        }
    }

    public resolveReference(reference: BeelderReference) {
        let referencePath: string

        if(reference.isDependency) {
            let dependency = reference.getDependency()

            let beelderReference = this.referenceMap.get(dependency)
            if(!beelderReference) throw new Error("Failed to resolve reference: '" + dependency + "'")

            referencePath = beelderReference.path
        } else {
            referencePath = reference.path
        }

        referencePath = path.resolve(this.projectRoot, referencePath)

        return referencePath
    }

    getAbsolutePath(file: string) {
        return path.join(this.projectRoot, file)
    }
}

Beelder.registerAction(BundleJavascriptAction)
Beelder.registerAction(CopyAction)
Beelder.registerAction(TextureAtlasAction)