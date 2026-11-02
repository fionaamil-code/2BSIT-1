// All User Management data access. Swap or extend here; the page code never talks to Supabase directly.
(() => {
  'use strict';
  const db = () => AuthService.db();
  const MESSAGES = {
    NOT_ALLOWED: 'You don’t have permission to do that.',
    LAST_SUPERADMIN: 'At least one active Superadmin must remain. Designate another Superadmin first.',
    SELF_BLOCK: 'You can’t block your own account.',
    USERNAME_TAKEN: 'That username is already taken.',
    BAD_INPUT: 'Check the name and email address and try again.',
    EMAIL_TAKEN: 'An account with this email already exists.',
    NOT_FOUND: 'That account no longer exists. Refresh the page.',
  };
  function fail(error) {
    const code = Object.keys(MESSAGES).find((k) => (error && error.message || '').includes(k));
    throw { code, message: code ? MESSAGES[code] : ((error && error.message) || 'Something went wrong. Try again.') };
  }
  async function run(query) { const { data, error } = await query; if (error) fail(error); return data; }

  window.UsersService = {
    list: () => run(db().from('profiles').select('id, full_name, username, email, role, status, created_at').order('created_at')),
    listRights: () => run(db().from('rights').select('code, module, label, sort').order('sort')),
    async getRights(userId) {
      const rows = await run(db().from('user_rights').select('right_code').eq('user_id', userId));
      return rows.map((r) => r.right_code);
    },
    setStatus: (id, status) => run(db().rpc('admin_set_status', { p_user: id, p_status: status })),
    update: (id, { fullName, username, role }) =>
      run(db().rpc('admin_update_user', { p_user: id, p_full_name: fullName, p_username: username, p_role: role || null })),
    async create({ firstName, lastName, email, role }) {
      const redirectTo = new URL('reset-password.html', window.location.href).href;
      const { data, error } = await db().functions.invoke('admin-create-user', { body: { firstName, lastName, email, role, redirectTo } });
      if (error) {
        let body = {};
        try { body = await error.context.json(); } catch (_) { /* not JSON */ }
        fail({ message: body.error || 'The user could not be added. Check that the admin-create-user function is deployed.' });
      }
      if (data && data.error) fail({ message: data.error });
      return data;
    },
    saveRights: (id, codes) => run(db().rpc('admin_save_rights', { p_user: id, p_codes: codes })),
  };
})();
