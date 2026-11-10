const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://ashadijewellers1_db_user:HkYqoX8D4p2nwM0g@cluster0.xexbznb.mongodb.net/ashadi_jewellers?retryWrites=true&w=majority';
    connectionPromise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
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
