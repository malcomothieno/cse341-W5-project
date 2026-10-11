const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

/**
 * Builds the standard collection-access functions used by every resource.
 * @param {string} name  MongoDB collection name
 * @param {object} sort  default sort for findAll
 */
function createModel(name, sort = { createdAt: -1 }) {
  const collection = () => getDb().collection(name);

  return {
    findAll: (filter = {}) => collection().find(filter).sort(sort).toArray(),

    findById: (id) => collection().findOne({ _id: new ObjectId(id) }),

    async create(data) {
      const now = new Date();
      const doc = { ...data, createdAt: now, updatedAt: now };
      const result = await collection().insertOne(doc);
      return { _id: result.insertedId, ...doc };
    },

    /** Returns the updated document, or null if nothing matched the id. */
    update: (id, data) =>
      collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      ),

    /** Returns true if a document was deleted. */
    async remove(id) {
      const result = await collection().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    },

    collection,
  };
}

module.exports = { createModel };
