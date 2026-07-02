const service = require('./orders.service');
exports.list = async (req, res) => { const data = await service.list(req.user.sub); res.json({ data, meta: { count: data.length } }); };
exports.create = async (req, res) => res.status(201).json({ data: await service.create(req.user.sub, req.validated) });
