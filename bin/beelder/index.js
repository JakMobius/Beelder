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
'use strict';
module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

},{}],5:[function(require,module,exports){
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}


},{"balanced-match":4,"concat-map":7}],6:[function(require,module,exports){
// builtin
var fs = require('fs');
var path = require('path');

// vendor
var resv = require('resolve');

// given a path, create an array of node_module paths for it
// borrowed from substack/resolve
function nodeModulesPaths (start, cb) {
    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;
    var parts = start.split(splitRe);

    var dirs = [];
    for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] === 'node_modules') continue;
        var dir = path.join.apply(
            path, parts.slice(0, i + 1).concat(['node_modules'])
        );
        if (!parts[0].match(/([A-Za-z]:)/)) {
            dir = '/' + dir;
        }
        dirs.push(dir);
    }
    return dirs;
}

function find_shims_in_package(pkgJson, cur_path, shims, browser) {
    try {
        var info = JSON.parse(pkgJson);
    }
    catch (err) {
        err.message = pkgJson + ' : ' + err.message
        throw err;
    }

    var replacements = getReplacements(info, browser);

    // no replacements, skip shims
    if (!replacements) {
        return;
    }

    // if browser mapping is a string
    // then it just replaces the main entry point
    if (typeof replacements === 'string') {
        var key = path.resolve(cur_path, info.main || 'index.js');
        shims[key] = path.resolve(cur_path, replacements);
        return;
    }

    // http://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders
    Object.keys(replacements).forEach(function(key) {
        var val;
        if (replacements[key] === false) {
            val = path.normalize(__dirname + '/empty.js');
        }
        else {
            val = replacements[key];
            // if target is a relative path, then resolve
            // otherwise we assume target is a module
            if (val[0] === '.') {
                val = path.resolve(cur_path, val);
            }
        }

        if (key[0] === '/' || key[0] === '.') {
            // if begins with / ../ or ./ then we must resolve to a full path
            key = path.resolve(cur_path, key);
        }
        shims[key] = val;
    });

    [ '.js', '.json' ].forEach(function (ext) {
        Object.keys(shims).forEach(function (key) {
            if (!shims[key + ext]) {
                shims[key + ext] = shims[key];
            }
        });
    });
}

// paths is mutated
// load shims from first package.json file found
function load_shims(paths, browser, cb) {
    // identify if our file should be replaced per the browser field
    // original filename|id -> replacement
    var shims = Object.create(null);

    (function next() {
        var cur_path = paths.shift();
        if (!cur_path) {
            return cb(null, shims);
        }

        var pkg_path = path.join(cur_path, 'package.json');

        fs.readFile(pkg_path, 'utf8', function(err, data) {
            if (err) {
                // ignore paths we can't open
                // avoids an exists check
                if (err.code === 'ENOENT') {
                    return next();
                }

                return cb(err);
            }
            try {
                find_shims_in_package(data, cur_path, shims, browser);
                return cb(null, shims);
            }
            catch (err) {
                return cb(err);
            }
        });
    })();
};

// paths is mutated
// synchronously load shims from first package.json file found
function load_shims_sync(paths, browser) {
    // identify if our file should be replaced per the browser field
    // original filename|id -> replacement
    var shims = Object.create(null);
    var cur_path;

    while (cur_path = paths.shift()) {
        var pkg_path = path.join(cur_path, 'package.json');

        try {
            var data = fs.readFileSync(pkg_path, 'utf8');
            find_shims_in_package(data, cur_path, shims, browser);
            return shims;
        }
        catch (err) {
            // ignore paths we can't open
            // avoids an exists check
            if (err.code === 'ENOENT') {
                continue;
            }

            throw err;
        }
    }
    return shims;
}

function build_resolve_opts(opts, base) {
    var packageFilter = opts.packageFilter;
    var browser = normalizeBrowserFieldName(opts.browser)

    opts.basedir = base;
    opts.packageFilter = function (info, pkgdir) {
        if (packageFilter) info = packageFilter(info, pkgdir);

        var replacements = getReplacements(info, browser);

        // no browser field, keep info unchanged
        if (!replacements) {
            return info;
        }

        info[browser] = replacements;

        // replace main
        if (typeof replacements === 'string') {
            info.main = replacements;
            return info;
        }

        var replace_main = replacements[info.main || './index.js'] ||
            replacements['./' + info.main || './index.js'];

        info.main = replace_main || info.main;
        return info;
    };

    var pathFilter = opts.pathFilter;
    opts.pathFilter = function(info, resvPath, relativePath) {
        if (relativePath[0] != '.') {
            relativePath = './' + relativePath;
        }
        var mappedPath;
        if (pathFilter) {
            mappedPath = pathFilter.apply(this, arguments);
        }
        if (mappedPath) {
            return mappedPath;
        }

        var replacements = info[browser];
        if (!replacements) {
            return;
        }

        mappedPath = replacements[relativePath];
        if (!mappedPath && path.extname(relativePath) === '') {
            mappedPath = replacements[relativePath + '.js'];
            if (!mappedPath) {
                mappedPath = replacements[relativePath + '.json'];
            }
        }
        return mappedPath;
    };

    return opts;
}

function resolve(id, opts, cb) {

    // opts.filename
    // opts.paths
    // opts.modules
    // opts.packageFilter

    opts = opts || {};
    opts.filename = opts.filename || '';

    var base = path.dirname(opts.filename);

    if (opts.basedir) {
        base = opts.basedir;
    }

    var paths = nodeModulesPaths(base);

    if (opts.paths) {
        paths.push.apply(paths, opts.paths);
    }

    paths = paths.map(function(p) {
        return path.dirname(p);
    });

    // we must always load shims because the browser field could shim out a module
    load_shims(paths, opts.browser, function(err, shims) {
        if (err) {
            return cb(err);
        }

        var resid = path.resolve(opts.basedir || path.dirname(opts.filename), id);
        if (shims[id] || shims[resid]) {
            var xid = shims[id] ? id : resid;
            // if the shim was is an absolute path, it was fully resolved
            if (shims[xid][0] === '/') {
                return resv(shims[xid], build_resolve_opts(opts, base), function(err, full, pkg) {
                    cb(null, full, pkg);
                });
            }

            // module -> alt-module shims
            id = shims[xid];
        }

        var modules = opts.modules || Object.create(null);
        var shim_path = modules[id];
        if (shim_path) {
            return cb(null, shim_path);
        }

        // our browser field resolver
        // if browser field is an object tho?
        var full = resv(id, build_resolve_opts(opts, base), function(err, full, pkg) {
            if (err) {
                return cb(err);
            }

            var resolved = (shims) ? shims[full] || full : full;
            cb(null, resolved, pkg);
        });
    });
};

resolve.sync = function (id, opts) {

    // opts.filename
    // opts.paths
    // opts.modules
    // opts.packageFilter

    opts = opts || {};
    opts.filename = opts.filename || '';

    var base = path.dirname(opts.filename);

    if (opts.basedir) {
        base = opts.basedir;
    }

    var paths = nodeModulesPaths(base);

    if (opts.paths) {
        paths.push.apply(paths, opts.paths);
    }

    paths = paths.map(function(p) {
        return path.dirname(p);
    });

    // we must always load shims because the browser field could shim out a module
    var shims = load_shims_sync(paths, opts.browser);
    var resid = path.resolve(opts.basedir || path.dirname(opts.filename), id);

    if (shims[id] || shims[resid]) {
        var xid = shims[id] ? id : resid;
        // if the shim was is an absolute path, it was fully resolved
        if (shims[xid][0] === '/') {
            return resv.sync(shims[xid], build_resolve_opts(opts, base));
        }

        // module -> alt-module shims
        id = shims[xid];
    }

    var modules = opts.modules || Object.create(null);
    var shim_path = modules[id];
    if (shim_path) {
        return shim_path;
    }

    // our browser field resolver
    // if browser field is an object tho?
    var full = resv.sync(id, build_resolve_opts(opts, base));

    return (shims) ? shims[full] || full : full;
};

function normalizeBrowserFieldName(browser) {
    return browser || 'browser';
}

function getReplacements(info, browser) {
    browser = normalizeBrowserFieldName(browser);
    var replacements = info[browser] || info.browser;

    // support legacy browserify field for easier migration from legacy
    // many packages used this field historically
    if (typeof info.browserify === 'string' && !replacements) {
        replacements = info.browserify;
    }

    return replacements;
}

module.exports = resolve;

},{"fs":"fs","path":"path","resolve":15}],7:[function(require,module,exports){
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],8:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],9:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":8}],10:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":9}],11:[function(require,module,exports){
module.exports={
	"assert": true,
	"assert/strict": ">= 15",
	"async_hooks": ">= 8",
	"buffer_ieee754": "< 0.9.7",
	"buffer": true,
	"child_process": true,
	"cluster": true,
	"console": true,
	"constants": true,
	"crypto": true,
	"_debug_agent": ">= 1 && < 8",
	"_debugger": "< 8",
	"dgram": true,
	"diagnostics_channel": ">= 15.1",
	"dns": true,
	"dns/promises": ">= 15",
	"domain": ">= 0.7.12",
	"events": true,
	"freelist": "< 6",
	"fs": true,
	"fs/promises": [">= 10 && < 10.1", ">= 14"],
	"_http_agent": ">= 0.11.1",
	"_http_client": ">= 0.11.1",
	"_http_common": ">= 0.11.1",
	"_http_incoming": ">= 0.11.1",
	"_http_outgoing": ">= 0.11.1",
	"_http_server": ">= 0.11.1",
	"http": true,
	"http2": ">= 8.8",
	"https": true,
	"inspector": ">= 8.0.0",
	"_linklist": "< 8",
	"module": true,
	"net": true,
	"node-inspect/lib/_inspect": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6.0 && < 12",
	"os": true,
	"path": true,
	"path/posix": ">= 15.3",
	"path/win32": ">= 15.3",
	"perf_hooks": ">= 8.5",
	"process": ">= 1",
	"punycode": true,
	"querystring": true,
	"readline": true,
	"repl": true,
	"smalloc": ">= 0.11.5 && < 3",
	"_stream_duplex": ">= 0.9.4",
	"_stream_transform": ">= 0.9.4",
	"_stream_wrap": ">= 1.4.1",
	"_stream_passthrough": ">= 0.9.4",
	"_stream_readable": ">= 0.9.4",
	"_stream_writable": ">= 0.9.4",
	"stream": true,
	"stream/promises": ">= 15",
	"string_decoder": true,
	"sys": [">= 0.6 && < 0.7", ">= 0.8"],
	"timers": true,
	"timers/promises": ">= 15",
	"_tls_common": ">= 0.11.13",
	"_tls_legacy": ">= 0.11.3 && < 10",
	"_tls_wrap": ">= 0.11.3",
	"tls": true,
	"trace_events": ">= 10",
	"tty": true,
	"url": true,
	"util": true,
	"util/types": ">= 15.3",
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8/tools/consarray": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8/tools/csvparser": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8/tools/logreader": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8/tools/profile_view": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8/tools/splaytree": [">= 4.4.0 && < 5", ">= 5.2.0 && < 12"],
	"v8": ">= 1",
	"vm": true,
	"wasi": ">= 13.4 && < 13.5",
	"worker_threads": ">= 11.7",
	"zlib": true
}

},{}],12:[function(require,module,exports){
'use strict';

var has = require('has');

function specifierIncluded(current, specifier) {
	var nodeParts = current.split('.');
	var parts = specifier.split(' ');
	var op = parts.length > 1 ? parts[0] : '=';
	var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

	for (var i = 0; i < 3; ++i) {
		var cur = parseInt(nodeParts[i] || 0, 10);
		var ver = parseInt(versionParts[i] || 0, 10);
		if (cur === ver) {
			continue; // eslint-disable-line no-restricted-syntax, no-continue
		}
		if (op === '<') {
			return cur < ver;
		}
		if (op === '>=') {
			return cur >= ver;
		}
		return false;
	}
	return op === '>=';
}

function matchesRange(current, range) {
	var specifiers = range.split(/ ?&& ?/);
	if (specifiers.length === 0) {
		return false;
	}
	for (var i = 0; i < specifiers.length; ++i) {
		if (!specifierIncluded(current, specifiers[i])) {
			return false;
		}
	}
	return true;
}

function versionIncluded(nodeVersion, specifierValue) {
	if (typeof specifierValue === 'boolean') {
		return specifierValue;
	}

	var current = typeof nodeVersion === 'undefined'
		? process.versions && process.versions.node && process.versions.node
		: nodeVersion;

	if (typeof current !== 'string') {
		throw new TypeError(typeof nodeVersion === 'undefined' ? 'Unable to determine current node version' : 'If provided, a valid node version is required');
	}

	if (specifierValue && typeof specifierValue === 'object') {
		for (var i = 0; i < specifierValue.length; ++i) {
			if (matchesRange(current, specifierValue[i])) {
				return true;
			}
		}
		return false;
	}
	return matchesRange(current, specifierValue);
}

var data = require('./core.json');

module.exports = function isCore(x, nodeVersion) {
	return has(data, x) && versionIncluded(nodeVersion, data[x]);
};

},{"./core.json":11,"has":10}],13:[function(require,module,exports){
module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = require('path')
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = require('brace-expansion')

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

},{"brace-expansion":5,"path":"path"}],14:[function(require,module,exports){
'use strict';

var isWindows = process.platform === 'win32';

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

win32.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};



// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


posix.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


if (isWindows)
  module.exports = win32.parse;
else /* posix */
  module.exports = posix.parse;

module.exports.posix = posix.parse;
module.exports.win32 = win32.parse;

},{}],15:[function(require,module,exports){
var async = require('./lib/async');
async.core = require('./lib/core');
async.isCore = require('./lib/is-core');
async.sync = require('./lib/sync');

module.exports = async;

},{"./lib/async":16,"./lib/core":19,"./lib/is-core":20,"./lib/sync":23}],16:[function(require,module,exports){
var fs = require('fs');
var path = require('path');
var caller = require('./caller');
var nodeModulesPaths = require('./node-modules-paths');
var normalizeOptions = require('./normalize-options');
var isCore = require('is-core-module');

var realpathFS = fs.realpath && typeof fs.realpath.native === 'function' ? fs.realpath.native : fs.realpath;

var defaultIsFile = function isFile(file, cb) {
    fs.stat(file, function (err, stat) {
        if (!err) {
            return cb(null, stat.isFile() || stat.isFIFO());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultIsDir = function isDirectory(dir, cb) {
    fs.stat(dir, function (err, stat) {
        if (!err) {
            return cb(null, stat.isDirectory());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultRealpath = function realpath(x, cb) {
    realpathFS(x, function (realpathErr, realPath) {
        if (realpathErr && realpathErr.code !== 'ENOENT') cb(realpathErr);
        else cb(null, realpathErr ? x : realPath);
    });
};

var maybeRealpath = function maybeRealpath(realpath, x, opts, cb) {
    if (opts && opts.preserveSymlinks === false) {
        realpath(x, cb);
    } else {
        cb(null, x);
    }
};

var defaultReadPackage = function defaultReadPackage(readFile, pkgfile, cb) {
    readFile(pkgfile, function (readFileErr, body) {
        if (readFileErr) cb(readFileErr);
        else {
            try {
                var pkg = JSON.parse(body);
                cb(null, pkg);
            } catch (jsonErr) {
                cb(null);
            }
        }
    });
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
    }
    return dirs;
};

module.exports = function resolve(x, options, callback) {
    var cb = callback;
    var opts = options;
    if (typeof options === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof x !== 'string') {
        var err = new TypeError('Path must be a string.');
        return process.nextTick(function () {
            cb(err);
        });
    }

    opts = normalizeOptions(x, opts);

    var isFile = opts.isFile || defaultIsFile;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var readFile = opts.readFile || fs.readFile;
    var realpath = opts.realpath || defaultRealpath;
    var readPackage = opts.readPackage || defaultReadPackage;
    if (opts.readFile && opts.readPackage) {
        var conflictErr = new TypeError('`readFile` and `readPackage` are mutually exclusive.');
        return process.nextTick(function () {
            cb(conflictErr);
        });
    }
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var includeCoreModules = opts.includeCoreModules !== false;
    var basedir = opts.basedir || path.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = path.resolve(basedir);

    maybeRealpath(
        realpath,
        absoluteStart,
        opts,
        function (err, realStart) {
            if (err) cb(err);
            else init(realStart);
        }
    );

    var res;
    function init(basedir) {
        if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
            res = path.resolve(basedir, x);
            if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
            if ((/\/$/).test(x) && res === basedir) {
                loadAsDirectory(res, opts.package, onfile);
            } else loadAsFile(res, opts.package, onfile);
        } else if (includeCoreModules && isCore(x)) {
            return cb(null, x);
        } else loadNodeModules(x, basedir, function (err, n, pkg) {
            if (err) cb(err);
            else if (n) {
                return maybeRealpath(realpath, n, opts, function (err, realN) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realN, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function onfile(err, m, pkg) {
        if (err) cb(err);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err);
            else if (d) {
                maybeRealpath(realpath, d, opts, function (err, realD) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realD, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function loadAsFile(x, thePackage, callback) {
        var loadAsFilePackage = thePackage;
        var cb = callback;
        if (typeof loadAsFilePackage === 'function') {
            cb = loadAsFilePackage;
            loadAsFilePackage = undefined;
        }

        var exts = [''].concat(extensions);
        load(exts, x, loadAsFilePackage);

        function load(exts, x, loadPackage) {
            if (exts.length === 0) return cb(null, undefined, loadPackage);
            var file = x + exts[0];

            var pkg = loadPackage;
            if (pkg) onpkg(null, pkg);
            else loadpkg(path.dirname(file), onpkg);

            function onpkg(err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err);
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex(err, ex) {
                if (err) return cb(err);
                if (ex) return cb(null, file, pkg);
                load(exts.slice(1), x, pkg);
            }
        }
    }

    function loadpkg(dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return cb(null);
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return cb(null);

        maybeRealpath(realpath, dir, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return loadpkg(path.dirname(dir), cb);
            var pkgfile = path.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                // on err, ex is false
                if (!ex) return loadpkg(path.dirname(dir), cb);

                readPackage(readFile, pkgfile, function (err, pkgParam) {
                    if (err) cb(err);

                    var pkg = pkgParam;

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }
                    cb(null, pkg, dir);
                });
            });
        });
    }

    function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
        var cb = callback;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }

        maybeRealpath(realpath, x, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return cb(unwrapErr);
            var pkgfile = path.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                if (err) return cb(err);
                if (!ex) return loadAsFile(path.join(x, 'index'), fpkg, cb);

                readPackage(readFile, pkgfile, function (err, pkgParam) {
                    if (err) return cb(err);

                    var pkg = pkgParam;

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }

                    if (pkg && pkg.main) {
                        if (typeof pkg.main !== 'string') {
                            var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                            mainError.code = 'INVALID_PACKAGE_MAIN';
                            return cb(mainError);
                        }
                        if (pkg.main === '.' || pkg.main === './') {
                            pkg.main = 'index';
                        }
                        loadAsFile(path.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                            if (err) return cb(err);
                            if (m) return cb(null, m, pkg);
                            if (!pkg) return loadAsFile(path.join(x, 'index'), pkg, cb);

                            var dir = path.resolve(x, pkg.main);
                            loadAsDirectory(dir, pkg, function (err, n, pkg) {
                                if (err) return cb(err);
                                if (n) return cb(null, n, pkg);
                                loadAsFile(path.join(x, 'index'), pkg, cb);
                            });
                        });
                        return;
                    }

                    loadAsFile(path.join(x, '/index'), pkg, cb);
                });
            });
        });
    }

    function processDirs(cb, dirs) {
        if (dirs.length === 0) return cb(null, undefined);
        var dir = dirs[0];

        isDirectory(path.dirname(dir), isdir);

        function isdir(err, isdir) {
            if (err) return cb(err);
            if (!isdir) return processDirs(cb, dirs.slice(1));
            loadAsFile(dir, opts.package, onfile);
        }

        function onfile(err, m, pkg) {
            if (err) return cb(err);
            if (m) return cb(null, m, pkg);
            loadAsDirectory(dir, opts.package, ondir);
        }

        function ondir(err, n, pkg) {
            if (err) return cb(err);
            if (n) return cb(null, n, pkg);
            processDirs(cb, dirs.slice(1));
        }
    }
    function loadNodeModules(x, start, cb) {
        var thunk = function () { return getPackageCandidates(x, start, opts); };
        processDirs(
            cb,
            packageIterator ? packageIterator(x, start, thunk, opts) : thunk()
        );
    }
};

},{"./caller":17,"./node-modules-paths":21,"./normalize-options":22,"fs":"fs","is-core-module":12,"path":"path"}],17:[function(require,module,exports){
module.exports = function () {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; };
    var stack = (new Error()).stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    return stack[2].getFileName();
};

},{}],18:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11}],19:[function(require,module,exports){
var current = (process.versions && process.versions.node && process.versions.node.split('.')) || [];

function specifierIncluded(specifier) {
    var parts = specifier.split(' ');
    var op = parts.length > 1 ? parts[0] : '=';
    var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

    for (var i = 0; i < 3; ++i) {
        var cur = parseInt(current[i] || 0, 10);
        var ver = parseInt(versionParts[i] || 0, 10);
        if (cur === ver) {
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        }
        if (op === '<') {
            return cur < ver;
        } else if (op === '>=') {
            return cur >= ver;
        } else {
            return false;
        }
    }
    return op === '>=';
}

function matchesRange(range) {
    var specifiers = range.split(/ ?&& ?/);
    if (specifiers.length === 0) { return false; }
    for (var i = 0; i < specifiers.length; ++i) {
        if (!specifierIncluded(specifiers[i])) { return false; }
    }
    return true;
}

function versionIncluded(specifierValue) {
    if (typeof specifierValue === 'boolean') { return specifierValue; }
    if (specifierValue && typeof specifierValue === 'object') {
        for (var i = 0; i < specifierValue.length; ++i) {
            if (matchesRange(specifierValue[i])) { return true; }
        }
        return false;
    }
    return matchesRange(specifierValue);
}

var data = require('./core.json');

var core = {};
for (var mod in data) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(data, mod)) {
        core[mod] = versionIncluded(data[mod]);
    }
}
module.exports = core;

},{"./core.json":18}],20:[function(require,module,exports){
var isCoreModule = require('is-core-module');

module.exports = function isCore(x) {
    return isCoreModule(x);
};

},{"is-core-module":12}],21:[function(require,module,exports){
var path = require('path');
var parse = path.parse || require('path-parse');

var getNodeModulesDirs = function getNodeModulesDirs(absoluteStart, modules) {
    var prefix = '/';
    if ((/^([A-Za-z]:)/).test(absoluteStart)) {
        prefix = '';
    } else if ((/^\\\\/).test(absoluteStart)) {
        prefix = '\\\\';
    }

    var paths = [absoluteStart];
    var parsed = parse(absoluteStart);
    while (parsed.dir !== paths[paths.length - 1]) {
        paths.push(parsed.dir);
        parsed = parse(parsed.dir);
    }

    return paths.reduce(function (dirs, aPath) {
        return dirs.concat(modules.map(function (moduleDir) {
            return path.resolve(prefix, aPath, moduleDir);
        }));
    }, []);
};

module.exports = function nodeModulesPaths(start, opts, request) {
    var modules = opts && opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules'];

    if (opts && typeof opts.paths === 'function') {
        return opts.paths(
            request,
            start,
            function () { return getNodeModulesDirs(start, modules); },
            opts
        );
    }

    var dirs = getNodeModulesDirs(start, modules);
    return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
};

},{"path":"path","path-parse":14}],22:[function(require,module,exports){
module.exports = function (x, opts) {
    /**
     * This file is purposefully a passthrough. It's expected that third-party
     * environments will override it at runtime in order to inject special logic
     * into `resolve` (by manipulating the options). One such example is the PnP
     * code path in Yarn.
     */

    return opts || {};
};

},{}],23:[function(require,module,exports){
var isCore = require('is-core-module');
var fs = require('fs');
var path = require('path');
var caller = require('./caller');
var nodeModulesPaths = require('./node-modules-paths');
var normalizeOptions = require('./normalize-options');

var realpathFS = fs.realpathSync && typeof fs.realpathSync.native === 'function' ? fs.realpathSync.native : fs.realpathSync;

var defaultIsFile = function isFile(file) {
    try {
        var stat = fs.statSync(file);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isFile() || stat.isFIFO();
};

var defaultIsDir = function isDirectory(dir) {
    try {
        var stat = fs.statSync(dir);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isDirectory();
};

var defaultRealpathSync = function realpathSync(x) {
    try {
        return realpathFS(x);
    } catch (realpathErr) {
        if (realpathErr.code !== 'ENOENT') {
            throw realpathErr;
        }
    }
    return x;
};

var maybeRealpathSync = function maybeRealpathSync(realpathSync, x, opts) {
    if (opts && opts.preserveSymlinks === false) {
        return realpathSync(x);
    }
    return x;
};

var defaultReadPackageSync = function defaultReadPackageSync(readFileSync, pkgfile) {
    var body = readFileSync(pkgfile);
    try {
        var pkg = JSON.parse(body);
        return pkg;
    } catch (jsonErr) {}
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path.join(dirs[i], x);
    }
    return dirs;
};

module.exports = function resolveSync(x, options) {
    if (typeof x !== 'string') {
        throw new TypeError('Path must be a string.');
    }
    var opts = normalizeOptions(x, options);

    var isFile = opts.isFile || defaultIsFile;
    var readFileSync = opts.readFileSync || fs.readFileSync;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var realpathSync = opts.realpathSync || defaultRealpathSync;
    var readPackageSync = opts.readPackageSync || defaultReadPackageSync;
    if (opts.readFileSync && opts.readPackageSync) {
        throw new TypeError('`readFileSync` and `readPackageSync` are mutually exclusive.');
    }
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var includeCoreModules = opts.includeCoreModules !== false;
    var basedir = opts.basedir || path.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = maybeRealpathSync(realpathSync, path.resolve(basedir), opts);

    if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
        var res = path.resolve(absoluteStart, x);
        if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return maybeRealpathSync(realpathSync, m, opts);
    } else if (includeCoreModules && isCore(x)) {
        return x;
    } else {
        var n = loadNodeModulesSync(x, absoluteStart);
        if (n) return maybeRealpathSync(realpathSync, n, opts);
    }

    var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;

    function loadAsFileSync(x) {
        var pkg = loadpkg(path.dirname(x));

        if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
            var rfile = path.relative(pkg.dir, x);
            var r = opts.pathFilter(pkg.pkg, x, rfile);
            if (r) {
                x = path.resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
            }
        }

        if (isFile(x)) {
            return x;
        }

        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }

    function loadpkg(dir) {
        if (dir === '' || dir === '/') return;
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return;
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return;

        var pkgfile = path.join(maybeRealpathSync(realpathSync, dir, opts), 'package.json');

        if (!isFile(pkgfile)) {
            return loadpkg(path.dirname(dir));
        }

        var pkg = readPackageSync(readFileSync, pkgfile);

        if (pkg && opts.packageFilter) {
            // v2 will pass pkgfile
            pkg = opts.packageFilter(pkg, /*pkgfile,*/ dir); // eslint-disable-line spaced-comment
        }

        return { pkg: pkg, dir: dir };
    }

    function loadAsDirectorySync(x) {
        var pkgfile = path.join(maybeRealpathSync(realpathSync, x, opts), '/package.json');
        if (isFile(pkgfile)) {
            try {
                var pkg = readPackageSync(readFileSync, pkgfile);
            } catch (e) {}

            if (pkg && opts.packageFilter) {
                // v2 will pass pkgfile
                pkg = opts.packageFilter(pkg, /*pkgfile,*/ x); // eslint-disable-line spaced-comment
            }

            if (pkg && pkg.main) {
                if (typeof pkg.main !== 'string') {
                    var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                    mainError.code = 'INVALID_PACKAGE_MAIN';
                    throw mainError;
                }
                if (pkg.main === '.' || pkg.main === './') {
                    pkg.main = 'index';
                }
                try {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path.resolve(x, pkg.main));
                    if (n) return n;
                } catch (e) {}
            }
        }

        return loadAsFileSync(path.join(x, '/index'));
    }

    function loadNodeModulesSync(x, start) {
        var thunk = function () { return getPackageCandidates(x, start, opts); };
        var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();

        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            if (isDirectory(path.dirname(dir))) {
                var m = loadAsFileSync(dir);
                if (m) return m;
                var n = loadAsDirectorySync(dir);
                if (n) return n;
            }
        }
    }
};

},{"./caller":17,"./node-modules-paths":21,"./normalize-options":22,"fs":"fs","is-core-module":12,"path":"path"}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("util"));

class AsyncEventEmitter {
  constructor() {
    this.handlers = void 0;
    this.handlers = [];
  }

  addListener(type, listener, priority) {
    let priorityBlock = this.handlers[priority];

    if (!priorityBlock) {
      priorityBlock = new Map();
      this.handlers[priority] = priorityBlock;
    }

    let handlers = priorityBlock.get(type);

    if (handlers) {
      handlers.push(listener);
    } else {
      priorityBlock.set(type, [listener]);
    }

    this._emit('newListener', [type, listener]);
  }

  on(type, listener, priority = AsyncEventEmitter.PRIORITY_NORMAL) {
    return this.addListener(type, listener, priority);
  }

  removeListener(type, listener) {
    for (let priorityBlock of this.handlers) {
      if (!priorityBlock) continue;
      let handlers = priorityBlock.get(type);
      if (!handlers) continue;
      let index = handlers.indexOf(listener);

      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  off(type, listener) {
    return this.removeListener(type, listener);
  }

  removeAllListeners(type) {
    if (type) {
      for (let priorityBlock of this.handlers) {
        if (type && priorityBlock) {
          priorityBlock.delete(type);
        }
      }
    } else {
      this.handlers = [];
    }
  }

  once(type, listener) {
    const on = () => {
      this.removeListener(type, on);
      return listener.apply(this, arguments);
    };

    return this.on(type, on);
  }

  async _emit(type, args) {
    let result = true;

    for (let priorityBlock of this.handlers) {
      if (!priorityBlock) continue;
      let handlers = priorityBlock.get(type);
      if (!handlers) continue;

      for (let handler of handlers) {
        if (_util.default.types.isAsyncFunction(handler)) {
          if ((await handler.apply(this, args)) === false) {
            result = false;
          }
        } else {
          if (handler.apply(this, args) === false) {
            result = false;
          }
        }
      }
    }

    return result;
  }

  async emit(type, ...values) {
    let args = Array.prototype.slice.call(arguments, 1);
    let params = Array.prototype.slice.call(arguments);
    await this._emit('event', params);
    return (await this._emit(type, args)) !== false;
  }

}

exports.default = AsyncEventEmitter;
AsyncEventEmitter.PRIORITY_LOW = 3;
AsyncEventEmitter.PRIORITY_MONITOR = 2;
AsyncEventEmitter.PRIORITY_NORMAL = 1;
AsyncEventEmitter.PRIORITY_HIGH = 0;

},{"@babel/runtime/helpers/interopRequireDefault":1,"util":"util"}],26:[function(require,module,exports){
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

},{"./action":24,"./reference":43,"@babel/runtime/helpers/interopRequireDefault":1}],27:[function(require,module,exports){
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

var _createShaderLibrary = _interopRequireDefault(require("./schemes/create-shader-library"));

var _compileScss = _interopRequireDefault(require("./schemes/compile-scss"));

var _delete = _interopRequireDefault(require("./schemes/delete"));

var _requireTarget = _interopRequireDefault(require("./schemes/require-target"));

class Beelder {
  constructor(config, projectRoot) {
    var _this$config$cacheDir;

    this.config = void 0;
    this.schemes = void 0;
    this.targetMap = void 0;
    this.referenceMap = void 0;
    this.projectRoot = void 0;
    this.cacheDirectory = void 0;
    this.cache = void 0;
    this.config = config;
    this.projectRoot = projectRoot !== null && projectRoot !== void 0 ? projectRoot : '/';
    this.cacheDirectory = _path.default.resolve(this.projectRoot, (_this$config$cacheDir = this.config.cacheDirectory) !== null && _this$config$cacheDir !== void 0 ? _this$config$cacheDir : "beelder-cache");
    this.cache = new _buildCache.default(this.cacheDirectory);
  }

  loadSchemes() {
    _timings.default.begin("Initializing Beelder");

    this.schemes = new Map();
    this.targetMap = new Map();
    this.referenceMap = new Map();

    for (let [name, scheme] of Object.entries(this.config.schemes)) {
      this.schemes.set(name, new _scheme.default(name, scheme, this));
    }

    for (let scheme of this.schemes.values()) {
      for (let target of scheme.getTargets()) {
        this.targetMap.set(target.getDefinedTarget(), scheme);
        this.referenceMap.set(target.getDefinedTarget(), target);
      }
    }

    _timings.default.end();
  }

  static registerAction(actionClass) {
    this.actions.set(actionClass.actionName, actionClass);
  }

  async runScheme(schemeName) {
    if (!this.schemes) this.loadSchemes();
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
      console.error(e);

      _timings.default.setStackState(state, "%s " + _chalk.default.red("failed due to error"));

      throw e;
    }
  }

  enqueueScheme(list, scheme, stack) {
    if (list.indexOf(scheme) != -1) return;
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
      referencePath = beelderReference.getPath();
    } else {
      referencePath = reference.getPath();
    }

    if (!referencePath) return null;
    referencePath = _path.default.join(this.projectRoot, referencePath);
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
Beelder.registerAction(_createShaderLibrary.default);
Beelder.registerAction(_compileScss.default);
Beelder.registerAction(_delete.default);
Beelder.registerAction(_requireTarget.default);

},{"./build-cache":28,"./scheme":44,"./schemes/bundle-javascript":45,"./schemes/compile-scss":46,"./schemes/copy":47,"./schemes/create-shader-library":48,"./schemes/delete":49,"./schemes/require-target":50,"./schemes/texture-atlas":51,"./timings":52,"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk","path":"path"}],28:[function(require,module,exports){
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

  getJSON() {
    if (!(0, _utils.prepareFileLocation)(this.cacheFilePath)) {
      throw new Error("Could not create cache file");
    }

    try {
      let text = _fs.default.readFileSync(this.cacheFilePath, "utf-8");

      return JSON.parse(text);
    } catch (error) {
      if (error.code != "ENOENT") {
        console.error("Cache file is corrupted, clearing the cache");
      }

      _fs.default.writeFileSync(this.cacheFilePath, "{}");

      return {};
    }
  }

  setJSON(json) {
    if (!(0, _utils.prepareFileLocation)(this.cacheFilePath)) {
      throw new Error("Could not create cache file");
    }

    try {
      let data = JSON.stringify(json);

      _fs.default.writeFileSync(this.cacheFilePath, data, "utf8");
    } catch (error) {
      console.error("Could not save cache file for section " + this.sectionPath);
      console.error(error.message);
    }
  }

  static fileRequiresRefresh(cache, fileName) {
    let cacheEntry = cache[fileName];
    if (!cacheEntry) return true;

    try {
      _fs.default.accessSync(fileName);
    } catch (error) {
      return true;
    }

    let stats = _fs.default.statSync(fileName);

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

},{"./utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],29:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _util = _interopRequireDefault(require("util"));

class EventHandlerBlock {
  constructor() {
    this.listeners = new Map();
    this.target = void 0;
  }

  bind(event, handler) {
    if (this.listeners.has(event)) {
      this.unbind(event);
    }

    const self = this;
    let listener = null;

    if (_util.default.types.isAsyncFunction(handler)) {
      listener = async function () {
        await handler.apply(self, arguments);
      };
    } else {
      listener = function () {
        handler.apply(self, arguments);
      };
    }

    if (this.listeners.has(event)) {
      this.listeners.get(event).push(listener);
    } else {
      this.listeners.set(event, [listener]);
    }

    if (this.target) this.target.on(event, listener);
  }

  unbind(event) {
    if (!this.target) return;

    if (this.target) {
      for (let listener of this.listeners.get(event)) {
        this.target.off(event, listener);
      }
    }

    this.listeners.delete(event);
  }

  unbindTarget(target) {
    for (let [key, listeners] of this.listeners.entries()) {
      for (let listener of listeners) {
        target.off(key, listener);
      }
    }
  }

  bindTarget(target) {
    for (let [key, listeners] of this.listeners.entries()) {
      for (let listener of listeners) {
        target.on(key, listener);
      }
    }
  }

  setTarget(target) {
    if (this.target) this.unbindTarget(this.target);
    if (target) this.bindTarget(target);
  }

}

exports.default = EventHandlerBlock;

},{"@babel/runtime/helpers/interopRequireDefault":1,"util":"util"}],30:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _base = _interopRequireDefault(require("./plugins/base"));

var _resourcePlugin = _interopRequireDefault(require("./plugins/resource-plugin"));

var _jsonCommentReplacer = _interopRequireDefault(require("./plugins/json-comment-replacer"));

class BundlerPluginFactory {
  static register(plugin) {
    this.plugins.set(plugin.getPluginName(), plugin);
  }

  static getPlugin(config) {
    const Plugin = this.plugins.get(config.plugin);
    if (!Plugin) return null;
    return new Plugin(config);
  }

}

exports.default = BundlerPluginFactory;
BundlerPluginFactory.plugins = new Map();
BundlerPluginFactory.register(_jsonCommentReplacer.default);
BundlerPluginFactory.register(_base.default);
BundlerPluginFactory.register(_resourcePlugin.default);

},{"./plugins/base":40,"./plugins/json-comment-replacer":41,"./plugins/resource-plugin":42,"@babel/runtime/helpers/interopRequireDefault":1}],31:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = _interopRequireDefault(require("events"));

/**
 * A base bundler plugin class.
 * The builder plugin can traverse the project
 * tree and modify it during build. See native
 * builder plugins for examples.
 *
 * Bundler plugin **should** handle cases when
 * it's called in the same build scheme with
 * different options within a single build
 * procedure. I.e, it should not cache its
 * results if they can be influenced with
 * plugin/scheme input options.
 *
 * To store file-related data, PackerFileCache
 * interface should be inherited, so you may
 * store your data in your custom fields. Be
 * sure to use unique field names. (i.e, you
 * may prefix them with your plugin identifier)
 */
class BundlerPlugin extends _events.default {
  constructor(config) {
    super();
    this.bundler = null;
  }

  setCompiler(bundler) {
    this.bundler = bundler;
  }
  /* TODO: As babelPlugins may not change
      from build to build, maybe it's better
      to make this method static. */

  /**
   * Babel plugins which are required to run before build.
   * Please, note that this method should ensure that it
   * will return the same babel plugins with the same
   * options, as long as the scheme configuration
   * is not changed.
   *
   * The reason for this restriction is that because
   * of the build cache, the files are not re-transformed
   * through babel unless they got changed. Beelder will
   * not detect if your babel plugin config has been
   * changed.
   */


  getBabelPlugins() {
    return null;
  }

  static getPluginName() {
    return "invalid";
  }
  /**
   * Returns targets that should be built before this plugin runs
   */


  getDependencies() {
    return [];
  }
  /**
   * Returns targets that this plugin exposes
   */


  getTargets() {
    return [];
  }

}

exports.default = BundlerPlugin;

},{"@babel/runtime/helpers/interopRequireDefault":1,"events":"events"}],32:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _exorcist = _interopRequireDefault(require("exorcist"));

var _utils = require("../utils");

var fs = _interopRequireWildcard(require("fs"));

var _bundlerPluginFactory = _interopRequireDefault(require("./bundler-plugin-factory"));

var _packer = _interopRequireDefault(require("./packer/packer"));

var _ = require("..");

var _stream = require("stream");

var _browserPack = _interopRequireDefault(require("browser-pack"));

var _packerProjectStorage = _interopRequireDefault(require("./packer/packer-project-storage"));

// @ts-ignore

/**
 * A class that generalises TypeScript compilation.
 */
class Bundler {
  // Cache files should not me modified by
  // anyone else, so we can avoid file modification
  // date check. It would even break everything
  constructor(config) {
    this.config = void 0;
    this.plugins = [];
    this.packer = void 0;
    this.scheme = void 0;
    this.buildTargetDataStorage = void 0;
    this.config = config;
    if (!this.config.extensions) this.config.extensions = [".js", ".ts", ".json"];
    if (!this.config.babelSourceType) this.config.babelSourceType = "module";
    if (!this.config.babelPresets) this.config.babelPresets = this.getDefaultBabelifyPresets();
    let cacheSection = this.config.cache.getSection("target-metadata");
    this.buildTargetDataStorage = new _packerProjectStorage.default(cacheSection, {
      skipFileModificationDateCheck: true
    });
    this.scheme = config.scheme;
    this.packer = this.createPacker();
    this.loadPlugins();
  }

  loadPlugins() {
    if (!this.config.plugins) return;

    for (let pluginConfig of this.config.plugins) {
      let plugin = _bundlerPluginFactory.default.getPlugin(pluginConfig);

      if (!plugin) throw new Error("Plugin not found: " + pluginConfig.plugin);
      this.plugins.push(plugin);
      plugin.setCompiler(this);
    }
  }

  createPacker() {
    return new _packer.default(this, {
      babelTransformConfig: {
        plugins: this.getBabelPluginList(),
        presets: this.config.babelPresets,
        sourceMaps: this.config.generateSourceMaps,
        sourceType: this.config.babelSourceType
      },
      extensions: this.config.extensions,
      includeExternalModules: this.config.includeExternalModules
    });
  }

  getDefaultBabelifyPresets() {
    return [['@babel/preset-env', {
      "debug": this.config.debug,
      "targets": "node 7"
    }]];
  }

  async build() {
    let projectUpdated = await this.packer.rebuildSubtree(this.config.source);

    if (this.config.destination) {
      let entries = await this.packer.bundleSubtree(this.config.source);
      if (!entries) return;
      if (!this.bundleFilesUpdated(entries) && !projectUpdated) return;

      _.Timings.begin("Collapsing module identifiers");

      _packer.default.collapseBundleIDs(entries);

      _.Timings.end(); //fs.writeFileSync("./beelder-debug-" + Math.floor(Math.random() * 1000) + ".json", JSON.stringify(entries))


      _.Timings.begin("Writing bundle");

      let stream = _stream.Readable.from(entries).pipe((0, _browserPack.default)({
        raw: true
      }));

      await this.listen(stream);

      _.Timings.end();
    } else if (!projectUpdated) return;

    _.Timings.begin("Saving cache");

    await this.packer.cache.saveCaches();

    _.Timings.end();
  }

  bundleFilesUpdated(entries) {
    let result = false;
    let cache = this.buildTargetDataStorage.accessFileData(this.config.destination);

    if (!cache.bundleFiles) {
      cache.bundleFiles = {};
      result = true;
    }

    for (let entry of entries) {
      let globalPath = entry.globalPath;
      let rebuildDate = this.packer.getFile(globalPath).getRebuildDate();
      let fileInfo = cache.bundleFiles[globalPath];

      if (!fileInfo) {
        cache.bundleFiles[globalPath] = {
          modificationDate: rebuildDate
        };
        result = true;
        continue;
      }

      if (rebuildDate > fileInfo.modificationDate) {
        fileInfo.modificationDate = rebuildDate;
        result = true;
      }
    }

    if (result) {
      this.buildTargetDataStorage.writeFileData(this.config.destination, cache);
      this.buildTargetDataStorage.save();
    }

    return result;
  }

  getBabelPluginList() {
    let result = [];
    result = (0, _utils.concatOptionalArrays)(result, this.config.babelPlugins);

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
        writeStream.on("close", resolve);
      }
    });
  }

  getExorcist() {
    return (0, _exorcist.default)(this.config.destination + ".map", null, this.config.projectRoot, this.config.projectRoot);
  }

  getTargets() {
    let result = null;

    for (let plugin of this.plugins) {
      result = (0, _utils.concatOptionalArrays)(result, plugin.getTargets());
    }

    return result;
  }

  getDependencies() {
    let result = null;

    for (let plugin of this.plugins) {
      result = (0, _utils.concatOptionalArrays)(result, plugin.getDependencies());
    }

    return result;
  }

}

exports.default = Bundler;

},{"..":"index.ts","../utils":53,"./bundler-plugin-factory":30,"./packer/packer":39,"./packer/packer-project-storage":37,"@babel/runtime/helpers/interopRequireDefault":1,"@babel/runtime/helpers/interopRequireWildcard":2,"browser-pack":"browser-pack","exorcist":"exorcist","fs":"fs","stream":"stream"}],33:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var _browserResolve = _interopRequireDefault(require("browser-resolve"));

class PackerASTWatcher {
  constructor(config) {
    this.config = void 0;
    this.config = config;
  }

  getErrorWithMessage(message, filePath, location) {
    let relativePath = _path.default.relative(this.config.packer.bundler.config.projectRoot, filePath);

    if (location) {
      return new Error(message + " at " + relativePath + ":" + location.line);
    } else {
      return new Error(message + " at " + relativePath);
    }
  }

  guessFilePath(dependency, filePath) {
    return _browserResolve.default.sync(dependency, {
      filename: filePath,
      extensions: this.config.extensions
    });
  }

  findDependencies(ast, filePath) {
    let dependencies = {};

    const addDependency = (dependency, node) => {
      if (this.config.packer.shouldWalkFile(dependency)) {
        try {
          dependencies[dependency] = this.guessFilePath(dependency, filePath);
        } catch (e) {
          throw this.getErrorWithMessage("No such file: " + dependency, filePath, node.loc && node.loc.start);
        }
      } else {
        dependencies[dependency] = dependency;
      }
    };

    (0, _traverse.default)(ast, {
      CallExpression: nodePath => {
        let callee = nodePath.node.callee;
        if (callee.type != "Identifier" || callee.name != "require") return;
        let args = nodePath.node.arguments;
        if (args.length != 1 || args[0].type != "StringLiteral") return;
        addDependency(args[0].value, nodePath.node);
      },
      ImportDeclaration: nodePath => {
        let source = nodePath.node.source.value;
        addDependency(source, nodePath.node);
      }
    });
    return dependencies;
  }

}

exports.default = PackerASTWatcher;

},{"@babel/runtime/helpers/interopRequireDefault":1,"@babel/traverse":"@babel/traverse","browser-resolve":6,"path":"path"}],34:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _packerProjectStorage = _interopRequireDefault(require("./packer-project-storage"));

var _packerFileStorage = _interopRequireDefault(require("./packer-file-storage"));

class PackerCache {
  /**
   * Storage that should be used for storing data
   * that may not be left unattended on each build.
   * Large amounts of data will make this storage
   * slow to read and write.
   */

  /**
   * Storage that should be used for storing
   * large amounts of data that you won't read
   * at each build.
   */

  /**
   * Storage for caching abstract syntax trees
   */
  constructor(cache) {
    this.fastStorage = void 0;
    this.largeStorage = void 0;
    this.astStorage = void 0;
    this.fastStorage = new _packerProjectStorage.default(cache.getSection("fast-storage"));
    this.largeStorage = new _packerFileStorage.default(cache.getSection("large-storage"));
    this.astStorage = new _packerFileStorage.default(cache.getSection("ast-storage"));
  }

  async saveCaches() {
    await this.fastStorage.save(); // await this.largeStorage.save() - This will do nothing
    // await this.astStorage.save() - And this too. AST storage also will only be saved when file is rebuilt
  }

}

exports.default = PackerCache;

},{"./packer-file-storage":35,"./packer-project-storage":37,"@babel/runtime/helpers/interopRequireDefault":1}],35:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _packerStorage = _interopRequireDefault(require("./packer-storage"));

var _utils = require("../../utils");

var _buildCache = _interopRequireDefault(require("../../build-cache"));

class PackerFileStorage extends _packerStorage.default {
  getFileNameHash(fileName) {
    return (0, _utils.murmurhash3_32_gc)(fileName, 0xBEEF);
  }

  getSection(filePath) {
    let hash = this.getFileNameHash(filePath);
    let hashString = (0, _utils.hashToUUIDString32)(hash);
    return this.cache.getSection(hashString);
  }

  accessFileData(filePath) {
    let section = this.getSection(filePath).getJSON();
    if (!section.files) section.files = {};

    if (_buildCache.default.fileRequiresRefresh(section.files, filePath)) {
      return {};
    }

    return _buildCache.default.getFileData(section.files, filePath);
  }

  save() {}

  writeFileData(filePath, data) {
    let section = this.getSection(filePath);
    let json = section.getJSON();
    if (!json.files) json.files = {};

    _buildCache.default.refreshFileData(json.files, filePath, data);

    section.setJSON(json);
  }

}

exports.default = PackerFileStorage;

},{"../../build-cache":28,"../../utils":53,"./packer-storage":38,"@babel/runtime/helpers/interopRequireDefault":1}],36:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

//
// To clarify:
//
// There will be two types of permanent data buffers: per-file and per-project.
//
// The more effective way to store light data that we will have to access at least
// once per build is to store it on the per-project storage.
//
// The most effective way to store heavy data is per-file storage,
// especially if we won't always need it.
//
// The dependency tree should be stored in per-project storage since it's the first
// thing that should be analyzed when project is building
//
// Since bundler plugin may not change AST tree cache, it's necessary to
// save its original version. AST tree is heavy to store in memory and parse,
// but we won't always want to read it. (only when file has been modified or
// will be processed by some plugin)
//
// Even thou transformed code is huge, the file that stores it will not be much larger
// than the bundle file, and it's three times lighter than AST in average, so we will
// store it in per-project storage.
//

/**
 * Interface for accessing file cache and metadata
 */
class PackerFile {
  constructor(packer, filePath) {
    this.filePath = void 0;
    this.fastStorage = void 0;
    this.projectPath = void 0;
    this.packer = void 0;
    this.ast = void 0;
    this.shouldBeCompiled = void 0;
    this.isJSON = void 0;
    this.inOriginalPackage = void 0;
    this.packer = packer;
    this.filePath = filePath;
    this.projectPath = _path.default.relative(this.packer.bundler.config.projectRoot, filePath);
    this.fastStorage = this.packer.cache.fastStorage.accessFileData(this.filePath); // TODO: make this more smart

    let extension = _path.default.extname(this.projectPath);

    this.shouldBeCompiled = extension == ".ts" || extension == ".js";
    this.inOriginalPackage = !this.projectPath.startsWith("..") && this.projectPath.indexOf("node_modules") == -1;
    this.isJSON = extension == ".json";
  }
  /**
   * Fetch file dependencies with most efficient available way
   *
   * - **Fast case**: File dependencies has already been found
   * in a previous build. If file has not been modified,
   * cached version will be returned. This way, no requests to
   * the file system will be made.
   *
   * - **Slow case**: Сache is outdated or missing. The file will
   * be rebuilt and its dependencies will be retrieved from
   * its AST. Two requests to the file system will be made:
   * one to read file contents and another one to write the AST
   * cache.
   * <br/>
   * **File system calls**:
   * <table width="200">
   *     <tr><td>Average case:</td><td>0 requests</td></tr>
   *     <tr><td>Worst case:</td><td>2 requests</td></tr>
   * </table>
   *
   */


  getDependencies() {
    if (!this.fastStorage.dependencies) {
      this.fastStorage.dependencies = this.determineDependencies();
    }

    return this.fastStorage.dependencies;
  }
  /**
   * Returns file text contents
   */


  getContents() {
    return _fs.default.readFileSync(this.filePath, "utf8");
  }

  compile() {
    let contents = this.getContents();

    if (this.shouldBeCompiled) {
      if (this.inOriginalPackage) {
        return this.packer.transformFile(contents, this.projectPath).ast;
      } else {
        return this.packer.parseFile(contents, this.projectPath);
      }
    } else {
      return null;
    }
  }
  /**
   * Fetch AST tree for this file after babel-transformed file
   * with most efficient available way
   *
   * **Please note** that this method is likely to be **slow**.
   * Reading the AST for each file can make the build process
   * slow.
   *
   * - **Fastest case**: If file AST tree has been already loaded,
   * it will just be returned. No file system requests will be made.
   *
   * - **Fast case**: Most common case for incremental rebuild,
   * when AST tree has been created in a previous build and file
   * cache is up to date. To read AST cache, a single request to
   * the file system will be made
   *
   * - **Slow case**: Cache is outdated or missing. The file will
   * be rebuilt and its dependencies will be retrieved from
   * its AST. Two requests to the file system will be made:
   * one to read file contents and another one to write the AST
   * cache.
   * <br/>
   * **File system calls**:
   * <table width="200">
   *     <tr><td>Best case:</td><td>0 requests</td></tr>
   *     <tr><td>Average case:</td><td>1 request</td></tr>
   *     <tr><td>Worst case:</td><td>2 requests</td></tr>
   * </table>
   *
   * @returns: AST tree of babel-transformed file
   */


  getAST(ignoreCache = false) {
    if (!ignoreCache) {
      if (this.ast) return this.ast;
      this.ast = this.packer.cache.astStorage.accessFileData(this.filePath); // accessFileData returns empty object
      // if entry was not found, so we have
      // to check if we've got a valid AST
      // tree from cache.

      if (this.ast && this.ast.type) return this.ast;
    }

    this.ast = this.compile();
    this.packer.cache.astStorage.writeFileData(this.filePath, this.ast);
    return this.ast;
  }
  /**
   * Generated code after babel and plugin transformations.
  *
   * **Please note** that this method should not be called
   * from plugins, as it will cause packer to ignore following
   * AST transformations.
   *
   * - **Fastest case**: If code has been already generated in
   * a previous build, a cached version will be returned.
   * As the code cache is stored in a fast storage, no
   * file system requests will be made
   *
   * - **Fast case**: If code cache was cleared by some plugin,
   * but AST cache is up-to-date, code will be regenerated from
   * this tree without rebuilding the file.
   */


  getTransformedCode() {
    if (this.fastStorage.code) return this.fastStorage.code;

    if (this.shouldBeCompiled) {
      this.fastStorage.code = this.packer.generateCode(this.getAST(), this.projectPath, this.getContents());
    } else if (this.isJSON) {
      this.fastStorage.code = "module.exports = " + this.getContents();
    } else {
      this.fastStorage.code = this.getContents();
    }

    this.fastStorage.rebuildDate = Date.now();
    return this.fastStorage.code;
  }
  /**
   * Clears transformed code cache. Plugins should call this method
   * for each file they transform.
   */


  clearCodeCache() {
    this.fastStorage.code = null;
    this.fastStorage.rebuildDate = 0;
  }

  determineDependencies() {
    // Ignoring cache here to avoid unnecessary querying
    // of the file system. This method is called only
    // when cache is outdated or missing.
    let ast = this.getAST(true);
    if (!ast) return {};
    return this.packer.astWatcher.findDependencies(ast, this.filePath);
  }

  getFastPluginStorage(plugin) {
    if (!this.fastStorage.pluginData) {
      this.fastStorage.pluginData = {};
    }

    let pluginData = this.fastStorage.pluginData[plugin];

    if (!pluginData) {
      pluginData = {};
      this.fastStorage.pluginData[plugin] = pluginData;
    }

    return pluginData;
  }

  cacheIsUpToDate() {
    return !!this.fastStorage.dependencies;
  }

  getRebuildDate() {
    return this.fastStorage.rebuildDate || 0;
  }

}

exports.default = PackerFile;

},{"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],37:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _packerStorage = _interopRequireDefault(require("./packer-storage"));

var _buildCache = _interopRequireDefault(require("../../build-cache"));

class PackerProjectStorage extends _packerStorage.default {
  constructor(cache, config = {}) {
    super(cache);
    this.cachedJSON = null;
    this.config = void 0;
    this.config = config;
  }

  getSection() {
    if (this.cachedJSON) return this.cachedJSON;
    this.cachedJSON = this.cache.getJSON();
    if (!this.cachedJSON.files) this.cachedJSON.files = {};
    return this.cachedJSON;
  }

  accessFileData(filePath) {
    let section = this.getSection();
    let data = null;

    if (this.config.skipFileModificationDateCheck || !_buildCache.default.fileRequiresRefresh(section.files, filePath)) {
      data = _buildCache.default.getFileData(section.files, filePath);
    }

    if (!data) {
      data = {};

      _buildCache.default.refreshFileData(section.files, filePath, data);
    }

    return data;
  }

  save() {
    if (this.cachedJSON) {
      this.cache.setJSON(this.cachedJSON);
    }
  }

  writeFileData(filePath, object) {
    _buildCache.default.refreshFileData(this.getSection().files, filePath, object);
  }

}

exports.default = PackerProjectStorage;

},{"../../build-cache":28,"./packer-storage":38,"@babel/runtime/helpers/interopRequireDefault":1}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Abstract file data storage system.
 */
class PackerStorage {
  constructor(cache) {
    this.cache = void 0;
    this.cache = cache;
  }

}

exports.default = PackerStorage;

},{}],39:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PackerBuildContext = exports.TraverseContext = void 0;

var babel = _interopRequireWildcard(require("@babel/core"));

var _path = _interopRequireDefault(require("path"));

var _generator = _interopRequireDefault(require("@babel/generator"));

var _index = require("../../index");

var _asyncEventEmitter = _interopRequireDefault(require("../../async-event-emitter"));

var _packerCache = _interopRequireDefault(require("./packer-cache"));

var _packerFile = _interopRequireDefault(require("./packer-file"));

var _packerAstWatcher = _interopRequireDefault(require("./packer-ast-watcher"));

class TraverseContext {
  constructor() {
    this.metFiles = new Set();
    this.cachedEntriesLoaded = 0;
    this.rebuiltEntries = 0;
    this.onlyCompilableFiles = true;
  }

}

exports.TraverseContext = TraverseContext;

class PackerBuildContext extends TraverseContext {
  constructor(...args) {
    super(...args);
    this.bundleCache = [];
  }

}
/**
 * This class provides an interface for transforming files
 */


exports.PackerBuildContext = PackerBuildContext;

class Packer extends _asyncEventEmitter.default {
  constructor(bundler, config) {
    super();
    this.bundler = void 0;
    this.config = void 0;
    this.babelConfig = void 0;
    this.cache = void 0;
    this.files = new Map();
    this.astWatcher = void 0;
    this.babelConfigGenerated = void 0;
    this.bundler = bundler;
    this.config = config;
    this.cache = new _packerCache.default(this.bundler.config.cache);
    this.astWatcher = new _packerAstWatcher.default({
      packer: this,
      extensions: this.config.extensions
    });
    this.babelConfigGenerated = false;
  }

  updateBabelConfig(filePath) {
    if (!this.babelConfigGenerated) this.generateConfig();
    this.babelConfig.options.filename = filePath;
    this.babelConfig.options.sourceFileName = filePath;
  }
  /**
   * Transforms given data with provided sourcemap filename
   * @param data Source code to transform
   * @param filePath Path to file for sourcemap (project-relative)
   */


  transformFile(data, filePath) {
    this.updateBabelConfig(filePath);
    return babel.transformSync(data, this.babelConfig.options);
  }

  parseFile(data, filePath) {
    this.updateBabelConfig(filePath);
    return babel.parseSync(data, this.babelConfig.options);
  }

  generateConfig() {
    let options = this.config.babelTransformConfig;
    if (!options) return;
    this.babelConfig = babel.loadPartialConfig(options);
    if (!this.babelConfig) return;
    const opts = this.babelConfig.options;
    opts.ast = true;
    opts.cwd = this.bundler.config.projectRoot;
    opts.caller = {
      name: "beelder"
    };
  }

  sourceMapComment(sourceMap) {
    const base64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64');
    return "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + base64;
  }
  /**
   * Generates code from abstract syntax tree
   * @param ast File tree
   * @param filePath Path to file for sourcemap (project-relative)
   * @param originalCode Original file code
   */


  generateCode(ast, filePath, originalCode) {
    let generated = (0, _generator.default)(ast, {
      sourceMaps: true,
      sourceFileName: filePath,
      sourceRoot: this.bundler.config.projectRoot
    });
    generated.map.sourcesContent = [originalCode];
    return generated.code + "\n" + this.sourceMapComment(generated.map);
  }

  async bundleSubtree(entry) {
    let context = new PackerBuildContext();
    context.onlyCompilableFiles = false;
    await this.traverse(entry, context, (filePath, data) => {
      context.bundleCache.push({
        id: filePath,
        source: data.getTransformedCode(),
        deps: Object.assign({}, data.getDependencies()),
        entry: context.bundleCache.length == 0,
        sourceFile: _path.default.relative(this.bundler.config.projectRoot, filePath),
        globalPath: filePath
      });
    });
    return context.bundleCache;
  }
  /**
   * @param entry
   * @returns true if at least one file was modified
   */


  async rebuildSubtree(entry) {
    _index.Timings.begin("Rebuilding files");

    await this.emit("before-build");
    let context = await this.traverse(entry);
    await this.emit("after-build");

    _index.Timings.end("Finished rebuilding files (had to rebuild " + context.rebuiltEntries + " / " + (context.cachedEntriesLoaded + context.rebuiltEntries) + " files)");

    return context.rebuiltEntries > 0;
  }

  static collapseBundleIDs(cache) {
    let fileNames = new Map();
    let fileIndex = 0;

    for (let fileInfo of cache) {
      fileNames.set(fileInfo.id, fileIndex);
      fileInfo.id = fileIndex;
      fileIndex++;
    }

    for (let fileInfo of cache) {
      for (let [key, value] of Object.entries(fileInfo.deps)) {
        let identifier = fileNames.get(value);
        if (identifier === undefined) continue;
        fileInfo.deps[key] = identifier;
      }
    }
  }
  /**
   * Get file meta-information and cache
   * @param filePath global file path
   */


  getFile(filePath) {
    let file = this.files.get(filePath);
    if (file) return file;
    file = new _packerFile.default(this, filePath);
    this.files.set(filePath, file);
    return file;
  }

  shouldWalkFile(path) {
    if (path.startsWith(".")) return true;

    if (this.config.includeExternalModules === true) {
      return true;
    } else if (Array.isArray(this.config.includeExternalModules)) {
      return this.config.includeExternalModules.indexOf(path) != -1;
    }
  }
  /**
   * Traverses the project tree with given callback function
   * @param filePath Project entry point to traverse from
   * @param context Traverse context object to store some useful information. May be null
   * @param callback Traverse function which will be called for each project file. May be either sync or async
   */


  async traverse(filePath, context, callback) {
    let tempContext = context;
    if (!tempContext) tempContext = new TraverseContext();
    if (tempContext.metFiles.has(filePath)) return;
    tempContext.metFiles.add(filePath);
    let file = this.getFile(filePath);

    if (file.cacheIsUpToDate()) {
      tempContext.cachedEntriesLoaded++;
    } else {
      tempContext.rebuiltEntries++;
    }

    if (callback) {
      let result = callback(filePath, file, context);

      if (result instanceof Promise) {
        await result;
      }
    } // getDependencies method tries to use the most
    // efficient method to fetch file dependencies,
    // but it will rebuild each modified file
    // automatically. See getDependencies
    // documentation


    for (let [name, absolute] of Object.entries(file.getDependencies())) {
      if (!this.shouldWalkFile(name)) continue;
      if (tempContext.onlyCompilableFiles && !this.getFile(absolute).shouldBeCompiled) continue;
      await this.traverse(absolute, tempContext, callback);
    }

    return tempContext;
  }

}

exports.default = Packer;

},{"../../async-event-emitter":25,"../../index":"index.ts","./packer-ast-watcher":33,"./packer-cache":34,"./packer-file":36,"@babel/core":"@babel/core","@babel/generator":"@babel/generator","@babel/runtime/helpers/interopRequireDefault":1,"@babel/runtime/helpers/interopRequireWildcard":2,"path":"path"}],40:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bundlerPlugin = _interopRequireDefault(require("../bundler-plugin"));

class BasePlugin extends _bundlerPlugin.default {
  getBabelPlugins() {
    return []; // return [
    //     ["module-resolver", {
    //         extensions: [".js", ".ts", ".json"],
    //         alias: {
    //             "src": Compiler.path("src")
    //         }
    //     }],
    //     BabelPluginImportDir,
    //     ["@babel/plugin-syntax-dynamic-import"],
    //     ["@babel/plugin-syntax-class-properties"],
    //     ["@babel/plugin-proposal-class-properties", { loose: true }],
    //     ["@babel/plugin-transform-typescript"],
    //     ["@babel/plugin-transform-runtime"],
    //     ["@babel/plugin-proposal-export-default-from"]
    // ]
  }

}

exports.default = BasePlugin;

},{"../bundler-plugin":31,"@babel/runtime/helpers/interopRequireDefault":1}],41:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CommentReplacement = void 0;

var _bundlerPlugin = _interopRequireDefault(require("../bundler-plugin"));

var _eventHandlerBlock = _interopRequireDefault(require("../../event-handler-block"));

var _traverse = _interopRequireDefault(require("@babel/traverse"));

var parser = _interopRequireWildcard(require("@babel/parser"));

var _types = require("@babel/types");

var _ = require("../..");

var _reference = _interopRequireDefault(require("../../reference"));

var _fs = _interopRequireDefault(require("fs"));

class CommentReplacement {
  constructor(config, plugin) {
    this.comment = void 0;
    this.ast = void 0;
    this.json = void 0;
    this.file = void 0;
    this.plugin = void 0;
    this.plugin = plugin;
    this.comment = config.comment;
    if (config.json) this.json = config.json;else if (config.file) this.file = new _reference.default(config.file);else throw new Error("Must either provide .file or .json field for json-comment-replacer plugin");
  }

  getDependency() {
    if (this.file && this.file.isDependency) {
      return this.file.getDependency();
    }

    return null;
  }

  getReplacement() {
    if (this.json) return parser.parseExpression(JSON.stringify(this.json));
    let reference = this.plugin.bundler.scheme.beelder.resolveReference(this.file);
    return parser.parseExpression(_fs.default.readFileSync(reference, "utf8"));
  }

  getAST() {
    if (!this.ast) {
      this.ast = this.getReplacement();
    }

    return (0, _types.cloneNode)(this.ast);
  }

}

exports.CommentReplacement = CommentReplacement;

/**
 * Replaces objects with special comments with pre-defined JSON
 *
 * @example:
 *
 * // before transform:
 * let a = {
 *  // exact-special-comment
 * }
 * // after transform, it's possible to achieve this:
 * let a = { key: "value" }
 */
class CommentReplacerBundlerPlugin extends _bundlerPlugin.default {
  constructor(config) {
    super(config);
    this.eventHandlerBlock = void 0;
    this.replacements = new Map();
    this.readConfig(config);
    this.eventHandlerBlock = new _eventHandlerBlock.default();
    this.eventHandlerBlock.bind("after-build", async () => await this.replaceComments());
  }

  getDependencies() {
    let result = null;

    for (let [, rule] of this.replacements.entries()) {
      let dependency = rule.getDependency();

      if (dependency) {
        if (!result) result = [];
        result.push(dependency);
      }
    }

    return result;
  }

  readConfig(config) {
    if (config.replacements) {
      for (let replacementConfig of config.replacements) {
        let replacement = new CommentReplacement(replacementConfig, this);
        this.replacements.set(replacement.comment, replacement);
      }
    }
  }

  maybeReplace(path, fileCache) {
    let node = path.node;

    if (!node.properties || !node.innerComments || node.properties.length !== 0 || node.innerComments.length !== 1) {
      return;
    }

    let comment = node.innerComments[0].value.trim();
    fileCache.cachedComments.push(comment);
    let replacement = this.replacements.get(comment);
    if (!replacement) return;
    path.replaceWith(replacement.getAST());
    path.node.innerComments = [];
  }

  async replaceComments() {
    _.Timings.begin("Running json-comment-replacer plugin");

    if (this.replacements.size) {
      let entry = this.bundler.config.source;
      await this.bundler.packer.traverse(entry, null, (filePath, file) => {
        // Using fast cache to filter out files
        // that we definitely don't want to transform.
        let storage = file.getFastPluginStorage(CommentReplacerBundlerPlugin.getPluginName());

        if (storage.cachedComments) {
          let flag = false;

          for (let comment of storage.cachedComments) {
            if (this.replacements.has(comment)) flag = true;
          }

          if (!flag) return;
        } // Transforming file


        storage.cachedComments = [];
        file.clearCodeCache();
        (0, _traverse.default)(file.getAST(), {
          ObjectExpression: path => this.maybeReplace(path, storage)
        });
      });
    }

    _.Timings.end();
  }

  setCompiler(bundler) {
    super.setCompiler(bundler);
    this.eventHandlerBlock.setTarget(bundler.packer);
  }

  static getPluginName() {
    return "json-comment-replacer";
  }

}

exports.default = CommentReplacerBundlerPlugin;

},{"../..":"index.ts","../../event-handler-block":29,"../../reference":43,"../bundler-plugin":31,"@babel/parser":"@babel/parser","@babel/runtime/helpers/interopRequireDefault":1,"@babel/runtime/helpers/interopRequireWildcard":2,"@babel/traverse":"@babel/traverse","@babel/types":"@babel/types","fs":"fs"}],42:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ResourceSearchContext = exports.ResourcePluginRule = exports.ResourceReference = void 0;

var _bundlerPlugin = _interopRequireDefault(require("../bundler-plugin"));

var _eventHandlerBlock = _interopRequireDefault(require("../../event-handler-block"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _ = require("../..");

var _packer = require("../packer/packer");

var _minimatch = require("minimatch");

var _utils = require("../../utils");

var _reference = _interopRequireDefault(require("../../reference"));

class ResourceReference {
  constructor() {
    this.resource = void 0;
    this.line = void 0;
  }

}

exports.ResourceReference = ResourceReference;

class ResourcePluginRule {
  constructor(config) {
    this.pattern = void 0;
    this.target = void 0;
    this.pattern = config.pattern;
    this.target = new _reference.default(config.target);
  }

}

exports.ResourcePluginRule = ResourcePluginRule;

class ResourceSearchContext extends _packer.TraverseContext {
  constructor(...args) {
    super(...args);
    this.foundResources = new Map();
  }

}

exports.ResourceSearchContext = ResourceSearchContext;

class ResourcePlugin extends _bundlerPlugin.default {
  constructor(config) {
    super(config);
    this.eventHandlerBlock = void 0;
    this.config = void 0;
    this.rules = void 0;
    this.pathSepReplaceRegex = void 0;
    this.config = config;
    this.eventHandlerBlock = new _eventHandlerBlock.default();
    this.eventHandlerBlock.bind("after-build", async () => await this.findResources());
    this.rules = this.config.rules.map(config => new ResourcePluginRule(config));

    if (_path.default.sep !== '/') {
      this.pathSepReplaceRegex = new RegExp((0, _utils.escapeRegExp)(_path.default.sep), "g");
    }
  }

  setCompiler(bundler) {
    super.setCompiler(bundler);
    this.eventHandlerBlock.setTarget(bundler.packer);
  }

  async findResources() {
    _.Timings.begin("Running resource-plugin");

    let entry = this.bundler.config.source;
    let context = new ResourceSearchContext();
    await this.bundler.packer.traverse(entry, context, (filePath, file) => {
      let relative = _path.default.relative(this.bundler.config.projectRoot, filePath); // Using fast cache to check if we've already
      // found all resources for this file


      let storage = file.getFastPluginStorage(ResourcePlugin.getPluginName());

      if (!storage.resources) {
        // if not, we have to fetch file AST
        // to find all resources and cache them
        storage.resources = this.getCommentsFromAST(file.getAST(), relative);
      }

      if (storage.resources.length) {
        context.foundResources.set(relative, storage.resources);
      }
    });
    let resourceArray = this.getResourceMap(context.foundResources);

    for (let rule of this.rules) {
      let objectToWrite = [];
      let matcher = new _minimatch.Minimatch(rule.pattern);

      for (let [resource, references] of resourceArray.entries()) {
        if (matcher.match(resource)) objectToWrite.push([resource, references]);
      }

      let destinationPath = this.bundler.scheme.beelder.resolveReference(rule.target);

      if ((0, _utils.prepareFileLocation)(destinationPath)) {
        _fs.default.writeFileSync(destinationPath, JSON.stringify(objectToWrite));
      }
    }

    _.Timings.end();
  }

  getCommentsFromAST(ast, filePath) {
    let dirname = _path.default.dirname(filePath);

    let resources = [];

    for (let comment of ast.comments) {
      let commentValue = comment.value.trim();

      if (commentValue.startsWith(ResourcePlugin.resourcePrefix)) {
        let resourcePath = commentValue.substr(ResourcePlugin.resourcePrefix.length).replace(/["']/g, "").trim();

        if (resourcePath.startsWith("/")) {
          resourcePath = resourcePath.substr(1);
        } else {
          resourcePath = _path.default.join(dirname, resourcePath);
        }

        if (this.pathSepReplaceRegex) {
          resourcePath = resourcePath.replace(this.pathSepReplaceRegex, '/');
        }

        let resourceToAdd = {
          resource: resourcePath,
          line: comment.loc.start.line
        };
        resources.push(resourceToAdd);
      }
    }

    return resources;
  }

  static getPluginName() {
    return "resource-plugin";
  }

  getResourceMap(foundResources) {
    let result = new Map();

    for (let [filePath, referenceList] of foundResources.entries()) {
      for (let reference of referenceList) {
        let list = result.get(reference.resource);
        let fileAndLine = filePath + ":" + reference.line;

        if (!list) {
          result.set(reference.resource, [fileAndLine]);
        } else {
          list.push(fileAndLine);
        }
      }
    }

    return result;
  }

  getTargets() {
    let result = null;

    for (let rule of this.rules) {
      if (rule.target.definesTarget) {
        if (!result) result = [];
        result.push(rule.target);
      }
    }

    return result;
  }

}

exports.default = ResourcePlugin;
ResourcePlugin.resourcePrefix = "@load-resource:";

},{"../..":"index.ts","../../event-handler-block":29,"../../reference":43,"../../utils":53,"../bundler-plugin":31,"../packer/packer":39,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","minimatch":13,"path":"path"}],43:[function(require,module,exports){
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
    this.targetName = void 0;
    this.config = void 0;
    this.config = config;

    if (typeof config === "object") {
      if (config.targetName) {
        if (config.path) this.definesTarget = true;else this.isDependency = true;
        this.targetName = config.targetName;
      }

      this.path = config.path;
    } else {
      this.parseInlineFormat(config);
    }

    if (!this.path) this.path = null;
  }

  parseInlineFormat(text) {
    if (/^#[^ =]*$/.test(text)) {
      this.targetName = text.substr(1);
      this.isDependency = true;
    } else if (/^#[^ =]* *=.*$/.test(text)) {
      let equalitySignIndex = text.indexOf("=");
      this.targetName = text.substring(1, equalitySignIndex).replace(/ *$/, "");
      this.path = text.substr(equalitySignIndex + 1).replace(/^ */, "");
      this.definesTarget = true;
    } else {
      this.path = text;
    }
  }

  getDependency() {
    if (!this.isDependency) return null;
    return this.targetName;
  }

  getDefinedTarget() {
    if (!this.definesTarget) return null;
    return this.targetName;
  }

  getPath() {
    return this.path;
  }

  getConsoleName() {
    if (this.definesTarget || this.isDependency) {
      return _chalk.default.green(this.targetName);
    } else {
      return _chalk.default.blueBright(this.path);
    }
  }

}

exports.default = BeelderReference;

},{"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk"}],44:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _beelder = _interopRequireDefault(require("./beelder"));

var _timings = _interopRequireDefault(require("./timings"));

var _chalk = _interopRequireDefault(require("chalk"));

var _reference = _interopRequireDefault(require("./reference"));

var _utils = require("./utils");

class BeelderScheme {
  constructor(name, config, beelder) {
    this.steps = [];
    this.explicitTargets = [];
    this.config = void 0;
    this.beelder = void 0;
    this.name = void 0;
    this.name = name;
    this.beelder = beelder;
    this.config = config;
    this.loadTargets();
    this.loadSteps();
  }

  loadTargets() {
    if (!this.config.targets) return;

    for (let referenceConfig of this.config.targets) {
      let reference = new _reference.default(referenceConfig);
      if (!reference.definesTarget) throw new Error("References listed in 'targets' must define target");
      this.explicitTargets.push(reference);
    }
  }

  loadSteps() {
    if (!this.config.steps) return;

    for (let step of this.config.steps) {
      const ActionClass = _beelder.default.actions.get(step.action);

      if (!ActionClass) {
        throw new Error("No such action: '" + step.action + "'");
      }

      const action = new ActionClass(step, this);
      this.steps.push(action);
    }
  }

  getDependencies() {
    let dependencies = [];

    for (let step of this.steps) {
      dependencies = (0, _utils.concatOptionalArrays)(dependencies, step.getDependencies());
    }

    return dependencies;
  }

  getTargets() {
    let targets = [];

    for (let step of this.steps) {
      targets = (0, _utils.concatOptionalArrays)(targets, step.getTargets());
    }

    targets = (0, _utils.concatOptionalArrays)(targets, this.explicitTargets);
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

},{"./beelder":27,"./reference":43,"./timings":52,"./utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk"}],45:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _timings = _interopRequireDefault(require("../timings"));

var _bundler = _interopRequireDefault(require("../javascript-bundler/bundler"));

var _utils = require("../utils");

/**
 * The class that implements bundle-javascript beelder action.
 * This action may be used multiple times in single build action.
 * If "target" field is omitted, project will be rebuilt in order
 * to update caches.
 *
 * The following parameters must be the same in all dependent
 * configurations (which share common source files):
 * - `compilerOptions.babelPlugins`
 * - `compilerOptions.babelPresets`
 * - `compilerOptions.babelSourceType`
 * - `includeExternalModules`
 */
class BundleJavascriptAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.compilerOptions = void 0;
    this.bundler = void 0;
    this.compilerOptions = config.compilerOptions;
    if (config.cacheSection) this.cache = this.cache.getSection(config.cacheSection);
    this.createBundler();
  }

  async runCompiler() {
    await this.bundler.build();
  }

  getDependencies() {
    return (0, _utils.concatOptionalArrays)(super.getDependencies(), this.bundler.getDependencies());
  }

  getTargets() {
    return (0, _utils.concatOptionalArrays)(super.getTargets(), this.bundler.getTargets());
  }

  async run() {
    let sourceName = this.source.getConsoleName();

    _timings.default.begin("Building " + sourceName);

    await this.runCompiler();

    _timings.default.end("Finished building " + sourceName);
  }

  createBundler() {
    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    let compilerOptions = {
      source: source,
      destination: destination,
      cache: this.cache,
      projectRoot: this.scheme.beelder.projectRoot,
      buildAction: this,
      scheme: this.scheme
    };

    if (this.compilerOptions) {
      Object.assign(compilerOptions, this.compilerOptions);
    }

    this.bundler = new _bundler.default(compilerOptions);
  }

}

exports.default = BundleJavascriptAction;
BundleJavascriptAction.actionName = "bundle-javascript";

},{"../base-scheme":26,"../javascript-bundler/bundler":32,"../timings":52,"../utils":53,"@babel/runtime/helpers/interopRequireDefault":1}],46:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _buildCache = _interopRequireDefault(require("../build-cache"));

var _sass = _interopRequireDefault(require("sass"));

var _utils = require("../utils");

var _ = require("..");

// TODOS:
// Handle file read errors

/**
 * Scheme action which compiles all SCSS files from resource list
 * into single CSS file.
 */
class CompileSCSSSchemeAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.config = void 0;
    this.config = config;
  }

  async run() {
    _.Timings.begin("Updating CSS resources");

    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    let resourceFile = JSON.parse(_fs.default.readFileSync(source, "utf8"));
    let resourceList = resourceFile.map(file => file[0]);
    let cacheJSON = this.cache.getJSON();
    let cacheForCurrentResourceList = cacheJSON[source];

    if (!cacheForCurrentResourceList) {
      cacheForCurrentResourceList = {};
      cacheJSON[source] = cacheForCurrentResourceList;
    }

    if (!cacheForCurrentResourceList.files) cacheForCurrentResourceList.files = {};
    if (!cacheForCurrentResourceList.resultCache) cacheForCurrentResourceList.resultCache = {};
    let resultCache = cacheForCurrentResourceList.resultCache[destination];

    if (!resultCache) {
      resultCache = {};
      cacheForCurrentResourceList.resultCache[destination] = resultCache;
    }

    let shouldUpdate = this.schemeFileCacheOutdated(resultCache, resourceList);
    if (!shouldUpdate) shouldUpdate = this.anyFilesUpdated(cacheForCurrentResourceList.files, resourceList);

    if (shouldUpdate) {
      _.Timings.begin("Recompiling SCSS files");

      if ((0, _utils.prepareFileLocation)(destination)) {
        _fs.default.writeFileSync(destination, this.recompileFiles(resourceFile, cacheForCurrentResourceList.files), "utf8");
      } else {
        console.error("Could not create target directory. Please, check permissions");
      }

      resultCache.resourceList = resourceList;
      this.cache.setJSON(cacheForCurrentResourceList);

      _.Timings.end();
    }

    _.Timings.end();
  }

  schemeFileCacheOutdated(resultCache, resourceList) {
    if (resultCache && resultCache.resourceList) {
      return !(0, _utils.compareArrayValues)(resultCache.resourceList, resourceList);
    }

    return true;
  }

  anyFilesUpdated(fileCache, resourceList) {
    for (let resource of resourceList) {
      if (_buildCache.default.fileRequiresRefresh(fileCache, resource)) return true;
    }

    return false;
  }

  recompileFiles(resourceFile, fileCache) {
    let compiledStylesheets = [];

    for (let resourceInfo of resourceFile) {
      let resourcePath = resourceInfo[0]; // TODO: print error if file does not exist
      //let resourceReferences = resourceInfo[1]

      let compiledSource;

      if (_buildCache.default.fileRequiresRefresh(fileCache, resourcePath)) {
        compiledSource = this.compileCSS(resourceInfo);

        _buildCache.default.refreshFileData(fileCache, resourcePath, compiledSource);
      } else {
        compiledSource = _buildCache.default.getFileData(fileCache, resourcePath);
      }

      compiledStylesheets.push(compiledSource);
    }

    return compiledStylesheets.reverse().join("\n");
  }

  compileCSS(resourceInfo) {
    let file = _fs.default.readFileSync(resourceInfo[0], "utf8");

    let rendered = _sass.default.renderSync({
      data: file,
      outputStyle: "expanded"
    });

    return rendered.css.toString("utf8");
  }

}

exports.default = CompileSCSSSchemeAction;
CompileSCSSSchemeAction.actionName = "compile-scss";

},{"..":"index.ts","../base-scheme":26,"../build-cache":28,"../utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","sass":"sass"}],47:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _path = _interopRequireDefault(require("path"));

var _utils = require("../utils");

var _fs = _interopRequireDefault(require("fs"));

var _timings = _interopRequireDefault(require("../timings"));

class CopyAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
  }

  async run() {
    _timings.default.begin("Copying " + this.source.getConsoleName() + " to " + this.target.getConsoleName());

    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    let sourceStat;

    try {
      sourceStat = await _fs.default.promises.stat(source);
    } catch (e) {
      throw new Error("Copying failed: " + e.message);
    }

    let dirname;

    if (destination.endsWith(_path.default.sep)) {
      // Copying something in directory, adding filename explicitly
      dirname = destination;
      destination = _path.default.join(destination, _path.default.basename(source));
    } else {
      // Copying file on exact new location
      dirname = _path.default.dirname(destination);
    }

    if (!(await (0, _utils.prepareDirectory)(dirname))) {
      throw new Error("Could not create destination directory");
    }

    if (sourceStat.isDirectory()) {
      await (0, _utils.copyDirectory)(source, destination);
    } else {
      await _fs.default.promises.copyFile(source, destination);
    }

    _timings.default.end();
  }

}

exports.default = CopyAction;
CopyAction.actionName = "copy";

},{"../base-scheme":26,"../timings":52,"../utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],48:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _baseScheme = _interopRequireDefault(require("../base-scheme"));

var _utils = require("../utils");

class CreateShaderLibraryAction extends _baseScheme.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.config = void 0;
    this.config = config;
  }

  async run() {
    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    let resourceArray = JSON.parse(_fs.default.readFileSync(source, "utf8"));
    let library = {};

    for (let resourceInfo of resourceArray) {
      let resourcePath = resourceInfo[0]; // TODO: print error if file does not exist
      //let resourceReferences = resourceInfo[1]

      let absolutePath = _path.default.join(this.scheme.beelder.getAbsolutePath(resourcePath));

      library[resourcePath] = _fs.default.readFileSync(absolutePath, "utf8");
    }

    let code = JSON.stringify(library);

    if ((0, _utils.prepareFileLocation)(destination)) {
      _fs.default.writeFileSync(destination, code, "utf8");
    } else {
      console.error("Could not create target directory. Please, check permissions");
    }
  }

}

exports.default = CreateShaderLibraryAction;
CreateShaderLibraryAction.actionName = "create-shader-library";

},{"../base-scheme":26,"../utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs","path":"path"}],49:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _timings = _interopRequireDefault(require("../timings"));

var _reference = _interopRequireDefault(require("../reference"));

var _action = _interopRequireDefault(require("../action"));

class DeleteAction extends _action.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.target = void 0;
    this.target = new _reference.default(config.target);
  }

  deleteFile(file) {
    try {
      let stat = _fs.default.statSync(file);

      if (stat.isDirectory()) {
        _fs.default.rmdirSync(file, {
          recursive: true
        });
      } else {
        _fs.default.rmSync(file);
      }
    } catch (ignored) {}
  }

  async run() {
    _timings.default.begin("Deleting " + this.target.getConsoleName());

    let target = this.scheme.beelder.resolveReference(this.target);
    this.deleteFile(target);

    _timings.default.end();
  }

}

exports.default = DeleteAction;
DeleteAction.actionName = "delete";

},{"../action":24,"../reference":43,"../timings":52,"@babel/runtime/helpers/interopRequireDefault":1,"fs":"fs"}],50:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _action = _interopRequireDefault(require("../action"));

var _reference = _interopRequireDefault(require("../reference"));

class RequireTargetAction extends _action.default {
  constructor(config, scheme) {
    super(config, scheme);
    this.target = void 0;
    this.target = new _reference.default(config.target);

    if (this.target.definesTarget) {
      throw new Error("run-command target field must specify existing target");
    }

    if (!this.target.isDependency) {
      throw new Error("run-command target field must specify dependency target");
    }
  }

  getDependencies() {
    return [this.target.getDependency()];
  }

}

exports.default = RequireTargetAction;
RequireTargetAction.actionName = "require-target";

},{"../action":24,"../reference":43,"@babel/runtime/helpers/interopRequireDefault":1}],51:[function(require,module,exports){
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
    this.pathSepReplaceRegex = void 0;
    this.texturesRoot = texturesRoot;
    this.atlasSize = atlasSize;

    if (_path.default.sep !== '/') {
      this.pathSepReplaceRegex = new RegExp((0, _utils.escapeRegExp)(_path.default.sep), "g");
    }
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
        let texturePath = image.name;
        if (this.pathSepReplaceRegex) texturePath = texturePath.replace(this.pathSepReplaceRegex, '/');
        this.atlasDescriptors[j][texturePath] = AtlasCreationSession.webglRect(rect, this.canvases[j]);
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
      }; // node-canvas sometimes throws ENOENT without
      // any reason on Windows, so we help him by
      // reading the file for him.


      const texturePath = _path.default.resolve(this.texturesRoot, file);

      const buffer = _fs.default.readFileSync(texturePath);

      image.onerror = reject;
      image.src = buffer;
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
    var _this$config$atlasSiz;

    let source = this.scheme.beelder.resolveReference(this.source);
    let destination = this.scheme.beelder.resolveReference(this.target);
    if (!(0, _utils.prepareDirectory)(destination)) throw new Error("Unable to create destination folder");

    _timings.default.begin("Creating texture atlases of " + this.source.getConsoleName());

    let cacheJSON = await this.cache.getJSON();
    let context = new AtlasCreationSession(source, (_this$config$atlasSiz = this.config.atlasSize) !== null && _this$config$atlasSiz !== void 0 ? _this$config$atlasSiz : 1024);

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

},{"../base-scheme":26,"../build-cache":28,"../timings":52,"../utils":53,"@babel/runtime/helpers/interopRequireDefault":1,"atlaspack":"atlaspack","canvas":"canvas","fs":"fs","path":"path"}],52:[function(require,module,exports){
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

},{"@babel/runtime/helpers/interopRequireDefault":1,"chalk":"chalk","util":"util"}],53:[function(require,module,exports){
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
exports.copyDirectoryContents = copyDirectoryContents;
exports.copyDirectory = copyDirectory;
exports.murmurhash3_32_gc = murmurhash3_32_gc;
exports.hashToUUIDString32 = hashToUUIDString32;
exports.mapToObject = mapToObject;
exports.concatOptionalArrays = concatOptionalArrays;
exports.escapeRegExp = escapeRegExp;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function readdirDeep(directory, array = [], base = "") {
  if (!array) array = [];
  if (!base) base = "";

  if (_fs.default.statSync(directory).isDirectory()) {
    _fs.default.readdirSync(directory).map(async file => {
      let item = _path.default.join(directory, file);

      let subbase = _path.default.join(base, file);

      array.push(subbase);
      readdirDeep(item, array, subbase);
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

function copyDirectoryContents(from, to) {
  try {
    _fs.default.mkdirSync(to);
  } catch (e) {}

  for (let element of _fs.default.readdirSync(from)) {
    const stat = _fs.default.lstatSync(_path.default.join(from, element));

    if (stat.isFile()) {
      _fs.default.copyFileSync(_path.default.join(from, element), _path.default.join(to, element));
    } else if (stat.isSymbolicLink()) {
      _fs.default.symlinkSync(_fs.default.readlinkSync(_path.default.join(from, element)), _path.default.join(to, element));
    } else if (stat.isDirectory()) {
      copyDirectoryContents(_path.default.join(from, element), _path.default.join(to, element));
    }
  }
}

function copyDirectory(from, to) {
  if (to.endsWith(_path.default.sep)) {
    to = _path.default.join(to, _path.default.basename(from));
  }

  copyDirectoryContents(from, to);
}
/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */


function murmurhash3_32_gc(key, seed) {
  let remainder, bytes, h1, h1b, c1, c2, k1, i;
  remainder = key.length & 3; // key.length % 4

  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
    ++i;
    k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
    k1 = k1 << 15 | k1 >>> 17;
    k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
    h1 ^= k1;
    h1 = h1 << 13 | h1 >>> 19;
    h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
    h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
  }

  k1 = 0; // noinspection FallThroughInSwitchStatementJS

  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

function hashToUUIDString32(hash) {
  let result = "";

  for (let i = 7; i >= 0; i--) {
    result += Math.abs(hash % 16).toString(16);
    hash >>= 4;
    if (i % 4 == 0 && i > 0) result += '-';
  }

  return result;
}

function mapToObject(map) {
  const obj = {};

  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }

  return obj;
}

function concatOptionalArrays(arrayA, arrayB) {
  if (arrayB && arrayB.length) {
    if (!arrayA) arrayA = [];

    for (let target of arrayB) {
      arrayA.push(target);
    }
  }

  return arrayA;
}

function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
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

},{"./beelder":27,"./timings":52,"@babel/runtime/helpers/interopRequireDefault":1}]},{},[])("index.ts")
});
//# sourceMappingURL=index.js.map
