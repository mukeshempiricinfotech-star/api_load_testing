const service = require('./products.service');
exports.list = async (_req, res) => { const products = await service.list(); res.json({ data: products, meta: { count: products.length, pagination: null } }); };
exports.detail = async (req, res) => res.json({ data: await service.detail(req.params.id) });
exports.search = async (req, res) => { const products = await service.search(req.query.q); res.json({ data: products, meta: { count: products.length, query: req.query.q, limit: 50 } }); };
