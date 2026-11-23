-- =====================================================================
-- 0007_price_as_of.sql                 Task: S2-DBA-02
-- "What was the price of a product on a given date?"
--   price_as_of(prodcode, date)   one product
--   product_prices_as_of(date)    every live product (price is NULL if none yet)
--   v_product_current_price       the Products screen's "Current Price" column
-- Rule: the price row with the latest effDate that is on or before the date.
-- Soft-deleted price rows are ignored.  "Today" is Manila time.
-- Run AFTER 0006.
-- =====================================================================

CREATE OR REPLACE FUNCTION price_as_of(
    p_prodcode VARCHAR,
    p_date     DATE DEFAULT (now() AT TIME ZONE 'Asia/Manila')::date
) RETURNS NUMERIC
LANGUAGE sql STABLE AS $$
    SELECT ph.unitprice
      FROM pricehist ph
     WHERE ph.prodcode = p_prodcode
       AND ph.effdate <= p_date
       AND NOT ph.is_deleted
     ORDER BY ph.effdate DESC
     LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION product_prices_as_of(
    p_date DATE DEFAULT (now() AT TIME ZONE 'Asia/Manila')::date
) RETURNS TABLE (prodcode VARCHAR, description VARCHAR, unit VARCHAR,
                 unitprice NUMERIC, price_effdate DATE)
LANGUAGE sql STABLE AS $$
    SELECT p.prodcode, p.description, p.unit, cp.unitprice, cp.effdate
      FROM product p
      LEFT JOIN LATERAL (
            SELECT ph.unitprice, ph.effdate
              FROM pricehist ph
             WHERE ph.prodcode = p.prodcode
               AND ph.effdate <= p_date
               AND NOT ph.is_deleted
             ORDER BY ph.effdate DESC
             LIMIT 1) cp ON TRUE
     WHERE NOT p.is_deleted;
$$;

CREATE OR REPLACE VIEW v_product_current_price AS
SELECT * FROM product_prices_as_of();


-- Try it (one statement at a time):
--   SELECT price_as_of('PC0001', '2010-07-11');   -- 499.99
--   SELECT price_as_of('PC0001', '2010-07-12');   -- 454.54  (price changed that day)
--   SELECT price_as_of('PC0001', '2010-05-14');   -- NULL    (no price yet)
--   SELECT * FROM product_prices_as_of('2010-07-12') ORDER BY prodcode;
--   SELECT * FROM v_product_current_price ORDER BY prodcode;
-- Used later by Sales: unit price of a line = price_as_of(prodcode, salesDate).
-- Test: tests/S2-DBA-02_price_as_of_test.sql

-- Row Level Security (db/README rule 7): Supabase exposes public tables through its web API.
-- RLS ON with no policies = the web API gets nothing; the server's direct database
-- connection (DATABASE_URL, postgres role) is not affected.
ALTER VIEW v_product_current_price SET (security_invoker = true);
