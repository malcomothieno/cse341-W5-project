const { sendError } = require('../utils/httpError');

/** Blocks the request with 401 unless the caller has a valid logged-in session. */
function requireAuth(req, res, next) {
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    return next();
  }
  return sendError(res, 401, 'Authentication required. Log in at /auth/github first');
}

module.exports = { requireAuth };
