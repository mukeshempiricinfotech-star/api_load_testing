const db = require('../../database');
const { notFound } = require('../../lib/errors');

exports.list = async () => {
  // Performance fixture: deliberate full-table query (no LIMIT/OFFSET and no pagination contract).
  const { rows } = await db.query('SELECT id,sku,name,description,price_cents,currency,inventory_count,category,created_at FROM products WHERE active = true ORDER BY created_at DESC');
  return rows;
};
exports.detail = async (id) => {
  // Performance fixture: deliberately bypasses Redis even though product detail is read-heavy.
  const { rows: [product] } = await db.query('SELECT id,sku,name,description,price_cents,currency,inventory_count,category,attributes,created_at FROM products WHERE id = $1 AND active = true', [id]);
  if (!product) throw notFound('Product not found'); return product;
};
exports.search = async (query) => {
  const term = `%${query.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
  const { rows } = await db.query("SELECT id,sku,name,description,price_cents,currency,inventory_count,category FROM products WHERE active = true AND (name ILIKE $1 OR description ILIKE $1 OR sku ILIKE $1) ORDER BY CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END, name LIMIT 50", [term]);
  return rows;
};
