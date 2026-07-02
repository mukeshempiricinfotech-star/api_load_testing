module.exports = function errorHandler(error, _req, res, _next) {
  const status = Number(error.status || (error.name === 'ZodError' ? 400 : 500));
  if (status >= 500) console.error(error);
  res.status(status).json({ error: { code: status, message: error.message || 'Internal server error', details: error.details || error.issues } });
};
