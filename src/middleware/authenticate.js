const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config');
const { unauthorized } = require('../lib/errors');

module.exports = function authenticate(req, _res, next) {
  const value = req.get('authorization');
  if (!value?.startsWith('Bearer ')) return next(unauthorized('Bearer access token is required'));
  try { req.user = jwt.verify(value.slice(7), jwtAccessSecret, { algorithms: ['HS256'] }); next(); }
  catch { next(unauthorized('Access token is invalid or expired')); }
};
