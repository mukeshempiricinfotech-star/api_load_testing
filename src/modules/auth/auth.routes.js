const router = require('express').Router();
const { z } = require('zod');
const controller = require('./auth.controller');
const wrap = require('../../lib/asyncHandler');

const credentials = z.object({ email: z.email(), password: z.string().min(10).max(128) });
const registration = credentials.extend({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80) });
const refresh = credentials.extend({ refreshToken: z.string().min(20) });
const validate = (schema) => (req, _res, next) => { try { req.validated = schema.parse(req.body); next(); } catch (error) { next(error); } };
router.post('/register', validate(registration), wrap(controller.register));
router.post('/login', validate(credentials), wrap(controller.login));
router.post('/refresh', validate(refresh), wrap(controller.refresh));
router.post('/logout', validate(refresh), wrap(controller.logout));
module.exports = router;
