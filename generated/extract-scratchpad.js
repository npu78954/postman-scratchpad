"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var YAML = require("yaml");
var postman_collection_1 = require("postman-collection");
var Utilities_1 = require("./lib/Utilities");
var utils = new Utilities_1.Utilities();
main(process.argv);
function main(args) {
    var inputCollection = loadInputCollectionParameter(args);
    var outputFolder = loadOutputFolderParameter(args);
    var postmanCollection = new postman_collection_1.Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
    var collectionFolder = outputFolder + '/' + postmanCollection.name;
    console.info("Starting to extract the postman collection \"".concat(inputCollection, "\""));
    recreateCollectionFolder(collectionFolder);
    saveCollectionSettings(collectionFolder, postmanCollection);
    saveFolderRecursive(collectionFolder, postmanCollection, true);
    console.info("The collection was successfully extracted to \"".concat(collectionFolder, "\""));
    process.exit(0);
}
function loadOutputFolderParameter(args) {
    var outputFolder = args[3];
    if (!outputFolder) {
        console.error("Mandatory parameter missing: outputFolder");
        process.exit(1);
    }
    outputFolder = utils.removeTrailingSlash(outputFolder);
    outputFolder = utils.resolveHome(outputFolder);
    return outputFolder;
}
function loadInputCollectionParameter(args) {
    var inputCollection = args[2];
    if (!inputCollection) {
        console.error("Mandatory parameter missing: inputCollection");
        printUsage();
        process.exit(1);
    }
    inputCollection = utils.resolveHome(inputCollection);
    return inputCollection;
}
function printUsage() {
    console.info('Usage: node extract-scratchpad.js [inputCollection] [outputFolder] ');
    console.info('Example: node extract-scratchpad.js ~/Postman/collections/my.postman_collection.json ~/Postman/collections/ ');
}
function saveCollectionSettings(collectionFolder, postmanCollection) {
    var scratchPadCollection = {};
    scratchPadCollection.id = postmanCollection.id;
    scratchPadCollection.auth = postmanCollection.auth;
    populateVariables(postmanCollection, scratchPadCollection);
    populateEvents(postmanCollection, scratchPadCollection);
    fs.writeFileSync("".concat(collectionFolder, "/Settings.yaml"), YAML.stringify(scratchPadCollection));
    console.debug("Generated file: \"".concat(collectionFolder, "/Settings.yaml\""));
}
function populateVariables(postmanCollection, scratchPadCollection) {
    if (postmanCollection.variables.count() > 0) {
        scratchPadCollection.variables = [];
        postmanCollection.variables.each(function (v) {
            scratchPadCollection.variables.push({
                key: v.key,
                value: v.value,
                type: 'default'
            });
        });
    }
}
function populateEvents(postmanItem, scratchPadCollection) {
    var prerequest = postmanItem.events.find(function (f) { return f.listen === 'prerequest'; }, null);
    if (prerequest) {
        var prerequestScript = prerequest.script.exec.join('\n');
        if (prerequestScript !== '') {
            scratchPadCollection.prerequest = utils.sanitizeMultiline(prerequestScript);
        }
    }
    var tests = postmanItem.events.find(function (f) { return f.listen === 'test'; }, null);
    if (tests) {
        var testsScript = tests.script.exec.join('\n');
        if (testsScript !== '') {
            scratchPadCollection.tests = utils.sanitizeMultiline(testsScript);
        }
    }
}
function recreateCollectionFolder(collectionFolder) {
    if (fs.existsSync(collectionFolder)) {
        console.debug("The folder \"".concat(collectionFolder, "\" exists already, it will be recreated"));
        fs.rmSync(collectionFolder, { recursive: true, force: true });
    }
    console.debug("Folder \"".concat(collectionFolder, "\" created"));
    fs.mkdirSync(collectionFolder);
}
function saveFolderRecursive(folderPath, postmanCollection, isRoot) {
    if (isRoot === void 0) { isRoot = false; }
    var itemCounter = 1;
    if (!isRoot)
        fs.mkdirSync(folderPath);
    postmanCollection.items.each(function (item) {
        if (item.items) {
            var counter = utils.getCounterPrefix(itemCounter);
            saveFolderRecursive(folderPath + '/' + counter + utils.sanitizeFileName(item.name), item);
        }
        else {
            saveRequest(item, folderPath, itemCounter);
        }
        itemCounter++;
    });
}
function saveRequest(postmanItem, folderPath, itemCounter) {
    var counter = utils.getCounterPrefix(itemCounter);
    var scratchPadItem = {};
    populateDescription(postmanItem, scratchPadItem);
    scratchPadItem.method = postmanItem.request.method;
    scratchPadItem.url = postmanItem.request.url.toString();
    populateHeaders(postmanItem, scratchPadItem);
    scratchPadItem.auth = postmanItem.request.auth;
    populateBody(postmanItem, scratchPadItem);
    populateEvents(postmanItem, scratchPadItem);
    var sanitizedFileName = counter + utils.sanitizeFileName(postmanItem.name) + '.yaml';
    fs.writeFileSync("".concat(folderPath, "/").concat(sanitizedFileName), YAML.stringify(scratchPadItem));
    console.debug("Generated file: \"".concat(folderPath, "/").concat(sanitizedFileName, "\""));
}
function populateBody(item, scratchPadItem) {
    if (item.request.body && item.request.body.raw) {
        scratchPadItem.body = utils.sanitizeMultiline(item.request.body.raw);
    }
}
function populateDescription(item, scratchPadItem) {
    var descriptionDefinition = item.request.description;
    if (descriptionDefinition) {
        if (descriptionDefinition.content)
            scratchPadItem.description = descriptionDefinition.content;
        else
            scratchPadItem.description = descriptionDefinition;
    }
}
function populateHeaders(item, scratchPadItem) {
    if (item.request.headers.contentSize() > 0) {
        scratchPadItem.headers = [];
        item.request.headers.each(function (h) {
            scratchPadItem.headers.push({
                key: h.key,
                value: h.value
            });
        });
    }
}
//# sourceMappingURL=extract-scratchpad.js.map