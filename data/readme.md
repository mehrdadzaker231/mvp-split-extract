```
export $TYPESENSE_API_KEY = "xyz"
docker run -p 8108:8108 \
            -v"$(pwd)"/typesense-data:/data typesense/typesense:29.0 \
            --data-dir /data \
            --api-key=$TYPESENSE_API_KEY \
            --enable-cors
```

**Typesense Collection Schema (ERP Agnostic)**

The import script will create a collection with the following schema:

```json
{
  "name": "<tenant>_items",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "item_code", "type": "string", "facet": false, "sort": true },
    { "name": "short_code", "type": "string", "facet": false },
    { "name": "description", "type": "string", "facet": false },
    { "name": "sales_pricing_unit", "type": "string", "facet": false },
    { "name": "sales_pricing_unit_size", "type": "float", "facet": false },
    { "name": "item_group_name", "type": "string", "facet": false },
    { "name": "item_class", "type": "string", "facet": false }
  ],
  "default_sorting_field": "item_code"
}
```

**TypeScript Interface Example**

The following TypeScript interface matches the Typesense schema above:

```typescript
export interface ERPItem {
  id: string;
  item_code: string;
  short_code: string;
  description: string;
  sales_pricing_unit: string;
  sales_pricing_unit_size: number;
  item_group_name: string;
  item_class: string;
}
```

**Importing Items**

```
npm run import:items -- --tenant ewing --apiKey xyz --fileName output.jsonl
```
