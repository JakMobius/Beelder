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
import CreateShaderLibraryAction from "./schemes/create-shader-library";
import CompileSCSSSchemeAction from "./schemes/compile-scss";
import DeleteAction from "./schemes/delete";
import RunCommandAction from "./schemes/run-command";
import RequireTargetAction from "./schemes/require-target";

export interface BeelderActionConfig {
    action: string
}

export interface BeelderConfig {
    cacheDirectory?: string;
    schemes: { [key: string]: BeelderSchemeConfig }
}

export default class Beelder {

    private config: BeelderConfig
    public static actions: Map<string, typeof BeelderAction> = new Map()
    public schemes: Map<string, BeelderScheme>
    public targetMap: Map<string, BeelderScheme>
    public referenceMap: Map<string, BeelderReference>
    public projectRoot: string;
    public cacheDirectory: string;
    public cache: BuildCache;

    constructor(config: BeelderConfig, projectRoot?: string) {
        this.config = config
        this.projectRoot = projectRoot ?? '/'
        this.cacheDirectory = path.resolve(this.projectRoot, this.config.cacheDirectory ?? "beelder-cache")
        this.cache = new BuildCache(this.cacheDirectory)
    }

    loadSchemes(): void {
        Timings.begin("Initializing Beelder")
        this.schemes = new Map()
        this.targetMap = new Map()
        this.referenceMap = new Map()

        for(let [name, scheme] of Object.entries(this.config.schemes)) {
            this.schemes.set(name, new BeelderScheme(name, scheme, this))
        }
        for(let scheme of this.schemes.values()) {
            for(let target of scheme.getTargets()) {
                this.targetMap.set(target.getDefinedTarget(), scheme)
                this.referenceMap.set(target.getDefinedTarget(), target);
            }
        }
        Timings.end()
    }

    static registerAction(actionClass: typeof BeelderAction) {
        this.actions.set(actionClass.actionName, actionClass);
    }

    async runScheme(schemeName: string) {
        if(!this.schemes) this.loadSchemes()
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
            console.error(e)
            Timings.setStackState(state, "%s " + Chalk.red("failed due to error"))
            throw e
        }
    }

    private enqueueScheme(list: BeelderScheme[], scheme: BeelderScheme, stack: BeelderScheme[]) {

        if(list.indexOf(scheme) != -1) return

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

            referencePath = beelderReference.getPath()
        } else {
            referencePath = reference.getPath()
        }

        if(!referencePath) return null

        referencePath = path.join(this.projectRoot, referencePath)

        return referencePath
    }

    getAbsolutePath(file: string) {
        return path.join(this.projectRoot, file)
    }
}

Beelder.registerAction(BundleJavascriptAction)
Beelder.registerAction(CopyAction)
Beelder.registerAction(TextureAtlasAction)
Beelder.registerAction(CreateShaderLibraryAction)
Beelder.registerAction(CompileSCSSSchemeAction)
Beelder.registerAction(DeleteAction)
Beelder.registerAction(RequireTargetAction)