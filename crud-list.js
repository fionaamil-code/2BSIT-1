// Reusable list screen used by every CRUD module (same layout everywhere):
// tabs and search on top, table below, actions at the row end. Staff also see Status and Stamp.
(() => {
  'use strict';
  const { esc, toast, modal } = App;
  const pad = (n) => String(n).padStart(2, '0');
  function stampText(r) {
    const d = new Date(r.stamp_at); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${esc(r.stamp_action)} ${esc(r.stamp_by)} ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${h}:${pad(d.getMinutes())} ${ap}`;
  }
  const STATUS = { ACTIVE: 'Active', INACTIVE: 'Inactive' };

  function blocked(noun, e) {
    if (e.code === 'IN_USE') modal({ title: 'Action blocked', body: `<p><strong>This ${esc(noun)} cannot be deleted</strong></p><p>${esc(e.message)}</p>`, actions: [{ label: 'Close' }] });
    else toast(e.message, 'error');
  }

  // fields: [{id, label, type, value, options, hint, readonly}]; validate(values) -> {id: message}
  function formDialog({ title, saveLabel = 'Save', fields, validate, save, done, onSaved }) {
    const form = document.createElement('form');
    form.noValidate = true;
    const control = (f) => {
      if (f.readonly) return `<p class="static">${esc(f.value)}</p>`;
      if (f.options) return `<select id="f_${f.id}"><option value="">Select ${esc(f.label.toLowerCase())}</option>${f.options.map((o) => `<option${o === f.value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      return `<input type="${f.type || 'text'}" id="f_${f.id}" value="${esc(f.value || '')}" autocomplete="off"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''}>`;
    };
    form.innerHTML = fields.map((f) => `<div class="field"><label${f.readonly ? '' : ` for="f_${f.id}"`}>${esc(f.label)}</label>${control(f)}${f.hint ? `<p class="help">${esc(f.hint)}</p>` : ''}<p class="error" id="e_${f.id}"></p></div>`).join('');
    const showErrors = (errs) => fields.forEach((f) => { const el = form.querySelector(`#e_${f.id}`); if (el) el.textContent = errs[f.id] || ''; });
    form.addEventListener('submit', (e) => e.preventDefault());
    return modal({ title, body: form, actions: [{ label: 'Cancel' }, { label: saveLabel, kind: 'primary', onClick: async (close) => {
      const values = {};
      fields.filter((f) => !f.readonly).forEach((f) => { values[f.id] = form.querySelector(`#f_${f.id}`).value.trim(); });
      const errs = validate ? validate(values) : {};
      showErrors(errs);
      if (Object.keys(errs).some((k) => errs[k])) return;
      try { await save(values); close(); toast(done, 'success'); if (onSaved) await onSaved(); }
      catch (e) { if (e.field) showErrors({ [e.field]: e.message }); else toast(e.message, 'error'); }
    } }] });
  }

  // cfg: {noun, plural, label(row), columns:[{label, render(row)}], load, searchText(row),
  //       canAdd, canEdit, canDelete, openForm(row|null, reload), setDeleted(row, bool), rowActions(row), onAction(key,row,reload)}
  function mount(main, ctx, cfg) {
    let rows = [], tab = 'ACTIVE', query = '';
    const staff = ctx.isStaff;
    main.innerHTML = `<div class="toolbar">${staff ? '<div class="tabs" id="tabs" role="tablist"></div>' : '<span></span>'}
      <div class="toolbar-right"><input type="search" id="q" placeholder="Search ${cfg.plural}" aria-label="Search ${cfg.plural}">
      ${cfg.canAdd ? `<button type="button" class="btn-sm primary" id="addBtn">Add ${cfg.noun}</button>` : ''}</div></div>
      <div class="table-wrap"><table><thead><tr>${cfg.columns.map((c) => `<th>${c.label}</th>`).join('')}${staff ? '<th>Status</th><th>Stamp</th>' : ''}<th>Actions</th></tr></thead><tbody id="body"></tbody></table></div>`;
    const body = main.querySelector('#body');
    const span = cfg.columns.length + (staff ? 3 : 1);
    body.innerHTML = `<tr><td colspan="${span}" class="empty">Loading…</td></tr>`;

    function actions(r) {
      const out = [];
      (cfg.rowActions ? cfg.rowActions(r) : []).forEach((a) => out.push(`<button type="button" class="btn-sm secondary" data-act="${a.key}" data-id="${r.id}">${esc(a.label)}</button>`));
      if (r.status === 'ACTIVE') {
        if (cfg.canEdit) out.push(`<button type="button" class="btn-sm secondary" data-act="edit" data-id="${r.id}">Edit</button>`);
        if (cfg.canDelete) out.push(`<button type="button" class="btn-sm secondary" data-act="delete" data-id="${r.id}">Delete</button>`);
      } else if (staff) out.push(`<button type="button" class="btn-sm secondary" data-act="restore" data-id="${r.id}">Restore</button>`);
      return out.length ? `<div class="actions">${out.join('')}</div>` : '—';
    }
    function draw() {
      const count = (s) => rows.filter((r) => s === 'ALL' || r.status === s).length;
      if (staff) main.querySelector('#tabs').innerHTML = [['ACTIVE', 'Active'], ['INACTIVE', 'Inactive'], ['ALL', 'All']].map(([k, l]) =>
        `<button type="button" role="tab" class="tab${tab === k ? ' active' : ''}" aria-selected="${tab === k}" data-tab="${k}">${l} (${count(k)})</button>`).join('');
      const q = query.trim().toLowerCase();
      const shown = rows.filter((r) => (!staff || tab === 'ALL' || r.status === tab) && (!q || cfg.searchText(r).toLowerCase().includes(q)));
      if (!shown.length) {
        const msg = q ? `<strong>No ${cfg.plural} match your search.</strong>` : `<strong>No ${cfg.plural} yet</strong>${cfg.canAdd ? `<br>Select Add ${cfg.noun} to create the first one.` : ''}`;
        body.innerHTML = `<tr><td colspan="${span}" class="empty">${msg}</td></tr>`; return;
      }
      body.innerHTML = shown.map((r) => `<tr class="${r.status === 'INACTIVE' ? 'row-deleted' : ''}">${cfg.columns.map((c) => `<td>${c.render(r)}</td>`).join('')}
        ${staff ? `<td><span class="badge ${r.status.toLowerCase()}">${STATUS[r.status]}</span></td><td class="stamp">${stampText(r)}</td>` : ''}<td>${actions(r)}</td></tr>`).join('');
    }
    async function reload() {
      try { rows = await cfg.load(); draw(); }
      catch (e) { body.innerHTML = `<tr><td colspan="${span}" class="empty error-text">${esc(e.message)} <button type="button" class="btn-sm secondary" id="retry">Try again</button></td></tr>`; }
    }
    async function remove(r) {
      if (!(await App.confirm({ title: `Delete ${cfg.noun}?`, message: `${cfg.label(r)} will be hidden from Users. An Admin can restore it.`, confirmLabel: 'Delete', danger: true }))) return;
      try { await cfg.setDeleted(r, true); toast(`${cfg.label(r)} was deleted.`, 'success'); await reload(); } catch (e) { blocked(cfg.noun, e); }
    }
    main.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; return draw(); }
      if (e.target.id === 'retry') return reload();
      if (e.target.id === 'addBtn') return cfg.openForm(null, reload);
      const b = e.target.closest('[data-act]'); if (!b) return;
      const r = rows.find((x) => x.id === b.dataset.id); if (!r) return;
      if (b.dataset.act === 'edit') cfg.openForm(r, reload);
      else if (b.dataset.act === 'delete') remove(r);
      else if (b.dataset.act === 'restore') { try { await cfg.setDeleted(r, false); toast(`${cfg.label(r)} was restored.`, 'success'); await reload(); } catch (err) { toast(err.message, 'error'); } }
      else if (cfg.onAction) cfg.onAction(b.dataset.act, r, reload);
    });
    main.querySelector('#q').addEventListener('input', (e) => { query = e.target.value; draw(); });
    return reload().then(() => ({ reload }));
  }

  window.CrudList = { mount, formDialog, blocked };
})();
