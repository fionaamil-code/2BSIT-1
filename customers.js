App.start('Customers', async (ctx, main) => {
  const { esc } = App;
  const can = (code) => ctx.isStaff || ctx.rights.includes(code);
  if (!ctx.isStaff && !ctx.rights.some((r) => r.startsWith('customer.'))) { main.innerHTML = '<p class="notice">You don’t have access to Customers.</p>'; return; }
  const TERMS = ['Net 15', 'Net 30', 'Net 45', 'COD', 'Prepaid'];

  CrudList.mount(main, ctx, {
    noun: 'customer', plural: 'customers', label: (r) => r.name,
    columns: [
      { label: 'Cust no', render: (r) => esc(r.cust_no) },
      { label: 'Customer name', render: (r) => esc(r.name) },
      { label: 'Address', render: (r) => esc(r.address) },
      { label: 'Pay terms', render: (r) => esc(r.pay_terms) },
    ],
    searchText: (r) => `${r.cust_no} ${r.name} ${r.address}`,
    load: CustomersService.list,
    canAdd: can('customer.add'), canEdit: can('customer.edit'), canDelete: can('customer.delete'),
    setDeleted: (r, deleted) => CustomersService.setDeleted(r.id, deleted),
    openForm: (row, reload) => CrudList.formDialog({
      title: row ? 'Edit customer' : 'Add customer', saveLabel: 'Save customer',
      fields: [
        { id: 'number', label: 'Customer number', readonly: true, value: row ? row.cust_no : 'Assigned automatically' },
        { id: 'name', label: 'Customer name', value: row && row.name },
        { id: 'address', label: 'Address', value: row && row.address },
        { id: 'terms', label: 'Payment terms', options: TERMS, value: row && row.pay_terms },
      ],
      validate: (v) => ({ name: v.name ? '' : 'Enter the customer name.', terms: v.terms ? '' : 'Choose the payment terms.' }),
      save: (v) => CustomersService.save(row && row.id, { name: v.name, address: v.address, payTerms: v.terms }),
      done: row ? 'Customer saved.' : 'Customer added.', onSaved: reload,
    }),
  });
});
