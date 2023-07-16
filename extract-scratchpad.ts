import * as fs from 'fs';
import * as YAML from 'yaml';

import { Item, Collection, DescriptionDefinition, Event } from "postman-collection";
import {Utilities} from './lib/Utilities';

const utils = new Utilities();

main(process.argv);

function main(args:string[]) {

  let inputCollection: string = args[2];
  if (!inputCollection) {
    console.error(`Mandatory parameter missing: inputCollection`);
    printUsage();
    process.exit(1);
  }
  inputCollection = utils.resolveHome(inputCollection);

  let outputFolder: string = args[3];
  if (!outputFolder) {
    console.error(`Mandatory parameter missing: outputFolder`);
    process.exit(1);
  }
  outputFolder = utils.removeTrailingSlash(outputFolder);
  outputFolder = utils.resolveHome(outputFolder);

  let collection: Collection = new Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));
  let collectionFolder: string = outputFolder + '/' + collection.name;

  console.info(`Starting to extract the postman collection "${inputCollection}"`);

  recreateCollectionFolder(collectionFolder);
  saveCollectionSettings(collectionFolder, collection);
  saveFolderRecursive(collectionFolder, collection, true);

  console.info(`The collection was successfully extracted to "${collectionFolder}"`);
  process.exit(0);
}

function printUsage() {
  console.info('Usage: node extract-scratchpad.js [inputCollection] [outputFolder] ');
  console.info('Example: node extract-scratchpad.js ~/Postman/collections/my.postman_collection.json ~/Postman/collections/ ');
}

function saveCollectionSettings(collectionFolder: string, collection: Collection) {

  let counter: string = utils.getCounterPrefix(0);
  let folder: string = collectionFolder + '/' + counter + 'Collection';
  fs.mkdirSync(folder);
  let result: any = {};
  result.name = collection.name;
  result.id = collection.id;
  result.auth = collection.auth;
  if (collection.variables.count() > 0)
    result.variables = collection.variables;
  let prerequest: Event = collection.events.find(f => f.listen === 'prerequest', null);
  if (prerequest) {
    let prerequestScript: string = prerequest.script.exec.join('\n');
    if (prerequestScript !== '') {
      result.prerequest = utils.sanitizeMultiline(prerequestScript);
    }
  }

  let tests: Event = collection.events.find(f => f.listen === 'test', null);
  if (tests) {
    let testsScript: string = tests.script.exec.join('\n');
    if (testsScript !== '') {
      result.tests = utils.sanitizeMultiline(testsScript);
    }
  }

  fs.writeFileSync(folder + '/' + counter + 'Settings.yaml', YAML.stringify(result));
  console.debug(`Generated file: "${folder}/${counter}Settings.yaml"`);
}

function recreateCollectionFolder(collectionFolder: string) {

  if (fs.existsSync(collectionFolder)) {
    console.debug(`The folder "${collectionFolder}" exists already, it will be recreated` );
    fs.rmSync(collectionFolder, { recursive: true, force: true });
  }
  console.debug(`Folder "${collectionFolder}" created` );
  fs.mkdirSync(collectionFolder);
}

function saveFolderRecursive(folderPath: string, folder : any, isRoot: boolean = false): void {

  let itemCounter: number = 1;
  if (!isRoot)
    fs.mkdirSync(folderPath);

  folder.items.each(item => {
    if (item.items) {
      let counter = utils.getCounterPrefix(itemCounter);
      saveFolderRecursive(folderPath + '/' + counter + utils.sanitizeFileName(item.name), item);
    } else {
      saveRequest(item, folderPath, itemCounter);
    }
    itemCounter++;
  })

}

function saveRequest(item: Item, folderPath: string, itemCounter: number): void {

  let counter: string = utils.getCounterPrefix(itemCounter);
  let result: any = {};

  result.name = item.name;
  result.method = item.request.method;
  result.url = item.request.url.toString();

  let descriptionDefinition: DescriptionDefinition = (item.request.description as DescriptionDefinition);
  if (descriptionDefinition) {
    if (descriptionDefinition.content)
      result.description = descriptionDefinition.content;
    else
      result.description = (item.request.description as string);
  }

  result.auth = item.request.auth;
  if (item.request.headers.contentSize() > 0)
    result.headers = item.request.headers;

  if (item.request.body && item.request.body.raw) {
    result.body = utils.sanitizeMultiline(item.request.body.raw);
  }

  let prerequest: Event = item.events.find(f => f.listen === 'prerequest', null);
  if (prerequest) {
    let prerequestScript = prerequest.script.exec.join('\n');
    if (prerequestScript !== '') {
      result.prerequest = utils.sanitizeMultiline(prerequestScript);
    }
  }

  let tests: Event = item.events.find(f => f.listen === 'test', null);
  if (tests) {
    let testsScript = tests.script.exec.join('\n');
    if (testsScript !== '') {
      result.tests = utils.sanitizeMultiline(testsScript);
    }
  }

  let sanitizedFileName: string = counter + utils.sanitizeFileName(item.name) + '.yaml';

  fs.writeFileSync(folderPath + '/' + sanitizedFileName, YAML.stringify(result));
  console.debug(`Generated file: "${folderPath}/${sanitizedFileName}"`);
}



