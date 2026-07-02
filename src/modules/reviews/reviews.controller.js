const service = require('./reviews.service');
exports.list = async (req, res) => { const reviews = await service.forProduct(req.params.id); res.json({ data: reviews, meta: { productId: req.params.id, count: reviews.length, pagination: null } }); };
