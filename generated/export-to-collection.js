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
    populateItemsRecursive(postmanCollection, scratchPadCollection);
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
function populateItemsRecursive(parentPostmanItem, parentScratchPadItem) {
    parentScratchPadItem.items.forEach(function (scratchPadItem) {
        if (scratchPadItem.items) {
            console.log("Folder: ".concat(scratchPadItem.name));
            var postmanItem = {
                name: scratchPadItem.name,
                item: []
            };
            if (!parentPostmanItem.item)
                parentPostmanItem.item = [];
            parentPostmanItem.item.push(postmanItem);
            populateItemsRecursive(postmanItem, scratchPadItem);
        }
        else {
            console.log("File: ".concat(scratchPadItem.name));
            var postmanItem = {
                name: scratchPadItem.name,
                event: mapEvents(scratchPadItem),
                protocolProfileBehavior: {
                    disableUrlEncoding: true
                },
                request: mapRequest(scratchPadItem),
                response: []
            };
            parentPostmanItem.item.push(postmanItem);
        }
    });
}
function mapEvents(scratchPadItem) {
    var result = [];
    if (scratchPadItem.prerequest) {
        result.push({
            listen: 'prerequest',
            script: {
                exec: populateEventExec(scratchPadItem.prerequest),
                type: 'text/javascript',
            }
        });
    }
    if (scratchPadItem.tests) {
        result.push({
            listen: 'test',
            script: {
                exec: populateEventExec(scratchPadItem.tests),
                type: 'text/javascript',
            }
        });
    }
    return result;
}
function mapRequest(scratchPadItem) {
    var result = {
        method: scratchPadItem.method,
        header: []
    };
    scratchPadItem.headers.forEach(function (header) {
        result.header.push({
            key: header.key,
            value: header.value,
            type: 'default'
        });
    });
    result.body = {
        mode: 'raw',
        raw: scratchPadItem.body,
        options: {
            raw: {
                language: 'json'
            }
        }
    };
    result.url = mapUrl(scratchPadItem);
    result.description = scratchPadItem.description;
    return result;
}
function mapUrl(scratchPadItem) {
    var url = {
        raw: scratchPadItem.url
    };
    var host = scratchPadItem.url.split('/');
    var parts = host.splice(1);
    url.host = host;
    url.path = parts;
    return url;
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
    if (content) {
        content.split('\n').forEach(function (line) {
            result.push(line);
        });
    }
    return result;
}
function loadScratchPadCollection(inputFolder) {
    var collectionFolderName = utils.getCounterPrefix(0) + 'Collection';
    var collectionFolder = inputFolder + '/' + collectionFolderName;
    var scratchPadCollectionFile = collectionFolder + '/' + utils.getCounterPrefix(0) + 'Settings.yaml';
    var yaml = fs.readFileSync(scratchPadCollectionFile).toString();
    var scratchPadCollection = YAML.parse(yaml);
    scratchPadCollection.items = [];
    scratchPadCollection.name = utils.getFolderName(inputFolder);
    loadItemsRecursive(inputFolder, collectionFolderName, scratchPadCollection, scratchPadCollection);
    return scratchPadCollection;
}
function loadItemsRecursive(inputFolder, collectionFolderName, scratchPadCollection, parentScratchPadItem) {
    var dirContent = fs.readdirSync(inputFolder);
    dirContent.forEach(function (name) {
        if (name === collectionFolderName) {
            return;
        }
        var isDir = fs.statSync(inputFolder + '/' + name).isDirectory();
        var current = inputFolder + '/' + name;
        if (isDir) {
            console.log("Loading folder: ".concat(current));
            var scratchPadItem = {
                name: utils.removeCounterPrefix(name),
                items: []
            };
            parentScratchPadItem.items.push(scratchPadItem);
            loadItemsRecursive(inputFolder + '/' + name, collectionFolderName, scratchPadCollection, scratchPadItem);
        }
        else {
            console.log("Loading file: ".concat(current));
            var yaml = fs.readFileSync(current).toString();
            var scratchPadItem = YAML.parse(yaml);
            scratchPadItem.name = utils.removeCounterPrefix(name);
            scratchPadItem.name = utils.filenameWithoutExtension(scratchPadItem.name);
            parentScratchPadItem.items.push(scratchPadItem);
        }
    });
}
function printUsage() {
    console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
    console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}
//# sourceMappingURL=export-to-collection.js.map