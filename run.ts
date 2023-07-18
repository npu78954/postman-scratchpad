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
  }).on('beforeItem', function(error,  args) {
    console.log('beforeItem')
  }).on('beforeRequest', function (error, args) {
      if (error) {
          console.error(error);
      } else {
          // Log the request body
          console.log('beforeRequest')

      }
  }).on('request', function (error, args) {
      if (error) {
          console.error(error);
      }
      else {
          console.log('sentRequest')

      }
  });

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

