const { sendError } = require('../utils/httpError');

// GET /auth/status
function status(req, res) {
  try {
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      const u = req.user;
      return res.status(200).json({
        authenticated: true,
        user: { id: String(u._id), username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl, role: u.role },
      });
    }
    return res.status(200).json({ authenticated: false });
  } catch (err) {
    console.error('status failed:', err.message);
    return sendError(res, 500, 'Failed to read authentication status');
  }
}

// GET /auth/failure
function failure(req, res) {
  return sendError(res, 401, 'GitHub authentication failed');
}

// POST /auth/logout
function logout(req, res) {
  try {
    req.logout((err) => {
      if (err) return sendError(res, 500, 'Logout failed');
      const finish = (destroyErr) => {
        res.clearCookie('connect.sid');
        if (destroyErr) return sendError(res, 500, 'Logout failed');
        return res.status(200).json({ message: 'Logged out successfully' });
      };
      if (req.session) return req.session.destroy(finish);
      return finish();
    });
  } catch (err) {
    console.error('logout failed:', err.message);
    return sendError(res, 500, 'Logout failed');
  }
}

module.exports = { status, failure, logout };
