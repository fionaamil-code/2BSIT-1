App.start('Products', async (ctx, main) => {
  const { esc, toast, modal } = App;
  const can = (code) => ctx.isStaff || ctx.rights.includes(code);
  if (!ctx.isStaff && !ctx.rights.some((r) => r.startsWith('product.'))) { main.innerHTML = '<p class="notice">You don’t have access to Products.</p>'; return; }
  const money = (n) => (n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n));
  const stamp = (r) => `${esc(r.stamp_action)} ${esc(r.stamp_by)} ${esc(String(r.stamp_at).slice(0, 10))}`;

  async function pricesDialog(p, reloadProducts) {
    const wrap = document.createElement('div');
    let prices = [];
    const headerLine = () => {
      const cur = prices.filter((x) => x.status === 'ACTIVE' && x.effective_date <= new Date().toISOString().slice(0, 10))[0];
      return `<p class="muted">Unit: ${esc(p.unit)} · Current price: ${cur ? `${money(cur.unit_price)}, effective ${esc(cur.effective_date)}` : 'none yet'}</p>`;
    };
    function draw() {
      const shown = ctx.isStaff ? prices : prices.filter((x) => x.status === 'ACTIVE');
      wrap.innerHTML = headerLine() + (shown.length ? `<div class="table-wrap"><table><thead><tr><th>Effective date</th><th>Unit price</th>${ctx.isStaff ? '<th>Status</th><th>Stamp</th>' : ''}<th>Actions</th></tr></thead><tbody>
        ${shown.map((x) => `<tr class="${x.status === 'INACTIVE' ? 'row-deleted' : ''}"><td>${esc(x.effective_date)}</td><td>${money(x.unit_price)}</td>
          ${ctx.isStaff ? `<td><span class="badge ${x.status.toLowerCase()}">${x.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td><td class="stamp">${stamp(x)}</td>` : ''}
          <td><div class="actions">${x.status === 'ACTIVE'
            ? `${can('product.price_edit') ? `<button type="button" class="btn-sm secondary" data-p="edit" data-id="${x.id}">Edit</button>` : ''}${can('product.price_delete') ? `<button type="button" class="btn-sm secondary" data-p="delete" data-id="${x.id}">Delete</button>` : ''}`
            : (ctx.isStaff ? `<button type="button" class="btn-sm secondary" data-p="restore" data-id="${x.id}">Restore</button>` : '')}</div></td></tr>`).join('')}</tbody></table></div>`
        : '<p class="empty"><strong>No prices yet</strong></p>');
    }
    async function refresh() { try { prices = await ProductsService.listPrices(p.id); draw(); } catch (e) { wrap.innerHTML = `<p class="error-text">${esc(e.message)}</p>`; } }
    const after = async () => { await refresh(); await reloadProducts(); };
    function priceForm(row) {
      CrudList.formDialog({
        title: row ? 'Edit price' : 'Add price', saveLabel: 'Save price',
        fields: [
          { id: 'date', label: 'Effective date', type: 'date', value: row && row.effective_date },
          { id: 'price', label: 'Unit price', inputmode: 'decimal', value: row ? String(row.unit_price) : '', hint: 'In US dollars, for example 13.75.' },
        ],
        validate: (v) => ({ date: v.date ? '' : 'Choose the effective date.', price: /^\d+(\.\d{1,2})?$/.test(v.price) ? '' : 'Enter a price such as 13.75.' }),
        save: async (v) => { try { await ProductsService.savePrice(row && row.id, p.id, { date: v.date, price: Number(v.price) }); } catch (e) { if (e.code === 'DUPLICATE') e.field = 'date', e.message = 'This product already has a price for that date.'; throw e; } },
        done: 'Price saved.', onSaved: after,
      });
    }
    wrap.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const row = prices.find((x) => x.id === b.dataset.id); if (!row) return;
      if (b.dataset.p === 'edit') return priceForm(row);
      const del = b.dataset.p === 'delete';
      if (del && !(await App.confirm({ title: 'Delete price?', message: `The price effective ${row.effective_date} will be hidden from Users. An Admin can restore it.`, confirmLabel: 'Delete', danger: true }))) return;
      try { await ProductsService.setPriceDeleted(row.id, del); toast(del ? 'Price deleted.' : 'Price restored.', 'success'); await after(); } catch (err) { toast(err.message, 'error'); }
    });
    modal({ title: `Price history — ${p.prod_code} ${p.description}`, body: wrap, wide: true,
      actions: [...(can('product.price_add') ? [{ label: 'Add price', kind: 'primary', onClick: () => priceForm(null) }] : []), { label: 'Close' }] });
    wrap.innerHTML = '<p class="empty">Loading…</p>';
    await refresh();
  }

  CrudList.mount(main, ctx, {
    noun: 'product', plural: 'products', label: (r) => r.description,
    columns: [
      { label: 'Prod code', render: (r) => esc(r.prod_code) },
      { label: 'Description', render: (r) => esc(r.description) },
      { label: 'Unit', render: (r) => esc(r.unit) },
      { label: 'Current price', render: (r) => money(r.current_price) },
    ],
    searchText: (r) => `${r.prod_code} ${r.description} ${r.unit}`,
    load: ProductsService.list,
    canAdd: can('product.add'), canEdit: can('product.edit'), canDelete: can('product.delete'),
    rowActions: (r) => (r.status === 'ACTIVE' ? [{ key: 'prices', label: 'Prices' }] : []),
    onAction: (key, row, reload) => { if (key === 'prices') pricesDialog(row, reload); },
    setDeleted: (r, deleted) => ProductsService.setDeleted(r.id, deleted),
    openForm: (row, reload) => CrudList.formDialog({
      title: row ? 'Edit product' : 'Add product', saveLabel: 'Save product',
      fields: [
        { id: 'code', label: 'Product code', readonly: true, value: row ? row.prod_code : 'Assigned automatically' },
        { id: 'description', label: 'Description', value: row && row.description },
        { id: 'unit', label: 'Unit', value: row && row.unit, hint: 'For example pcs, can, pair or meter.' },
      ],
      validate: (v) => ({ description: v.description ? '' : 'Enter the description.', unit: v.unit ? '' : 'Enter the unit.' }),
      save: (v) => ProductsService.save(row && row.id, { description: v.description, unit: v.unit }),
      done: row ? 'Product saved.' : 'Product added.', onSaved: reload,
    }),
  });
});
