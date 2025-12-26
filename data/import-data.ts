import Typesense, { Client } from 'typesense';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import yargs from 'yargs';
import fs from 'fs';

interface ParsedArgs {
  tenant: string;
  apiKey: string;
  fileName: string;
}

function parseArgs(): ParsedArgs {
  const argv = yargs(process.argv.slice(2))
    .usage('Usage: Import Items Data from a Tenant')
    .options({
      tenant: {
        alias: 'tenant',
        describe: `Filter By Tenant`,
      },
      apiKey: {
        alias: 'apiKey',
        describe: `API Key for Typesense`,
      },
      fileName: {
        alias: 'fileName',
        describe: `Name of the data file`,
      },
    })
    .version(false)
    .help().argv as ParsedArgs;
  return argv;
}

async function createCollection(schema: CollectionCreateSchema, client: Client) {
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

//@ts-ignore
async function deleteCollection(client: Client, collectionName: string) {
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

function toTypesenseDoc(raw: any) {
  const itemId = raw.inv_mast_uid;

  return {
    // Typesense id should be a string
    id: String(itemId),

    // You need something for item_code (since schema expects it)
    item_code: String(itemId),

    short_code: raw.short_code ?? '',

    // schema: description
    description: raw.item_desc ?? '',

    sales_pricing_unit: String(raw.sales_pricing_unit) ?? '',

    // ensure number for float
    sales_pricing_unit_size:
      raw.sales_pricing_unit_size === '' || raw.sales_pricing_unit_size == null
        ? 0
        : Number(raw.sales_pricing_unit_size),

    // schema: item_group_name
    item_group_name: raw.product_group_desc ?? '',

    // schema: item_class
    item_class: raw.class_id1 ?? '',
  };
}

async function importCsv(client: Client, collectionName: string, fileName: string): Promise<any> {
  const filePath = __dirname + '/' + fileName;
  const text = await fs.promises.readFile(filePath, 'utf8');
  const mappedLines: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const raw = JSON.parse(trimmed);
    const doc = toTypesenseDoc(raw);
    mappedLines.push(JSON.stringify(doc));
  }

  const mappedJsonl = mappedLines.join('\n');
  const result = await client.collections(collectionName).documents().import(mappedJsonl, { action: 'upsert' });
  console.log('Import result: ', result);
  return result;
}

async function main() {
  const { tenant, apiKey, fileName } = parseArgs();

  const client = new Typesense.Client({
    nodes: [
      {
        host: 'localhost',
        port: 8108,
        protocol: 'http',
      },
    ],
    apiKey: apiKey, // your Typesense admin key
    connectionTimeoutSeconds: 10,
  });
  const collectionName = `${tenant}_items`;
  const schema: CollectionCreateSchema = {
    name: collectionName,
    fields: [
      { name: 'id', type: 'string' },
      { name: 'item_code', type: 'string', facet: false, sort: true },
      { name: 'short_code', type: 'string', facet: false },
      { name: 'description', type: 'string', facet: false },
      { name: 'sales_pricing_unit', type: 'string', facet: false },
      { name: 'sales_pricing_unit_size', type: 'float', facet: false },
      { name: 'item_group_name', type: 'string', facet: false },
      { name: 'item_class', type: 'string', facet: false },
    ],
    default_sorting_field: 'item_code',
  };
  await createCollection(schema, client);
  await importCsv(client, collectionName, fileName);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
  });
