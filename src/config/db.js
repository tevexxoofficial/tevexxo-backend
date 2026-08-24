const mongoose = require('mongoose');
const { mongodbUri } = require('./env');

async function connectDB() {
  if (!mongodbUri) {
    throw new Error(
      'MONGODB_URI is not set. Copy backend/.env.example to backend/.env and provide your MongoDB connection string.'
    );
  }
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(mongodbUri);
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
