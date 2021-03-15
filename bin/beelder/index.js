(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.beelder = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],2:[function(require,module,exports){
var _typeof = require("@babel/runtime/helpers/typeof");

function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function") return null;
  var cache = new WeakMap();

  _getRequireWildcardCache = function _getRequireWildcardCache() {
    return cache;
  };

  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
    return {
      "default": obj
    };
  }

  var cache = _getRequireWildcardCache();

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj["default"] = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

module.exports = _interopRequireWildcard;
},{"@babel/runtime/helpers/typeof":3}],3:[function(require,module,exports){
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class BeelderAction {
  constructor(config, scheme) {
    this.scheme = void 0;
    this.scheme = scheme;
  }

  getDependencies() {
    return null;
  }

  getTargets() {
    return null;
  }

  async run() {}

}

exports.default = BeelderAction;
BeelderAction.actionName = void 0;

},{}],5:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _action = _interopRequireDefault(require("./action"));

var _reference = _interopRequireDefault(require("./reference"));

class BaseAction extends _action.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.target = void 0;
    this.source = void 0;
    this.cache = void 0;
    this.target = new _reference.default(config.target);
    this.source = new _reference.default(config.source);
    this.cache = scheme.beelder.cache.getSection(this.constructor.actionName);
  }

  getDependencies() {
    if (this.source.isDependency) {
      return [this.source.getDependency()];
    }

    return null;
  }

  getTargets() {
    if (this.target.definesTarget) {
      return [this.target];
    }

    return null;
  }

}

exports.default = BaseAction;

},{"./action":4,"./reference":9,"@babel/runtime/helpers/interopRequireDefault":1}],6:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _scheme = _interopRequireDefault(require("./scheme"));

var _bundleJavascript = _interopRequireDefault(require("./schemes/bundle-javascript"));

var _copy = _interopRequireDefault(require("./schemes/copy"));

var _textureAtlas = _interopRequireDefault(require("./schemes/texture-atlas"));

var _timings = _interopRequireDefault(require("./timings"));

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _buildCache = _interopRequireDefault(require("./build-cache"));

class Beelder {
  constructor(config, projectRoot) {
    var _config$cacheDirector;

    this.config = void 0;
    this.schemes = new Map();
    this.targetMap = new Map();
    this.referenceMap = new Map();
    this.projectRoot = void 0;
    this.cacheDirectory = void 0;
    this.cache = void 0;
    this.config = config;
    this.projectRoot = projectRoot !== null && projectRoot !== void 0 ? projectRoot : '/';
    this.cacheDirectory = _path.default.resolve(this.projectRoot, (_config$cacheDirector = config.cacheDirectory) !== null && _config$cacheDirector !== void 0 ? _config$cacheDirector : "beelder-cache");
    this.cache = new _buildCache.default(this.cacheDirectory);
    this.loadSchemes();
  }

  loadSchemes() {
    for (let [name, scheme] of Object.entries(this.config.schemes)) {
      this.schemes.set(name, new _scheme.default(name, scheme, this));
    }

    for (let scheme of this.schemes.values()) {
      for (let target of scheme.getTargets()) {
        this.targetMap.set(target.getDefinedTarget(), scheme);
        this.referenceMap.set(target.getDefinedTarget(), target);
      }
    }
  }

  static registerAction(actionClass) {
    this.actions.set(actionClass.actionName, actionClass);
  }

  async runScheme(schemeName) {
    let scheme = this.schemes.get(schemeName);
    if (!scheme) throw new Error("No such scheme: '" + schemeName + "'");

    let state = _timings.default.getStackState();

    try {
      _timings.default.begin("Building");

      let list = [];
      let stack = [];
      this.enqueueScheme(list, scheme, stack);
      await this.runSchemeList(list);

      _timings.default.end("Build finished");
    } catch (e) {
      console.error(e.message);

      _timings.default.setStackState(state, "%s " + _chalk.default.red("failed due to error"));

      throw e;
    }
  }

  enqueueScheme(list, scheme, stack) {
    let dependencies = scheme.getDependencies();

    if (stack.indexOf(scheme) != -1) {
      let arrow = " -> ";
      let path = stack.slice(stack.indexOf(scheme)).map(a => a.name).join(arrow);
      throw new Error("Cycle dependency: " + path + arrow + scheme.name);
    }

    stack.push(scheme);

    for (let dependencyName of dependencies) {
      let dependency = this.targetMap.get(dependencyName);
      if (!dependency) throw new Error("Scheme '" + scheme.name + "' have an unknown dependency: '" + dependencyName + "'");
      this.enqueueScheme(list, dependency, stack);
    }

    stack.pop();
    list.push(scheme);
  }

  async runSchemeList(list) {
    for (let scheme of list) {
      await scheme.run();
    }
  }

  resolveReference(reference) {
    let referencePath;

    if (reference.isDependency) {
      let dependency = reference.getDependency();
      let beelderReference = this.referenceMap.get(dependency);
      if (!beelderReference) throw new Error("Failed to resolve reference: '" + dependency + "'");
      referencePath = beelderReference.path;
    } else {
      referencePath = reference.path;
    }

    referencePath = _path.default.resolve(this.projectRoot, referencePath);
    return referencePath;
  }

  getAbsolutePath(file) {
    return _path.default.join(this.projectRoot, file);
  }

}

exports.default = Beelder;
Beelder.actions = new Map();
Beelder.registerAction(_bundleJavascript.default);
Beelder.registerAction(_copy.default);
Beelder.registerAction(_textureAtlas.default);

},{"./build-cache":7,"./scheme":10,"./schemes/bundle-javascript":11,"./schemes/copy":12,"./schemes/texture-atlas":13,"./timings":14,"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk","path":"path"}],7:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _utils = require("./utils");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

class BuildCache {
  constructor(sectionPath) {
    this.sectionPath = void 0;
    this.cacheFilePath = void 0;
    this.sectionPath = sectionPath;
    this.cacheFilePath = _path.default.join(this.sectionPath, "section.json");
  }

  getSection(section) {
    let sectionPath = _path.default.join(this.sectionPath, section);

    return new BuildCache(sectionPath);
  }

  async getJSON() {
    if (!(0, _utils.prepareFileLocation)(this.cacheFilePath)) {
      throw new Error("Impossible to create cache file");
    }

    return await _fs.default.promises.readFile(this.cacheFilePath, "utf-8").then(text => {
      return JSON.parse(text);
    }).catch(async () => {
      console.error("Cache file is missing or corrupted, clearing the cache");
      await _fs.default.promises.writeFile(this.cacheFilePath, "{}");
      return {};
    });
  }

  async setJSON(json) {
    if (!(0, _utils.prepareFileLocation)(this.cacheFilePath)) {
      throw new Error("Impossible to create cache file");
    }

    try {
      let data = JSON.stringify(json);
      await _fs.default.promises.writeFile(this.cacheFilePath, data).catch(error => {
        console.error("Could not save cache file for section " + this.sectionPath);
        console.error(error.message);
      });
    } catch (error) {
      console.error("Coult not save cache file");
      console.error(error.message);
    }
  }

  static async fileRequiresRefresh(cache, fileName) {
    let cacheEntry = cache[fileName];
    if (!cacheEntry) return true;

    try {
      await _fs.default.promises.access(fileName);
    } catch (error) {
      return true;
    }

    let stats = await _fs.default.promises.stat(fileName);
    return cacheEntry.modificationDate < stats.mtime.getTime();
  }

  static getFileData(cache, fileName) {
    let cacheEntry = cache[fileName];
    if (!cacheEntry) return null;
    return cacheEntry.data;
  }

  static refreshFileData(cache, fileName, data) {
    let cacheEntry = cache[fileName];

    if (cacheEntry) {
      cacheEntry.modificationDate = Date.now();
      cacheEntry.data = data;
    } else {
      cache[fileName] = {
        modificationDate: Date.now(),
        data: data
      };
    }
  }

}

exports.default = BuildCache;

},{"./utils":15,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],8:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _babelify = _interopRequireDefault(require("babelify"));

var _browserifyIncremental = _interopRequireDefault(require("browserify-incremental"));

var _browserify = _interopRequireDefault(require("browserify"));

var _exorcist = _interopRequireDefault(require("exorcist"));

var _utils = require("../utils");

var fs = _interopRequireWildcard(require("fs"));

// @ts-ignore
class Bundler {
  constructor(config) {
    this.config = void 0;
    this.plugins = [];
    this.babelify = void 0;
    this.browserify = void 0;
    this.config = config;
  }

  plugin(plugin) {
    plugin.setCompiler(this);
    this.plugins.push(plugin);
    return this;
  }

  createBabelify() {
    var _this$config$babelPre, _this$config$babelSou;

    return _babelify.default.configure({
      plugins: this.getBabelPluginList(),
      presets: (_this$config$babelPre = this.config.babelPresets) !== null && _this$config$babelPre !== void 0 ? _this$config$babelPre : this.getDefaultBabelifyPresets(),
      sourceMaps: this.config.generateSourceMaps,
      sourceType: (_this$config$babelSou = this.config.babelSourceType) !== null && _this$config$babelSou !== void 0 ? _this$config$babelSou : "module",
      extensions: ['.ts', '.js']
    });
  }

  createBrowserify() {
    let config = Object.assign({}, _browserifyIncremental.default.args, {
      paths: [this.config.projectRoot + "/"],
      extensions: ['.ts'],
      detectGlobals: false
    });
    let result = (0, _browserify.default)(config, {
      debug: this.config.debug
    });

    if (this.config.externalLibraries) {
      for (let externalLibrary of this.config.externalLibraries) {
        result.external(externalLibrary);
      }
    }

    for (let plugin of this.plugins) {
      let pluginList = plugin.getBrowserifyPlugins();
      if (pluginList) for (let plugin of pluginList) {
        result.plugin(plugin);
      }
    }

    return result;
  }

  getDefaultBabelifyPresets() {
    return [['@babel/preset-env', {
      "debug": this.config.debug,
      "targets": "node 7"
    }]];
  }

  emitPluginEvent(event) {
    for (let plugin of this.plugins) {
      plugin.emit(event);
    }
  }

  async build() {
    this.babelify = this.createBabelify();
    this.browserify = this.createBrowserify();
    this.emitPluginEvent("init");
    this.browserify.transform(this.babelify);

    this.browserify.require(this.config.source, {
      entry: true
    });

    this.emitPluginEvent("beforebuild");
    let wasError = await this.listen(this.browserify.bundle());
    this.emitPluginEvent("afterbuild");

    if (wasError) {
      throw new Error("Build finished with errors");
    }
  }

  getBabelPluginList() {
    // Default plugin list
    let result = [["@babel/plugin-syntax-class-properties"], ["@babel/plugin-proposal-class-properties", {
      loose: true
    }], ["@babel/plugin-transform-typescript"], ["@babel/plugin-transform-runtime"]];

    for (let plugin of this.plugins) {
      let babelPlugins = plugin.getBabelPlugins();
      if (babelPlugins) result = result.concat(babelPlugins);
    }

    return result;
  }

  listen(stream) {
    return new Promise(resolve => {
      let errorHandler = error => {
        console.error(error.message);
        if (error.annotated) console.error(error.annotated);
        resolve(true);
      };

      if (!(0, _utils.prepareFileLocation)(this.config.destination)) {
        errorHandler(new Error("Cannot create parent directories for '" + this.config.destination + "'"));
      } else {
        stream.on("error", errorHandler);
        stream = stream.pipe(this.getExorcist());
        stream.on("error", errorHandler);
        let writeStream = fs.createWriteStream(this.config.destination);
        stream.pipe(writeStream);
        writeStream.on("error", errorHandler);
        writeStream.on("finish", resolve);
      }
    });
  }

  getExorcist() {
    return (0, _exorcist.default)(this.config.destination + ".map", null, this.config.projectRoot, this.config.projectRoot);
  }

}

exports.default = Bundler;

},{"../utils":15,"@babel/runtime/helpers/interopRequireDefault":1,"@babel/runtime/helpers/interopRequireWildcard":2,"babelify":"babelify","browserify":"browserify","browserify-incremental":"browserify-incremental","exorcist":"exorcist","fs":"fs"}],9:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _chalk = _interopRequireDefault(require("chalk"));

class BeelderReference {
  constructor(config) {
    this.isDependency = false;
    this.definesTarget = false;
    this.path = void 0;
    this.config = void 0;
    this.config = config;

    if (typeof config === "object") {
      if (config.targetName) {
        if (config.path) this.definesTarget = true;else this.isDependency = true;
      }

      this.path = config.path;
    } else {
      this.path = config;
    }

    if (!this.path) this.path = null;
  }

  getDependency() {
    if (!this.isDependency) return null;
    return this.config.targetName;
  }

  getDefinedTarget() {
    if (!this.definesTarget) return null;
    return this.config.targetName;
  }

  getPath() {
    return this.path;
  }

  getConsoleName() {
    if (this.definesTarget || this.isDependency) {
      return _chalk.default.green(this.config.targetName);
    } else {
      return _chalk.default.blueBright(this.path);
    }
  }

}

exports.default = BeelderReference;

},{"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk"}],10:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _beelder = _interopRequireDefault(require("./beelder"));

var _timings = _interopRequireDefault(require("./timings"));

var _chalk = _interopRequireDefault(require("chalk"));

class BeelderScheme {
  constructor(name, config, beelder) {
    this.steps = [];
    this.config = void 0;
    this.beelder = void 0;
    this.name = void 0;
    this.name = name;
    this.beelder = beelder;
    this.config = config;
    this.loadSteps();
  }

  loadSteps() {
    for (let step of this.config.steps) {
      const ActionClass = _beelder.default.actions.get(step.action);

      if (!ActionClass) throw new Error("No such action: '" + step.action + "'");
      const action = new ActionClass(step, this);
      this.steps.push(action);
    }
  }

  getDependencies() {
    let dependencies = [];

    for (let step of this.steps) {
      const stepDependencies = step.getDependencies();

      if (stepDependencies) {
        for (let dep of stepDependencies) {
          dependencies.push(dep);
        }
      }
    }

    return dependencies;
  }

  getTargets() {
    let targets = [];

    for (let step of this.steps) {
      const stepTargets = step.getTargets();

      if (stepTargets) {
        for (let target of stepTargets) {
          targets.push(target);
        }
      }
    }

    return targets;
  }

  async run() {
    let coloredSchemeName = _chalk.default.magenta(this.name);

    _timings.default.begin("Running '" + coloredSchemeName + "'");

    for (let step of this.steps) {
      await step.run();
    }

    _timings.default.end("Finished running '" + coloredSchemeName + "'");
  }

}

exports.default = BeelderScheme;

},{"./beelder":6,"./timings":14,"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk"}],11:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _timings = _interopRequireDefault(require("../timings"));

var _bundler = _interopRequireDefault(require("../javascript-bundler/bundler"));

class BundleJavascriptAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.compilerOptions = void 0;
    this.compilerOptions = config.compilerOptions;
  }

  async runCompiler() {
    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    let compilerOptions = {
      source: source,
      destination: destination,
      cacheFile: this.cache.cacheFilePath,
      projectRoot: this.scheme.beelder.projectRoot
    };

    if (this.compilerOptions) {
      Object.assign(compilerOptions, this.compilerOptions);
    }

    let bundler = new _bundler.default(compilerOptions);
    await bundler.build();
  }

  async run() {
    let sourceName = this.source.getConsoleName();

    _timings.default.begin("Building " + sourceName);

    await this.runCompiler();

    _timings.default.end("Finished building " + sourceName);
  }

}

exports.default = BundleJavascriptAction;
BundleJavascriptAction.actionName = "bundle-javascript";

},{"../base-scheme":5,"../javascript-bundler/bundler":8,"../timings":14,"@babel/runtime/helpers/interopRequireDefault":1}],12:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

class CopyAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
  }

}

exports.default = CopyAction;
CopyAction.actionName = "copy";

},{"../base-scheme":5,"@babel/runtime/helpers/interopRequireDefault":1}],13:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AtlasCreationSession = void 0;

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _atlaspack = _interopRequireDefault(require("atlaspack"));

var _canvas = _interopRequireDefault(require("canvas"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _timings = _interopRequireDefault(require("../timings"));

var _chalk = _interopRequireDefault(require("chalk"));

var _utils = require("../utils");

var _buildCache = _interopRequireDefault(require("../build-cache"));

//@ts-ignore
class AtlasCreationSession {
  constructor(texturesRoot, atlasSize) {
    this.imagePaths = void 0;
    this.canvases = [];
    this.contexts = [];
    this.atlases = [];
    this.atlasDescriptors = [];
    this.texturesRoot = void 0;
    this.atlasSize = void 0;
    this.texturesToPack = void 0;
    this.texturesRoot = texturesRoot;
    this.atlasSize = atlasSize;
  }

  async readTextureList() {
    this.imagePaths = (await (0, _utils.readdirDeep)(this.texturesRoot)).filter(file => file.endsWith(".png"));
  }

  async checkCacheRelevance(cache) {
    if (!cache.directorySubtrees) return false;
    if (!cache.textureInfo) return false;
    let cachedSubtree = cache.directorySubtrees[this.texturesRoot];
    if (!cachedSubtree) return false;
    if (!(0, _utils.compareArrayValues)(cachedSubtree, this.imagePaths)) return false;

    for (let imagePath of this.imagePaths) {
      let absolutePath = _path.default.join(this.texturesRoot, imagePath);

      if (await _buildCache.default.fileRequiresRefresh(cache.textureInfo, absolutePath)) return false;
    }

    return true;
  }

  writeCache(cache) {
    if (!cache.directorySubtrees) cache.directorySubtrees = {};
    if (!cache.textureInfo) cache.textureInfo = {};
    cache.directorySubtrees[this.texturesRoot] = this.imagePaths;

    for (let imagePath of this.imagePaths) {
      let absolutePath = _path.default.join(this.texturesRoot, imagePath);

      _buildCache.default.refreshFileData(cache.textureInfo, absolutePath);
    }
  }

  static webglRect(rect, canvas) {
    return {
      x: (rect.x + 1) / canvas.width,
      y: (rect.y + 1) / canvas.height,
      w: (rect.w - 2) / canvas.width,
      h: (rect.h - 2) / canvas.height
    };
  }

  createCanvases() {
    let size = this.atlasSize;

    do {
      let canvas = _canvas.default.createCanvas(size, size);

      let ctx = canvas.getContext('2d');
      let atlas = (0, _atlaspack.default)(canvas);
      atlas.tilepad = true;
      this.canvases.push(canvas);
      this.contexts.push(ctx);
      this.atlases.push(atlas);
      size >>= 1;
    } while (size > 64);
  }

  drawTextures() {
    for (let image of this.texturesToPack) {
      let mipMapSize = this.atlasSize;
      let scale = 1;

      for (let j = 0; this.canvases[j]; j++) {
        const rect = this.atlases[j].pack({
          width: image.image.width * scale + 2,
          height: image.image.height * scale + 2
        }).rect;

        if (!rect) {
          this.canvases[j] = null;
          break;
        }

        if (!this.atlasDescriptors[j]) this.atlasDescriptors[j] = {};
        this.atlasDescriptors[j][image.name] = AtlasCreationSession.webglRect(rect, this.canvases[j]);
        AtlasCreationSession.drawTexture(this.canvases[j], this.contexts[j], image, rect);
        mipMapSize >>= 1;
        scale /= 2;
      }
    }
  }

  async readTextures() {
    let textures = [];
    await Promise.all(this.imagePaths.map(file => new Promise((resolve, reject) => {
      const image = new _canvas.default.Image();

      image.onload = () => {
        textures.push({
          name: (0, _utils.trimExtension)(file),
          image: image
        });
        resolve();
      };

      image.onerror = reject;
      image.src = _path.default.resolve(this.texturesRoot, file);
    })));
    textures.sort((left, right) => {
      return right.image.width * right.image.height - left.image.width * left.image.height;
    });
    this.texturesToPack = textures;
  }

  static drawTexture(canvas, ctx, img, rect) {
    // Internal
    ctx.drawImage(img.image, rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2); // Left

    ctx.drawImage(canvas, rect.x + 1, rect.y + 1, 1, rect.h - 2, rect.x, rect.y + 1, 1, rect.h - 2); // Right

    ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + 1, 1, rect.h - 2, rect.x + rect.w - 1, rect.y + 1, 1, rect.h - 2); // Top

    ctx.drawImage(canvas, rect.x + 1, rect.y + 1, rect.w - 2, 1, rect.x + 1, rect.y, rect.w - 2, 1); // Bottom

    ctx.drawImage(canvas, rect.x + 1, rect.y + rect.h - 2, rect.w - 2, 1, rect.x + 1, rect.y + rect.h - 1, rect.w - 2, 1); // Left-top

    ctx.drawImage(canvas, rect.x + 1, rect.y + 1, 1, 1, rect.x, rect.y, 1, 1); // Right-top

    ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + 1, 1, 1, rect.x + rect.w - 1, rect.y, 1, 1); // Left-bottom

    ctx.drawImage(canvas, rect.x + 1, rect.y + rect.h - 2, 1, 1, rect.x, rect.y + rect.h - 1, 1, 1); // Right-bottom

    ctx.drawImage(canvas, rect.x + rect.w - 2, rect.y + rect.h - 2, 1, 1, rect.x + rect.w - 1, rect.y + rect.h - 1, 1, 1);
  }

  async writeTextures(destination) {
    for (let j = 0; j < this.canvases.length; j++) {
      if (!this.canvases[j]) break;
      await _fs.default.promises.writeFile(_path.default.resolve(destination, "atlas-mipmap-level-" + j + ".png"), this.canvases[j].toBuffer());
      await _fs.default.promises.writeFile(_path.default.resolve(destination, "atlas-mipmap-level-" + j + ".json"), JSON.stringify(this.atlasDescriptors[j]));
    }
  }

}

exports.AtlasCreationSession = AtlasCreationSession;

class TextureAtlasAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.config = void 0;
    this.config = config;
  }

  async run() {
    let source = _path.default.join(this.scheme.beelder.projectRoot, this.source.getPath());

    let destination = this.scheme.beelder.resolveReference(this.target);
    if (!(0, _utils.prepareDirectory)(destination)) throw new Error("Unable to create destination folder");

    _timings.default.begin("Creating texture atlases of " + _chalk.default.blueBright(this.config.source));

    let cacheJSON = await this.cache.getJSON();
    let context = new AtlasCreationSession(source, this.config.atlasSize);

    _timings.default.begin("Reading directory");

    await context.readTextureList();

    _timings.default.end();

    _timings.default.begin("Checking cache");

    if (await context.checkCacheRelevance(cacheJSON)) {
      _timings.default.end();

      _timings.default.end("Textures has not been updated, used cached result");

      return;
    } else {
      _timings.default.end("Textures has been updated, should refresh atlas");
    }

    _timings.default.begin("Reading textures");

    await context.readTextures();

    _timings.default.end();

    _timings.default.begin("Allocating canvases");

    context.createCanvases();

    _timings.default.end();

    _timings.default.begin("Drawing atlases");

    context.drawTextures();

    _timings.default.end();

    _timings.default.begin("Writing atlases");

    await context.writeTextures(destination);

    _timings.default.end();

    _timings.default.begin("Saving caches");

    context.writeCache(cacheJSON);
    await this.cache.setJSON(cacheJSON);

    _timings.default.end();

    _timings.default.end("Finished creating texture atlas");
  }

}

exports.default = TextureAtlasAction;
TextureAtlasAction.actionName = "texture-atlas";

},{"../base-scheme":5,"../build-cache":7,"../timings":14,"../utils":15,"@babel/runtime/helpers/interopRequireDefault":1,"atlaspack":"atlaspack","canvas":"canvas","chalk":"chalk","fs":"fs","path":"path"}],14:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("util"));

var _chalk = _interopRequireDefault(require("chalk"));

class Entry {
  constructor(title) {
    this.hasInlinedText = void 0;
    this.date = void 0;
    this.title = void 0;
    this.title = title;
    this.date = Date.now();
    this.hasInlinedText = false;
  }

}

class Timings {
  static tab() {
    return new Array(this.stack.length + 1).join(_chalk.default.gray("- "));
  }

  static muteSubtasks() {
    if (this.mutedStackIndex === null) this.mutedStackIndex = this.stack.length;
  }

  static unmuteSubtasks() {
    if (this.stack.length === this.mutedStackIndex) this.mutedStackIndex = null;
  }

  static begin(title) {
    this.stdoutMarkMessage = false;

    if (this.stack.length === 0) {
      this.bindStdout();
    }

    process.stdout.write(title + _chalk.default.gray(":"));
    this.stdoutMarkMessage = true;
    this.stdoutShouldLinefeed = true;
    this.stack.push(new Entry(title));
  }

  static getStackState() {
    return this.stack.length;
  }

  static setStackState(length, reason) {
    while (this.stack.length > length) {
      if (reason) {
        this.end(reason.replace("%s", this.stack[this.stack.length - 1].title));
      } else {
        this.end();
      }
    }
  }

  static perform(title, task) {
    this.begin(title);

    if (_util.default.types.isAsyncFunction(task)) {
      return task().then(() => this.end());
    }

    task();
    this.end();
  }

  static end(description) {
    if (this.stack.length === this.mutedStackIndex) this.mutedStackIndex = null;
    let task = this.stack.pop();
    let time = ((Date.now() - task.date) / 1000).toFixed(3);
    this.stdoutMarkMessage = false;

    if (task.hasInlinedText) {
      if (!description) {
        description = task.title;
      }

      process.stdout.write(description + _chalk.default.gray(": ") + this.timingColor("[" + time + "s]"));
      this.stdoutShouldLinefeed = true;
    } else {
      this.stdoutShouldLinefeed = false;

      if (description) {
        this.stdoutShouldLinefeed = false;
        process.stdout.write("\r\x1b[K" + this.tab() + description + _chalk.default.gray(":"));
      }

      process.stdout.write(this.timingColor(" [" + time + "s]"));
      this.stdoutShouldLinefeed = true;
    }

    this.stdoutMarkMessage = true;

    if (this.stack.length === 0) {
      this.unbindStdout();
    }
  }

  static bindStdout() {
    this.stdoutWriteHandler = process.stdout.write;
    this.stderrWriteHandler = process.stderr.write;

    process.stdout.write = data => {
      this.writeHandler(data, false);
      return true;
    };

    process.stderr.write = data => {
      this.writeHandler(data, true);
      return true;
    };
  }

  static writeHandler(text, isError) {
    if (this.mutedStackIndex !== null) return;
    if (this.stack.length) this.stack[this.stack.length - 1].hasInlinedText = true;

    if (this.stdoutShouldLinefeed) {
      text = "\n" + text;
      this.stdoutShouldLinefeed = false;
    } else if (this.stdoutMarkMessage) {
      if (isError) text = this.errPrefix + text;else text = this.logPrefix + text;
    }

    if (text[text.length - 1] === "\n") {
      text = text.substr(0, text.length - 1);
      this.stdoutShouldLinefeed = true;
    }

    if (this.stdoutMarkMessage) {
      text = text.replace(/\n(?!$)/g, "\n" + this.tab() + (isError ? this.errPrefix : this.logPrefix));
    } else {
      text = text.replace(/\n/g, "\n" + this.tab());
    }

    this.stdoutWriteHandler.call(process.stdout, text);
  }

  static unbindStdout() {
    process.stdout.write = this.stdoutWriteHandler;
    process.stderr.write = this.stderrWriteHandler;

    if (this.stdoutShouldLinefeed) {
      process.stdout.write("\n");
      this.stdoutShouldLinefeed = false;
    }
  }

}

exports.default = Timings;
Timings.mutedStackIndex = null;
Timings.stdoutWriteHandler = null;
Timings.stderrWriteHandler = null;
Timings.stdoutShouldLinefeed = false;
Timings.stdoutMarkMessage = false;
Timings.logPrefix = _chalk.default.yellow.bold("[ LOG ]") + _chalk.default.gray(": ");
Timings.errPrefix = _chalk.default.red.bold("[ ERR ]") + _chalk.default.gray(": ");
Timings.timingColor = _chalk.default.cyan;
Timings.stack = [];

},{"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk","util":"util"}],15:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readdirDeep = readdirDeep;
exports.trimExtension = trimExtension;
exports.prepareDirectory = prepareDirectory;
exports.prepareFileLocation = prepareFileLocation;
exports.compareArrayValues = compareArrayValues;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

async function readdirDeep(directory, array = [], base = "") {
  if (!array) array = [];
  if (!base) base = "";

  if (_fs.default.statSync(directory).isDirectory()) {
    await _fs.default.readdirSync(directory).map(async file => {
      let item = _path.default.join(directory, file);

      let subbase = _path.default.join(base, file);

      array.push(subbase);
      await readdirDeep(item, array, subbase);
    });
  }

  return array;
}

function trimExtension(fileName) {
  const fragments = fileName.split(".");
  if (fragments.length > 1) fragments.pop();
  return fragments.join(".");
}

function prepareDirectory(directory) {
  try {
    _fs.default.accessSync(directory);
  } catch (e) {
    try {
      _fs.default.mkdirSync(directory, {
        recursive: true
      });
    } catch (e) {
      return false;
    }
  }

  return true;
}

function prepareFileLocation(filePath) {
  let directoryPath = _path.default.dirname(filePath);

  try {
    _fs.default.accessSync(directoryPath);
  } catch (e) {
    try {
      _fs.default.mkdirSync(directoryPath, {
        recursive: true
      });
    } catch (e) {
      return false;
    }
  }

  return true;
}

function compareArrayValues(arr1, arr2) {
  let dictionary = new Map();

  for (let element of arr1) dictionary.set(element, 1);

  for (let element of arr2) {
    let existed = dictionary.get(element);
    if (!existed) return false;
    dictionary.set(element, 2);
  }

  for (let value of dictionary.values()) {
    if (value === 1) return false;
  }

  return true;
}

},{"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],"index.ts":[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Timings", {
  enumerable: true,
  get: function () {
    return _timings.default;
  }
});
Object.defineProperty(exports, "Beelder", {
  enumerable: true,
  get: function () {
    return _beelder.default;
  }
});

var _timings = _interopRequireDefault(require("./timings"));

var _beelder = _interopRequireDefault(require("./beelder"));

},{"./beelder":6,"./timings":14,"@babel/runtime/helpers/interopRequireDefault":1}]},{},[])("index.ts")
});
//# sourceMappingURL=index.js.map
