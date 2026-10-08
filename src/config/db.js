const { MongoClient } = require('mongodb');

let client;
let db;

/**
 * Connects to MongoDB Atlas once and caches the handle.
 * Credentials come only from environment variables.
 */
async function connectDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your .env file or Render environment variables.');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.DB_NAME || 'campusconnect');
  return db;
}

/** Returns the connected database (throws if connectDb() has not completed). */
function getDb() {
  if (!db) {
    throw new Error('Database not initialised. Call connectDb() first.');
  }
  return db;
}

async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

module.exports = { connectDb, getDb, closeDb };
