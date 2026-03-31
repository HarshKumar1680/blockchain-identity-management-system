// === SERVER.JS (Updated: Phase 2) ===
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/user');
const blockchainRoutes = require('./routes/blockchain');
const documentRoutes   = require('./routes/documents');   // ← Phase 2

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'null'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/user',       userRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/documents',  documentRoutes);   // ← Phase 2

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ChainID API is running', timestamp: new Date() });
});

// Connect DB and start
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✓ MongoDB connected');

    // Initialize blockchain on startup
    const { getBlockchain } = require('./utils/blockchain');
    await getBlockchain();
    console.log('✓ Blockchain initialized');

    app.listen(PORT, () => {
      console.log(`\n🚀 ChainID Server running on http://localhost:${PORT}`);
      console.log(`   Phase 2: Auth + Identity + Blockchain + Document Verification\n`);
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err.message);
    console.log('\nMake sure MongoDB is running: mongod');
    process.exit(1);
  });
