const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const collection = () => getDb().collection('announcements');

async function findAll(filter = {}) {
  return collection().find(filter).sort({ publishedAt: -1 }).toArray();
}

async function findById(id) {
  return collection().findOne({ _id: new ObjectId(id) });
}

async function create(data) {
  const now = new Date();
  const doc = { ...data, createdAt: now, updatedAt: now };
  const result = await collection().insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/** Returns the updated document, or null if no document matched the id. */
async function update(id, data) {
  return collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
}

/** Returns true if a document was deleted. */
async function remove(id) {
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

module.exports = { findAll, findById, create, update, remove };
