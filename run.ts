import { Collection, Item } from "postman-collection";
import {Utilities} from './lib/Utilities';

import * as newman from 'newman';
import * as fs from 'fs';

const utils = new Utilities();

main(process.argv);

function main(args:string[]) {

  let inputCollection: string = loadInputCollectionParameter(args);
  let inputEnvironment: string = loadInputEnvironmentParameter(args);
  let collection: Collection = new Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
  let environment = JSON.parse(fs.readFileSync(inputEnvironment).toString());

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

function logRequestResponse(args: any) {
  if (args.request.headers && args.request.headers.members) {
    logHighlighted(`\n\n  Request headers: `);
    args.request.headers.members.forEach(header => {
      logHighlightedNoLn(`  ${header.key}: ${header.value}`)
    });
  }
  if (args.request.body) {
    let req: string = '\n\n  Request body: ' + args.request.body.raw.replace(/\n/g, '');
    logHighlighted(req);
  }
  if (args.response.headers && args.response.headers.members) {
    logHighlighted(`\n  Response headers: `);
    args.response.headers.members.forEach(header => {
      logHighlightedNoLn(`  ${header.key}: ${header.value}`)
    });
  }
  if (args.response.stream) {
    let resp: string = '\n\n  Response body: ' + args.response.stream.toString().replace(/\n/g, '') + '\n';
    logHighlighted(resp);
  }
}

function displaySummary(args: any) {
  let msg = `\n  EXECUTIONS: ${args.run.executions.length} FAILURES: ${args.run.failures.length}\n`;
  if (args.run.failures.length === 0) {
    logSuccess(msg);
  } else {
    logError(msg);
  }
}

function logError(message: string) {
  process.stderr.write(`\x1b[31m${message}\x1b[0m\n`);
}

function logSuccess(message: string) {
  process.stdout.write(`\x1b[32m${message}\x1b[0m\n`);
}

function logHighlighted(message: string) {
  process.stdout.write(`\x1b[33m${message}\x1b[0m\n`);
}

function logHighlightedNoLn(message: string) {
  process.stdout.write(`\x1b[33m${message}\x1b[0m`);
}

function loadInputCollectionParameter(args: string[]) {

  let inputCollection: string = args[2];
  if (!inputCollection) {
    console.error(`Mandatory parameter missing: inputCollection`);
    printUsage();
    process.exit(1);
  }
  inputCollection = utils.resolveHome(inputCollection);
  return inputCollection;
}

function loadInputEnvironmentParameter(args: string[]) {

  let inputCollection: string = args[3];
  if (!inputCollection) {
    console.error(`Mandatory parameter missing: inputEnvironment`);
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

