-- S2-DBA-03: validation constraints. Run AFTER 0008.
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
            (1, 'payterm N30 rejected (23514)', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ001','T','x','N30')$q$, '23514'),
            (2, 'payterm ''Net 30'' too long (22001)', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ002','T','x','Net 30')$q$, '22001'),
            (3, 'payterm NULL rejected (23502)', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ003','T','x',NULL)$q$, '23502'),
            (4, 'payterm COD accepted', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ004','T','x','COD')$q$, 'OK'),
            (5, 'payterm 30D accepted', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ005','T','x','30D')$q$, 'OK'),
            (6, 'payterm 45D accepted', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ006','T','x','45D')$q$, 'OK'),
            (7, 'blank customer name rejected (23514)', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ007','   ','x','COD')$q$, '23514'),
            (8, 'NULL customer name rejected (23502)', $q$INSERT INTO customer (custno,custname,address,payterm) VALUES ('ZZ008',NULL,'x','COD')$q$, '23502'),
            (9, 'unit ''pcs'' rejected (23514) - the prototype uses this', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0001','T','pcs')$q$, '23514'),
            (10, 'unit ''meter'' too long (22001)', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0002','T','meter')$q$, '22001'),
            (11, 'unit NULL rejected (23502)', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0003','T',NULL)$q$, '23502'),
            (12, 'all 5 valid units accepted', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0004','T','pc'),('ZZ0005','T','ea'),('ZZ0006','T','mtr'),('ZZ0007','T','pkg'),('ZZ0008','T','ltr')$q$, 'OK'),
            (13, 'blank product description rejected (23514)', $q$INSERT INTO product (prodcode,description,unit) VALUES ('ZZ0009','  ','pc')$q$, '23514'),
            (14, 'price 0 rejected (23514)', $q$INSERT INTO pricehist (effdate,prodcode,unitprice) VALUES ('2030-01-01','AD0001',0)$q$, '23514'),
            (15, 'negative quantity rejected (23514)', $q$INSERT INTO salesdetail (transno,prodcode,quantity) VALUES ('TR000001','AD0004',-1)$q$, '23514')
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
