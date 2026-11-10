const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const craftsmenRouter = require('./routes/craftsmen');
const designsRouter = require('./routes/designs');
const operationsRouter = require('./routes/operations');
const allocationsRouter = require('./routes/allocations');
const timelogsRouter = require('./routes/timelogs');
const dashboardRouter = require('./routes/dashboard');
const leavesRouter = require('./routes/leaves');
const reportsRouter = require('./routes/reports');
const clientShopsRouter = require('./routes/clientShops');
const authRouter = require('./routes/auth');
const { syncAdminFromAtlas } = require('./data/adminStore');

const Craftsman = require('./models/Craftsman');
const Design = require('./models/Design');
const Allocation = require('./models/Allocation');
const TimeLog = require('./models/TimeLog');
const Leave = require('./models/Leave');
const { craftsmenList, designsMaster, allocationsList, timeLogsList, leavesList } = require('./data/initialData');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/craftsmen', craftsmenRouter);
app.use('/api/designs', designsRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/allocations', allocationsRouter);
app.use('/api/timelogs', timelogsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/client-shops', clientShopsRouter);
app.use('/api/auth', authRouter);

// Root and API entrypoints
app.get('/api', (req, res) => {
  res.status(200).json({
    system: 'Ashadi Jewellers — Labour Cost & Production Management System API',
    status: 'online',
    version: '2.1.0',
    craftsmenHeadcount: 63,
    database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas (Connected)' : 'In-Memory / File Mode',
    endpoints: {
      metrics: 'http://localhost:5000/api/dashboard/metrics',
      craftsmen: 'http://localhost:5000/api/craftsmen',
      leaves: 'http://localhost:5000/api/leaves',
      leavesSummary: 'http://localhost:5000/api/leaves/summary',
      designs: 'http://localhost:5000/api/designs',
      operations: 'http://localhost:5000/api/operations',
      allocations: 'http://localhost:5000/api/allocations',
      timelogs: 'http://localhost:5000/api/timelogs',
      monthlyReport: 'http://localhost:5000/api/reports/monthly',
      downloadExcel: 'http://localhost:5000/api/dashboard/download-excel',
      health: 'http://localhost:5000/api/health'
    }
  });
});

app.get('/', (req, res) => {
  res.redirect('/api');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    system: 'Ashadi Jewellers Labour Cost & Production Management System',
    craftsmenHeadcount: 63,
    database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas Connected' : 'In-Memory Resilient Mode',
    timestamp: new Date().toISOString()
  });
});

// Auto-seed database and sync Seniority-ordered Craftsmen
const checkAndSeedDB = async () => {
  try {
    const count = await Craftsman.countDocuments();
    if (count === 0) {
      console.log('MongoDB Atlas is empty. Auto-seeding initial 63 craftsmen & master data (Seniority Indexed)...');
      await Craftsman.insertMany(craftsmenList);
      await Design.insertMany(designsMaster);
      await Allocation.insertMany(allocationsList);
      await TimeLog.insertMany(timeLogsList);
      await Leave.insertMany(leavesList);
      console.log('Successfully seeded 63 Craftsmen, Master Designs, Leaves, and Orders into MongoDB Atlas!');
    } else {
      // Load user's saved craftsmen from MongoDB Atlas so edits persist across server restarts
      const dbCraftsmen = await Craftsman.find().lean();
      if (dbCraftsmen && dbCraftsmen.length > 0) {
        craftsmenList.length = 0;
        dbCraftsmen.forEach(c => craftsmenList.push(c));
        console.log(`Loaded ${dbCraftsmen.length} saved craftsmen from MongoDB Atlas (All user edits preserved).`);
      }
    }
    // Sync Admin credentials with MongoDB Atlas
    await syncAdminFromAtlas();
  } catch (err) {
    console.log('Auto-seed check notice:', err.message);
  }
};

// Database connection
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ashadi_jewellers';
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas successfully!');
    await checkAndSeedDB();
  } catch (err) {
    console.log('MongoDB Atlas connection notice:', err.message);
    console.log('Continuing in resilient In-Memory / File Data Mode (0 disruption).');
  }

  app.listen(PORT, () => {
    console.log(`Ashadi Jewellers Labour Management Server is running on port: ${PORT}`);
  });
};

connectDB();
