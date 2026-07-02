const db = require('../../database'); const queue = require('../../lib/orderQueue'); const { HttpError } = require('../../lib/errors');
exports.list = async (userId) => {
  const { rows: orders } = await db.query('SELECT id,status,subtotal_cents,shipping_cents,tax_cents,total_cents,currency,shipping_address,created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  // Performance fixture: intentional N+1, one separate line-items query per order.
  for (const order of orders) { const { rows } = await db.query('SELECT oi.id,oi.quantity,oi.unit_price_cents,p.id product_id,p.name,p.sku FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=$1 ORDER BY oi.id', [order.id]); order.items = rows; }
  return orders;
};
exports.create = async (userId, input) => {
  const order = await db.transaction(async (client) => {
    const ids = input.items.map((item) => item.productId); const { rows: products } = await client.query('SELECT id,price_cents,currency,inventory_count FROM products WHERE id=ANY($1::uuid[]) AND active=true FOR UPDATE', [ids]);
    if (products.length !== new Set(ids).size) throw new HttpError(400, 'One or more products are not available');
    const byId = new Map(products.map((p) => [p.id, p])); let subtotal = 0;
    for (const item of input.items) { const p = byId.get(item.productId); if (p.inventory_count < item.quantity) throw new HttpError(409, `Insufficient inventory for ${item.productId}`); subtotal += p.price_cents * item.quantity; }
    const shipping = subtotal >= 7500 ? 0 : 799; const tax = Math.round(subtotal * 0.08); const total = subtotal + shipping + tax;
    const { rows: [created] } = await client.query("INSERT INTO orders(user_id,status,subtotal_cents,shipping_cents,tax_cents,total_cents,currency,shipping_address) VALUES($1,'pending',$2,$3,$4,$5,$6,$7) RETURNING *", [userId, subtotal, shipping, tax, total, products[0].currency, input.shippingAddress]);
    for (const item of input.items) { const p = byId.get(item.productId); await client.query('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents) VALUES($1,$2,$3,$4)', [created.id, item.productId, item.quantity, p.price_cents]); await client.query('UPDATE products SET inventory_count=inventory_count-$1 WHERE id=$2', [item.quantity, item.productId]); }
    return created;
  });
  await queue.add('send-order-confirmation', { orderId: order.id, userId }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 500 });
  return order;
};
