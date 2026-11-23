-- =====================================================================
-- S2-DBA-06: search performance check and index tuning
-- RUN ONE NUMBERED SECTION AT A TIME: highlight it, then press Ctrl+Enter
-- (or paste it alone and click Run). Needs 0006 applied (pg_trgm).
-- The real tables only have ~80 rows, where Postgres CORRECTLY ignores indexes,
-- so we test on a big scratch table and delete it at the end.
-- Copy the "Execution Time" and the plan type (Seq Scan / Bitmap Index Scan)
-- from steps 2 and 4 into your PR description.
-- =====================================================================

-- 1. Build a scratch table with 200,000 fake customers
CREATE TABLE perf_customer AS
SELECT 'C' || lpad(g::text, 6, '0') AS custno,
       'Customer ' || md5(g::text)  AS custname
  FROM generate_series(1, 200000) g;
ANALYZE perf_customer;

-- 2. BEFORE the index (expect: Seq Scan, tens of milliseconds)
EXPLAIN ANALYZE SELECT * FROM perf_customer WHERE custname ILIKE '%7f3a9%';

-- 3. Add the same kind of index as 0006
CREATE INDEX perf_customer_trgm_idx ON perf_customer
    USING gin (custname extensions.gin_trgm_ops);
ANALYZE perf_customer;

-- 4. AFTER the index (expect: Bitmap Index Scan, a few milliseconds)
EXPLAIN ANALYZE SELECT * FROM perf_customer WHERE custname ILIKE '%7f3a9%';

-- 5. Check the REAL query the Customer screen runs (small table: Seq Scan is fine)
EXPLAIN ANALYZE SELECT * FROM customer_active WHERE custname ILIKE '%corp%';

-- 6. Which indexes are used? idx_scan = 0 for a long time means "unused"
SELECT relname AS table_name, indexrelname AS index_name, idx_scan
  FROM pg_stat_user_indexes
 WHERE schemaname = 'public'
 ORDER BY idx_scan, relname;

-- 7. CLEAN UP (do not forget!)
DROP TABLE perf_customer;
