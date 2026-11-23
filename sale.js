App.start('Sale details', async (ctx, main) => {
  const { esc, toast } = App;
  const { money } = SalesPages, can = (c) => SalesPages.can(ctx, c);
  if (!SalesPages.canSee(ctx)) { main.innerHTML = '<p class="notice">You don’t have access to Sales.</p>'; return; }
  const id = new URLSearchParams(location.search).get('id');
  let sale = null, lines = [], pays = [];
  const canView = can('sale.view');
  main.innerHTML = '<p class="empty">Loading…</p>';

  function render() {
    const balance = Number(sale.total) - Number(sale.paid), active = sale.status === 'ACTIVE';
    const shown = ctx.isStaff ? lines : lines.filter((l) => l.status === 'ACTIVE');
    const lineRows = shown.map((l) => `<tr class="${l.status === 'INACTIVE' ? 'row-deleted' : ''}"><td>${esc(l.prod_code)} ${esc(l.description)}</td><td>${l.qty}</td><td>${money(l.unit_price)}</td><td>${money(l.line_total)}</td>
      ${ctx.isStaff ? `<td><span class="badge ${l.status.toLowerCase()}">${l.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td>` : ''}
      <td><div class="actions">${l.status === 'ACTIVE' && active ? `${can('sale.line_edit') ? `<button type="button" class="btn-sm secondary" data-l="edit" data-id="${l.id}">Edit</button>` : ''}${can('sale.line_delete') ? `<button type="button" class="btn-sm secondary" data-l="delete" data-id="${l.id}">Delete</button>` : ''}` : (l.status === 'INACTIVE' && ctx.isStaff ? `<button type="button" class="btn-sm secondary" data-l="restore" data-id="${l.id}">Restore</button>` : '')}</div></td></tr>`).join('');
    main.innerHTML = `<div class="crumbs"><a href="sales.html">Back to sales</a>${active && can('sale.edit') ? '<button type="button" class="btn-sm secondary" id="editSale">Edit sale</button>' : ''}</div>
      <section class="panel"><h2 class="panel-title">Sale ${esc(sale.trans_no)} <span class="badge ${sale.status.toLowerCase()}">${active ? 'Active' : 'Inactive'}</span></h2>
        <p class="muted">${esc(sale.sale_date)} · ${esc(sale.cust_no)} ${esc(sale.customer_name)} · Sold by ${esc(sale.emp_no)} ${esc(sale.employee_name)}</p></section>
      ${!canView ? '<div class="notice"><strong>No View Sale Details right</strong><br>Line items and payments are available to users with the View Sale Details right. Ask an Admin if you need access.</div>' : `
      <div class="two-col"><section class="panel"><div class="row-between"><h2 class="panel-title">Line items</h2>${active && can('sale.line_add') ? '<button type="button" class="btn-sm primary" id="addLine">Add line</button>' : ''}</div>
        ${shown.length ? `<div class="table-wrap"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th>${ctx.isStaff ? '<th>Status</th>' : ''}<th>Actions</th></tr></thead><tbody>${lineRows}</tbody></table></div>`
          : `<div class="empty"><strong>No line items yet</strong>${active && can('sale.line_add') ? '<br>Select Add line to add the first product.' : ''}</div>`}
        <p class="muted">Unit price is the price in force on the sales date. It cannot be typed.</p></section>
      <section class="panel"><h2 class="panel-title">Payment summary</h2>
        <dl class="facts one"><div><dt>Total</dt><dd>${money(sale.total)}</dd></div><div><dt>Paid</dt><dd>${money(sale.paid)}</dd></div><div><dt>Balance</dt><dd>${money(balance)}</dd></div><div><dt>Status</dt><dd>${SalesPages.payBadge(sale)}</dd></div></dl>
        ${active && can('sale.edit') && balance > 0 ? '<p><button type="button" class="btn-sm primary" id="addPay">Record payment</button></p>' : ''}
        ${pays.length ? `<div class="table-wrap"><table><thead><tr><th>OR no</th><th>Date</th><th>Amount</th></tr></thead><tbody>${pays.map((p) => `<tr><td>${esc(p.or_no)}</td><td>${esc(p.pay_date)}</td><td>${money(p.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No payments yet.</p>'}</section></div>`}`;
  }

  async function load() {
    try {
      sale = await SalesService.get(id);
      if (!sale) { main.innerHTML = '<p class="notice">This sale was not found, or you don’t have access to it. <a href="sales.html">Back to sales</a></p>'; return; }
      [lines, pays] = canView ? await Promise.all([SalesService.lines(id), SalesService.payments(id)]) : [[], []];
      render();
    } catch (e) { main.innerHTML = `<p class="error-text">${esc(e.message)} <button type="button" class="btn-sm secondary" id="retry">Try again</button></p>`; }
  }

  async function lineForm(row) {
    let products; try { products = await SalesService.products(); } catch (e) { return toast(e.message, 'error'); }
    const label = (p) => `${p.prod_code} ${p.description}`;
    const cur = row && products.find((p) => p.id === row.product_id);
    CrudList.formDialog({
      title: row ? 'Edit line item' : 'Add line item', saveLabel: 'Save line',
      fields: [
        { id: 'sale', label: 'Sale', readonly: true, value: `${sale.trans_no} · sales date ${sale.sale_date}` },
        { id: 'product', label: 'Product', options: products.map(label), value: cur ? label(cur) : '', hint: `The unit price comes from the price history on ${sale.sale_date}. It cannot be typed.` },
        { id: 'qty', label: 'Quantity', inputmode: 'numeric', value: row ? String(row.qty) : '' },
      ],
      validate: (v) => ({ product: v.product ? '' : 'Choose the product.', qty: /^[1-9]\d{0,5}$/.test(v.qty) ? '' : 'Enter a whole number of 1 or more.' }),
      save: async (v) => { try { await SalesService.saveLine(row && row.id, id, { productId: products.find((p) => label(p) === v.product).id, qty: Number(v.qty) }); }
        catch (e) { if (e.code === 'NO_PRICE') e.field = 'product'; throw e; } },
      done: 'Line saved.', onSaved: load,
    });
  }

  function payForm() {
    const balance = Number(sale.total) - Number(sale.paid);
    CrudList.formDialog({
      title: 'Record payment', saveLabel: 'Save payment',
      fields: [
        { id: 'sale', label: 'Sale', readonly: true, value: `${sale.trans_no} · balance ${money(balance)}` },
        { id: 'or', label: 'Official receipt number', readonly: true, value: 'Assigned automatically' },
        { id: 'date', label: 'Payment date', type: 'date', value: new Date().toISOString().slice(0, 10) },
        { id: 'amount', label: 'Amount', inputmode: 'decimal', value: '', hint: 'The amount cannot be more than the balance.' },
      ],
      validate: (v) => ({ date: v.date ? '' : 'Choose the payment date.',
        amount: !/^\d+(\.\d{1,2})?$/.test(v.amount) || Number(v.amount) <= 0 ? 'Enter an amount such as 100.00.' : (Number(v.amount) > balance + 0.001 ? `The amount cannot be more than the balance (${money(balance)}).` : '') }),
      save: async (v) => { try { await SalesService.savePayment(id, { date: v.date, amount: Number(v.amount) }); } catch (e) { if (e.code === 'OVERPAY') e.field = 'amount'; throw e; } },
      done: 'Payment recorded.', onSaved: load,
    });
  }

  function editSale() {
    SalesService.pickers().then(({ customers, employees }) => {
      const cl = (c) => `${c.cust_no} ${c.name}`, el = (e) => `${e.emp_no} ${e.full_name}`;
      const cur = (list, sid, fmt) => { const f = list.find((x) => x.id === sid); return f ? fmt(f) : ''; };
      CrudList.formDialog({
        title: 'Edit sale', saveLabel: 'Save sale',
        fields: [
          { id: 'number', label: 'Transaction number', readonly: true, value: sale.trans_no },
          { id: 'date', label: 'Sales date', type: 'date', value: sale.sale_date, hint: 'Existing line items keep the price they were given.' },
          { id: 'customer', label: 'Customer', options: customers.map(cl), value: cur(customers, sale.customer_id, cl) },
          { id: 'employee', label: 'Employee (salesperson)', options: employees.map(el), value: cur(employees, sale.employee_id, el) },
        ],
        validate: (v) => ({ date: v.date ? '' : 'Choose the sales date.', customer: v.customer ? '' : 'Choose the customer.', employee: v.employee ? '' : 'Choose the salesperson.' }),
        save: (v) => SalesService.save(id, { date: v.date, customerId: customers.find((c) => cl(c) === v.customer).id, employeeId: employees.find((e) => el(e) === v.employee).id }),
        done: 'Sale saved.', onSaved: load,
      });
    }).catch((e) => toast(e.message, 'error'));
  }

  main.addEventListener('click', async (e) => {
    if (e.target.id === 'retry') return load();
    if (e.target.id === 'editSale') return editSale();
    if (e.target.id === 'addLine') return lineForm(null);
    if (e.target.id === 'addPay') return payForm();
    const b = e.target.closest('[data-l]'); if (!b) return;
    const row = lines.find((l) => l.id === b.dataset.id); if (!row) return;
    if (b.dataset.l === 'edit') return lineForm(row);
    const del = b.dataset.l === 'delete';
    if (del && !(await App.confirm({ title: 'Delete line item?', message: `${row.prod_code} ${row.description} will be hidden from Users. An Admin can restore it.`, confirmLabel: 'Delete', danger: true }))) return;
    try { await SalesService.setLineDeleted(row.id, del); toast(del ? 'Line deleted.' : 'Line restored.', 'success'); await load(); } catch (err) { toast(err.message, 'error'); }
  });
  await load();
});
