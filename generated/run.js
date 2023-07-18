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
                noSummary: true,
                noBanner: true
            },
        },
        folder: 'Get single city and its population data',
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
    if (args.request.headers && args.request.headers.members) {
        logHighlighted("\n\n  Request headers: ");
        args.request.headers.members.forEach(function (header) {
            logHighlightedNoLn("  ".concat(header.key, ": ").concat(header.value));
        });
    }
    if (args.request.body) {
        var req = '\n\n  Request body: ' + args.request.body.raw.replace(/\n/g, '');
        logHighlighted(req);
    }
    if (args.response.headers && args.response.headers.members) {
        logHighlighted("\n  Response headers: ");
        args.response.headers.members.forEach(function (header) {
            logHighlightedNoLn("  ".concat(header.key, ": ").concat(header.value));
        });
    }
    if (args.response.stream) {
        var resp = '\n\n  Response body: ' + args.response.stream.toString().replace(/\n/g, '') + '\n';
        logHighlighted(resp);
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
function logError(message) {
    process.stderr.write("\u001B[31m".concat(message, "\u001B[0m\n"));
}
function logSuccess(message) {
    process.stdout.write("\u001B[32m".concat(message, "\u001B[0m\n"));
}
function logHighlighted(message) {
    process.stdout.write("\u001B[33m".concat(message, "\u001B[0m\n"));
}
function logHighlightedNoLn(message) {
    process.stdout.write("\u001B[33m".concat(message, "\u001B[0m"));
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