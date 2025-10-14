"use strict";
/**
 * class-transformer compatible decorators using TC39 Stage 3 decorator syntax
 * These decorators provide API compatibility with class-transformer library
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expose = Expose;
exports.Exclude = Exclude;
exports.Type = Type;
exports.Transform = Transform;
exports.TransformClassToPlain = TransformClassToPlain;
exports.TransformClassToClass = TransformClassToClass;
exports.TransformPlainToClass = TransformPlainToClass;
const metadata_1 = require("./metadata");
// Symbol for tracking initialized properties
const METADATA_INITIALIZED = Symbol('class-transformer-compat:initialized');
/**
 * Marks property to be exposed during transformation.
 * Compatible with class-transformer @Expose decorator.
 *
 * @param options - Expose options
 *
 * @example
 * ```typescript
 * class User {
 *   @Expose()
 *   id: number;
 *
 *   @Expose({ name: 'userName' })
 *   name: string;
 *
 *   @Expose({ groups: ['admin'] })
 *   email: string;
 * }
 * ```
 */
function Expose(options = {}) {
    return function (target, context) {
        // Handle class decorator
        if (context.kind === 'class') {
            // Class-level @Expose() - not commonly used in class-transformer but supported
            return;
        }
        // Handle field decorator
        if (context.kind === 'field') {
            const propertyKey = context.name;
            context.addInitializer(function () {
                const ctor = this.constructor;
                // Initialize tracking set if needed
                if (!ctor[METADATA_INITIALIZED]) {
                    ctor[METADATA_INITIALIZED] = new Set();
                }
                const initSet = ctor[METADATA_INITIALIZED];
                if (!initSet.has(propertyKey)) {
                    initSet.add(propertyKey);
                    (0, metadata_1.updateCompatMetadata)(ctor, propertyKey, {
                        expose: true,
                        exposeOptions: options,
                        name: options.name,
                    });
                }
            });
        }
    };
}
/**
 * Marks property to be excluded during transformation.
 * Compatible with class-transformer @Exclude decorator.
 *
 * @param options - Exclude options
 *
 * @example
 * ```typescript
 * class User {
 *   id: number;
 *
 *   @Exclude()
 *   password: string;
 *
 *   @Exclude({ toPlainOnly: true })
 *   internalId: string;
 * }
 * ```
 */
function Exclude(options = {}) {
    return function (target, context) {
        // Handle class decorator
        if (context.kind === 'class') {
            // Class-level @Exclude() - marks all properties as excluded by default
            return;
        }
        // Handle field decorator
        if (context.kind === 'field') {
            const propertyKey = context.name;
            context.addInitializer(function () {
                const ctor = this.constructor;
                if (!ctor[METADATA_INITIALIZED]) {
                    ctor[METADATA_INITIALIZED] = new Set();
                }
                const initSet = ctor[METADATA_INITIALIZED];
                if (!initSet.has(propertyKey)) {
                    initSet.add(propertyKey);
                    (0, metadata_1.updateCompatMetadata)(ctor, propertyKey, {
                        exclude: true,
                        excludeOptions: options,
                    });
                }
            });
        }
    };
}
/**
 * Specifies a type of the property for proper transformation.
 * Compatible with class-transformer @Type decorator.
 *
 * @param typeFunction - Function that returns the type
 * @param options - Type options
 *
 * @example
 * ```typescript
 * class User {
 *   @Type(() => Date)
 *   createdAt: Date;
 *
 *   @Type(() => Photo)
 *   photos: Photo[];
 * }
 * ```
 */
function Type(typeFunction, options = {}) {
    return function (target, context) {
        if (context.kind !== 'field') {
            throw new Error('@Type can only be applied to class fields');
        }
        const propertyKey = context.name;
        context.addInitializer(function () {
            const ctor = this.constructor;
            // Type decorator updates existing metadata
            (0, metadata_1.updateCompatMetadata)(ctor, propertyKey, {
                typeFunction,
                typeOptions: options,
            });
        });
    };
}
/**
 * Transforms the value of the property using a custom function.
 * Compatible with class-transformer @Transform decorator.
 *
 * @param transformFn - Transform function
 * @param options - Transform options
 *
 * @example
 * ```typescript
 * class User {
 *   @Transform(({ value }) => value.toUpperCase())
 *   name: string;
 * }
 * ```
 */
function Transform(transformFn, options = {}) {
    return function (target, context) {
        if (context.kind !== 'field') {
            throw new Error('@Transform can only be applied to class fields');
        }
        const propertyKey = context.name;
        context.addInitializer(function () {
            const ctor = this.constructor;
            // Transform decorator updates existing metadata
            (0, metadata_1.updateCompatMetadata)(ctor, propertyKey, {
                transformFn,
                transformOptions: options,
            });
        });
    };
}
/**
 * Transforms method return value from class to plain object.
 * Compatible with class-transformer @TransformClassToPlain decorator.
 */
function TransformClassToPlain(options = {}) {
    return function (target, context) {
        if (context.kind !== 'method') {
            throw new Error('@TransformClassToPlain can only be applied to methods');
        }
        return function (...args) {
            const result = target.call(this, ...args);
            // Import classToPlain dynamically to avoid circular dependency
            const { classToPlain } = require('./functions');
            return classToPlain(result, options);
        };
    };
}
/**
 * Transforms method return value from class to class (deep clone).
 * Compatible with class-transformer @TransformClassToClass decorator.
 */
function TransformClassToClass(options = {}) {
    return function (target, context) {
        if (context.kind !== 'method') {
            throw new Error('@TransformClassToClass can only be applied to methods');
        }
        return function (...args) {
            const result = target.call(this, ...args);
            // Import classToClass dynamically to avoid circular dependency
            const { classToClass } = require('./functions');
            return classToClass(result, options);
        };
    };
}
/**
 * Transforms method return value from plain to class.
 * Compatible with class-transformer @TransformPlainToClass decorator.
 */
function TransformPlainToClass(classType, options = {}) {
    return function (target, context) {
        if (context.kind !== 'method') {
            throw new Error('@TransformPlainToClass can only be applied to methods');
        }
        return function (...args) {
            const result = target.call(this, ...args);
            // Import plainToClass dynamically to avoid circular dependency
            const { plainToClass } = require('./functions');
            return plainToClass(classType, result, options);
        };
    };
}
