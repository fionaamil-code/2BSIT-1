-- =====================================================================
-- 0003_password_reset_token.sql        Task: S1-DBA-04
-- One-time tokens for "forgot password" and "first-time set password".
-- The app stores only a HASH of the token (SHA-256, 64 hex characters);
-- the real token exists only in the e-mailed link.
-- Run AFTER 0002.
-- =====================================================================

CREATE TABLE password_reset_token (
    token_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES app_user,
    token_hash  CHAR(64)    NOT NULL UNIQUE,
    purpose     VARCHAR(12) NOT NULL DEFAULT 'reset',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN     NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    CONSTRAINT prt_purpose_ck CHECK (purpose IN ('reset','setpassword')),
    CONSTRAINT prt_hash_ck    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    CONSTRAINT prt_expiry_ck  CHECK (expires_at > created_at),
    CONSTRAINT prt_used_ck    CHECK ((is_used AND used_at IS NOT NULL)
                                  OR (NOT is_used AND used_at IS NULL))
);

CREATE INDEX prt_user_idx   ON password_reset_token (user_id);
CREATE INDEX prt_expiry_idx ON password_reset_token (expires_at) WHERE NOT is_used;

-- Tokens the app may still accept (not used, not expired).
CREATE VIEW v_valid_token AS
SELECT * FROM password_reset_token
 WHERE NOT is_used AND expires_at > now();


-- =====================================================================
-- Usage note for the developer:
--   create : INSERT INTO password_reset_token (user_id, token_hash, purpose, expires_at)
--            VALUES (:uid, :sha256_hex, 'reset', now() + interval '30 minutes');
--   use    : look the hash up in v_valid_token; if found, set the new password and
--            UPDATE password_reset_token SET is_used = TRUE, used_at = now()
--             WHERE token_id = :id;
-- (Expired and used tokens are rejected because they are not in v_valid_token.)
-- =====================================================================

-- Row Level Security (db/README rule 7): Supabase exposes public tables through its web API.
-- RLS ON with no policies = the web API gets nothing; the server's direct database
-- connection (DATABASE_URL, postgres role) is not affected.
ALTER TABLE password_reset_token ENABLE ROW LEVEL SECURITY;
ALTER VIEW v_valid_token SET (security_invoker = true);
