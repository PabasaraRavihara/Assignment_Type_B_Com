require('dotenv').config();
const mongoose = require('mongoose');
const Craftsman = require('./models/Craftsman');
const Design = require('./models/Design');
const Allocation = require('./models/Allocation');
const TimeLog = require('./models/TimeLog');
const { craftsmenList, designsMaster, allocationsList, timeLogsList } = require('./data/initialData');

const seedDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('No MONGO_URI found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas at:', mongoURI.split('@')[1] || mongoURI);
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected successfully to MongoDB Atlas!');

    // 1. Seed Craftsmen
    await Craftsman.deleteMany({});
    const insertedCraftsmen = await Craftsman.insertMany(craftsmenList);
    console.log(`Successfully seeded ${insertedCraftsmen.length} Craftsmen into MongoDB Atlas!`);

    // 2. Seed Designs
    await Design.deleteMany({});
    const insertedDesigns = await Design.insertMany(designsMaster);
    console.log(`Successfully seeded ${insertedDesigns.length} Designs into MongoDB Atlas!`);

    // 3. Seed Allocations
    await Allocation.deleteMany({});
    const insertedAllocations = await Allocation.insertMany(allocationsList);
    console.log(`Successfully seeded ${insertedAllocations.length} Allocations into MongoDB Atlas!`);

    // 4. Seed Time Logs
    await TimeLog.deleteMany({});
    const insertedLogs = await TimeLog.insertMany(timeLogsList);
    console.log(`Successfully seeded ${insertedLogs.length} Time Logs into MongoDB Atlas!`);

    console.log('\n--- ALL ASHADI JEWELLERS DATA SEEDED SUCCESSFULLY TO MONGODB ATLAS ---');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDB();
