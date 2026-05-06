/* ============================================================
   server.js — Express Entry Point (All 3 Phases)
   ============================================================ */
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const app = express();

/* ---- Middleware ---- */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---- Frontend Static Files ---- */
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

/* ---- Routes ---- */
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/user',       require('./routes/user'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/documents',  require('./routes/documents'));
app.use('/api/access',     require('./routes/access'));
app.use('/api/keypairs',   require('./routes/keypairs'));

/* ---- API Health Check ---- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'BlockID API running', version: '3.0.0' });
});

/* ---- Global Error Handler ---- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

/* ---- Connect DB & Start ---- */
const PORT        = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockid';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ BlockID server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
