"use strict";
/**
 * Transformation functions compatible with class-transformer
 * Using TC39 Stage 3 decorators for metadata storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceToInstance = exports.instanceToPlain = exports.plainToInstance = void 0;
exports.plainToClass = plainToClass;
exports.plainToClassFromExist = plainToClassFromExist;
exports.classToPlain = classToPlain;
exports.classToClass = classToClass;
exports.serialize = serialize;
exports.deserialize = deserialize;
exports.deserializeArray = deserializeArray;
const metadata_1 = require("./metadata");
function plainToClass(cls, plain, options = {}) {
    if (Array.isArray(plain)) {
        return plain.map((item) => transformPlainToClass(cls, item, 'plainToClass', options));
    }
    return transformPlainToClass(cls, plain, 'plainToClass', options);
}
/**
 * Alias for plainToClass
 */
exports.plainToInstance = plainToClass;
/**
 * Converts a plain object to an existing class instance.
 * Compatible with class-transformer plainToClassFromExist function.
 *
 * @param clsObject - Existing class instance
 * @param plain - Plain object
 * @param options - Transformation options
 * @returns Updated class instance
 */
function plainToClassFromExist(clsObject, plain, options = {}) {
    const cls = clsObject.constructor;
    const metadata = (0, metadata_1.getCompatMetadata)(cls);
    // Build source-to-target property map
    const sourceToTargetMap = new Map();
    for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
        const sourceName = (0, metadata_1.getSourcePropertyName)(propertyMeta, propertyKey);
        sourceToTargetMap.set(sourceName, propertyKey);
    }
    // Transform properties
    for (const [sourceKey, value] of Object.entries(plain)) {
        const targetKey = sourceToTargetMap.get(sourceKey) || sourceKey;
        const propertyMeta = metadata.properties.get(targetKey);
        if (!(0, metadata_1.shouldExposeProperty)(propertyMeta, targetKey, 'plainToClass', options)) {
            continue;
        }
        const transformedValue = transformValue(value, propertyMeta, sourceKey, plain, 'plainToClass', options);
        clsObject[targetKey] = transformedValue;
    }
    return clsObject;
}
function classToPlain(object, options = {}) {
    if (Array.isArray(object)) {
        return object.map((item) => transformClassToPlain(item, 'classToPlain', options));
    }
    return transformClassToPlain(object, 'classToPlain', options);
}
/**
 * Alias for classToPlain
 */
exports.instanceToPlain = classToPlain;
function classToClass(object, options = {}) {
    if (Array.isArray(object)) {
        return object.map((item) => {
            const plain = transformClassToPlain(item, 'classToClass', options);
            return transformPlainToClass(item.constructor, plain, 'classToClass', options);
        });
    }
    const plain = transformClassToPlain(object, 'classToClass', options);
    return transformPlainToClass(object.constructor, plain, 'classToClass', options);
}
/**
 * Alias for classToClass
 */
exports.instanceToInstance = classToClass;
/**
 * Serializes a class instance to a JSON string.
 * Compatible with class-transformer serialize function.
 *
 * @param object - Class instance or array of class instances
 * @param options - Transformation options
 * @returns JSON string
 */
function serialize(object, options = {}) {
    const plain = classToPlain(object, options);
    return JSON.stringify(plain);
}
/**
 * Deserializes a JSON string to a class instance.
 * Compatible with class-transformer deserialize function.
 *
 * @param cls - Class constructor
 * @param json - JSON string
 * @param options - Transformation options
 * @returns Class instance
 */
function deserialize(cls, json, options = {}) {
    const plain = JSON.parse(json);
    return transformPlainToClass(cls, plain, 'plainToClass', options);
}
/**
 * Deserializes a JSON array to class instances.
 * Compatible with class-transformer deserializeArray function.
 *
 * @param cls - Class constructor
 * @param json - JSON string
 * @param options - Transformation options
 * @returns Array of class instances
 */
function deserializeArray(cls, json, options = {}) {
    const plain = JSON.parse(json);
    if (!Array.isArray(plain)) {
        throw new Error('JSON does not represent an array');
    }
    return plainToClass(cls, plain, options);
}
// ============================================================================
// Internal transformation helpers
// ============================================================================
/**
 * Transform a plain object to a class instance
 */
function transformPlainToClass(cls, plain, transformationType, options) {
    const instance = new cls();
    const metadata = (0, metadata_1.getCompatMetadata)(cls);
    // Build source-to-target property map
    const sourceToTargetMap = new Map();
    for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
        const sourceName = (0, metadata_1.getSourcePropertyName)(propertyMeta, propertyKey);
        sourceToTargetMap.set(sourceName, propertyKey);
    }
    // Transform properties from plain object
    for (const [sourceKey, value] of Object.entries(plain)) {
        const targetKey = sourceToTargetMap.get(sourceKey) || sourceKey;
        const propertyMeta = metadata.properties.get(targetKey);
        if (!(0, metadata_1.shouldExposeProperty)(propertyMeta, targetKey, transformationType, options)) {
            continue;
        }
        const transformedValue = transformValue(value, propertyMeta, sourceKey, plain, transformationType, options);
        instance[targetKey] = transformedValue;
    }
    return instance;
}
/**
 * Transform a class instance to a plain object
 */
function transformClassToPlain(object, transformationType, options) {
    const cls = object.constructor;
    const metadata = (0, metadata_1.getCompatMetadata)(cls);
    const result = {};
    // Get all property keys from the instance
    const allKeys = new Set([
        ...Object.keys(object),
        ...metadata.properties.keys(),
    ]);
    for (const propertyKey of allKeys) {
        const propertyMeta = metadata.properties.get(propertyKey);
        if (!(0, metadata_1.shouldExposeProperty)(propertyMeta, propertyKey, transformationType, options)) {
            continue;
        }
        const value = object[propertyKey];
        const outputKey = propertyMeta?.name || String(propertyKey);
        const transformedValue = transformValue(value, propertyMeta, String(propertyKey), object, transformationType, options);
        result[outputKey] = transformedValue;
    }
    return result;
}
/**
 * Transform a single value based on metadata
 */
function transformValue(value, propertyMeta, key, obj, transformationType, options) {
    // Apply custom transform function if exists
    if (propertyMeta?.transformFn) {
        const transformOpts = propertyMeta.transformOptions || {};
        // Check if transform should be applied for this transformation type
        if (transformationType === 'plainToClass' && transformOpts.toPlainOnly) {
            // Skip transform
        }
        else if (transformationType === 'classToPlain' && transformOpts.toClassOnly) {
            // Skip transform
        }
        else {
            value = propertyMeta.transformFn({
                value,
                key,
                obj,
                type: transformationType,
                options,
            });
        }
    }
    // Apply type transformation if exists
    if (propertyMeta?.typeFunction && transformationType === 'plainToClass') {
        const TypeClass = propertyMeta.typeFunction();
        if (Array.isArray(value)) {
            return value.map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return transformPlainToClass(TypeClass, item, transformationType, options);
                }
                return item;
            });
        }
        else if (typeof value === 'object' && value !== null) {
            return transformPlainToClass(TypeClass, value, transformationType, options);
        }
    }
    return value;
}
