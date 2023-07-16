"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var YAML = require("yaml");
var postman_collection_1 = require("postman-collection");
var Utilities_1 = require("./lib/Utilities");
var utils = new Utilities_1.Utilities();
main(process.argv);
function main(args) {
    var inputCollection = args[2];
    if (!inputCollection) {
        console.error("Mandatory parameter missing: inputCollection");
        printUsage();
        process.exit(1);
    }
    inputCollection = utils.resolveHome(inputCollection);
    var outputFolder = args[3];
    if (!outputFolder) {
        console.error("Mandatory parameter missing: outputFolder");
        process.exit(1);
    }
    outputFolder = utils.removeTrailingSlash(outputFolder);
    outputFolder = utils.resolveHome(outputFolder);
    var collection = new postman_collection_1.Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
    var collectionFolder = outputFolder + '/' + collection.name;
    console.info("Starting to extract the postman collection \"".concat(inputCollection, "\""));
    recreateCollectionFolder(collectionFolder);
    saveCollectionSettings(collectionFolder, collection);
    saveFolderRecursive(collectionFolder, collection, true);
    console.info("The collection was successfully extracted to \"".concat(collectionFolder, "\""));
    process.exit(0);
}
function printUsage() {
    console.info('Usage: node extract-scratchpad.js [inputCollection] [outputFolder] ');
    console.info('Example: node extract-scratchpad.js ~/Postman/collections/my.postman_collection.json ~/Postman/collections/ ');
}
function saveCollectionSettings(collectionFolder, collection) {
    var counter = utils.getCounterPrefix(0);
    var folder = collectionFolder + '/' + counter + 'Collection';
    fs.mkdirSync(folder);
    var result = {};
    result.name = collection.name;
    result.id = collection.id;
    result.auth = collection.auth;
    if (collection.variables.count() > 0)
        result.variables = collection.variables;
    var prerequest = collection.events.find(function (f) { return f.listen === 'prerequest'; }, null);
    if (prerequest) {
        var prerequestScript = prerequest.script.exec.join('\n');
        if (prerequestScript !== '') {
            result.prerequest = utils.sanitizeMultiline(prerequestScript);
        }
    }
    var tests = collection.events.find(function (f) { return f.listen === 'test'; }, null);
    if (tests) {
        var testsScript = tests.script.exec.join('\n');
        if (testsScript !== '') {
            result.tests = utils.sanitizeMultiline(testsScript);
        }
    }
    fs.writeFileSync(folder + '/' + counter + 'Settings.yaml', YAML.stringify(result));
    console.debug("Generated file: \"".concat(folder, "/").concat(counter, "Settings.yaml\""));
}
function recreateCollectionFolder(collectionFolder) {
    if (fs.existsSync(collectionFolder)) {
        console.debug("The folder \"".concat(collectionFolder, "\" exists already, it will be recreated"));
        fs.rmSync(collectionFolder, { recursive: true, force: true });
    }
    console.debug("Folder \"".concat(collectionFolder, "\" created"));
    fs.mkdirSync(collectionFolder);
}
function saveFolderRecursive(folderPath, folder, isRoot) {
    if (isRoot === void 0) { isRoot = false; }
    var itemCounter = 1;
    if (!isRoot)
        fs.mkdirSync(folderPath);
    folder.items.each(function (item) {
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
function saveRequest(item, folderPath, itemCounter) {
    var counter = utils.getCounterPrefix(itemCounter);
    var result = {};
    result.name = item.name;
    result.method = item.request.method;
    result.url = item.request.url.toString();
    var descriptionDefinition = item.request.description;
    if (descriptionDefinition) {
        if (descriptionDefinition.content)
            result.description = descriptionDefinition.content;
        else
            result.description = item.request.description;
    }
    result.auth = item.request.auth;
    if (item.request.headers.contentSize() > 0)
        result.headers = item.request.headers;
    if (item.request.body && item.request.body.raw) {
        result.body = utils.sanitizeMultiline(item.request.body.raw);
    }
    var prerequest = item.events.find(function (f) { return f.listen === 'prerequest'; }, null);
    if (prerequest) {
        var prerequestScript = prerequest.script.exec.join('\n');
        if (prerequestScript !== '') {
            result.prerequest = utils.sanitizeMultiline(prerequestScript);
        }
    }
    var tests = item.events.find(function (f) { return f.listen === 'test'; }, null);
    if (tests) {
        var testsScript = tests.script.exec.join('\n');
        if (testsScript !== '') {
            result.tests = utils.sanitizeMultiline(testsScript);
        }
    }
    var sanitizedFileName = counter + utils.sanitizeFileName(item.name) + '.yaml';
    fs.writeFileSync(folderPath + '/' + sanitizedFileName, YAML.stringify(result));
    console.debug("Generated file: \"".concat(folderPath, "/").concat(sanitizedFileName, "\""));
}
//# sourceMappingURL=extract-scratchpad.js.map