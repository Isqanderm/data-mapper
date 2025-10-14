"use strict";
/**
 * Common validation decorators
 * Using TC39 Stage 3 decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsOptional = IsOptional;
exports.IsDefined = IsDefined;
exports.IsNotEmpty = IsNotEmpty;
const metadata_1 = require("../engine/metadata");
/**
 * Marks property as optional - validation will be skipped if value is undefined or null
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsOptional()
 *   @IsString()
 *   middleName?: string;
 * }
 * ```
 */
function IsOptional() {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.markPropertyAsOptional)(this.constructor, propertyKey);
        });
    };
}
/**
 * Checks if value is defined (!== undefined, !== null)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsDefined()
 *   name: string;
 * }
 * ```
 */
function IsDefined(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'isDefined',
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is not empty (not null, not undefined, not empty string, not empty array)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class UserDto {
 *   @IsNotEmpty()
 *   name: string;
 * }
 * ```
 */
function IsNotEmpty(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'isNotEmpty',
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
