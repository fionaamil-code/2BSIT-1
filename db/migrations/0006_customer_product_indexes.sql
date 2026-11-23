-- =====================================================================
-- 0006_customer_product_indexes.sql    Task: S2-DBA-01
-- Active views already exist from 0001 (customer_active, product_active, ...).
-- This file adds the indexes the Customer and Product screens need:
--   * search box (ILIKE '%text%')  -> trigram indexes (pg_trgm)
--   * foreign keys (Postgres does NOT index these automatically)
-- Run AFTER 0005.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Search: only live rows are searched, so index only live rows.
CREATE INDEX IF NOT EXISTS customer_custname_trgm_idx ON customer
    USING gin (custname extensions.gin_trgm_ops) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS customer_address_trgm_idx ON customer
    USING gin (address extensions.gin_trgm_ops) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS product_description_trgm_idx ON product
    USING gin (description extensions.gin_trgm_ops) WHERE NOT is_deleted;

-- Foreign keys used by joins and by the "active children" delete checks.
CREATE INDEX IF NOT EXISTS sales_custno_idx        ON sales (custno);
CREATE INDEX IF NOT EXISTS salesdetail_prodcode_idx ON salesdetail (prodcode);
CREATE INDEX IF NOT EXISTS pricehist_prod_eff_idx  ON pricehist (prodcode, effdate DESC)
    WHERE NOT is_deleted;                                  -- also serves "price as of a date"


-- Verify (expected: the 6 indexes above):
--   SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
--    AND indexname IN ('customer_custname_trgm_idx','customer_address_trgm_idx',
--      'product_description_trgm_idx','sales_custno_idx','salesdetail_prodcode_idx',
--      'pricehist_prod_eff_idx');
-- Views exist (expected 2 rows):
--   SELECT table_name FROM information_schema.views
--    WHERE table_schema='public' AND table_name IN ('customer_active','product_active');
