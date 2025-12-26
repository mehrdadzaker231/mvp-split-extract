import fs from 'fs';
import Typesense from 'typesense';

import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
//https://bfritscher.github.io/typesense-dashboard/#/collection/items/search
//
const schema: CollectionCreateSchema = {
  name: 'items',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'item_code', type: 'string', facet: false },
    { name: 'short_code', type: 'string', facet: false },
    { name: 'description', type: 'string', facet: false },
  ],
  default_sorting_field: 'item_code',
};

const client = new Typesense.Client({
  nodes: [
    {
      host: 'localhost',
      port: 8108,
      protocol: 'http',
    },
  ],
  apiKey: 'xyz', // your Typesense admin key
  connectionTimeoutSeconds: 10,
});

async function createCollection() {
  try {
    await client.collections().create(schema);
    console.log('Collection created.');
  } catch (err: any) {
    if (err?.httpStatus === 400) {
      console.log('Collection already exists.');
    } else {
      console.error(err);
    }
  }
}
async function deleteCollection() {
  try {
    await client.collections('items').delete();
    console.log('Collection deleted.');
  } catch (err: any) {
    if (err?.httpStatus === 404) {
      console.log('Collection does not exist.');
    } else {
      console.error(err);
    }
  }
}

async function importCsv(): Promise<any> {
  const csvData = await fs.promises.readFile(__dirname + '/sample.jsonl', 'utf8');
  const result = await client.collections('items').documents().import(csvData);
  console.log('Import result: ', result);
  return result;
}

async function runExample() {
  try {
    // Delete if the collection already exists from a previous example run
    await deleteCollection();
  } catch (error) {
    // do nothing
  }

  try {
    // create a collection
    await createCollection();

    // Load documents from a JSON file, or API call, etc. into a variable
    // Here we already have documents in the `documents` variable.

    // Bulk import documents
    await importCsv();

    // Or if you have documents in JSONL format, and want to save the overhead of parsing JSON,
    // you can also pass a JSONL string to the import method:
    // await typesense.collections('companies').documents().import(documentsInJSONLFormat)

    let searchParameters = {
      q: 'hydro',
      query_by: 'item_code,short_code,description',
      sort_by: 'price:asc',
    };

    const results = await client.collections('items').documents().search(searchParameters);
    console.log('Search results: ', results);
  } catch (error) {
    console.log(error);
  } finally {
    // Cleanup
    //await client.collections('items').delete();
  }
}

runExample()
  .then(() => {
    console.log('Example run complete.');
  })
  .catch((error) => {
    console.error('Error running example:', error);
  });
