window.CustomersService = {
  list: () => Api.run(Api.db().from('customers').select('id, cust_no, name, address, pay_terms, status, stamp_action, stamp_by, stamp_at').order('cust_no')),
  save: (id, { name, address, payTerms }) => Api.run(Api.db().rpc('customer_save', { p_id: id || null, p_name: name, p_address: address, p_terms: payTerms })),
  setDeleted: (id, deleted) => Api.run(Api.db().rpc('customer_set_deleted', { p_id: id, p_deleted: deleted })),
};
