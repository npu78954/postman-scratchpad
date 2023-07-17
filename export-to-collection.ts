import * as fs from 'fs';
import * as YAML from 'yaml';

import {Utilities} from './lib/Utilities';
import {PCollection, PEvent, PItem, PRequest, PUrl} from './lib/PostmanModels';
import {SCollection, SItem} from './lib/ScratchPadModels';

const utils = new Utilities();
const SETTINGS_FILE = 'Settings.yaml';

main(process.argv);

function main(args:string[]) {

  let inputFolder: string = loadInputFolderParameter(args);
  let outputCollection: string = loadOutputCollectionParameter(args);

  let scratchPadCollection  = loadScratchPadCollection(inputFolder);
  let postmanCollection: PCollection = {
  };

  populateInfo(postmanCollection, scratchPadCollection);
  populateItemsRecursive(postmanCollection, scratchPadCollection);
  populateAuth(postmanCollection, scratchPadCollection);
  populateEvents(postmanCollection, scratchPadCollection);
  populateVariables(postmanCollection, scratchPadCollection);
  saveCollection(outputCollection, postmanCollection);

  console.log("DONE");
}

function loadOutputCollectionParameter(args: string[]) {

  let outputCollection: string = args[3];
  if (!outputCollection) {
    console.error(`Mandatory parameter missing: outputCollection`);
    process.exit(1);
  }
  outputCollection = utils.resolveHome(outputCollection);
  return outputCollection;
}

function loadInputFolderParameter(args: string[]) {

  let inputFolder: string = args[2];
  if (!inputFolder) {
    console.error(`Mandatory parameter missing: inputFolder`);
    printUsage();
    process.exit(1);
  }
  inputFolder = utils.removeTrailingSlash(inputFolder);
  inputFolder = utils.resolveHome(inputFolder);
  return inputFolder;
}

function saveCollection(outputCollection: string, postmanCollection: PCollection) {

  fs.writeFileSync(outputCollection, JSON.stringify(postmanCollection, null, '\t'));
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
      type: v.type
    });
  });
}

function populateItemsRecursive(parentPostmanItem: PItem, parentScratchPadItem: SItem) {

  parentScratchPadItem.items.forEach( (scratchPadItem: SItem) => {

      if (scratchPadItem.items) {
        console.log(`Folder: ${scratchPadItem.name}`);
        let postmanItem : PItem = {
          name: scratchPadItem.name,
          item: []
        }
        if (!parentPostmanItem.item)
          parentPostmanItem.item = [];
        parentPostmanItem.item.push(postmanItem);
        populateItemsRecursive(postmanItem, scratchPadItem);
      } else {
        console.log(`File: ${scratchPadItem.name}`);
        let postmanItem : PItem = {
          name: scratchPadItem.name,
          event: mapEvents(scratchPadItem),
          protocolProfileBehavior: {
            disableUrlEncoding: true
          },
          request: mapRequest(scratchPadItem),
          response: []
        }
        parentPostmanItem.item.push(postmanItem);
      }
  });
}

function mapEvents(scratchPadItem : SItem): PEvent[] {

  let result = [];

  if (scratchPadItem.prerequest) {
    result.push({
      listen: 'prerequest',
      script: {
        exec: populateEventExec(scratchPadItem.prerequest),
        type: 'text/javascript',
      }
    });
  }

  if (scratchPadItem.tests) {
    result.push({
      listen: 'test',
      script: {
        exec: populateEventExec(scratchPadItem.tests),
        type: 'text/javascript',
      }
    });
  }
  return result;
}

function mapRequest(scratchPadItem : SItem): PRequest {

  let result : PRequest = {
    method: scratchPadItem.method,
    header: []
  };

  scratchPadItem.headers.forEach(header=> {

    result.header.push({
      key: header.key,
      value: header.value,
      type: 'default'
    });
  });
  result.body = {
    mode: 'raw',
    raw: scratchPadItem.body,
    options: {
      raw: {
        language: 'json'
      }
    }
  }
  result.url = mapUrl(scratchPadItem);
  result.description = scratchPadItem.description;
  return result;
}

function mapUrl(scratchPadItem: SItem) {

  let url : PUrl = {
    raw: scratchPadItem.url
  };
  let host : string[] = scratchPadItem.url.split('/');
  let parts = host.splice(1);
  url.host = host;
  url.path = parts;
  return url;
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

  if (content) {
    content.split('\n').forEach(line=>{
      result.push(line)
    });
  }

  return result
}

function loadScratchPadCollection(inputFolder: string): SCollection {

  let scratchPadCollectionFile = inputFolder + '/' + SETTINGS_FILE;
  let yaml = fs.readFileSync(scratchPadCollectionFile).toString();
  let scratchPadCollection: SCollection =  YAML.parse(yaml);
  scratchPadCollection.items = [];
  scratchPadCollection.name = utils.getFolderName(inputFolder);
  loadItemsRecursive(inputFolder, scratchPadCollection, scratchPadCollection);

  return scratchPadCollection;
}

function loadItemsRecursive(inputFolder: string, scratchPadCollection: SCollection,
  parentScratchPadItem: SItem) {

  let dirContent: string[] = fs.readdirSync(inputFolder);
  dirContent.forEach(name => {

    if (name === SETTINGS_FILE) {
      return;
    }

    let isDir: boolean = fs.statSync(inputFolder + '/' + name).isDirectory();
    let current: string = inputFolder + '/' + name;
    if (isDir) {

      console.log(`Loading folder: ${current}`);
      let scratchPadItem: SItem = {
        name: utils.removeCounterPrefix(name),
        items: []
      }
      parentScratchPadItem.items.push(scratchPadItem);
      loadItemsRecursive(inputFolder + '/' + name, scratchPadCollection, scratchPadItem);

    } else {

      console.log(`Loading file: ${current}`);
      let yaml = fs.readFileSync(current).toString();
      let scratchPadItem: SItem = YAML.parse(yaml);
      scratchPadItem.name = utils.removeCounterPrefix(name);
      scratchPadItem.name = utils.filenameWithoutExtension(scratchPadItem.name);
      parentScratchPadItem.items.push(scratchPadItem);

    }
  });
}

function printUsage() {

  console.info('Usage: node export-to-collection.js [inputFolder] [outputCollection] ');
  console.info('Example: node export-to-collection.js ~/Postman/collections/ ~/Postman/collections/my.postman_collection.json');
}



