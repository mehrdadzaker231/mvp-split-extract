SELECT
    inv_mast."inv_mast_uid" as "inv_mast_uid",
    inv_mast."item_id" as "item_id",
    inv_mast."item_desc" as "item_desc",
    COALESCE(inv_mast."extended_desc", '') as "extended_desc",
    COALESCE(inv_mast."short_code", '') as "short_code",
    COALESCE(inv_mast."keywords", '') as "keywords",
    inv_mast."sales_pricing_unit" as "sales_pricing_unit",
    inv_mast."sales_pricing_unit_size" as "sales_pricing_unit_size",
    coalesce(inv_mast."default_product_group", '') as "default_product_group",
    inv_mast."class_id1" as "class_id1",
    product_group_data."product_group_desc" as "product_group_desc"
FROM inbound_normalized.p21_dbo_inv_mast AS inv_mast
LEFT JOIN (
    SELECT
        iloc."inv_mast_uid" as "inv_mast_uid",
        pg."product_group_id",
        pg."product_group_desc",
        ROW_NUMBER() OVER (PARTITION BY iloc."inv_mast_uid" ORDER BY iloc."inv_mast_uid") AS rn
    FROM inbound_normalized.p21_dbo_inv_loc AS iloc
    JOIN inbound_normalized.p21_dbo_product_group AS pg
        ON iloc."product_group_id" = pg."product_group_id"
) AS product_group_data
    ON product_group_data."inv_mast_uid" = inv_mast."inv_mast_uid"
    AND product_group_data.rn = 1
WHERE COALESCE(inv_mast."delete_flag", 'N') <> 'Y';
