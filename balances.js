App.start('Sales', async (ctx, main) => {
  const { esc } = App, { money } = SalesPages;
  if (!SalesPages.canSee(ctx) ) { main.innerHTML = '<p class="notice">You don’t have access to Sales.</p>'; return; }
  main.innerHTML = SalesPages.tabs('balances') + '<p class="empty">Loading…</p>';
  if (!SalesPages.can(ctx, 'sale.view')) { main.innerHTML = SalesPages.tabs('balances') + '<div class="notice"><strong>No View Sale Details right</strong><br>Balances are available to users with the View Sale Details right. Ask an Admin if you need access.</div>'; return; }
  let rows;
  try { rows = (await SalesService.list()).filter((r) => r.status === 'ACTIVE'); }
  catch (e) { main.innerHTML = SalesPages.tabs('balances') + `<p class="error-text">${esc(e.message)}</p>`; return; }
  const byCust = new Map();
  rows.forEach((r) => { const c = byCust.get(r.customer_id) || { cust_no: r.cust_no, name: r.customer_name, total: 0, paid: 0 }; c.total += Number(r.total); c.paid += Number(r.paid); byCust.set(r.customer_id, c); });
  const custRows = [...byCust.values()].sort((a, b) => a.cust_no.localeCompare(b.cust_no));
  main.innerHTML = SalesPages.tabs('balances') + `
    <h2 class="section-title">By transaction</h2>
    <div class="table-wrap"><table><thead><tr><th>Trans no</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
      ${rows.length ? rows.map((r) => `<tr><td>${esc(r.trans_no)}</td><td>${esc(r.sale_date)}</td><td>${esc(r.customer_name)}</td><td>${money(r.total)}</td><td>${money(r.paid)}</td><td>${money(r.total - r.paid)}</td><td>${SalesPages.payBadge(r)}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">No sales yet</td></tr>'}</tbody></table></div>
    <h2 class="section-title">By customer</h2>
    <div class="table-wrap"><table><thead><tr><th>Cust no</th><th>Customer</th><th>Total sales</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
      ${custRows.length ? custRows.map((c) => `<tr><td>${esc(c.cust_no)}</td><td>${esc(c.name)}</td><td>${money(c.total)}</td><td>${money(c.paid)}</td><td>${money(c.total - c.paid)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">No sales yet</td></tr>'}</tbody></table></div>`;
});
