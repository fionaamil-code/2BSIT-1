-- S2-DBA-02: price as of a date. Run AFTER 0007.
-- HOW TO RUN: paste the WHOLE file in Supabase > SQL Editor > Run.
-- HOW TO READ THE RESULT: the editor ends with a red message that starts with
-- "TEST REPORT". That is NORMAL - it is how this test reports AND how it
-- undoes everything it did, so nothing is left in your database.
--   PASS = good.   FAIL = problem.   "got 22012" on a "check:" line = the check failed.
DO $test$
DECLARE
    t     RECORD;
    got   TEXT;
    rpt   TEXT := '';
    fails INT  := 0;
BEGIN
    FOR t IN
        SELECT * FROM (VALUES
            (1, 'PC0001 before its first price -> NULL', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2010-05-14') IS NULL$q$, 'OK'),
            (2, 'check: PC0001 on first price date = 499.99', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2010-05-15') = 499.99$q$, 'OK'),
            (3, 'check: PC0001 2010-07-11 = 499.99', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2010-07-11') = 499.99$q$, 'OK'),
            (4, 'check: PC0001 2010-07-12 = 454.54 (new price)', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2010-07-12') = 454.54$q$, 'OK'),
            (5, 'check: PC0001 in 2020 = 454.54 (latest)', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2020-01-01') = 454.54$q$, 'OK'),
            (6, 'check: MD0001 2010-07-31 = 119.68', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('MD0001','2010-07-31') = 119.68$q$, 'OK'),
            (7, 'check: MD0001 2010-08-01 = 131.65', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('MD0001','2010-08-01') = 131.65$q$, 'OK'),
            (8, 'NB0005 before 2011-02-01 -> NULL', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('NB0005','2011-01-31') IS NULL$q$, 'OK'),
            (9, 'check: NB0005 on 2011-02-01 = 1184.72', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('NB0005','2011-02-01') = 1184.72$q$, 'OK'),
            (10, 'check: product_prices_as_of(''2010-07-12'') has PC0001 = 454.54', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM product_prices_as_of('2010-07-12') WHERE prodcode = 'PC0001' AND unitprice = 454.54)$q$, 'OK'),
            (11, 'check: v_product_current_price has PC0001 = 454.54', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM v_product_current_price WHERE prodcode = 'PC0001' AND unitprice = 454.54)$q$, 'OK'),
            (12, 'add a product with no price', $q$INSERT INTO product (prodcode, description, unit) VALUES ('ZZ0001','TEST product','pc')$q$, 'OK'),
            (13, 'check: it is listed with NULL price', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM product_prices_as_of('2026-01-01') WHERE prodcode = 'ZZ0001' AND unitprice IS NULL)$q$, 'OK'),
            (14, 'soft-delete PC0001''s 2010-07-12 price', $q$UPDATE pricehist SET is_deleted = TRUE WHERE prodcode = 'PC0001' AND effdate = '2010-07-12'$q$, 'OK'),
            (15, 'check: deleted price ignored (back to 499.99)', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE price_as_of('PC0001','2010-08-01') = 499.99$q$, 'OK')
        ) AS v(n, label, stmt, expected)
        ORDER BY n
    LOOP
        got := 'OK';
        BEGIN
            EXECUTE t.stmt;
        EXCEPTION WHEN OTHERS THEN
            got := SQLSTATE;
        END;
        IF got = t.expected THEN
            rpt := rpt || E'\n  PASS  ' || lpad(t.n::text, 2) || '  ' || t.label;
        ELSE
            fails := fails + 1;
            rpt := rpt || E'\n  FAIL  ' || lpad(t.n::text, 2) || '  ' || t.label
                       || '  (expected ' || t.expected || ', got ' || got || ')';
        END IF;
    END LOOP;
    RAISE EXCEPTION E'TEST REPORT: % failed. (Everything was rolled back automatically.)%', fails, rpt;
END
$test$;
