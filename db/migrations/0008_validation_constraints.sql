-- =====================================================================
-- 0008_validation_constraints.sql      Task: S2-DBA-03
-- 0001 already has CHECKs for customer.payterm and product.unit.  This file:
--   * gives them clear names (they show up in error messages)
--   * makes the key text columns NOT NULL and not blank
-- Allowed values (from the professor's file):
--   payterm : COD, 30D, 45D          unit : pc, ea, mtr, pkg, ltr
-- Run AFTER 0007.
-- =====================================================================

ALTER TABLE customer RENAME CONSTRAINT pay_ck  TO customer_payterm_ck;
ALTER TABLE product  RENAME CONSTRAINT unit_ck TO product_unit_ck;

ALTER TABLE customer
    ALTER COLUMN custname SET NOT NULL,
    ALTER COLUMN payterm  SET NOT NULL;
ALTER TABLE customer
    ADD CONSTRAINT customer_custname_notblank_ck CHECK (btrim(custname) <> '');

ALTER TABLE product
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN unit        SET NOT NULL;
ALTER TABLE product
    ADD CONSTRAINT product_description_notblank_ck CHECK (btrim(description) <> '');


-- Error codes the app can translate into friendly messages:
--   23514 check_violation        wrong payterm/unit, blank name/description
--   23502 not_null_violation     missing value
--   22001 string too long        e.g. 'Net 30' does not fit payterm VARCHAR(3)
-- NOTE FOR THE TEAM: the prototype uses free text ("Net 30", "pcs", "meter").
-- The real screens must use DROP-DOWNS with the database codes above.
-- Test: tests/S2-DBA-03_constraints_test.sql
