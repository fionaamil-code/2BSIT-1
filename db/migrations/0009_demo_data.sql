-- =====================================================================
-- 0009_demo_data.sql                   Task: S2-DBA-05
-- Small demo set (names start with "DEMO") for customer, product, price history.
-- Covers the cases the screens must show:
--   C0083 C0084 C0085  normal customers, no sales (deletable)
--   C0086              soft-deleted customer  -> Inactive row + Restore button
--   DM0001             3 prices incl. one in the FUTURE (not current yet)
--   DM0002             2 prices
--   DM0003             NO price -> Current Price shows "-"
--   DM0004             soft-deleted product (and its price)
-- For "delete blocked by active children" use an existing row, e.g. customer C0001.
-- Run AFTER 0008.  Skips itself if already loaded.
-- =====================================================================

DO $demo$
DECLARE
    today DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
    IF EXISTS (SELECT 1 FROM customer WHERE custno = 'C0083') THEN
        RAISE NOTICE 'Demo data already loaded - skipped.';
        RETURN;
    END IF;

    PERFORM set_app_user('demo-seed');

    INSERT INTO customer (custno, custname, address, payterm) VALUES
        ('C0083', 'DEMO Acme Trading',  '123 Demo Street, Sample City', '30D'),
        ('C0084', 'DEMO Globex Retail', '456 Demo Avenue, Sample City', '45D'),
        ('C0085', 'DEMO Initech Co',    '789 Demo Road, Sample City',   'COD'),
        ('C0086', 'DEMO Umbrella Corp', '1 Demo Boulevard, Sample City','COD');

    INSERT INTO product (prodcode, description, unit) VALUES
        ('DM0001', 'DEMO Widget A',     'pc'),
        ('DM0002', 'DEMO Cable 2.5mm',  'mtr'),
        ('DM0003', 'DEMO Gloves XL',    'pkg'),
        ('DM0004', 'DEMO Oil 5L',       'ltr');

    INSERT INTO pricehist (effdate, prodcode, unitprice) VALUES
        (today - 300, 'DM0001', 12.50),
        (today - 120, 'DM0001', 13.75),
        (today +  60, 'DM0001', 15.00),     -- future: not the current price yet
        (today - 200, 'DM0002',  2.15),
        (today -  30, 'DM0002',  2.35),
        (today - 100, 'DM0004',  8.50);

    -- soft-delete: children first, then the parent
    UPDATE pricehist SET is_deleted = TRUE WHERE prodcode = 'DM0004';
    UPDATE product   SET is_deleted = TRUE WHERE prodcode = 'DM0004';
    UPDATE customer  SET is_deleted = TRUE WHERE custno   = 'C0086';
END
$demo$;


-- Verify (expected: 3 live demo customers + 1 deleted; 3 live demo products):
--   SELECT custno, custname, is_deleted, stamp FROM customer WHERE custno >= 'C0083' ORDER BY custno;
--   SELECT * FROM v_product_current_price WHERE prodcode LIKE 'DM%' ORDER BY prodcode;
--     -> DM0001 13.75, DM0002 2.35, DM0003 NULL   (DM0004 hidden: deleted)
