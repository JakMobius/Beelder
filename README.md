# Beelder
TypeScript build system designed for browser games with a client-server architecture

#### Please, note that project is unfinished and is under heavy development now

## Why should I use Beelder?
Let us imagine a game with lots and lots of resources: textures, sounds, UI stylesheets, models and so on.
How'd you make a game bundle out of sources?

- **Option 1: Build it manually.**
  This is certainly the way to go, but no one does it.
  

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
  
  With custom script you can also automate other, not JS-related
  parts of the build. For example, you can check if textures folder 
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
  separate file, where you can visually divide the build process into
  steps and comment on each one.

  Gradually, the build system becomes a whole separate project with
  thousands and thousands of lines of code. This is how Beelder was
  created.
  

- **Option 4: Use Beelder.** Instead of writing your own copy of Beelder,
  Why not use a ready-made solution?
  
## Creating example project

First, install Beelder package from NPM.

```shell
npm install beelder -g
```

Create `src/index.ts` file with following content:
    
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
Create `build-schemes.json` file with following content:
   
```json
{
    "schemes": {
        "build-project": {
            "steps": [
                {
                    "action": "bundle-javascript",
                    "source": "src/index.ts",
                    "target": "dist/index.js"
                }
            ]
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
    const Beelder = require("./Beelder/bin/beelder").Beelder // Loading the Beelder module
    const buildSchemes = require("./build-schemes.json")     // Loading the project descriptor 
    
    // Beelder constructor parameters are:
    // 1) Project descriptor JSON
    // 2) Project root directory. May be omitted if it's specified in the JSON file.
   
    const beelder = new Beelder(buildSchemes, __dirname)
    beelder.runScheme("build-project")
    ```
  Then run it with `node build.js` command.

When it's done, the `dist` folder should appear. Check for `index.js`
file - it's your bundled script. Otherwise, check for errors in console.

#### Todo: complete readme