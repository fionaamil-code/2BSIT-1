-- S1-DBA-06: audit_user() records the logged-in user. Run AFTER 0005.
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
            (1, 'set_app_user(''caberto@school.edu.ph'')', $q$SELECT set_app_user('caberto@school.edu.ph')$q$, 'OK'),
            (2, 'edit customer C0001 as that user', $q$UPDATE customer SET address = 'AUDIT TEST 1' WHERE custno = 'C0001'$q$, 'OK'),
            (3, 'check: audit_log.action_by is the app user', $q$SELECT 1/count(*) FROM (SELECT action_by FROM audit_log WHERE table_name = 'customer' AND record_key = 'C0001' ORDER BY audit_id DESC LIMIT 1) x WHERE action_by = 'caberto@school.edu.ph'$q$, 'OK'),
            (4, 'check: row stamp reads EDIT caberto ...', $q$SELECT 1/count(*) FROM (SELECT 1) x WHERE EXISTS (SELECT 1 FROM customer WHERE custno = 'C0001' AND stamp LIKE 'EDIT caberto %')$q$, 'OK'),
            (5, 'clear the user (empty text)', $q$SELECT set_app_user('')$q$, 'OK'),
            (6, 'edit again with no app user', $q$UPDATE customer SET address = 'AUDIT TEST 2' WHERE custno = 'C0001'$q$, 'OK'),
            (7, 'check: falls back to the database login', $q$SELECT 1/count(*) FROM (SELECT action_by FROM audit_log WHERE table_name = 'customer' AND record_key = 'C0001' ORDER BY audit_id DESC LIMIT 1) x WHERE action_by = session_user::text$q$, 'OK'),
            (8, 'set a very long e-mail (over 50 characters)', $q$SELECT set_app_user('a-very-long-email-address-that-is-longer-than-fifty-characters@example-school.edu.ph')$q$, 'OK'),
            (9, 'edit again - must not fail on length', $q$UPDATE customer SET address = 'AUDIT TEST 3' WHERE custno = 'C0001'$q$, 'OK'),
            (10, 'check: action_by cut to 50 characters', $q$SELECT 1/count(*) FROM (SELECT action_by FROM audit_log WHERE table_name = 'customer' AND record_key = 'C0001' ORDER BY audit_id DESC LIMIT 1) x WHERE length(action_by) = 50 AND action_by LIKE 'a-very-long%'$q$, 'OK')
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
