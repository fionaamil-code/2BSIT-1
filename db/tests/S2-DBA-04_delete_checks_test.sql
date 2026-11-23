-- S2-DBA-04: child-record delete checks for customer and product. Run AFTER 0001 (any later is fine).
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
            (1, 'customer C0001 has active sales -> soft delete blocked', $q$UPDATE customer SET is_deleted = TRUE WHERE custno = 'C0001'$q$, 'P0001'),
            (2, 'product AD0001 is on active sale lines -> blocked', $q$UPDATE product SET is_deleted = TRUE WHERE prodcode = 'AD0001'$q$, 'P0001'),
            (3, 'hard DELETE of a customer is blocked', $q$DELETE FROM customer WHERE custno = 'C0001'$q$, 'P0001'),
            (4, 'hard DELETE of a product is blocked', $q$DELETE FROM product WHERE prodcode = 'AD0001'$q$, 'P0001'),
            (5, 'create throw-away customer ZZ001', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ001','TEST customer','x','COD')$q$, 'OK'),
            (6, 'customer with no children can be soft-deleted', $q$UPDATE customer SET is_deleted = TRUE WHERE custno = 'ZZ001'$q$, 'OK'),
            (7, 'check: stamp starts with DELETE', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM customer WHERE custno='ZZ001' AND is_deleted AND stamp LIKE 'DELETE %')$q$, 'OK'),
            (8, 'check: customer_active hides it', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE NOT EXISTS (SELECT 1 FROM customer_active WHERE custno='ZZ001')$q$, 'OK'),
            (9, 'restore it', $q$UPDATE customer SET is_deleted = FALSE WHERE custno = 'ZZ001'$q$, 'OK'),
            (10, 'check: stamp starts with RESTORE', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM customer WHERE custno='ZZ001' AND NOT is_deleted AND stamp LIKE 'RESTORE %')$q$, 'OK'),
            (11, 'create customer ZZ002', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ002','TEST customer 2','x','COD')$q$, 'OK'),
            (12, 'give ZZ002 one sale', $q$INSERT INTO sales (transno,salesdate,custno,empno) VALUES ('TRZ00001', CURRENT_DATE, 'ZZ002', '00005')$q$, 'OK'),
            (13, 'ZZ002 has an active sale -> blocked', $q$UPDATE customer SET is_deleted = TRUE WHERE custno = 'ZZ002'$q$, 'P0001'),
            (14, 'soft-delete that sale', $q$UPDATE sales SET is_deleted = TRUE WHERE transno = 'TRZ00001'$q$, 'OK'),
            (15, 'ZZ002 now deletable (only DELETED children left)', $q$UPDATE customer SET is_deleted = TRUE WHERE custno = 'ZZ002'$q$, 'OK'),
            (16, 'create product ZZ0001', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0001','TEST product','pc')$q$, 'OK'),
            (17, 'give it one price', $q$INSERT INTO pricehist (effdate,prodcode,unitprice) VALUES (DATE '2026-01-01','ZZ0001',10)$q$, 'OK'),
            (18, 'product with an active price -> blocked', $q$UPDATE product SET is_deleted = TRUE WHERE prodcode = 'ZZ0001'$q$, 'P0001'),
            (19, 'soft-delete the price', $q$UPDATE pricehist SET is_deleted = TRUE WHERE prodcode = 'ZZ0001'$q$, 'OK'),
            (20, 'product now deletable', $q$UPDATE product SET is_deleted = TRUE WHERE prodcode = 'ZZ0001'$q$, 'OK'),
            (21, 'check: audit_log recorded the DELETE of ZZ001', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM audit_log WHERE table_name='customer' AND record_key='ZZ001' AND action='DELETE')$q$, 'OK')
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
