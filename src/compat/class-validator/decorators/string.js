"use strict";
/**
 * String validation decorators
 * Using TC39 Stage 3 decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsString = IsString;
exports.MinLength = MinLength;
exports.MaxLength = MaxLength;
exports.Length = Length;
const metadata_1 = require("../engine/metadata");
/**
 * Checks if value is a string
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsString()
 *   name: string;
 * }
 * ```
 */
function IsString(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'isString',
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if string's length is not less than given number
 *
 * @param min - Minimum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MinLength(3)
 *   name: string;
 * }
 * ```
 */
function MinLength(min, options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'minLength',
                value: min,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if string's length is not more than given number
 *
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @MaxLength(50)
 *   name: string;
 * }
 * ```
 */
function MaxLength(max, options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'maxLength',
                value: max,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if string's length falls in a range
 *
 * @param min - Minimum length
 * @param max - Maximum length
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @Length(3, 50)
 *   name: string;
 * }
 * ```
 */
function Length(min, max, options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            // Add both min and max constraints
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'minLength',
                value: min,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'maxLength',
                value: max,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
