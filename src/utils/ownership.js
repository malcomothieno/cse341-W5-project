/** True if the user owns the record or has the admin role. */
function isOwnerOrAdmin(user, ownerId) {
  if (!user) return false;
  return user.role === 'admin' || String(ownerId) === String(user._id);
}

module.exports = { isOwnerOrAdmin };
