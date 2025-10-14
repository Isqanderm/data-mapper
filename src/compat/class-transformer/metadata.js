"use strict";
/**
 * Metadata storage for class-transformer compatibility layer
 * Using WeakMap to avoid memory leaks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompatMetadata = getCompatMetadata;
exports.setCompatMetadata = setCompatMetadata;
exports.updateCompatMetadata = updateCompatMetadata;
exports.shouldExposeProperty = shouldExposeProperty;
exports.getSourcePropertyName = getSourcePropertyName;
/**
 * WeakMap to store metadata for each class
 */
const metadataStorage = new WeakMap();
/**
 * Get metadata for a class constructor
 */
function getCompatMetadata(target) {
    let metadata = metadataStorage.get(target);
    if (!metadata) {
        metadata = {
            properties: new Map(),
            classOptions: {},
        };
        metadataStorage.set(target, metadata);
    }
    return metadata;
}
/**
 * Set metadata for a class constructor
 */
function setCompatMetadata(target, metadata) {
    metadataStorage.set(target, metadata);
}
/**
 * Update property metadata
 */
function updateCompatMetadata(target, propertyKey, updates) {
    const metadata = getCompatMetadata(target);
    const existing = metadata.properties.get(propertyKey) || {};
    metadata.properties.set(propertyKey, { ...existing, ...updates });
}
/**
 * Check if a property should be exposed based on metadata and options
 */
function shouldExposeProperty(propertyMeta, propertyKey, transformationType, options = {}) {
    // If ignoring decorators, expose all properties
    if (options.ignoreDecorators) {
        return true;
    }
    // Check exclude prefixes
    if (options.excludePrefixes && typeof propertyKey === 'string') {
        for (const prefix of options.excludePrefixes) {
            if (propertyKey.startsWith(prefix)) {
                return false;
            }
        }
    }
    // If no metadata, use strategy
    if (!propertyMeta) {
        const strategy = options.excludeExtraneousValues ? 'excludeAll' : options.strategy || 'exposeAll';
        return strategy === 'exposeAll';
    }
    // Check if explicitly excluded
    if (propertyMeta.exclude) {
        const excludeOpts = propertyMeta.excludeOptions || {};
        if (transformationType === 'plainToClass' && excludeOpts.toClassOnly) {
            return false;
        }
        if (transformationType === 'classToPlain' && excludeOpts.toPlainOnly) {
            return false;
        }
        if (!excludeOpts.toClassOnly && !excludeOpts.toPlainOnly) {
            return false;
        }
    }
    // Check if explicitly exposed
    if (propertyMeta.expose) {
        const exposeOpts = propertyMeta.exposeOptions || {};
        // Check transformation type restrictions
        if (transformationType === 'plainToClass' && exposeOpts.toPlainOnly) {
            return false;
        }
        if (transformationType === 'classToPlain' && exposeOpts.toClassOnly) {
            return false;
        }
        // Check groups
        if (options.groups && exposeOpts.groups) {
            const hasMatchingGroup = exposeOpts.groups.some((g) => options.groups.includes(g));
            if (!hasMatchingGroup) {
                return false;
            }
        }
        // Check version
        if (options.version !== undefined) {
            if (exposeOpts.since !== undefined && options.version < exposeOpts.since) {
                return false;
            }
            if (exposeOpts.until !== undefined && options.version >= exposeOpts.until) {
                return false;
            }
        }
        return true;
    }
    // Use strategy
    const strategy = options.excludeExtraneousValues ? 'excludeAll' : options.strategy || 'exposeAll';
    return strategy === 'exposeAll';
}
/**
 * Get the source property name for a target property
 * Handles @Expose({ name: 'sourceName' })
 */
function getSourcePropertyName(propertyMeta, propertyKey) {
    if (propertyMeta?.name) {
        return propertyMeta.name;
    }
    return String(propertyKey);
}
