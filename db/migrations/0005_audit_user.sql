-- =====================================================================
-- 0005_audit_user.sql                  Task: S1-DBA-06
-- Makes audit_user() report the LOGGED-IN APP USER (not the shared DB login)
-- in audit_log.action_by and in the row stamp.
--   * audit_user()  : app user if set, else the database login; max 50 chars
--                     (audit_log.action_by is VARCHAR(50))
--   * audit_stamp() : stamp shows the part before '@', max 20 chars, so the
--                     stamp always fits VARCHAR(60), e.g. EDIT caberto 2026-10-12 11:18 AM
--   * set_app_user(): helper the server calls before each write
-- Run AFTER 0004.
-- =====================================================================

CREATE OR REPLACE FUNCTION audit_user() RETURNS TEXT
LANGUAGE sql STABLE AS $$
    SELECT left(COALESCE(NULLIF(btrim(current_setting('app.username', true)), ''),
                         session_user::text), 50);
$$;

CREATE OR REPLACE FUNCTION audit_stamp(p_action TEXT) RETURNS TEXT
LANGUAGE sql STABLE AS $$
    SELECT p_action || ' ' || left(split_part(audit_user(), '@', 1), 20) || ' ' ||
           to_char(now() AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD HH12:MI AM');
$$;

-- Tells the database who is acting.  The 'true' makes it last only until the
-- end of the CURRENT TRANSACTION, so it can never leak to another user when
-- connections are shared (pooling).
CREATE OR REPLACE FUNCTION set_app_user(p_user TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('app.username', COALESCE(btrim(p_user), ''), true);
END;
$$;


-- =====================================================================
-- HAND-OFF TO THE DEVELOPER: every write must look like this, in ONE transaction
--     BEGIN;
--     SELECT set_app_user('user@email.com');    -- the logged-in user
--     UPDATE customer SET address = '...' WHERE custno = 'C0001';
--     COMMIT;
-- If the app uses a pooled connection, set_app_user must be in the same
-- transaction as the write, otherwise action_by falls back to the DB login.
-- Test: run tests/S1-DBA-06_audit_user_test.sql
-- =====================================================================
