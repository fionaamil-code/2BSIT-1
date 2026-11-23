App.start('Sales', async (ctx, main) => {
  const { esc } = App;
  const { money, can } = { money: SalesPages.money, can: (c) => SalesPages.can(ctx, c) };
  if (!SalesPages.canSee(ctx)) { main.innerHTML = '<p class="notice">You don’t have access to Sales.</p>'; return; }
  main.innerHTML = SalesPages.tabs('sales') + '<div id="list"></div>';

  function openForm(row, reload) {
    SalesService.pickers().then(({ customers, employees }) => {
      const cl = (c) => `${c.cust_no} ${c.name}`, el = (e) => `${e.emp_no} ${e.full_name}`;
      const cur = (list, id, fmt) => { const f = list.find((x) => x.id === id); return f ? fmt(f) : ''; };
      CrudList.formDialog({
        title: row ? 'Edit sale' : 'New sale', saveLabel: 'Save sale',
        fields: [
          { id: 'number', label: 'Transaction number', readonly: true, value: row ? row.trans_no : 'Assigned automatically' },
          { id: 'date', label: 'Sales date', type: 'date', value: row ? row.sale_date : new Date().toISOString().slice(0, 10) },
          { id: 'customer', label: 'Customer', options: customers.map(cl), value: row && cur(customers, row.customer_id, cl) },
          { id: 'employee', label: 'Employee (salesperson)', options: employees.map(el), value: row && cur(employees, row.employee_id, el), hint: 'Status and stamp are set by the system. Add products on the next screen.' },
        ],
        validate: (v) => ({ date: v.date ? '' : 'Choose the sales date.', customer: v.customer ? '' : 'Choose the customer.', employee: v.employee ? '' : 'Choose the salesperson.' }),
        save: (v) => SalesService.save(row && row.id, { date: v.date, customerId: customers.find((c) => cl(c) === v.customer).id, employeeId: employees.find((e) => el(e) === v.employee).id }),
        done: row ? 'Sale saved.' : 'Sale created.',
        onSaved: async (newId) => { if (!row && newId && can('sale.view')) window.location.href = `sale.html?id=${encodeURIComponent(newId)}`; else await reload(); },
      });
    }).catch((e) => App.toast(e.message, 'error'));
  }

  CrudList.mount(main.querySelector('#list'), ctx, {
    noun: 'sale', plural: 'sales', label: (r) => r.trans_no,
    columns: [
      { label: 'Trans no', render: (r) => esc(r.trans_no) }, { label: 'Sales date', render: (r) => esc(r.sale_date) },
      { label: 'Customer', render: (r) => esc(`${r.cust_no} ${r.customer_name}`) }, { label: 'Employee', render: (r) => esc(`${r.emp_no} ${r.employee_name}`) },
      { label: 'Total', render: (r) => money(r.total) },
    ],
    searchText: (r) => `${r.trans_no} ${r.customer_name} ${r.cust_no} ${r.employee_name}`,
    load: SalesService.list,
    canAdd: can('sale.add'), canEdit: can('sale.edit'), canDelete: can('sale.delete'),
    rowActions: (r) => (r.status === 'ACTIVE' && can('sale.view') ? [{ key: 'details', label: 'Details' }] : []),
    onAction: (key, row) => { if (key === 'details') window.location.href = `sale.html?id=${encodeURIComponent(row.id)}`; },
    setDeleted: (r, d) => SalesService.setDeleted(r.id, d),
    openForm,
  });
});
