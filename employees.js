App.start('Human Resources', async (ctx, main) => {
  const { esc } = App;
  if (!HrPages.canSee(ctx)) return HrPages.noAccess(main);
  const can = (c) => HrPages.can(ctx, c);
  main.innerHTML = HrPages.tabs('employees') + '<div id="list"></div>';
  CrudList.mount(main.querySelector('#list'), ctx, {
    noun: 'employee', plural: 'employees', label: (r) => `${r.first_name} ${r.last_name}`,
    columns: [
      { label: 'Emp no', render: (r) => esc(r.emp_no) }, { label: 'Last name', render: (r) => esc(r.last_name) },
      { label: 'First name', render: (r) => esc(r.first_name) }, { label: 'Gender', render: (r) => esc(r.gender) },
      { label: 'Birth date', render: (r) => esc(r.birth_date) }, { label: 'Hire date', render: (r) => esc(r.hire_date) },
      { label: 'Sep date', render: (r) => esc(r.sep_date || '—') },
    ],
    searchText: (r) => `${r.emp_no} ${r.last_name} ${r.first_name}`,
    load: HrService.Employees.list,
    canAdd: can('hr.emp_add'), canEdit: can('hr.emp_edit'), canDelete: can('hr.emp_delete'),
    rowActions: () => [{ key: 'profile', label: 'Profile' }],
    onAction: (key, row) => { if (key === 'profile') window.location.href = `employee.html?id=${encodeURIComponent(row.id)}`; },
    setDeleted: (r, d) => HrService.Employees.setDeleted(r.id, d),
    openForm: (row, reload) => EmployeeForm.open(row, reload),
  });
});
