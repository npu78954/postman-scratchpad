import * as fs from 'fs';
import * as YAML from 'yaml';

import {Utilities} from './lib/Utilities';
import  {PCollection} from './lib/PostmanModels';
import  {SCollection} from './lib/ScratchPadModels';

const utils = new Utilities();

main(process.argv);

function main(args:string[]) {

  let inputFolder: string = args[2];
  if (!inputFolder) {
    console.error(`Mandatory parameter missing: inputFolder`);
    printUsage();
    process.exit(1);
  }
  inputFolder = utils.removeTrailingSlash(inputFolder);
  inputFolder = utils.resolveHome(inputFolder);

  let outputCollection: string = args[3];
  if (!outputCollection) {
    console.error(`Mandatory parameter missing: outputCollection`);
    process.exit(1);
  }
  outputCollection = utils.resolveHome(outputCollection);

  let scratchPadCollection  = loadScratchPadCollection(inputFolder);
  let postmanCollection: PCollection = {};

  populateInfo(postmanCollection, scratchPadCollection);
  populateAuth(postmanCollection, scratchPadCollection);
  populateEvents(postmanCollection, scratchPadCollection);
  populateVariables(postmanCollection, scratchPadCollection);

  fs.writeFileSync(outputCollection, JSON.stringify(postmanCollection, null,'\t'))
  console.log("DONE")
}

function populateInfo(postmanCollection: PCollection, scratchPadCollection: SCollection) {

  postmanCollection.info = {
    _postman_id: scratchPadCollection.id,
    name: scratchPadCollection.name,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  };
}

function populateAuth(postmanCollection: PCollection, scratchPadCollection: SCollection) {

  postmanCollection.auth = {
    type: scratchPadCollection.auth.type,
  };
  postmanCollection.auth.basic = [];
  scratchPadCollection.auth.basic.forEach(v => {
    postmanCollection.auth.basic.push({
      key: v.key,
      value: v.value,
      type: v.type
    });
  });
}

function populateVariables(postmanCollection: PCollection, scratchPadCollection: SCollection) {

  postmanCollection.variable = [];
  scratchPadCollection.variables.forEach(v => {
    postmanCollection.variable.push({
      key: v.key,
      value: v.value,
      type: 'default'
    });
  });
}

function populateEvents(postmanCollection: PCollection, scratchPadCollection: SCollection) {

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

function populateEventExec(content:string):string[] {
  let result = [];
  content.split('\n').forEach(line=>{
    result.push(line)
  })
  return result
}

function loadScratchPadCollection(inputFolder: string): SCollection {

  let collectionFolder = inputFolder + '/' + utils.getCounterPrefix(0) + 'Collection';
  let scratchPadCollectionFile = collectionFolder + '/' + utils.getCounterPrefix(0) + 'Settings.yaml';

  let yaml = fs.readFileSync(scratchPadCollectionFile).toString();
  return YAML.parse(yaml);
}

function printUsage() {
  console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
  console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}
