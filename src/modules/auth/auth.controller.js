const service = require('./auth.service');
exports.register = async (req, res) => res.status(201).json(await service.register(req.validated));
exports.login = async (req, res) => res.json(await service.login(req.validated));
exports.refresh = async (req, res) => res.json(await service.refresh(req.validated));
exports.logout = async (req, res) => res.json(await service.logout(req.validated));
