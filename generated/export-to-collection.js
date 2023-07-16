"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var YAML = require("yaml");
var Utilities_1 = require("./lib/Utilities");
var utils = new Utilities_1.Utilities();
main(process.argv);
function main(args) {
    var inputFolder = loadInputFolderParameter(args);
    var outputCollection = loadOutputCollectionParameter(args);
    var scratchPadCollection = loadScratchPadCollection(inputFolder);
    var postmanCollection = {};
    populateInfo(postmanCollection, scratchPadCollection);
    populateAuth(postmanCollection, scratchPadCollection);
    populateEvents(postmanCollection, scratchPadCollection);
    populateVariables(postmanCollection, scratchPadCollection);
    saveCollection(outputCollection, postmanCollection);
    console.log("DONE");
}
function loadOutputCollectionParameter(args) {
    var outputCollection = args[3];
    if (!outputCollection) {
        console.error("Mandatory parameter missing: outputCollection");
        process.exit(1);
    }
    outputCollection = utils.resolveHome(outputCollection);
    return outputCollection;
}
function loadInputFolderParameter(args) {
    var inputFolder = args[2];
    if (!inputFolder) {
        console.error("Mandatory parameter missing: inputFolder");
        printUsage();
        process.exit(1);
    }
    inputFolder = utils.removeTrailingSlash(inputFolder);
    inputFolder = utils.resolveHome(inputFolder);
    return inputFolder;
}
function saveCollection(outputCollection, postmanCollection) {
    fs.writeFileSync(outputCollection, JSON.stringify(postmanCollection, null, '\t'));
}
function populateInfo(postmanCollection, scratchPadCollection) {
    postmanCollection.info = {
        _postman_id: scratchPadCollection.id,
        name: scratchPadCollection.name,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    };
}
function populateAuth(postmanCollection, scratchPadCollection) {
    postmanCollection.auth = {
        type: scratchPadCollection.auth.type,
    };
    postmanCollection.auth.basic = [];
    scratchPadCollection.auth.basic.forEach(function (v) {
        postmanCollection.auth.basic.push({
            key: v.key,
            value: v.value,
            type: v.type
        });
    });
}
function populateVariables(postmanCollection, scratchPadCollection) {
    postmanCollection.variable = [];
    scratchPadCollection.variables.forEach(function (v) {
        postmanCollection.variable.push({
            key: v.key,
            value: v.value,
            type: v.type
        });
    });
}
function populateEvents(postmanCollection, scratchPadCollection) {
    postmanCollection.event = [];
    postmanCollection.event.push({
        listen: 'prerequest',
        script: {
            type: 'text/javascript',
            exec: populateEventExec(scratchPadCollection.prerequest)
        }
    });
    postmanCollection.event.push({
        listen: 'test',
        script: {
            type: 'text/javascript',
            exec: populateEventExec(scratchPadCollection.tests)
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
function loadScratchPadCollection(inputFolder) {
    var collectionFolder = inputFolder + '/' + utils.getCounterPrefix(0) + 'Collection';
    var scratchPadCollectionFile = collectionFolder + '/' + utils.getCounterPrefix(0) + 'Settings.yaml';
    var yaml = fs.readFileSync(scratchPadCollectionFile).toString();
    return YAML.parse(yaml);
}
function printUsage() {
    console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
    console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}
//# sourceMappingURL=export-to-collection.js.map