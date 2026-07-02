class HttpError extends Error { constructor(status, message, details) { super(message); this.status = status; this.details = details; } }
const notFound = (message = 'Resource not found') => new HttpError(404, message);
const conflict = (message) => new HttpError(409, message);
const unauthorized = (message = 'Authentication required') => new HttpError(401, message);
module.exports = { HttpError, notFound, conflict, unauthorized };
