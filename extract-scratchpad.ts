import { CollectionDefinition, Item, Collection, ItemGroup, ItemGroupDefinition, DescriptionDefinition, Event } from "postman-collection";
import * as fs from 'fs';
import * as YAML from 'yaml';

main();

function main() {

	let inputCollection: string = process.argv[2];
	if (!inputCollection) {
		console.error("Mandatory parameter missing: inputCollection");
		process.exit(1);
	}

	let outFolder: string = process.argv[3];
	if (!outFolder) {
		console.error("Mandatory parameter missing: output folder");
		process.exit(1);
	}

	let myCollection: Collection = new Collection(JSON.parse(fs.readFileSync(inputCollection).toString()));

	let collectionFolder: string = outFolder + '/' + myCollection.name;

	recreateCollectionFolder(collectionFolder);
	saveFolder(myCollection, collectionFolder, true);
	saveCollection(collectionFolder, myCollection);

	console.log('DONE');
	process.exit(0);
}

function saveCollection(collectionFolder, collection: Collection) {

	let counter: string = getCounter(0);
	let folder: string = collectionFolder + '/' + counter + 'Collection';
	fs.mkdirSync(folder);
	let result: any = {};
	result.id = collection.id;
	result.auth = collection.auth;
	if (collection.variables.count() > 0)
		result.variables = collection.variables;
	let prerequest: Event = collection.events.find(f => f.listen === 'prerequest', null);
	if (prerequest) {
		let prerequestScript: string = prerequest.script.exec.join('\n');
		if (prerequestScript !== '') {
			result.prerequest = sanitizeMultiline(prerequestScript);
		}
	}

	let tests: Event = collection.events.find(f => f.listen === 'test', null);
	if (tests) {
		let testsScript: string = tests.script.exec.join('\n');
		if (testsScript !== '') {
			result.tests = sanitizeMultiline(testsScript);
		}
	}

	fs.writeFileSync(folder + '/' + counter + 'Settings.yaml', YAML.stringify(result));
}

function recreateCollectionFolder(collectionFolder: string) {

	if (fs.existsSync(collectionFolder)) {
		fs.rmSync(collectionFolder, { recursive: true, force: true });
	}
	fs.mkdirSync(collectionFolder);
}

function saveFolder(folder, folderPath: string, isRoot:boolean=false): void {

	let itemCounter: number = 1;
	if (!isRoot)
		fs.mkdirSync(folderPath);

	folder.items.each(item=> {
		if (item.items) {
			let counter = getCounter(itemCounter);
			saveFolder(item, folderPath + '/' + counter + sanitizeName(item.name));
		} else {
			saveRequest(item, folderPath, itemCounter);
		}
		itemCounter++;
	})

}

function saveRequest(item: Item, folderPath: string, itemCounter: number): void {

	let counter: string = getCounter(itemCounter);
	let result : any = 	{}

	result.method = item.request.method;
	result.url = item.request.url.toString();

	let descriptionDefinition: DescriptionDefinition= (item.request.description as DescriptionDefinition);
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
		result.body = sanitizeMultiline(item.request.body.raw);
	}

	let prerequest: Event = item.events.find(f => f.listen === 'prerequest', null);
	if (prerequest) {
		let prerequestScript = prerequest.script.exec.join('\n');
		if (prerequestScript !== '') {
			result.prerequest = sanitizeMultiline(prerequestScript);
		}
	}

	let tests: Event = item.events.find(f => f.listen === 'test', null);
	if (tests) {
		let testsScript = tests.script.exec.join('\n');
		if (testsScript !== '') {
			result.tests = sanitizeMultiline(testsScript);
		}
	}

	let sanitizedFileName: string = counter + sanitizeName(item.name) + '.yaml';

	fs.writeFileSync(folderPath + '/' + sanitizedFileName, YAML.stringify(result));
}

function sanitizeName(name: string): string {
	if (!name)
		return name;
	return name.replace(/[\/\<\>\:\*\t]/g,'');
}

function sanitizeMultiline(text: string): string {
	if (!text)
		return text;
	return text.replace(/\r/g,'');
}

function getCounter(itemCounter: number): string {
	return itemCounter.toString().padStart(2, '0') + '00 ';
}
