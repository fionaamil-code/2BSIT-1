-- =====================================================================
-- 0002_users_roles_rights.sql          Task: S1-DBA-03
-- Tables: app_role, app_module, app_right, app_user, user_permission
-- Same pattern as the HOPE tables: is_deleted (soft delete) + stamp + audit.
-- Run AFTER 0001.  Run once.
-- =====================================================================

-- 0. Never copy secrets into audit_log ------------------------------------
-- Replaces the trg_audit_log() from 0001: identical, except password_hash is
-- removed from the old/new values that get written to audit_log.
CREATE OR REPLACE FUNCTION trg_audit_log() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_action TEXT;
    v_key    TEXT;
BEGIN
    SELECT string_agg(to_jsonb(NEW) ->> k, '|' ORDER BY ord)
      INTO v_key
      FROM unnest(TG_ARGV) WITH ORDINALITY AS t(k, ord);

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, action, record_key, old_values, new_values, action_by)
        VALUES (TG_TABLE_NAME, 'ADD', v_key, NULL, to_jsonb(NEW) - 'password_hash', audit_user());
    ELSE
        IF (to_jsonb(OLD) - 'stamp') = (to_jsonb(NEW) - 'stamp') THEN
            RETURN NULL;                             -- nothing changed, no log
        END IF;
        v_action := CASE
                      WHEN NOT OLD.is_deleted AND NEW.is_deleted THEN 'DELETE'
                      WHEN OLD.is_deleted AND NOT NEW.is_deleted THEN 'RESTORE'
                      ELSE 'EDIT'
                    END;
        INSERT INTO audit_log (table_name, action, record_key, old_values, new_values, action_by)
        VALUES (TG_TABLE_NAME, v_action, v_key,
                to_jsonb(OLD) - 'password_hash', to_jsonb(NEW) - 'password_hash', audit_user());
    END IF;
    RETURN NULL;
END;
$$;

-- 1. Lookup tables ----------------------------------------------------------
CREATE TABLE app_role (
    role_id     SMALLINT    PRIMARY KEY,
    role_name   VARCHAR(20) NOT NULL UNIQUE CHECK (role_name = lower(role_name)),
    description VARCHAR(100)
);

CREATE TABLE app_module (
    module_code VARCHAR(20) PRIMARY KEY,           -- customers, products, hr, sales, reports
    module_name VARCHAR(30) NOT NULL,
    sort_order  SMALLINT    NOT NULL
);

-- The rights catalogue = one row per checkbox in the Rights dialog.
-- is_module_switch = TRUE for the module's own checkbox (e.g. customers.view).
CREATE TABLE app_right (
    right_code       VARCHAR(30) PRIMARY KEY,       -- same keys as the prototype, e.g. customers.add
    module_code      VARCHAR(20) NOT NULL REFERENCES app_module,
    right_name       VARCHAR(40) NOT NULL,
    is_module_switch BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order       SMALLINT    NOT NULL
);

-- 2. Accounts ----------------------------------------------------------------
CREATE TABLE app_user (
    user_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email             VARCHAR(100) NOT NULL UNIQUE,
    first_name        VARCHAR(40)  NOT NULL,
    last_name         VARCHAR(40)  NOT NULL,
    password_hash     TEXT,                          -- NULL until the person sets a password
    role_id           SMALLINT     NOT NULL DEFAULT 3 REFERENCES app_role,   -- 3 = user
    account_status    VARCHAR(10)  NOT NULL DEFAULT 'pending',               -- new registrations start pending
    is_blocked        BOOLEAN      NOT NULL DEFAULT FALSE,
    must_set_password BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
    stamp             VARCHAR(60),
    CONSTRAINT app_user_status_ck CHECK (account_status IN ('pending','approved')),
    CONSTRAINT app_user_email_ck  CHECK (email = lower(email) AND position('@' IN email) > 1)
);

-- One row per ticked checkbox.  Un-ticking = soft delete (is_deleted = TRUE),
-- ticking again = is_deleted = FALSE (see usage note at the bottom).
CREATE TABLE user_permission (
    user_id    BIGINT      NOT NULL REFERENCES app_user,
    right_code VARCHAR(30) NOT NULL REFERENCES app_right,
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
    stamp      VARCHAR(60),
    PRIMARY KEY (user_id, right_code)
);

-- 3. Soft delete + stamp + audit on the two data tables -----------------------
CREATE TRIGGER app_user_biu_stamp BEFORE INSERT OR UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION trg_set_stamp();
CREATE TRIGGER app_user_bd_block BEFORE DELETE ON app_user
    FOR EACH ROW EXECUTE FUNCTION trg_block_hard_delete();
CREATE TRIGGER app_user_bt_block BEFORE TRUNCATE ON app_user
    FOR EACH STATEMENT EXECUTE FUNCTION trg_block_hard_delete();
CREATE TRIGGER app_user_aiu_audit AFTER INSERT OR UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION trg_audit_log('user_id');

CREATE TRIGGER user_permission_biu_stamp BEFORE INSERT OR UPDATE ON user_permission
    FOR EACH ROW EXECUTE FUNCTION trg_set_stamp();
CREATE TRIGGER user_permission_bd_block BEFORE DELETE ON user_permission
    FOR EACH ROW EXECUTE FUNCTION trg_block_hard_delete();
CREATE TRIGGER user_permission_bt_block BEFORE TRUNCATE ON user_permission
    FOR EACH STATEMENT EXECUTE FUNCTION trg_block_hard_delete();
CREATE TRIGGER user_permission_aiu_audit AFTER INSERT OR UPDATE ON user_permission
    FOR EACH ROW EXECUTE FUNCTION trg_audit_log('user_id','right_code');

CREATE INDEX user_permission_right_idx ON user_permission (right_code);
CREATE INDEX app_user_role_idx         ON app_user (role_id);


-- =====================================================================
-- Usage note for the developer (Rights dialog, "Save Rights"):
--   tick a box   : INSERT INTO user_permission (user_id, right_code)
--                  VALUES (:uid, :code)
--                  ON CONFLICT (user_id, right_code) DO UPDATE SET is_deleted = FALSE;
--   untick a box : UPDATE user_permission SET is_deleted = TRUE
--                  WHERE user_id = :uid AND right_code = :code;
--   current rights of a user:
--                  SELECT right_code FROM user_permission
--                  WHERE user_id = :uid AND NOT is_deleted;
-- Verify (run each SELECT separately):
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema='public' AND table_name IN
--    ('app_role','app_module','app_right','app_user','user_permission');   -- 5 rows
-- =====================================================================

-- Row Level Security (db/README rule 7): Supabase exposes public tables through its web API.
-- RLS ON with no policies = the web API gets nothing; the server's direct database
-- connection (DATABASE_URL, postgres role) is not affected.
ALTER TABLE app_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_right ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission ENABLE ROW LEVEL SECURITY;
