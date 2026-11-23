// Human Resources data access: departments, jobs, employees, job history.
(() => {
  'use strict';
  const db = () => Api.db(), rpc = (fn, args) => Api.run(db().rpc(fn, args));
  const STAMP = 'status, stamp_action, stamp_by, stamp_at';
  window.HrService = {
    Departments: {
      list: () => Api.run(db().from('departments').select(`id, dept_no, name, ${STAMP}`).order('dept_no')),
      save: (id, { name }) => rpc('department_save', { p_id: id || null, p_name: name }),
      setDeleted: (id, d) => rpc('department_set_deleted', { p_id: id, p_deleted: d }),
    },
    Jobs: {
      list: () => Api.run(db().from('jobs').select(`id, job_no, description, ${STAMP}`).order('job_no')),
      save: (id, { description }) => rpc('job_save', { p_id: id || null, p_description: description }),
      setDeleted: (id, d) => rpc('job_set_deleted', { p_id: id, p_deleted: d }),
    },
    Employees: {
      list: () => Api.run(db().from('employees').select(`id, emp_no, last_name, first_name, gender, birth_date, hire_date, sep_date, ${STAMP}`).order('emp_no')),
      async get(id) { const rows = await Api.run(db().from('employees').select(`id, emp_no, last_name, first_name, gender, birth_date, hire_date, sep_date, ${STAMP}`).eq('id', id)); return rows[0] || null; },
      save: (id, v) => rpc('employee_save', { p_id: id || null, p_last: v.last, p_first: v.first, p_gender: v.gender, p_birth: v.birth, p_hire: v.hire, p_sep: v.sep || null }),
      setDeleted: (id, d) => rpc('employee_set_deleted', { p_id: id, p_deleted: d }),
    },
    History: {
      list: (employeeId) => Api.run(db().from('job_history').select('id, effective_date, salary, job_id, dept_id, job:jobs(job_no, description), dept:departments(dept_no, name)').eq('employee_id', employeeId).order('effective_date', { ascending: false })),
      save: (id, employeeId, v) => rpc('history_save', { p_id: id || null, p_employee: employeeId, p_date: v.date, p_job: v.jobId, p_dept: v.deptId, p_salary: v.salary }),
      remove: (id) => rpc('history_delete', { p_id: id }),
    },
  };
})();
