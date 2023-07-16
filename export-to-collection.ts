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

  let collectionSettings  = loadCollectionSettings(inputFolder);

  let c: PCollection = {};
  populateInfo(c, collectionSettings);
  populateAuth(c, collectionSettings);
  populateEvents(c, collectionSettings);
  populateVariables(c, collectionSettings);

  fs.writeFileSync(outputCollection, JSON.stringify(c, null,'\t'))
  console.log("DONE")
}

function populateInfo(c: PCollection, collectionSettings: SCollection) {
  c.info = {
    _postman_id: collectionSettings.id,
    name: collectionSettings.name,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  };
}

function populateAuth(c: PCollection, collectionSettings: SCollection) {
  c.auth = {
    type: collectionSettings.auth.type,
  };
  c.auth.basic = [];
  collectionSettings.auth.basic.forEach(v => {
    c.auth.basic.push({
      key: v.key,
      value: v.value,
      type: v.type
    });
  });
}

function populateVariables(c: PCollection, collectionSettings: SCollection) {
  c.variable = [];
  collectionSettings.variables.forEach(v => {
    c.variable.push({
      key: v.key,
      value: v.value,
      type: 'default'
    });
  });
}

function populateEvents(c: PCollection, collectionSettings: SCollection) {
  c.event = [];
  c.event.push({
    listen: 'prerequest',
    script: {
      type: 'text/javascript',
      exec: populateEventExec(collectionSettings.prerequest)
    }
  });
  c.event.push({
    listen: 'test',
    script: {
      type: 'text/javascript',
      exec: populateEventExec(collectionSettings.tests)
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

function loadCollectionSettings(inputFolder: string): SCollection {
  let collectionFolder = inputFolder + '/' + utils.getCounterPrefix(0) + 'Collection';
  let collectionSettingsFile = collectionFolder + '/' + utils.getCounterPrefix(0) + 'Settings.yaml';

  let yaml = fs.readFileSync(collectionSettingsFile).toString();
  return YAML.parse(yaml);
}

function printUsage() {
  console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
  console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}
