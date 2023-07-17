"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilities = void 0;
var os = require("os");
var path = require("path");
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
    Utilities.prototype.removeCounterPrefix = function (name) {
        return name.substring(5);
    };
    Utilities.prototype.filenameWithoutExtension = function (filename) {
        return path.parse(filename).name;
    };
    Utilities.prototype.getFolderName = function (folder) {
        return path.parse(folder).name;
    };
    return Utilities;
}());
exports.Utilities = Utilities;
//# sourceMappingURL=Utilities.js.map