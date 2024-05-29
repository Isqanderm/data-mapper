"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapper = void 0;
var Mapper = /** @class */ (function () {
    function Mapper(mappingConfig, defaultValues) {
        this.mappingConfig = mappingConfig;
        this.defaultValues = defaultValues;
        this.cache = {};
        this.execute = this.execute.bind(this);
        this.createCompiler = this.createCompiler.bind(this);
    }
    Mapper.prototype.getValueByPath = function (configValue) {
        return configValue
            .split(".")
            .map(function (part) { return "".concat(part); })
            .join("?.");
    };
    Mapper.prototype.createCompiler = function (_a, cache, parentTarget, // "foo.bar"
    relativeToMapper) {
        var _b = __read(_a, 2), targetKey = _b[0], configValue = _b[1];
        if (parentTarget === void 0) { parentTarget = ""; }
        if (relativeToMapper === void 0) { relativeToMapper = false; }
        var targetPath = [parentTarget, targetKey].filter(Boolean).join(".");
        if (typeof configValue === "function") {
            cache["".concat(targetPath, "__handler")] = configValue;
            return "try {\n            target.".concat(targetPath, " = (cache['").concat(targetPath, "__handler'])(source").concat(parentTarget ? ".".concat(parentTarget) : "", ");\n          } catch(error) {\n            __errors.push(\"Mapping error at field by function '").concat(targetPath, "': \" + error.message);\n          }");
        }
        else if (configValue instanceof Mapper) {
            var transformFunc = configValue.getCompiledFnBody(configValue.mappingConfig, targetPath, true);
            cache["".concat(targetPath, "__defValues")] = configValue.defaultValues;
            Object.assign(cache, configValue.cache);
            return "try {\n            target.".concat(targetPath, " = {};\n            ").concat(transformFunc, "\n          } catch(error) {\n            __errors.push(\"Mapping error at Mapper '").concat(targetPath, "': \" + error.message);\n          }");
        }
        else if (typeof configValue === "string") {
            var configPath = this.getValueByPath(configValue);
            var path = [parentTarget, configPath].filter(Boolean).join("?.");
            return "try {\n            target.".concat(targetPath, " = source.").concat(relativeToMapper ? path : configPath, " || cache['").concat(parentTarget, "__defValues']?.").concat(targetKey, ";\n          } catch(error) {\n            __errors.push(\"Mapping error at field '").concat(targetPath, "' from source field '").concat(configValue, "': \" + error.message);\n          }");
        }
        else if (typeof configValue === "object" && configValue !== null) {
            var nestedMapping = this.getCompiledFnBody(configValue, targetPath);
            cache["".concat(targetPath, "__defValues")] = this.defaultValues
                ? // @ts-ignore
                    this.defaultValues[targetKey]
                : undefined;
            Object.assign(cache, this.cache);
            return "try {\n            target.".concat(targetPath, " = {};\n            ").concat(nestedMapping, "\n          } catch(error) {\n            __errors.push(\"Mapping error at nested field '").concat(targetPath, "': \" + error.message);\n          }");
        }
    };
    Mapper.prototype.getCompiledFnBody = function (mappingConfig, parentTarget, relativeToMapper) {
        var _this = this;
        return Object.entries(mappingConfig)
            .map(function (item) {
            return _this.createCompiler(item, _this.cache, parentTarget, relativeToMapper);
        })
            .join("\n");
    };
    Mapper.prototype.getCompiledFn = function (mappingConfig, parentTarget) {
        var body = this.getCompiledFnBody(mappingConfig, parentTarget);
        var func = new Function("source, target, __errors, cache", "".concat(body));
        return func;
    };
    Mapper.prototype.compile = function () {
        this.transformFunction = this.getCompiledFn(this.mappingConfig);
    };
    Mapper.prototype.execute = function (source) {
        if (!this.transformFunction) {
            this.compile();
        }
        this.cache["__defValues"] = this.defaultValues;
        var errors = [];
        var target = {};
        this.transformFunction(source, target, errors, this.cache);
        return { errors: errors, result: target };
    };
    return Mapper;
}());
exports.Mapper = Mapper;
//# sourceMappingURL=Mapper.js.map