"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueByPath = exports.parsePath = void 0;
function parsePath(path) {
    return path
        .split(".")
        .reduce(function (accum, next) {
        if (next.startsWith("[") && next.endsWith("]")) {
            if (next.length === 2) {
                accum.push({ part: next, type: "array" });
            }
            else {
                accum.push({ part: next, type: "index" });
            }
        }
        else {
            accum.push({ part: next, type: "key" });
        }
        return accum;
    }, []);
}
exports.parsePath = parsePath;
// foo.bar.[].baz.foo.[3].number
// foo.bar
//        map(baz.foo[3].number)
function getValueByPath(path) {
    var chunks = parsePath(path);
    var result = [];
    var pathObject = { path: "" };
    while (chunks.length) {
        var chunk = chunks.shift();
        if ((chunk === null || chunk === void 0 ? void 0 : chunk.type) === "key") {
            if (!pathObject.path) {
                pathObject.path = chunk.part;
            }
            else {
                pathObject.path += ".".concat(chunk.part);
            }
        }
        else if ((chunk === null || chunk === void 0 ? void 0 : chunk.type) === "index") {
            pathObject.path += chunk.part;
        }
        else if ((chunk === null || chunk === void 0 ? void 0 : chunk.type) === "array") {
            result.push(pathObject);
            pathObject = { path: "" };
        }
    }
    result.push(pathObject);
    return result;
}
exports.getValueByPath = getValueByPath;
//# sourceMappingURL=utils.js.map