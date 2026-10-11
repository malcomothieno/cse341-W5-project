const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/userModel');

const oauthConfigured = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_CALLBACK_URL
);

if (oauthConfigured) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await User.findOrCreateFromGithub(profile);
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('GitHub OAuth is not configured (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / GITHUB_CALLBACK_URL). Login will be unavailable.');
}

// Only the user id is stored in the session; the full user is re-loaded per request.
passport.serializeUser((user, done) => done(null, String(user._id)));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    return done(null, user || false);
  } catch (err) {
    return done(err);
  }
});

module.exports = { passport, oauthConfigured };
