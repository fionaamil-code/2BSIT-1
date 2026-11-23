App.start('Employee profile', async (ctx, main) => {
  const { esc, toast } = App;
  if (!HrPages.canSee(ctx)) return HrPages.noAccess(main);
  const can = (c) => HrPages.can(ctx, c);
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const id = new URLSearchParams(location.search).get('id');
  let emp = null, history = [], jobs = [], depts = [];
  const canView = can('hr.history_view');

  main.innerHTML = '<p class="empty">Loading…</p>';

  function render() {
    const name = `${emp.first_name} ${emp.last_name}`;
    const items = history.map((h, i) => `<li class="tl-item${i === 0 ? ' current' : ''}">
      <div class="tl-head"><strong>${esc(h.effective_date)}</strong>${i === 0 ? '<span class="badge active">Current</span>' : ''}<span class="tl-salary">${money(h.salary)}</span></div>
      <div class="muted">${esc(h.job.job_no)} ${esc(h.job.description)} · ${esc(h.dept.dept_no)} ${esc(h.dept.name)}</div>
      <div class="actions">${can('hr.history_edit') ? `<button type="button" class="btn-sm secondary" data-h="edit" data-id="${h.id}">Edit</button>` : ''}${can('hr.history_delete') ? `<button type="button" class="btn-sm secondary" data-h="delete" data-id="${h.id}">Delete</button>` : ''}</div></li>`).join('');
    const historyBlock = !canView
      ? '<div class="notice"><strong>No View Job History right</strong><br>Job history and salary are available to users with the View Job History right. Ask an Admin if you need access.</div>'
      : (history.length ? `<ol class="timeline">${items}</ol>`
        : `<div class="empty"><strong>No job history yet</strong>${can('hr.history_add') ? '<br>Select Add job history to record the first job and salary.' : ''}</div>`);
    main.innerHTML = `<div class="crumbs"><a href="employees.html">Back to employees</a>${emp.status === 'ACTIVE' && can('hr.emp_edit') ? '<button type="button" class="btn-sm secondary" id="editEmp">Edit</button>' : ''}</div>
      <section class="panel"><h2 class="panel-title">${esc(name)} <span class="badge ${emp.status.toLowerCase()}">${emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></h2>
        <dl class="facts"><div><dt>Employee number</dt><dd>${esc(emp.emp_no)}</dd></div><div><dt>Gender</dt><dd>${esc(emp.gender)}</dd></div>
          <div><dt>Birth date</dt><dd>${esc(emp.birth_date)}</dd></div><div><dt>Hire date</dt><dd>${esc(emp.hire_date)}</dd></div>
          ${emp.sep_date ? `<div><dt>Separation date</dt><dd>${esc(emp.sep_date)}</dd></div>` : ''}</dl></section>
      <section class="panel"><div class="row-between"><h2 class="panel-title">Job history</h2>${canView && emp.status === 'ACTIVE' && can('hr.history_add') ? '<button type="button" class="btn-sm primary" id="addHist">Add job history</button>' : ''}</div>${historyBlock}</section>`;
  }

  async function load() {
    try {
      emp = await HrService.Employees.get(id);
      if (!emp) { main.innerHTML = '<p class="notice">This employee was not found, or you don’t have access to it. <a href="employees.html">Back to employees</a></p>'; return; }
      history = canView ? await HrService.History.list(id) : [];
      render();
    } catch (e) { main.innerHTML = `<p class="error-text">${esc(e.message)} <button type="button" class="btn-sm secondary" id="retry">Try again</button></p>`; }
  }

  async function historyForm(row) {
    try { [jobs, depts] = await Promise.all([HrService.Jobs.list(), HrService.Departments.list()]); } catch (e) { return toast(e.message, 'error'); }
    const label = { job: (j) => `${j.job_no} ${j.description}`, dept: (d) => `${d.dept_no} ${d.name}` };
    const usable = (list, cur) => list.filter((x) => x.status === 'ACTIVE' || x.id === cur);
    const jobOpts = usable(jobs, row && row.job_id), deptOpts = usable(depts, row && row.dept_id);
    CrudList.formDialog({
      title: row ? 'Edit job history' : 'Add job history', saveLabel: 'Save job history',
      fields: [
        { id: 'date', label: 'Effective date', type: 'date', value: row && row.effective_date, hint: 'Two entries cannot have the same effective date. The latest date is the current job.' },
        { id: 'job', label: 'Job', options: jobOpts.map(label.job), value: row ? (jobs.find((j) => j.id === row.job_id) ? label.job(jobs.find((j) => j.id === row.job_id)) : '') : '' },
        { id: 'dept', label: 'Department', options: deptOpts.map(label.dept), value: row ? (depts.find((d) => d.id === row.dept_id) ? label.dept(depts.find((d) => d.id === row.dept_id)) : '') : '' },
        { id: 'salary', label: 'Salary', inputmode: 'decimal', value: row ? String(row.salary) : '', hint: 'Yearly salary in US dollars.' },
      ],
      validate: (v) => ({ date: v.date ? '' : 'Choose the effective date.', job: v.job ? '' : 'Choose the job.', dept: v.dept ? '' : 'Choose the department.',
        salary: /^\d+(\.\d{1,2})?$/.test(v.salary) ? '' : 'Enter a salary such as 52000.' }),
      save: async (v) => {
        try {
          await HrService.History.save(row && row.id, id, { date: v.date, jobId: jobOpts.find((j) => label.job(j) === v.job).id, deptId: deptOpts.find((d) => label.dept(d) === v.dept).id, salary: Number(v.salary) });
        } catch (e) { if (e.code === 'DUPLICATE') { e.field = 'date'; e.message = 'This employee already has an entry for that date.'; } throw e; }
      },
      done: 'Job history saved.', onSaved: load,
    });
  }

  main.addEventListener('click', async (e) => {
    if (e.target.id === 'retry') return load();
    if (e.target.id === 'editEmp') return EmployeeForm.open(emp, load);
    if (e.target.id === 'addHist') return historyForm(null);
    const b = e.target.closest('[data-h]'); if (!b) return;
    const row = history.find((h) => h.id === b.dataset.id); if (!row) return;
    if (b.dataset.h === 'edit') return historyForm(row);
    if (!(await App.confirm({ title: 'Delete this entry?', message: `The job history entry effective ${row.effective_date} will be removed.`, confirmLabel: 'Delete', danger: true }))) return;
    try { await HrService.History.remove(row.id); toast('Entry deleted.', 'success'); await load(); } catch (err) { toast(err.message, 'error'); }
  });
  await load();
});
