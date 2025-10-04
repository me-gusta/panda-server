function deepUpdateObject (obj, extension) {
    for (const key in extension) {
        if (Object.prototype.hasOwnProperty.call(extension, key)) {
            const extensionValue = extension[key]
            const originalValue = obj[key]

            // Check if extensionValue is a plain object and not an array or null
            if (typeof extensionValue === 'object' && extensionValue !== null && !Array.isArray(extensionValue)) {
                // Handle special commands: $push, $add, $sub
                if (Object.prototype.hasOwnProperty.call(extensionValue, '$push')) {
                    if (Array.isArray(originalValue)) {
                        originalValue.push(...extensionValue.$push)
                    }
                } else if (Object.prototype.hasOwnProperty.call(extensionValue, '$add')) {
                    if (typeof originalValue === 'number') {
                        obj[key] += extensionValue.$add
                    }
                } else if (Object.prototype.hasOwnProperty.call(extensionValue, '$sub')) {
                    if (typeof originalValue === 'number') {
                        obj[key] -= extensionValue.$sub
                    }
                    // If it's a regular object for deep merging
                } else if (typeof originalValue === 'object' && originalValue !== null && !Array.isArray(originalValue)) {
                    deepUpdateObject(originalValue, extensionValue)
                } else {
                    // If the key doesn't exist in obj or is not an object, assign it
                    obj[key] = extensionValue
                }
            } else {
                // For non-object values, just assign
                obj[key] = extensionValue
            }
        }
    }
}

export default deepUpdateObject
