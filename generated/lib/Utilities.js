"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilities = void 0;
var os = require("os");
var Utilities = /** @class */ (function () {
    function Utilities() {
    }
    Utilities.prototype.resolveHome = function (filepath) {
        return filepath.replace("~", os.homedir);
    };
    Utilities.prototype.removeTrailingSlash = function (str) {
        if (str.endsWith('/'))
            return str.slice(0, -1);
        else
            return str;
    };
    Utilities.prototype.sanitizeFileName = function (name) {
        if (!name)
            return name;
        return name.replace(/[\/\<\>\:\*\t]/g, '');
    };
    Utilities.prototype.sanitizeMultiline = function (text) {
        if (!text)
            return text;
        return text.replace(/\r/g, '');
    };
    Utilities.prototype.getCounterPrefix = function (itemCounter) {
        return itemCounter.toString().padStart(2, '0') + '00 ';
    };
    return Utilities;
}());
exports.Utilities = Utilities;
//# sourceMappingURL=Utilities.js.map