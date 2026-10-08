require('dotenv').config();

const app = require('./app');
const { connectDb } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDb();
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`CampusConnect API listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
