App.start('Reports', async (ctx, main) => {
  const { esc, toast } = App, { money } = SalesPages;
  const can = (c) => ctx.isStaff || ctx.rights.includes(c);
  const today = new Date(), iso = (d) => d.toISOString().slice(0, 10);
  const monthStart = iso(new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))), monthEnd = iso(new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0)));
  const dash = (v) => (v == null || v === '' ? '—' : esc(v));
  const REPORTS = [
    { key: 'top-customers', title: 'Top Customers by Sales', tab: 'Top Customers', right: 'report.top_customers', fn: 'report_top_customers', filter: 'range',
      cols: [['Rank', 'rank'], ['Cust no', 'cust_no'], ['Customer name', 'name'], ['Total sales', 'total', money]] },
    { key: 'product-master', title: 'Product Master List (current price)', tab: 'Product Master List', right: 'report.product_master', fn: 'report_product_master',
      cols: [['Prod code', 'prod_code'], ['Description', 'description'], ['Unit', 'unit'], ['Current price', 'price', (v) => (v == null ? '—' : money(v))]] },
    { key: 'top-products', title: 'Top Products by Sales Amount', tab: 'Top Products', right: 'report.top_products', fn: 'report_top_products', filter: 'range',
      cols: [['Rank', 'rank'], ['Prod code', 'prod_code'], ['Description', 'description'], ['Qty sold', 'qty'], ['Sales amount', 'amount', money]] },
    { key: 'active-employees', title: 'Active Employees (not separated)', tab: 'Active Employees', right: 'report.active_employees', fn: 'report_active_employees',
      cols: [['Emp no', 'emp_no'], ['Last name', 'last_name'], ['First name', 'first_name'], ['Gender', 'gender'], ['Birth date', 'birth_date'], ['Hire date', 'hire_date']] },
    { key: 'all-employees', title: 'All Employees (including separated)', tab: 'All Employees', right: 'report.all_employees', fn: 'report_all_employees',
      cols: [['Emp no', 'emp_no'], ['Last name', 'last_name'], ['First name', 'first_name'], ['Gender', 'gender'], ['Birth date', 'birth_date'], ['Hire date', 'hire_date'], ['Sep date', 'sep_date'], ['Status', 'state']] },
    { key: 'employee-history', title: 'Employee Job History', tab: 'Employee Job History', right: 'report.employee_history', fn: 'report_employee_history', filter: 'employee',
      cols: [['Effective date', 'date'], ['Job', 'job'], ['Department', 'dept'], ['Salary', 'salary', (v) => money(v)]] },
    { key: 'top-sales', title: 'Top Sales', tab: 'Top Sales', right: 'report.top_sales', fn: 'report_top_sales', filter: 'range',
      cols: [['Rank', 'rank'], ['Trans no', 'trans_no'], ['Date', 'date'], ['Customer', 'customer'], ['Employee', 'employee'], ['Total', 'total', money]] },
  ].filter((r) => can(r.right));
  if (!REPORTS.length) { main.innerHTML = '<p class="notice">You don’t have access to Reports.</p>'; return; }

  main.innerHTML = '<nav class="subtabs noprint" id="rtabs" aria-label="Reports"></nav><div id="report"></div>';
  let current = REPORTS.find((r) => '#' + r.key === location.hash) || REPORTS[0];

  function drawTabs() {
    main.querySelector('#rtabs').innerHTML = REPORTS.map((r) => `<a href="#${r.key}" class="subtab${r === current ? ' active' : ''}" data-key="${r.key}">${esc(r.tab)}</a>`).join('');
  }
  async function show() {
    drawTabs();
    const box = main.querySelector('#report');
    const filters = current.filter === 'range'
      ? `<div class="field"><label for="rFrom">From</label><input type="date" id="rFrom" value="${monthStart}"></div><div class="field"><label for="rTo">To</label><input type="date" id="rTo" value="${monthEnd}"></div>
         <div class="field"><label for="rN">Top N</label><input type="text" id="rN" value="10" inputmode="numeric"></div>`
      : current.filter === 'employee' ? '<div class="field"><label for="rEmp">Employee</label><select id="rEmp"><option value="">Select employee</option></select></div>' : '';
    box.innerHTML = `<div class="row-between report-head"><h2 class="panel-title">${esc(current.title)}</h2><div class="actions noprint"><button type="button" class="btn-sm secondary" data-print>Print</button><button type="button" class="btn-sm secondary" data-print>Save as PDF</button></div></div>
      ${filters ? `<form class="filters noprint" id="rform" novalidate>${filters}<button type="submit" class="btn-sm primary">Apply</button></form><p class="error" id="rerr"></p>` : '<p class="muted noprint">This report has no filters.</p>'}
      <p class="print-only muted">Hope, Inc. ERP · ${esc(current.title)} · generated ${iso(today)} by ${esc(ctx.profile.full_name)}</p>
      <div class="table-wrap" id="rtable"><p class="empty">${current.filter ? 'Choose filters and select Apply.' : 'Loading…'}</p></div>`;
    if (current.filter === 'employee') {
      try { const list = await ReportsService.run('report_employee_list'); box.querySelector('#rEmp').innerHTML += list.map((e) => `<option value="${esc(e.id)}">${esc(e.label)}</option>`).join(''); } catch (e) { toast(e.message, 'error'); }
    }
    if (!current.filter) run(); else if (current.filter === 'range') run();
  }
  async function run() {
    const box = main.querySelector('#report'), table = box.querySelector('#rtable'), err = box.querySelector('#rerr');
    let args = {};
    if (current.filter === 'range') {
      const from = box.querySelector('#rFrom').value, to = box.querySelector('#rTo').value, n = box.querySelector('#rN').value.trim();
      const msg = !from || !to ? 'Choose both dates.' : from > to ? 'The From date can’t be after the To date.' : !/^[1-9]\d{0,3}$/.test(n) ? 'Top N must be a whole number of 1 or more.' : '';
      if (err) err.textContent = msg; if (msg) return;
      args = { p_from: from, p_to: to, p_n: Number(n) };
    } else if (current.filter === 'employee') {
      const emp = box.querySelector('#rEmp').value;
      if (err) err.textContent = emp ? '' : 'Choose an employee.'; if (!emp) return;
      args = { p_employee: emp };
    }
    table.innerHTML = '<p class="empty">Loading…</p>';
    try {
      const rows = await ReportsService.run(current.fn, args);
      table.innerHTML = rows.length ? `<table><thead><tr>${current.cols.map((c) => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${current.cols.map((c) => `<td>${c[2] ? c[2](r[c[1]]) : dash(r[c[1]])}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : '<p class="empty"><strong>No results</strong><br>Nothing matches these filters.</p>';
    } catch (e) { table.innerHTML = `<p class="empty error-text">${esc(e.message)}</p>`; }
  }
  main.addEventListener('submit', (e) => { if (e.target.id === 'rform') { e.preventDefault(); run(); } });
  main.addEventListener('click', (e) => {
    if (e.target.closest('[data-print]')) return window.print();   // "Save as PDF" uses the print dialog's Save as PDF option
    const t = e.target.closest('[data-key]'); if (!t) return;
    e.preventDefault(); current = REPORTS.find((r) => r.key === t.dataset.key); history.replaceState(null, '', '#' + current.key); show();
  });
  await show();
});
