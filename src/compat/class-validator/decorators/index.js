"use strict";
/**
 * Export all validation decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsNegative = exports.IsPositive = exports.Max = exports.Min = exports.IsInt = exports.IsNumber = exports.Length = exports.MaxLength = exports.MinLength = exports.IsString = exports.IsNotEmpty = exports.IsDefined = exports.IsOptional = void 0;
// Common decorators
var common_1 = require("./common");
Object.defineProperty(exports, "IsOptional", { enumerable: true, get: function () { return common_1.IsOptional; } });
Object.defineProperty(exports, "IsDefined", { enumerable: true, get: function () { return common_1.IsDefined; } });
Object.defineProperty(exports, "IsNotEmpty", { enumerable: true, get: function () { return common_1.IsNotEmpty; } });
// String decorators
var string_1 = require("./string");
Object.defineProperty(exports, "IsString", { enumerable: true, get: function () { return string_1.IsString; } });
Object.defineProperty(exports, "MinLength", { enumerable: true, get: function () { return string_1.MinLength; } });
Object.defineProperty(exports, "MaxLength", { enumerable: true, get: function () { return string_1.MaxLength; } });
Object.defineProperty(exports, "Length", { enumerable: true, get: function () { return string_1.Length; } });
// Number decorators
var number_1 = require("./number");
Object.defineProperty(exports, "IsNumber", { enumerable: true, get: function () { return number_1.IsNumber; } });
Object.defineProperty(exports, "IsInt", { enumerable: true, get: function () { return number_1.IsInt; } });
Object.defineProperty(exports, "Min", { enumerable: true, get: function () { return number_1.Min; } });
Object.defineProperty(exports, "Max", { enumerable: true, get: function () { return number_1.Max; } });
Object.defineProperty(exports, "IsPositive", { enumerable: true, get: function () { return number_1.IsPositive; } });
Object.defineProperty(exports, "IsNegative", { enumerable: true, get: function () { return number_1.IsNegative; } });
