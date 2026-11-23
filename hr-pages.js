// Shared Human Resources screen pieces: the Employees / Jobs / Departments tab bar and the lookup list.
(() => {
  'use strict';
  const { esc } = App;
  const canSee = (ctx) => ctx.isStaff || ctx.rights.some((r) => r.startsWith('hr.'));
  const can = (ctx, code) => ctx.isStaff || ctx.rights.includes(code);
  const TABS = [['employees', 'Employees', 'employees.html'], ['jobs', 'Jobs', 'jobs.html'], ['departments', 'Departments', 'departments.html']];
  const tabs = (active) => `<nav class="subtabs" aria-label="Human Resources">${TABS.map(([k, l, h]) =>
    `<a href="${h}" class="subtab${k === active ? ' active' : ''}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  const noAccess = (main) => { main.innerHTML = '<p class="notice">You don’t have access to Human Resources.</p>'; };

  // Jobs and Departments are small lookup lists with a code and one text field.
  function lookupPage({ active, noun, plural, codeKey, codeLabel, textKey, textLabel, rights, service }) {
    App.start('Human Resources', async (ctx, main) => {
      if (!canSee(ctx)) return noAccess(main);
      main.innerHTML = tabs(active) + '<div id="list"></div>';
      CrudList.mount(main.querySelector('#list'), ctx, {
        noun, plural, label: (r) => r[textKey],
        columns: [{ label: codeLabel, render: (r) => esc(r[codeKey]) }, { label: textLabel, render: (r) => esc(r[textKey]) }],
        searchText: (r) => `${r[codeKey]} ${r[textKey]}`,
        load: service.list,
        canAdd: can(ctx, `${rights}_add`), canEdit: can(ctx, `${rights}_edit`), canDelete: can(ctx, `${rights}_delete`),
        setDeleted: (r, d) => service.setDeleted(r.id, d),
        openForm: (row, reload) => CrudList.formDialog({
          title: `${row ? 'Edit' : 'Add'} ${noun}`, saveLabel: `Save ${noun}`,
          fields: [
            { id: 'code', label: codeLabel === 'Dept code' ? 'Department code' : 'Job code', readonly: true, value: row ? row[codeKey] : 'Assigned automatically' },
            { id: 'text', label: textLabel, value: row && row[textKey], hint: 'Status and stamp are set by the system.' },
          ],
          validate: (v) => ({ text: v.text ? '' : `Enter the ${textLabel.toLowerCase()}.` }),
          save: (v) => service.save(row && row.id, { name: v.text, description: v.text }),
          done: row ? `${noun[0].toUpperCase() + noun.slice(1)} saved.` : `${noun[0].toUpperCase() + noun.slice(1)} added.`, onSaved: reload,
        }),
      });
    });
  }
  window.HrPages = { tabs, canSee, can, noAccess, lookupPage };
})();
