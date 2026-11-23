// Reports and audit log data access. Every report is a database function that checks its own right.
(() => {
  'use strict';
  const rpc = (fn, args) => Api.run(Api.db().rpc(fn, args || {}));
  window.ReportsService = {
    run: (fn, args) => rpc(fn, args),
    audit: (f) => rpc('audit_search', { p_entity: f.entity || null, p_verb: f.verb || null, p_user: f.user || null, p_from: f.from || null, p_to: f.to || null }),
    auditUsers: async () => (await Api.run(Api.db().from('profiles').select('username').order('username'))).map((r) => r.username),
  };
})();
