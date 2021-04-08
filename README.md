# Beelder
TypeScript build system designed for browser games with a client-server architecture

#### Please, note that project is unfinished and is under heavy development now

## Why should I use Beelder?

What methods are available to assemble game sources (code, textures,
stylesheets, models, ...) into a game bundle?

- **Option 1: Build it manually.**
  This is certainly the way to go, but it does not apply to any large
  projects. It is very inconvenient.
  

- **Option 2: Use bash script.**
  This is not a bad approach. It can be used as long as the project 
  size does not become too big. Then the script starts to take a very 
  long time, which complicates the development process. Even a small 
  code change requires a complete rebuild of the project, which
  is inconvenient.


- **Option 3: Create a JS script for Babel.**
  Here is where things start to get specific to TypeScript and to
  browser games. This approach avoids the problem of long build times,
  as Babel can be configured to use the cache and rebuild only the
  files that have changed.
  
  With custom script it becomes possible to also automate other, not JS-related
  parts of the build. For example, it allows checking if textures folder 
  has been updated, and rebuild the texture atlas as required. 
  
  The bad side of such approach is that the build script eventually
  become large and unstructured. This is because new functionality
  is added to the build system when it is needed. In addition, the
  script has to be written in pure JavaScript to run on Node without
  being pre-built. Perhaps a better solution would be to make a script
  to build the build system written in TypeScript, which has become
  commonplace.

  It will also soon become obvious that file paths are awkward to write
  in code. The obvious solution is to put all the file paths in a
  separate file, where the build process could be visually divided into
  steps and each one may me commented on.

  Gradually, the build system becomes a whole separate project with
  thousands and thousands of lines of code. This is exactly how Beelder was
  created.
  

- **Option 4: Use Beelder.** Instead of writing your own copy of Beelder,
  Why not use a ready-made solution?
  
## Examples

First, install Beelder package from NPM.

```shell
npm install beelder -g
```

### Building single TypeScript file with Beelder

Project structure:
```
my_project
├┬src
│└──index.ts
└─build-schemes.json
```
`src/index.ts`:
```typescript
class Hello {
    static sayHello(who: string): void {
        console.log("Hello, " + who)
    }
}

Hello.sayHello("world")
```

So there should only be one build scheme which will bundle this code
into single JS file

In order to build a project, the Beelder must know its structure.
This is what `build-schemes.json` file is purposed for

`build-schemes.json`:
```json
{
  "schemes": {
    "build-project": {
      "steps": [{
        "action": "bundle-javascript",
        "source": "src/index.ts",
        "target": "dist/index.js"
      }]
    }
  }
}
```
  
The above code defines a project with a build scheme called
`"build-project"`. This scheme consists of single step - build
some TypeScript code to single JavaScript file, which could be
launched in browser later. 

### Running the build scheme

To build your project, do one of the following:

- Enter CLI command:
    ```shell
    beelder build-project
    ```
  
- Create `build.js` file with following content:
    ```js
    // Loading the Beelder module
    const Beelder = require("./Beelder/bin/beelder").Beelder
    
    // Loading the project descriptor
    const buildSchemes = require("./build-schemes.json")
    
    // JSON5 Module is used in order to allow
    // comments in your build-schemes.json file
    // JSON.parse may be used as well, but this
    // way you may not use comments in your
    // schemes file
    const json5 = require("json5") 
    
    // Beelder constructor parameters are:
    // 1) Project descriptor JSON
    // 2) Project root directory. May be omitted if it's specified in the JSON file.
   
    const beelder = new Beelder(buildSchemes, __dirname)
    beelder.runScheme("build-project")
    ```
  Then run it with `node build.js` command.

When it's done, the `dist` folder should appear. Check for `index.js`
file - it's your bundled script. Otherwise, check for errors in console.

### Building texture atlas out of textures with Beelder

Project structure:
```
my_project
├┬textures
│└┬─texture_a.png
│ └─texture_b.png
└─build-schemes.json
```

`build-schemes.json`:
```json5
{
  "schemes": {
    "build-project": {
      "steps": [{
        "action": "create-texture-atlas",
        "source": "textures",
        "target": "dist"
      }]
    }
  }
}
```

Beelder should create `dist` directory and put texture atlases (with
mipmap levels) inside.

**Note** Beelder will not recreate texture atlases if source directory
was not modified. So, it's necessary to write atlases in a cache directory
and then copy them to the `dist` so that the project will build
correctly if the `dist` folder was deleted.


(TODO: make this action more adjustable)

### Creating and building complex projects

Project structure:

```
my_project
├┬src
│└┬─index.ts
│ └─some_depencency.ts
├┬textures
│└┬─texture_a.png
│ └─texture_b.png
└─build-schemes.json
```

`src/index.ts`:
```ts
import {Dependency} from "./dependency";

new Dependency().yell()
```

`src/some_dependency.ts`:
```ts
export class Dependency {
    yell() {
        console.log("AAA")
    }
}
```

`textures/texture_a.png` and `textures/texture_b.png` are just usual
images. Take them from your downloads folder, or take some screenshots.

Also, in order to structure the assembly process, we divide the steps
into different assembly schemes. To find out how to automate the assembly
of several schemes that depend on each other, see "Using targets"

Create `build-schemes.json` file with following content:

```json5
{
  "schemes": {
    "build-typescript": {
      "steps": [{
        "action": "bundle-javascript",
        "source": "src/index.ts",
        "target": "cache/index.js"
      }]
    },
    "build-texture-atlas": {
      "steps": [{
        "action": "build-texture-atlas",
        "source": "textures",
        "target": "cache/textures"
      }]
    },
    "build-project": {
      "steps": [{
        "action": "copy",
        "source": "cache/textures",
        "target": "release/textures"
      }, {
        "action": "copy",
        "source": "cache/index.js",
        "target": "release/"
      }]
    }
  }
}
```

Although it may look scary, there is nothing complicated about this
file.

The above project configuration defines three build schemes:
1)  The `build-typescript` scheme builds TypeScript code into 
    `cache/index.js` file.

2)  The `build-texture-atlas` scheme creates texture atlases and
    put them in `cache/textures` directory
    
3)  The 'build-project' scheme copies compiled JavaScript and
    textures into `release` folder.
    
Now, you should run `build-typescript`, `build-texture-atlas` and `build-project`
to build your project.

**Please note:** This approach is inconvenient because one should
run three schemes manually to build the project. There are two possible
workarounds:

1) First way is to not separate the project assembly scheme. 
   This approach makes it hard to keep your project scheme structured,
   be as you will have to manually set the order of the assembly steps
2) Second way is to use Beelder targets. 

### Using targets

Note that the project from the example above can be represented as a
dependency graph. (as almost any project).

```
 ╭──────────────────╮   compiled javascript
 │ build-typescript │ ───────────────────────╮
 ╰──────────────────╯                       ╭───────────────╮
                                            │ build-project │ ─── game
 ╭─────────────────────╮   texture atlases  ╰───────────────╯
 │ build-texture-atlas │ ────────────────────╯
 ╰─────────────────────╯
```

Now there are labels for the results of each assembly scheme with names.
They are called **targets**. Each target is associated with one or more
file paths. From this diagram, it is clear in which order assembly
schemes should be evaluated.

**Note:** Target is linked to single build step, not to whole scheme, but
when it's required to build some target, Beelder will execute the whole
scheme.

Here is how to define target:

`context: build scheme "steps" array`
```json5
[{
  "action": "bundle-javascript",
  "source": "...",
  // The following line does not define target, only step destination path
  "target": "cache/index.js"
}, {
  "action": "bundle-javascript",
  "source": "...",
  // The following lines defines target "compiled javascript", linked to "cache/index.js"
  // You now will be able to refer to "targetName": "compiled javascript" in other build schemes 
  "target": {
    "path": "cache/index.js",
    "targetName": "compiled javascript"
  },
  // It can also be written down more simply
  "target": "#compiled-javascript = cache/index.js"
}]    
```

Here is how to 'consume' target:

`context: build scheme "steps" array`
```json5
[{
  "action": "copy",
  // Old variant: 
  // "source": "cache/index.js",
  // New variant:
  "source": {
    "targetName": "compiled-javascript"
  },
  // Or, equivalently:
  "source": "#compiled-javascript",
  "target": "..."
}]    
```

Now this step won't be executed before the one which defines this target.

The new `build-schemes.json` file for above example will now look like this:
```json5
{
  "schemes": {
    // A scheme for building typescript
    "build-typescript": {
      "steps": [{
        "action": "bundle-javascript",
        "source": "src/index.ts",
        "target": "#compiled-javascript = cache/index.js"
      }]
    },
    // A scheme for building the texture atlas
    "build-texture-atlas": {
      "steps": [{
        "action": "build-texture-atlas",
        "source": "textures",
        "target": "#texture-atlases = cache/textures"
      }]
    },
    // A scheme which copies all temporary files to the build folder
    "build-project": {
      "steps": [{
        // Copying texture atlases to build folder
        "action": "copy",
        "source": "#texture-atlases",
        "target": "release/"
      }, {
        // Copying compiled javascript to build folder
        "action": "copy",
        "source": "#compiled-javascript",
        "target": "release/"
      }]
    }
  }
}
```

#### Todo: complete readme