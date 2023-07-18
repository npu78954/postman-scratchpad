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
        reporters: 'cli',
        reporter: {
            cli: {
                noSummary: true
            },
        },
        folder: 'Get population for unknown city',
        environment: environment,
        insecure: 'true'
    }, function (err) {
        if (err) {
            throw err;
        }
    }).on('request', function (error, args) {
        if (error) {
            logError(error);
        }
        else {
            logRequestResponse(args);
        }
    }).on('done', function (error, args) {
        if (error) {
            logError(error);
        }
        else {
            displaySummary(args);
        }
    });
}
function logRequestResponse(args) {
    if (args.request.body) {
        var req = '\n  Request body: ' + args.request.body.raw.replace(/\n/g, '');
        logRequestResponseBody(req);
    }
    if (args.response.stream) {
        var resp = '  Response body: ' + args.response.stream.toString().replace(/\n/g, '') + '\n';
        logRequestResponseBody(resp);
    }
}
function displaySummary(args) {
    var msg = "\n  EXECUTIONS: ".concat(args.run.executions.length, " FAILURES: ").concat(args.run.failures.length, "\n");
    if (args.run.failures.length === 0) {
        logSuccess(msg);
    }
    else {
        logError(msg);
    }
}
function logError(errorMessage) {
    process.stderr.write("\u001B[31m".concat(errorMessage, "\u001B[0m\n"));
}
function logSuccess(errorMessage) {
    process.stderr.write("\u001B[32m".concat(errorMessage, "\u001B[0m\n"));
}
function logRequestResponseBody(errorMessage) {
    process.stderr.write("\n\u001B[33m".concat(errorMessage, "\u001B[0m\n"));
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