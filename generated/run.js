"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var postman_collection_1 = require("postman-collection");
var Utilities_1 = require("./lib/Utilities");
var newman = require("newman");
var fs = require("fs");
var utils = new Utilities_1.Utilities();
main(process.argv);
function main(args) {
    var inputCollection = loadInputCollectionParameter(args);
    var inputEnvironment = loadInputEnvironmentParameter(args);
    var collection = new postman_collection_1.Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
    var environment = JSON.parse(fs.readFileSync(inputEnvironment).toString());
    newman.run({
        collection: collection,
        reporters: 'html',
        reporter: {
            html: {
                export: './htmlResults.html'
            }
        },
        environment: environment,
        insecure: 'true'
    }, function (err) {
        if (err) {
            throw err;
        }
        console.log('collection run complete!');
    }).on('beforeItem', function (error, args) {
        console.log('beforeItem');
    }).on('beforeRequest', function (error, args) {
        if (error) {
            console.error(error);
        }
        else {
            // Log the request body
            console.log('beforeRequest');
        }
    }).on('request', function (error, args) {
        if (error) {
            console.error(error);
        }
        else {
            console.log('sentRequest');
        }
    });
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
function loadInputEnvironmentParameter(args) {
    var inputCollection = args[3];
    if (!inputCollection) {
        console.error("Mandatory parameter missing: inputEnvironment");
        printUsage();
        process.exit(1);
    }
    inputCollection = utils.resolveHome(inputCollection);
    return inputCollection;
}
function printUsage() {
    console.info('Usage: node run.js [inputCollection]  ');
    console.info('Example: node run.js ~/Postman/collections/Countries & Cities API.postman_collection.json');
}
//# sourceMappingURL=run.js.map