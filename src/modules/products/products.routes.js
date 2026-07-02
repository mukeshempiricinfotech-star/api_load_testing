const router = require('express').Router();
const { z } = require('zod'); const wrap = require('../../lib/asyncHandler'); const controller = require('./products.controller');
router.get('/search', (req, _res, next) => { try { req.query.q = z.string().trim().min(2).max(80).parse(req.query.q); next(); } catch (e) { next(e); } }, wrap(controller.search));
router.get('/', wrap(controller.list));
router.get('/:id', (req, _res, next) => { try { req.params.id = z.uuid().parse(req.params.id); next(); } catch (e) { next(e); } }, wrap(controller.detail));
module.exports = router;
