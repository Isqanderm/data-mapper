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
    function Mapper(mappingConfig) {
        this.transformFunction = this.compile(mappingConfig);
    }
    Mapper.prototype.getValueByPath = function (configValue) {
        return configValue.split(".").reduce(function (accum, part) {
            accum += "['".concat(part, "']");
            return accum;
        }, "");
    };
    Mapper.prototype.compile = function (mappingConfig) {
        var _this = this;
        var body = Object.entries(mappingConfig)
            .map(function (_a) {
            var _b = __read(_a, 2), targetKey = _b[0], configValue = _b[1];
            if (typeof configValue === "function") {
                return "try {\n            target['".concat(targetKey, "'] = (").concat(configValue.toString(), ")(source);\n          } catch(error) {\n            throw new Error(\"Mapping error at field '").concat(targetKey, "': \" + error.message);\n          }\n        ");
            }
            else if (configValue instanceof Mapper) {
                return "try {\n            target['".concat(targetKey, "'] = ").concat(configValue.transformFunction.toString(), "(source['").concat(targetKey, "']);\n          } catch(error) {\n            throw new Error(\"Mapping error at field '").concat(targetKey, "': \" + error.message);\n          }\n        ");
            }
            else if (typeof configValue === "string") {
                return "try {\n            target['".concat(targetKey, "'] = source").concat(_this.getValueByPath(configValue), ";\n          } catch(error) {\n            throw new Error(\"Mapping error at field '").concat(targetKey, "' from source field '").concat(configValue, "': \" + error.message);\n          }\n        ");
            }
        })
            .join("\n");
        var func = new Function("source", "const target = {}; ".concat(body, " return target;"));
        return func;
    };
    Mapper.prototype.map = function (source) {
        return this.transformFunction(source);
    };
    return Mapper;
}());
exports.Mapper = Mapper;
