App.start('User Management', async (ctx, main) => {
  const { esc, toast, modal, ROLE_LABEL } = App;
  if (!ctx.isStaff) { main.innerHTML = '<p class="notice">You don’t have access to User Management.</p>'; return; }

  let users = [], tab = 'ALL', query = '';
  const me = ctx.profile.id;
  const tabsDef = ctx.isSuper
    ? [['ALL', 'All'], ['ACTIVE', 'Active'], ['PENDING', 'Pending'], ['BLOCKED', 'Blocked']]
    : [['ALL', 'All'], ['ACTIVE', 'Active'], ['BLOCKED', 'Blocked']];
  const STATUS_LABEL = { ACTIVE: 'Active', PENDING: 'Pending', BLOCKED: 'Blocked' };

  main.innerHTML = `<p class="page-note">${ctx.isSuper ? 'Manage accounts, approve registrations and designate Admins.' : 'Admins manage Users only. Superadmin accounts are hidden and cannot be changed here.'}</p>
    <div class="toolbar"><div class="tabs" id="tabs" role="tablist"></div>
      <div class="toolbar-right"><input type="search" id="search" placeholder="Search users" aria-label="Search users"><button type="button" class="btn-sm primary" id="addUser">Add user</button></div></div>
    <div id="pending"></div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div>
    ${ctx.isSuper ? '<p class="page-note">At least one active Superadmin must remain, so Block is disabled for the last one.</p>' : ''}`;
  const rowsEl = main.querySelector('#rows');
  rowsEl.innerHTML = '<tr><td colspan="5" class="empty">Loading users…</td></tr>';

  const activeSupers = () => users.filter((u) => u.role === 'SUPERADMIN' && u.status === 'ACTIVE').length;
  const btn = (action, label, id, extra = '') => `<button type="button" class="btn-sm ${action === 'approve' ? 'primary' : 'secondary'}" data-action="${action}" data-id="${id}" ${extra}>${label}</button>`;

  function actionsFor(u) {
    if (!ctx.isSuper && u.role !== 'USER') return '—';
    const out = [];
    if (u.status === 'PENDING') out.push(btn('approve', 'Approve', u.id));
    if (u.role === 'USER' && u.status !== 'PENDING') out.push(btn('rights', 'Rights', u.id));
    out.push(btn('edit', 'Edit', u.id));
    if (u.status === 'ACTIVE') {
      const locked = u.id === me || (u.role === 'SUPERADMIN' && activeSupers() === 1);
      out.push(btn('block', 'Block', u.id, locked ? 'disabled title="At least one active Superadmin must remain."' : ''));
    }
    if (u.status === 'BLOCKED') out.push(btn('unblock', 'Unblock', u.id));
    return `<div class="actions">${out.join('')}</div>`;
  }

  function draw() {
    const count = (s) => users.filter((u) => s === 'ALL' || u.status === s).length;
    main.querySelector('#tabs').innerHTML = tabsDef.map(([k, l]) =>
      `<button type="button" role="tab" class="tab${tab === k ? ' active' : ''}" aria-selected="${tab === k}" data-tab="${k}">${l} (${count(k)})</button>`).join('');
    const pending = count('PENDING');
    main.querySelector('#pending').innerHTML = ctx.isSuper && pending
      ? `<div class="notice row-between"><span>${pending} account${pending > 1 ? 's are' : ' is'} waiting for approval. Approved users can log in as a User.</span>
         <button type="button" class="btn-sm secondary" data-tab="PENDING">Show pending</button></div>` : '';
    const q = query.trim().toLowerCase();
    const shown = users.filter((u) => (tab === 'ALL' || u.status === tab) &&
      (!q || [u.full_name, u.email, u.username].some((v) => (v || '').toLowerCase().includes(q))));
    rowsEl.innerHTML = shown.length ? shown.map((u) => `<tr>
        <td>${esc(u.full_name)}<div class="muted">@${esc(u.username)}</div></td><td>${esc(u.email)}</td>
        <td><span class="badge role">${ROLE_LABEL[u.role]}</span></td>
        <td><span class="badge ${u.status.toLowerCase()}">${STATUS_LABEL[u.status]}</span></td><td>${actionsFor(u)}</td></tr>`).join('')
      : `<tr><td colspan="5" class="empty">${users.length ? 'No users match your search.' : 'No users yet.'}</td></tr>`;
  }

  async function load() {
    try { users = await UsersService.list(); draw(); }
    catch (e) { rowsEl.innerHTML = `<tr><td colspan="5" class="empty error-text">${esc(e.message)} <button class="btn-sm secondary" id="retry">Try again</button></td></tr>`; }
  }

  function blocked(e) {
    if (e.code === 'LAST_SUPERADMIN') {
      return modal({ title: 'Action blocked', body: '<p><strong>Cannot disable the last Superadmin.</strong></p><p>At least one active Superadmin must remain. Designate another Superadmin first.</p>', actions: [{ label: 'Close' }] });
    }
    toast(e.message, 'error');
  }

  async function changeStatus(u, status, { title, message, label, danger, done }) {
    if (!(await App.confirm({ title, message, confirmLabel: label, danger }))) return;
    try { await UsersService.setStatus(u.id, status); toast(done, 'success'); await load(); } catch (e) { blocked(e); }
  }

  function editDialog(u) {
    const canRole = ctx.isSuper && u.role !== 'SUPERADMIN';
    const body = document.createElement('form');
    body.noValidate = true;
    body.innerHTML = `<div class="field"><label for="eName">Full name</label><input type="text" id="eName" value="${esc(u.full_name)}"><p class="error" id="eNameErr"></p></div>
      <div class="field"><label for="eUser">Username</label><input type="text" id="eUser" value="${esc(u.username)}"><p class="help">3–20 letters, numbers or underscores.</p><p class="error" id="eUserErr"></p></div>
      <div class="field"><label>Email address</label><p class="static">${esc(u.email)}</p></div>
      <div class="field"><label for="eRole">Role</label><select id="eRole" ${canRole ? '' : 'disabled'}>
        ${u.role === 'SUPERADMIN' ? '<option value="SUPERADMIN">Superadmin</option>' : `<option value="USER"${u.role === 'USER' ? ' selected' : ''}>User</option><option value="ADMIN"${u.role === 'ADMIN' ? ' selected' : ''}>Admin</option>`}</select>
        <p class="help">Only a Superadmin can designate an Admin.</p></div>`;
    const save = async (close) => {
      const name = body.querySelector('#eName').value.trim(), user = body.querySelector('#eUser').value.trim();
      const nErr = name ? '' : 'Enter the full name.';
      const uErr = /^[A-Za-z0-9_]{3,20}$/.test(user) ? '' : 'Use 3–20 letters, numbers or underscores.';
      body.querySelector('#eNameErr').textContent = nErr; body.querySelector('#eUserErr').textContent = uErr;
      if (nErr || uErr) return;
      try {
        await UsersService.update(u.id, { fullName: name, username: user, role: canRole ? body.querySelector('#eRole').value : null });
        close(); toast('Changes saved.', 'success'); await load();
      } catch (e) { if (e.code === 'USERNAME_TAKEN') body.querySelector('#eUserErr').textContent = e.message; else toast(e.message, 'error'); }
    };
    body.addEventListener('submit', (ev) => ev.preventDefault());
    modal({ title: 'Edit user', body, actions: [{ label: 'Cancel' }, { label: 'Save user', kind: 'primary', onClick: save }] });
  }

  function addDialog() {
    const body = document.createElement('form');
    body.noValidate = true;
    body.innerHTML = `<div class="field"><label for="aFirst">First name</label><input type="text" id="aFirst" autocomplete="off"><p class="error" id="aFirstErr"></p></div>
      <div class="field"><label for="aLast">Last name</label><input type="text" id="aLast" autocomplete="off"><p class="error" id="aLastErr"></p></div>
      <div class="field"><label for="aEmail">Email address</label><input type="text" id="aEmail" inputmode="email" autocomplete="off"><p class="error" id="aEmailErr"></p></div>
      <div class="field"><label for="aRole">Role</label><select id="aRole" ${ctx.isSuper ? '' : 'disabled'}><option value="USER">User</option>${ctx.isSuper ? '<option value="ADMIN">Admin</option>' : ''}</select>
        <p class="help">Only a Superadmin can designate an Admin.</p></div>
      <p class="notice">The person sets their own password through a one-time link sent by email.</p>`;
    const save = async (close) => {
      const v = (id) => body.querySelector(id).value.trim();
      const errs = {
        '#aFirstErr': v('#aFirst') ? '' : 'Enter the first name.',
        '#aLastErr': v('#aLast') ? '' : 'Enter the last name.',
        '#aEmailErr': /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('#aEmail')) ? '' : 'Enter a valid email address.',
      };
      Object.entries(errs).forEach(([k, m]) => { body.querySelector(k).textContent = m; });
      if (Object.values(errs).some(Boolean)) return;
      try {
        await UsersService.create({ firstName: v('#aFirst'), lastName: v('#aLast'), email: v('#aEmail'), role: body.querySelector('#aRole').value });
        close(); toast(`Invitation sent to ${v('#aEmail')}.`, 'success'); await load();
      } catch (e) { if (e.code === 'EMAIL_TAKEN') body.querySelector('#aEmailErr').textContent = e.message; else toast(e.message, 'error'); }
    };
    body.addEventListener('submit', (ev) => ev.preventDefault());
    modal({ title: 'Add user', body, actions: [{ label: 'Cancel' }, { label: 'Save user', kind: 'primary', onClick: save }] });
  }

  async function rightsDialog(u) {
    let catalog, current;
    try { [catalog, current] = await Promise.all([UsersService.listRights(), UsersService.getRights(u.id)]); } catch (e) { return toast(e.message, 'error'); }
    const groups = [...new Set(catalog.map((r) => r.module))];
    const body = document.createElement('div');
    body.innerHTML = `<p class="muted" id="count"></p><p class="muted">Every change is recorded in the audit log.</p><div class="rights-grid">${groups.map((g) =>
      `<fieldset class="rights-group"><legend>${esc(g)}</legend><div class="group-tools"><button type="button" class="link-btn" data-set="1">All</button><button type="button" class="link-btn" data-set="0">None</button></div>
      ${catalog.filter((r) => r.module === g).map((r) => `<label class="check"><input type="checkbox" value="${esc(r.code)}"${current.includes(r.code) ? ' checked' : ''}> ${esc(r.label)}</label>`).join('')}</fieldset>`).join('')}</div>`;
    const boxes = () => [...body.querySelectorAll('input[type=checkbox]')];
    const upd = () => { body.querySelector('#count').textContent = `${esc(u.email)} · ${boxes().filter((b) => b.checked).length} of ${catalog.length} rights selected`; };
    body.addEventListener('change', upd);
    body.addEventListener('click', (e) => {
      const t = e.target.closest('[data-set]'); if (!t) return;
      t.closest('fieldset').querySelectorAll('input').forEach((b) => { b.checked = t.dataset.set === '1'; }); upd();
    });
    upd();
    modal({ title: `Rights — ${u.full_name}`, body, wide: true, actions: [{ label: 'Cancel' }, { label: 'Save rights', kind: 'primary', onClick: async (close) => {
      try {
        await UsersService.saveRights(u.id, boxes().filter((b) => b.checked).map((b) => b.value));
        close(); toast(`Rights saved. They apply the next time ${u.full_name} opens a page.`, 'success');
      } catch (e) { toast(e.message, 'error'); }
    } }] });
  }

  main.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; return draw(); }
    if (e.target.id === 'retry') return load();
    const b = e.target.closest('[data-action]'); if (!b) return;
    const u = users.find((x) => x.id === b.dataset.id); if (!u) return;
    ({
      edit: () => editDialog(u),
      rights: () => rightsDialog(u),
      block: () => changeStatus(u, 'BLOCKED', { title: 'Block this user?', message: `${u.full_name} will not be able to log in until you unblock the account.`, label: 'Block user', danger: true, done: `${u.full_name} was blocked.` }),
      unblock: () => changeStatus(u, 'ACTIVE', { title: 'Unblock this user?', message: `${u.full_name} will be able to log in again.`, label: 'Unblock user', done: `${u.full_name} was unblocked.` }),
      approve: () => changeStatus(u, 'ACTIVE', { title: 'Approve this account?', message: `${u.full_name} will be able to log in as a User. You can give rights afterwards.`, label: 'Approve', done: `${u.full_name} was approved.` }),
    })[b.dataset.action]();
  });
  main.querySelector('#addUser').addEventListener('click', addDialog);
  main.querySelector('#search').addEventListener('input', (e) => { query = e.target.value; draw(); });
  await load();
});
