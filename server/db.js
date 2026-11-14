const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('CRITICAL: MONGO_URI is not defined in environment variables.');
      throw new Error('MONGO_URI is missing');
    }
    connectionPromise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
      bufferCommands: false
    }).then((conn) => {
      console.log('MongoDB Atlas connected successfully.');
      return conn;
    }).catch((err) => {
      connectionPromise = null;
      console.error('MongoDB Atlas connection error:', err.message);
      throw err;
    });
  }

  return connectionPromise;
};

const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 1) return true;
  try {
    await connectDB();
    return mongoose.connection.readyState === 1;
  } catch (err) {
    return false;
  }
};

module.exports = { connectDB, ensureDbConnected };
