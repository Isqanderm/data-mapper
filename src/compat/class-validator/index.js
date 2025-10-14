"use strict";
/**
 * class-validator compatibility layer for om-data-mapper
 * High-performance validation with JIT compilation
 *
 * @example
 * ```typescript
 * import { IsString, MinLength, validate } from 'om-data-mapper/class-validator-compat';
 *
 * class UserDto {
 *   @IsString()
 *   @MinLength(3)
 *   name: string;
 * }
 *
 * const user = new UserDto();
 * user.name = 'Jo'; // Too short
 *
 * const errors = await validate(user);
 * // [{ property: 'name', constraints: { minLength: 'must be at least 3 characters' } }]
 * ```
 *
 * @packageDocumentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidatorCacheSize = exports.clearValidatorCache = exports.ValidationFailedError = exports.validateOrRejectSync = exports.validateOrReject = exports.validateManySync = exports.validateMany = exports.validateSync = exports.validate = void 0;
// Export validation functions
var validator_1 = require("./engine/validator");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validator_1.validate; } });
Object.defineProperty(exports, "validateSync", { enumerable: true, get: function () { return validator_1.validateSync; } });
Object.defineProperty(exports, "validateMany", { enumerable: true, get: function () { return validator_1.validateMany; } });
Object.defineProperty(exports, "validateManySync", { enumerable: true, get: function () { return validator_1.validateManySync; } });
Object.defineProperty(exports, "validateOrReject", { enumerable: true, get: function () { return validator_1.validateOrReject; } });
Object.defineProperty(exports, "validateOrRejectSync", { enumerable: true, get: function () { return validator_1.validateOrRejectSync; } });
Object.defineProperty(exports, "ValidationFailedError", { enumerable: true, get: function () { return validator_1.ValidationFailedError; } });
// Export decorators
__exportStar(require("./decorators"), exports);
// Export utility functions
var compiler_1 = require("./engine/compiler");
Object.defineProperty(exports, "clearValidatorCache", { enumerable: true, get: function () { return compiler_1.clearValidatorCache; } });
Object.defineProperty(exports, "getValidatorCacheSize", { enumerable: true, get: function () { return compiler_1.getValidatorCacheSize; } });
