import Typesense, { Client } from 'typesense';
import fs from 'fs';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

const collectionName = 'items_vector_ts';
//@ts-ignore
async function performSimilarSearch(client: Client) {
  let searchParameters = {
    q: '*',
    vector_query: 'embedding:([], id: id-080679)',
  } as any;

  // http://typesense.org/docs/29.0/api/vector-search.html#auto-generated-embeddings
  searchParameters = {
    q: 'can you look for tube and pvc',
    query_by: 'embedding',
    prefix: false,
    remote_embedding_timeout_ms: 5000,
    remote_embedding_num_tries: 3,
  };

  const results = await client.collections(collectionName).documents().search(searchParameters);
  if (results['hits'] && results['hits'].length > 0) {
    const hits = results['hits'];
    hits.forEach((hit: any) => {
      console.log({
        id: hit.document.id,
        short_code: hit.document.short_code,
        item_code: hit.document.item_code,
        description: hit.document.description,
      });
    });
  } else {
    console.log('No search results found.');
  }
}
//@ts-ignore
async function importData(client: Client): Promise<any> {
  const csvData = await fs.promises.readFile(__dirname + '/sample.jsonl', 'utf8');
  const result = await client.collections(collectionName).documents().import(csvData);
  console.log('Import result: ', result);
  return result;
}

const schema: CollectionCreateSchema = {
  name: collectionName,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'item_code', type: 'string', facet: false },
    { name: 'short_code', type: 'string', facet: false },
    { name: 'description', type: 'string', facet: false },
    {
      name: 'embedding',
      type: 'float[]',
      embed: {
        from: ['item_code', 'short_code', 'description'],
        model_config: {
          model_name: 'ts/e5-small',
        },
      },
    },
    // {
    //   name: 'embedding',
    //   type: 'float[]',
    //   embed: {
    //     from: ['item_code', 'short_code', 'description'],
    //     model_config: {
    //       model_name: 'openai/text-embedding-ada-002',
    //       api_key:
    //         '',
    //     },
    //   },
    // },
  ],
};

//@ts-ignore
async function createCollection(client: Client) {
  try {
    await client.collections().create(schema);
    console.log('Collection created.');
  } catch (err: any) {
    console.error(err);
    if (err?.httpStatus === 400) {
      console.log('Collection already exists.');
    } else {
      console.error(err);
    }
  }
}
//@ts-ignore
async function deleteCollection(client: Client) {
  try {
    await client.collections(collectionName).delete();
    console.log('Collection deleted.');
  } catch (err: any) {
    if (err?.httpStatus === 404) {
      console.log('Collection does not exist.');
    } else {
      console.error(err);
    }
  }
}

async function runExample() {
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

  // await deleteCollection(client);
  //await createCollection(client);
  //await importData(client);
  await performSimilarSearch(client);
}

runExample()
  .then(() => {
    console.log('Example run complete.');
  })
  .catch((error) => {
    console.error('Error running example:', error);
  });
