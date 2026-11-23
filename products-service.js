window.ProductsService = {
  list: () => Api.run(Api.db().from('products_view').select('id, prod_code, description, unit, current_price, current_effective, status, stamp_action, stamp_by, stamp_at').order('prod_code')),
  save: (id, { description, unit }) => Api.run(Api.db().rpc('product_save', { p_id: id || null, p_description: description, p_unit: unit })),
  setDeleted: (id, deleted) => Api.run(Api.db().rpc('product_set_deleted', { p_id: id, p_deleted: deleted })),
  listPrices: (productId) => Api.run(Api.db().from('product_prices').select('id, effective_date, unit_price, status, stamp_action, stamp_by, stamp_at').eq('product_id', productId).order('effective_date', { ascending: false })),
  savePrice: (id, productId, { date, price }) => Api.run(Api.db().rpc('price_save', { p_id: id || null, p_product: productId, p_date: date, p_price: price })),
  setPriceDeleted: (id, deleted) => Api.run(Api.db().rpc('price_set_deleted', { p_id: id, p_deleted: deleted })),
};
