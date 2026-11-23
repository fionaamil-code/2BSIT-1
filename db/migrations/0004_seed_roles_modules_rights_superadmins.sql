-- =====================================================================
-- 0004_seed_roles_modules_rights_superadmins.sql     Task: S1-DBA-05
-- Seeds: 3 roles, 5 modules, the rights catalogue (36 action rights +
-- 5 module switches), and one superadmin per team member.
-- NO PASSWORDS are stored: password_hash stays NULL and must_set_password
-- is TRUE, so each person sets their first password through a one-time link.
-- Run AFTER 0003.  Safe to run twice (ON CONFLICT DO NOTHING).
-- =====================================================================

SELECT set_config('app.username', 'seed', true);   -- stamps will say "ADD seed ..."

-- 1. Roles ---------------------------------------------------------------------
INSERT INTO app_role (role_id, role_name, description) VALUES
    (1, 'superadmin', 'System owner: everything, incl. assigning admins'),
    (2, 'admin',      'Manager: manages Users and their rights; cannot see Superadmins'),
    (3, 'user',       'Staff: only the rights an admin has granted')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Modules ---------------------------------------------------------------------
INSERT INTO app_module (module_code, module_name, sort_order) VALUES
    ('customers', 'Customer Management', 1),
    ('products',  'Product Management',  2),
    ('hr',        'Human Resources',     3),
    ('sales',     'Sales',               4),
    ('reports',   'Reports',             5)
ON CONFLICT (module_code) DO NOTHING;

-- 3. Rights catalogue (keys match the prototype's ALL_PERMS) ----------------------
INSERT INTO app_right (right_code, module_code, right_name, is_module_switch, sort_order) VALUES
    -- module switches (5)
    ('customers.view',  'customers', 'View Customers',        TRUE, 0),
    ('products.view',   'products',  'View Products',         TRUE, 0),
    ('hr.view',         'hr',        'View Human Resources',  TRUE, 0),
    ('sales.view',      'sales',     'View Sales',            TRUE, 0),
    ('reports.view',    'reports',   'View Reports',          TRUE, 0),
    -- Customer (3)
    ('customers.add',    'customers', 'Add Customer',    FALSE, 1),
    ('customers.edit',   'customers', 'Edit Customer',   FALSE, 2),
    ('customers.delete', 'customers', 'Delete Customer', FALSE, 3),
    -- Product (6)
    ('products.add',         'products', 'Add Product',    FALSE, 1),
    ('products.edit',        'products', 'Edit Product',   FALSE, 2),
    ('products.delete',      'products', 'Delete Product', FALSE, 3),
    ('products.priceAdd',    'products', 'Add Price',      FALSE, 4),
    ('products.priceEdit',   'products', 'Edit Price',     FALSE, 5),
    ('products.priceDelete', 'products', 'Delete Price',   FALSE, 6),
    -- Human Resources (13)
    ('hr.jobAdd',     'hr', 'Add Job',            FALSE, 1),
    ('hr.jobEdit',    'hr', 'Edit Job',           FALSE, 2),
    ('hr.jobDelete',  'hr', 'Delete Job',         FALSE, 3),
    ('hr.deptAdd',    'hr', 'Add Department',     FALSE, 4),
    ('hr.deptEdit',   'hr', 'Edit Department',    FALSE, 5),
    ('hr.deptDelete', 'hr', 'Delete Department',  FALSE, 6),
    ('hr.empAdd',     'hr', 'Add Employee',       FALSE, 7),
    ('hr.empEdit',    'hr', 'Edit Employee',      FALSE, 8),
    ('hr.empDelete',  'hr', 'Delete Employee',    FALSE, 9),
    ('hr.jhView',     'hr', 'View Job History',   FALSE, 10),
    ('hr.jhAdd',      'hr', 'Add Job History',    FALSE, 11),
    ('hr.jhEdit',     'hr', 'Edit Job History',   FALSE, 12),
    ('hr.jhDelete',   'hr', 'Delete Job History', FALSE, 13),
    -- Sales (7)
    ('sales.add',          'sales', 'Add Sale',            FALSE, 1),
    ('sales.edit',         'sales', 'Edit Sale',           FALSE, 2),
    ('sales.delete',       'sales', 'Delete Sale',         FALSE, 3),
    ('sales.detailView',   'sales', 'View Sale Details',   FALSE, 4),
    ('sales.detailAdd',    'sales', 'Add Sale Detail',     FALSE, 5),
    ('sales.detailEdit',   'sales', 'Edit Sale Detail',    FALSE, 6),
    ('sales.detailDelete', 'sales', 'Delete Sale Detail',  FALSE, 7),
    -- Reports (7)
    ('reports.topCustomers',    'reports', 'Top Customers',         FALSE, 1),
    ('reports.productMaster',   'reports', 'Product Master List',   FALSE, 2),
    ('reports.topProducts',     'reports', 'Top Products',          FALSE, 3),
    ('reports.activeEmployees', 'reports', 'Active Employees',      FALSE, 4),
    ('reports.allEmployees',    'reports', 'All Employees',         FALSE, 5),
    ('reports.empJobHistory',   'reports', 'Employee Job History',  FALSE, 6),
    ('reports.topSales',        'reports', 'Top Sales',             FALSE, 7)
ON CONFLICT (right_code) DO NOTHING;

-- 4. One superadmin per team member ------------------------------------------------
-- >>> EDIT THIS LIST BEFORE RUNNING: real first names and real e-mail addresses
-- >>> (lower-case).  The script refuses to run while placeholders remain.
CREATE TEMP TABLE seed_member (
    email VARCHAR(100), first_name VARCHAR(40), last_name VARCHAR(40)
) ON COMMIT DROP;

INSERT INTO seed_member (email, first_name, last_name) VALUES
    ('roddneycaberto@gmail.com',  'Xyd Roddney', 'Caberto'),
    ('bervelynkim123@gmail.com', 'Bervelyn Kim', 'Dollesin'),
    ('dorothyfaith.cosa@neu.edu.ph',     'Dorothy Faith', 'Cosa'),
    ('fionajoy.amil@neu.edu.ph',     'Fiona Joy', 'Amil');

DO $chk$
BEGIN
    IF EXISTS (SELECT 1 FROM seed_member
                WHERE email LIKE '%example.com' OR first_name = 'REPLACE') THEN
        RAISE EXCEPTION 'Edit the seed_member list (real first names and e-mails) before running this file. Nothing was changed.';
    END IF;
END
$chk$;

INSERT INTO app_user (email, first_name, last_name, role_id, account_status, must_set_password)
SELECT lower(email), first_name, last_name, 1, 'approved', TRUE
  FROM seed_member
ON CONFLICT (email) DO NOTHING;


-- =====================================================================
-- Verify (run as ONE statement; expected: 3 | 5 | 36 | 5 | 4)
--   SELECT (SELECT count(*) FROM app_role)                                   AS roles,
--          (SELECT count(*) FROM app_module)                                 AS modules,
--          (SELECT count(*) FROM app_right WHERE NOT is_module_switch)       AS action_rights,
--          (SELECT count(*) FROM app_right WHERE is_module_switch)           AS module_switches,
--          (SELECT count(*) FROM app_user  WHERE role_id = 1
--                                           AND password_hash IS NULL)       AS superadmins_no_password;
-- Rights per module (expected customers 3, products 6, hr 13, sales 7, reports 7):
--   SELECT module_code, count(*) FROM app_right
--    WHERE NOT is_module_switch GROUP BY module_code ORDER BY module_code;
-- Nothing secret in the repo: this file contains no passwords and no hashes.
-- Role note: superadmin and admin get full access from their ROLE, so they need
-- no rows in user_permission (confirm this with the developer).
-- =====================================================================
