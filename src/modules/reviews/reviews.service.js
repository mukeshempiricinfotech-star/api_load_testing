const db = require('../../database');
exports.forProduct = async (productId) => {
  // Performance fixture APIPERF-1: intentionally unbounded result and response payload.
  const { rows } = await db.query('SELECT r.id,r.rating,r.title,r.body,r.created_at,u.first_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 ORDER BY r.created_at DESC', [productId]);
  return rows;
};
