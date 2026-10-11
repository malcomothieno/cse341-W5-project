const router = require('express').Router();
const { passport, oauthConfigured } = require('../config/passport');
const c = require('../controllers/authController');
const { sendError } = require('../utils/httpError');

const needsOAuth = (req, res, next) =>
  oauthConfigured ? next() : sendError(res, 503, 'GitHub OAuth is not configured on this server');

router.get('/github', needsOAuth, passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  needsOAuth,
  passport.authenticate('github', { failureRedirect: '/auth/failure' }),
  (req, res) => res.redirect('/api-docs')
);

router.get('/status', c.status);
router.get('/failure', c.failure);
router.post('/logout', c.logout);

module.exports = router;
