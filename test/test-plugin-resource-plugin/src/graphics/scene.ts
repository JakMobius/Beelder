
// Let's pretend that there is a Scene class
// that requires some shaders to be included
// in the build

/* @load-resource: ./shader.glsl */

import {Shaders} from "../shaders";

export default class Scene {
    doStuff() {
        if(!Shaders["src/graphics/shader.glsl"]) {
            throw new Error("Shader has not been loaded!")
        }
    }
}