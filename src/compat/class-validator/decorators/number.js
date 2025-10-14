"use strict";
/**
 * Number validation decorators
 * Using TC39 Stage 3 decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsNumber = IsNumber;
exports.IsInt = IsInt;
exports.Min = Min;
exports.Max = Max;
exports.IsPositive = IsPositive;
exports.IsNegative = IsNegative;
const metadata_1 = require("../engine/metadata");
/**
 * Checks if value is a number
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsNumber()
 *   price: number;
 * }
 * ```
 */
function IsNumber(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'isNumber',
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is an integer
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsInt()
 *   quantity: number;
 * }
 * ```
 */
function IsInt(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'isInt',
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is not less than given number
 *
 * @param min - Minimum value
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @Min(0)
 *   price: number;
 * }
 * ```
 */
function Min(min, options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'min',
                value: min,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is not greater than given number
 *
 * @param max - Maximum value
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @Max(1000)
 *   price: number;
 * }
 * ```
 */
function Max(max, options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'max',
                value: max,
                message: options?.message,
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is a positive number (> 0)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class ProductDto {
 *   @IsPositive()
 *   price: number;
 * }
 * ```
 */
function IsPositive(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'min',
                value: 0.000001, // Slightly above 0
                message: options?.message || 'must be a positive number',
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
/**
 * Checks if value is a negative number (< 0)
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * class TransactionDto {
 *   @IsNegative()
 *   debit: number;
 * }
 * ```
 */
function IsNegative(options) {
    return function (target, context) {
        const propertyKey = context.name;
        context.addInitializer(function () {
            (0, metadata_1.addValidationConstraint)(this.constructor, propertyKey, {
                type: 'max',
                value: -0.000001, // Slightly below 0
                message: options?.message || 'must be a negative number',
                groups: options?.groups,
                always: options?.always,
            });
        });
    };
}
