"use strict";
/**
 * class-transformer compatibility layer for om-data-mapper
 * Using TC39 Stage 3 decorators
 *
 * This module provides a drop-in replacement for class-transformer with better performance.
 * Simply replace:
 *   import { plainToClass, Expose } from 'class-transformer';
 * with:
 *   import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourcePropertyName = exports.shouldExposeProperty = exports.updateCompatMetadata = exports.setCompatMetadata = exports.getCompatMetadata = exports.deserializeArray = exports.deserialize = exports.serialize = exports.instanceToInstance = exports.classToClass = exports.instanceToPlain = exports.classToPlain = exports.plainToClassFromExist = exports.plainToInstance = exports.plainToClass = exports.TransformPlainToClass = exports.TransformClassToClass = exports.TransformClassToPlain = exports.Transform = exports.Type = exports.Exclude = exports.Expose = void 0;
// Export decorators
var decorators_1 = require("./decorators");
Object.defineProperty(exports, "Expose", { enumerable: true, get: function () { return decorators_1.Expose; } });
Object.defineProperty(exports, "Exclude", { enumerable: true, get: function () { return decorators_1.Exclude; } });
Object.defineProperty(exports, "Type", { enumerable: true, get: function () { return decorators_1.Type; } });
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return decorators_1.Transform; } });
Object.defineProperty(exports, "TransformClassToPlain", { enumerable: true, get: function () { return decorators_1.TransformClassToPlain; } });
Object.defineProperty(exports, "TransformClassToClass", { enumerable: true, get: function () { return decorators_1.TransformClassToClass; } });
Object.defineProperty(exports, "TransformPlainToClass", { enumerable: true, get: function () { return decorators_1.TransformPlainToClass; } });
// Export transformation functions
var functions_1 = require("./functions");
Object.defineProperty(exports, "plainToClass", { enumerable: true, get: function () { return functions_1.plainToClass; } });
Object.defineProperty(exports, "plainToInstance", { enumerable: true, get: function () { return functions_1.plainToInstance; } });
Object.defineProperty(exports, "plainToClassFromExist", { enumerable: true, get: function () { return functions_1.plainToClassFromExist; } });
Object.defineProperty(exports, "classToPlain", { enumerable: true, get: function () { return functions_1.classToPlain; } });
Object.defineProperty(exports, "instanceToPlain", { enumerable: true, get: function () { return functions_1.instanceToPlain; } });
Object.defineProperty(exports, "classToClass", { enumerable: true, get: function () { return functions_1.classToClass; } });
Object.defineProperty(exports, "instanceToInstance", { enumerable: true, get: function () { return functions_1.instanceToInstance; } });
Object.defineProperty(exports, "serialize", { enumerable: true, get: function () { return functions_1.serialize; } });
Object.defineProperty(exports, "deserialize", { enumerable: true, get: function () { return functions_1.deserialize; } });
Object.defineProperty(exports, "deserializeArray", { enumerable: true, get: function () { return functions_1.deserializeArray; } });
// Export metadata utilities (for advanced use cases)
var metadata_1 = require("./metadata");
Object.defineProperty(exports, "getCompatMetadata", { enumerable: true, get: function () { return metadata_1.getCompatMetadata; } });
Object.defineProperty(exports, "setCompatMetadata", { enumerable: true, get: function () { return metadata_1.setCompatMetadata; } });
Object.defineProperty(exports, "updateCompatMetadata", { enumerable: true, get: function () { return metadata_1.updateCompatMetadata; } });
Object.defineProperty(exports, "shouldExposeProperty", { enumerable: true, get: function () { return metadata_1.shouldExposeProperty; } });
Object.defineProperty(exports, "getSourcePropertyName", { enumerable: true, get: function () { return metadata_1.getSourcePropertyName; } });
