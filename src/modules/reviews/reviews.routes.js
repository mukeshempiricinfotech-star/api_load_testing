const router = require('express').Router(); const { z } = require('zod'); const wrap = require('../../lib/asyncHandler'); const controller = require('./reviews.controller');
router.get('/:id/reviews', (req, _res, next) => { try { req.params.id = z.uuid().parse(req.params.id); next(); } catch (e) { next(e); } }, wrap(controller.list));
module.exports = router;
