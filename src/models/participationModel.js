const { createModel } = require('./baseModel');

const base = createModel('participations', { joinedAt: -1 });

/** Finds an ACTIVE participation for this user and target (used to block duplicates). */
base.findActiveByUserAndTarget = (userId, targetType, targetId) =>
  base.collection().findOne({ userId, targetType, targetId, status: 'active' });

module.exports = base;
