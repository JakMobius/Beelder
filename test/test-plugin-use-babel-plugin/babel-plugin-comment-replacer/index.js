
function getReplacement(api, options) {

    let objectProperties = []

    for(let [key, value] of Object.entries(options.object)) {
        objectProperties.push(api.types.objectProperty(
            api.types.stringLiteral(key),
            api.types.stringLiteral(value)
        ))
    }

    return api.types.objectExpression(objectProperties)
}

function handleProgram(api, options, path) {
    try {
        path.traverse({
            enter(path) {
                if(path.type === "ObjectExpression") {
                    if(path.node.properties.length === 0 && path.node.innerComments.length === 1) {
                        if(path.node.innerComments[0].value.trim() === options.replace) {
                            path.replaceWith(getReplacement(api, options))
                            path.node.innerComments = []
                        }
                    }
                }
            }
        })
    } catch(error) {
        console.error(error)
    }
}

module.exports = function commentReplacer(api, options) {
    return {
        visitor: {
            Program(path) {
                handleProgram(api, options, path)
            }
        },
    };
}