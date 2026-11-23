// Add / Edit employee dialog (used by the list and by the profile page).
window.EmployeeForm = {
  open(row, onSaved) {
    CrudList.formDialog({
      title: row ? 'Edit employee' : 'Add employee', saveLabel: 'Save employee',
      fields: [
        { id: 'number', label: 'Employee number', readonly: true, value: row ? row.emp_no : 'Assigned automatically' },
        { id: 'last', label: 'Last name', value: row && row.last_name },
        { id: 'first', label: 'First name', value: row && row.first_name },
        { id: 'gender', label: 'Gender', options: ['F', 'M'], value: row && row.gender },
        { id: 'birth', label: 'Birth date', type: 'date', value: row && row.birth_date },
        { id: 'hire', label: 'Hire date', type: 'date', value: row && row.hire_date },
        { id: 'sep', label: 'Separation date', type: 'date', value: row && row.sep_date, hint: 'Leave empty while the person is still employed.' },
      ],
      validate: (v) => ({
        last: v.last ? '' : 'Enter the last name.', first: v.first ? '' : 'Enter the first name.', gender: v.gender ? '' : 'Choose the gender.',
        birth: v.birth ? '' : 'Choose the birth date.',
        hire: !v.hire ? 'Choose the hire date.' : (v.birth && v.hire < v.birth ? 'The hire date must be after the birth date.' : ''),
        sep: v.sep && v.hire && v.sep < v.hire ? 'The separation date can’t be before the hire date.' : '',
      }),
      save: (v) => HrService.Employees.save(row && row.id, v),
      done: row ? 'Employee saved.' : 'Employee added.', onSaved,
    });
  },
};
