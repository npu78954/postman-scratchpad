"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var YAML = require("yaml");
var Utilities_1 = require("./lib/Utilities");
var utils = new Utilities_1.Utilities();
main(process.argv);
function main(args) {
    var inputFolder = args[2];
    if (!inputFolder) {
        console.error("Mandatory parameter missing: inputFolder");
        printUsage();
        process.exit(1);
    }
    inputFolder = utils.removeTrailingSlash(inputFolder);
    inputFolder = utils.resolveHome(inputFolder);
    var outputCollection = args[3];
    if (!outputCollection) {
        console.error("Mandatory parameter missing: outputCollection");
        process.exit(1);
    }
    outputCollection = utils.resolveHome(outputCollection);
    var collectionSettings = loadCollectionSettings(inputFolder);
    var c = {};
    populateInfo(c, collectionSettings);
    populateAuth(c, collectionSettings);
    populateEvents(c, collectionSettings);
    populateVariables(c, collectionSettings);
    fs.writeFileSync(outputCollection, JSON.stringify(c, null, '\t'));
    console.log("DONE");
}
function populateInfo(c, collectionSettings) {
    c.info = {
        _postman_id: collectionSettings.id,
        name: collectionSettings.name,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    };
}
function populateAuth(c, collectionSettings) {
    c.auth = {
        type: collectionSettings.auth.type,
    };
    c.auth.basic = [];
    collectionSettings.auth.basic.forEach(function (v) {
        c.auth.basic.push({
            key: v.key,
            value: v.value,
            type: v.type
        });
    });
}
function populateVariables(c, collectionSettings) {
    c.variable = [];
    collectionSettings.variables.forEach(function (v) {
        c.variable.push({
            key: v.key,
            value: v.value,
            type: 'default'
        });
    });
}
function populateEvents(c, collectionSettings) {
    c.event = [];
    c.event.push({
        listen: 'prerequest',
        script: {
            type: 'text/javascript',
            exec: populateEventExec(collectionSettings.prerequest)
        }
    });
    c.event.push({
        listen: 'test',
        script: {
            type: 'text/javascript',
            exec: populateEventExec(collectionSettings.tests)
        }
    });
}
function populateEventExec(content) {
    var result = [];
    content.split('\n').forEach(function (line) {
        result.push(line);
    });
    return result;
}
function loadCollectionSettings(inputFolder) {
    var collectionFolder = inputFolder + '/' + utils.getCounterPrefix(0) + 'Collection';
    var collectionSettingsFile = collectionFolder + '/' + utils.getCounterPrefix(0) + 'Settings.yaml';
    var yaml = fs.readFileSync(collectionSettingsFile).toString();
    return YAML.parse(yaml);
}
function printUsage() {
    console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
    console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}
//# sourceMappingURL=export-to-collection.js.map