const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const collection = () => getDb().collection('users');

const findById = (id) => collection().findOne({ _id: new ObjectId(id) });

/**
 * Finds the user for a GitHub account or creates one on first login.
 * Only public profile data is stored - never tokens or passwords.
 */
async function findOrCreateFromGithub(profile) {
  const now = new Date();
  return collection().findOneAndUpdate(
    { githubId: String(profile.id) },
    {
      $set: {
        username: profile.username,
        displayName: profile.displayName || profile.username,
        email: (profile.emails && profile.emails[0] && profile.emails[0].value) || null,
        avatarUrl: (profile.photos && profile.photos[0] && profile.photos[0].value) || null,
        updatedAt: now,
      },
      $setOnInsert: { githubId: String(profile.id), role: 'user', createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );
}

module.exports = { findById, findOrCreateFromGithub };
