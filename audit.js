App.start('Audit Log', async (ctx, main) => {
  const { esc, toast } = App;
  if (!ctx.isSuper) { main.innerHTML = '<p class="notice">Only Superadmins can see this page.</p>'; return; }
  const VERBS = [['ADD', 'Create'], ['EDIT', 'Edit'], ['DELETE', 'Delete'], ['RESTORE', 'Restore'], ['BLOCK', 'Block'], ['UNBLOCK', 'Unblock'], ['APPROVE', 'Approve'], ['SAVE', 'Save'], ['CHANGE', 'Change']];
  const ENTITIES = ['CUSTOMER', 'PRODUCT', 'PRICE', 'DEPARTMENT', 'JOB', 'EMPLOYEE', 'JOB_HISTORY', 'SALE', 'SALE_LINE', 'PAYMENT', 'USER', 'RIGHTS', 'ROLE'];
  const pretty = (s) => s.toLowerCase().replace(/_/g, ' ');
  const verbLabel = (v) => (VERBS.find((x) => x[0] === v) || [v, v])[1].toUpperCase();
  const pad = (n) => String(n).padStart(2, '0');
  const when = (s) => { const d = new Date(s); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${h}:${pad(d.getMinutes())} ${ap}`; };
  const iso = (d) => d.toISOString().slice(0, 10), today = new Date();
  const first = iso(new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))), last = iso(new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0)));
  let users = []; try { users = await ReportsService.auditUsers(); } catch (e) { toast(e.message, 'error'); }

  main.innerHTML = `<div class="row-between report-head"><p class="page-note">Only Superadmins can see this page.</p><div class="actions noprint"><button type="button" class="btn-sm secondary" data-print>Print</button><button type="button" class="btn-sm secondary" data-print>Save as PDF</button></div></div>
    <form class="filters noprint" id="aform" novalidate>
      <div class="field"><label for="aT">Table</label><select id="aT"><option value="">All tables</option>${ENTITIES.map((e) => `<option value="${e}">${esc(pretty(e))}</option>`).join('')}</select></div>
      <div class="field"><label for="aA">Action</label><select id="aA"><option value="">All actions</option>${VERBS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="field"><label for="aU">User</label><select id="aU"><option value="">All users</option>${users.map((u) => `<option>${esc(u)}</option>`).join('')}</select></div>
      <div class="field"><label for="aF">From</label><input type="date" id="aF" value="${first}"></div><div class="field"><label for="aTo">To</label><input type="date" id="aTo" value="${last}"></div>
      <button type="submit" class="btn-sm primary">Apply</button></form><p class="error" id="aerr"></p>
    <div class="table-wrap" id="atable"></div><p class="muted">Shows up to 500 of the latest entries. Before and after values are not recorded yet; the details column shows what each action stored.</p>`;
  const q = (id) => main.querySelector(id);

  async function run() {
    const from = q('#aF').value, to = q('#aTo').value;
    q('#aerr').textContent = from && to && from > to ? 'The From date can’t be after the To date.' : '';
    if (q('#aerr').textContent) return;
    q('#atable').innerHTML = '<p class="empty">Loading…</p>';
    try {
      const rows = await ReportsService.audit({ entity: q('#aT').value, verb: q('#aA').value, user: q('#aU').value, from, to });
      q('#atable').innerHTML = rows.length ? `<table><thead><tr><th>When</th><th>User</th><th>Table</th><th>Row</th><th>Action</th><th>Details</th></tr></thead><tbody>${rows.map((r) => {
        const d = r.detail && Object.keys(r.detail).length ? Object.entries(r.detail).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(', ') : '—';
        return `<tr><td>${when(r.at)}</td><td>${esc(r.user)}</td><td>${esc(pretty(r.entity))}</td><td>${esc(r.row || '—')}</td><td>${esc(verbLabel(r.verb))}</td><td class="stamp">${d}</td></tr>`; }).join('')}</tbody></table>`
        : '<p class="empty"><strong>No entries found</strong><br>Try a wider date range or other filters.</p>';
    } catch (e) { q('#atable').innerHTML = `<p class="empty error-text">${esc(e.message)}</p>`; }
  }
  main.addEventListener('submit', (e) => { if (e.target.id === 'aform') { e.preventDefault(); run(); } });
  main.addEventListener('click', (e) => { if (e.target.closest('[data-print]')) window.print(); });
  await run();
});
