"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var postman_collection_1 = require("postman-collection");
var fs = require("fs");
var YAML = require("yaml");
var os = require("os");
main(process.argv);
function main(args) {
    var inputCollection = args[2];
    if (!inputCollection) {
        console.error("Mandatory parameter missing: inputCollection");
        printUsage();
        process.exit(1);
    }
    inputCollection = resolveHome(inputCollection);
    var outputFolder = args[3];
    if (!outputFolder) {
        console.error("Mandatory parameter missing: output folder");
        process.exit(1);
    }
    outputFolder = removeTrailingSlash(outputFolder);
    outputFolder = resolveHome(outputFolder);
    var collection = new postman_collection_1.Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
    var collectionFolder = outputFolder + '/' + collection.name;
    console.info("Starting to extract the postman collection \"".concat(inputCollection, "\""));
    recreateCollectionFolder(collectionFolder);
    saveCollectionSettings(collectionFolder, collection);
    saveFolderRecursive(collection, collectionFolder, true);
    console.info("The collection was successfully extracted to \"".concat(collectionFolder, "\""));
    process.exit(0);
}
function printUsage() {
    console.info('Usage: node extract-scratchpad.js [input-postman-collection] [output-folder] ');
    console.info('Example: node extract-scratchpad.js ~/Postman/collections/my.postman_collection.json ~/Postman/collections/ ');
}
function saveCollectionSettings(collectionFolder, collection) {
    var counter = getCounter(0);
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
            result.prerequest = sanitizeMultiline(prerequestScript);
        }
    }
    var tests = collection.events.find(function (f) { return f.listen === 'test'; }, null);
    if (tests) {
        var testsScript = tests.script.exec.join('\n');
        if (testsScript !== '') {
            result.tests = sanitizeMultiline(testsScript);
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
function removeTrailingSlash(str) {
    if (str.endsWith('/'))
        return str.slice(0, -1);
    else
        return str;
}
function saveFolderRecursive(folder, folderPath, isRoot) {
    if (isRoot === void 0) { isRoot = false; }
    var itemCounter = 1;
    if (!isRoot)
        fs.mkdirSync(folderPath);
    folder.items.each(function (item) {
        if (item.items) {
            var counter = getCounter(itemCounter);
            saveFolderRecursive(item, folderPath + '/' + counter + sanitizeFileName(item.name));
        }
        else {
            saveRequest(item, folderPath, itemCounter);
        }
        itemCounter++;
    });
}
function saveRequest(item, folderPath, itemCounter) {
    var counter = getCounter(itemCounter);
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
        result.body = sanitizeMultiline(item.request.body.raw);
    }
    var prerequest = item.events.find(function (f) { return f.listen === 'prerequest'; }, null);
    if (prerequest) {
        var prerequestScript = prerequest.script.exec.join('\n');
        if (prerequestScript !== '') {
            result.prerequest = sanitizeMultiline(prerequestScript);
        }
    }
    var tests = item.events.find(function (f) { return f.listen === 'test'; }, null);
    if (tests) {
        var testsScript = tests.script.exec.join('\n');
        if (testsScript !== '') {
            result.tests = sanitizeMultiline(testsScript);
        }
    }
    var sanitizedFileName = counter + sanitizeFileName(item.name) + '.yaml';
    fs.writeFileSync(folderPath + '/' + sanitizedFileName, YAML.stringify(result));
    console.debug("Generated file: \"".concat(folderPath, "/").concat(sanitizedFileName, "\""));
}
function sanitizeFileName(name) {
    if (!name)
        return name;
    return name.replace(/[\/\<\>\:\*\t]/g, '');
}
function sanitizeMultiline(text) {
    if (!text)
        return text;
    return text.replace(/\r/g, '');
}
function getCounter(itemCounter) {
    return itemCounter.toString().padStart(2, '0') + '00 ';
}
function resolveHome(filepath) {
    return filepath.replace("~", os.homedir);
}
//# sourceMappingURL=extract-scratchpad.js.map