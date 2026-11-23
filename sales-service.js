// Sales data access: sales, line items, payments, pick lists.
(() => {
  'use strict';
  const db = () => Api.db(), rpc = (fn, args) => Api.run(db().rpc(fn, args));
  window.SalesService = {
    list: () => Api.run(db().from('sales_view').select('*').order('trans_no')),
    async get(id) { const rows = await Api.run(db().from('sales_view').select('*').eq('id', id)); return rows[0] || null; },
    pickers: async () => { const [customers, employees] = await Promise.all([rpc('sale_customers'), rpc('sale_employees')]); return { customers, employees }; },
    products: () => rpc('sale_products'),
    save: (id, v) => rpc('sale_save', { p_id: id || null, p_date: v.date, p_customer: v.customerId, p_employee: v.employeeId }),
    setDeleted: (id, d) => rpc('sale_set_deleted', { p_id: id, p_deleted: d }),
    lines: (saleId) => Api.run(db().from('sale_lines_view').select('*').eq('sale_id', saleId).order('stamp_at')),
    saveLine: (id, saleId, v) => rpc('line_save', { p_id: id || null, p_sale: saleId, p_product: v.productId, p_qty: v.qty }),
    setLineDeleted: (id, d) => rpc('line_set_deleted', { p_id: id, p_deleted: d }),
    payments: (saleId) => Api.run(db().from('payments').select('id, or_no, pay_date, amount').eq('sale_id', saleId).order('pay_date')),
    savePayment: (saleId, v) => rpc('payment_save', { p_sale: saleId, p_date: v.date, p_amount: v.amount }),
  };
})();
