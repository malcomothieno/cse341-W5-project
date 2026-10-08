const { sendError } = require('../utils/httpError');

/** 404 for any route that does not exist. */
function notFound(req, res) {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Centralised error handler. Catches malformed JSON bodies (400) and anything
 * unexpected (500) without leaking stack traces to the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return sendError(res, 400, 'Malformed JSON in request body');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'Request body too large');
  }
  console.error('Unhandled error:', err.message);
  return sendError(res, 500, 'Internal server error');
}

module.exports = { notFound, errorHandler };
