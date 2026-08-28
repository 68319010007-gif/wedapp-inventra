-- Empty barcode strings violate unique constraint when multiple products have no barcode.
-- PostgreSQL treats NULL as distinct for unique indexes; empty string is a duplicate value.
UPDATE "Product" SET "barcode" = NULL WHERE "barcode" = '';
