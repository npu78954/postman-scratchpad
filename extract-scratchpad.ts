import * as fs from 'fs';
import * as YAML from 'yaml';

import { Item, Collection, Event } from "postman-collection";
import {Utilities} from './lib/Utilities';
import { SCollection, SItem } from './lib/ScratchPadModels';

const utils = new Utilities();

main(process.argv);

function main(args:string[]) {

  let inputCollection: string = loadInputCollectionParameter(args);
  let outputFolder: string = loadOutputFolderParameter(args);

  let postmanCollection: Collection = new Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
  let collectionFolder: string = outputFolder + '/' + postmanCollection.name;

  console.info(`Starting to extract the postman collection "${inputCollection}"`);

  recreateCollectionFolder(collectionFolder);
  saveCollectionSettings(collectionFolder, postmanCollection);
  saveFolderRecursive(collectionFolder, postmanCollection, true);

  console.info(`The collection was successfully extracted to "${collectionFolder}"`);
  process.exit(0);
}

function loadOutputFolderParameter(args: string[]) {

  let outputFolder: string = args[3];
  if (!outputFolder) {
    console.error(`Mandatory parameter missing: outputFolder`);
    process.exit(1);
  }
  outputFolder = utils.removeTrailingSlash(outputFolder);
  outputFolder = utils.resolveHome(outputFolder);
  return outputFolder;
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

function printUsage() {
  console.info('Usage: node extract-scratchpad.js [inputCollection] [outputFolder] ');
  console.info('Example: node extract-scratchpad.js ~/Postman/collections/my.postman_collection.json ~/Postman/collections/ ');
}

function saveCollectionSettings(collectionFolder: string, postmanCollection: Collection) {

  let scratchPadCollection: SCollection = {};
  scratchPadCollection.id = postmanCollection.id;
  scratchPadCollection.auth = postmanCollection.auth;

  populateVariables(postmanCollection, scratchPadCollection);
  populateEvents(postmanCollection , scratchPadCollection);

  fs.writeFileSync(`${collectionFolder}/Settings.yaml`, YAML.stringify(scratchPadCollection));
  console.debug(`Generated file: "${collectionFolder}/Settings.yaml"`);
}

function populateVariables(postmanCollection: Collection, scratchPadCollection: SCollection) {

  if (postmanCollection.variables.count() > 0) {
    scratchPadCollection.variables = [];
    postmanCollection.variables.each(v => {
      scratchPadCollection.variables.push({
        key: v.key,
        value: v.value,
        type: 'default'
      });
    });
  }
}

function populateEvents(postmanItem: Item | Collection, scratchPadCollection: SCollection) {

  let prerequest: Event = postmanItem.events.find(f => f.listen === 'prerequest', null);
  if (prerequest) {
    let prerequestScript: string = prerequest.script.exec.join('\n');
    if (prerequestScript !== '') {
      scratchPadCollection.prerequest = utils.sanitizeMultiline(prerequestScript);
    }
  }

  let tests: Event = postmanItem.events.find(f => f.listen === 'test', null);
  if (tests) {
    let testsScript: string = tests.script.exec.join('\n');
    if (testsScript !== '') {
      scratchPadCollection.tests = utils.sanitizeMultiline(testsScript);
    }
  }
}

function recreateCollectionFolder(collectionFolder: string) {

  if (fs.existsSync(collectionFolder)) {
    console.debug(`The folder "${collectionFolder}" exists already, it will be recreated` );
    fs.rmSync(collectionFolder, { recursive: true, force: true });
  }
  console.debug(`Folder "${collectionFolder}" created` );
  fs.mkdirSync(collectionFolder);
}

function saveFolderRecursive(folderPath: string, postmanCollection : Collection, isRoot: boolean = false): void {

  let itemCounter: number = 1;
  if (!isRoot)
    fs.mkdirSync(folderPath);

  postmanCollection.items.each((item: any) => {
    if (item.items) {
      let counter = utils.getCounterPrefix(itemCounter);
      saveFolderRecursive(folderPath + '/' + counter + utils.sanitizeFileName(item.name), item);
    } else {
      saveRequest(item, folderPath, itemCounter);
    }
    itemCounter++;
  });
}

function saveRequest(postmanItem: Item, folderPath: string, itemCounter: number): void {

  let counter: string = utils.getCounterPrefix(itemCounter);
  let scratchPadItem: SItem = {};

  populateDescription(postmanItem, scratchPadItem);
  scratchPadItem.method = postmanItem.request.method;
  scratchPadItem.url = postmanItem.request.url.toString();
  populateHeaders(postmanItem, scratchPadItem);
  scratchPadItem.auth = postmanItem.request.auth;
  populateBody(postmanItem, scratchPadItem);
  populateEvents(postmanItem, scratchPadItem);

  let sanitizedFileName: string = counter + utils.sanitizeFileName(postmanItem.name) + '.yaml';

  fs.writeFileSync(`${folderPath}/${sanitizedFileName}`, YAML.stringify(scratchPadItem));
  console.debug(`Generated file: "${folderPath}/${sanitizedFileName}"`);
}

function populateBody(item: Item, scratchPadItem: SItem) {

  if (item.request.body && item.request.body.raw) {
    scratchPadItem.body = utils.sanitizeMultiline(item.request.body.raw);
  }
}

function populateDescription(item: Item, scratchPadItem: SItem) {

  let descriptionDefinition: any = item.request.description;
  if (descriptionDefinition) {
    if (descriptionDefinition.content)
      scratchPadItem.description = descriptionDefinition.content;
    else
      scratchPadItem.description = descriptionDefinition;
  }
}

function populateHeaders(item: Item, scratchPadItem: SItem) {

  if (item.request.headers.contentSize() > 0) {
    scratchPadItem.headers = [];
    item.request.headers.each(h => {
      scratchPadItem.headers.push({
        key: h.key,
        value: h.value
      });
    });
  }
}

