/* ============================================================
   models/KeyPair.js — RSA Key Pair Schema (Phase 3)
   Private keys are NEVER stored on server — only public keys
   ============================================================ */
const mongoose = require('mongoose');

const keyPairSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label:       { type: String, required: true, trim: true },
  algorithm:   { type: String, default: 'RSA-PSS' },
  publicKey:   { type: String, required: true },
  fingerprint: { type: String },
  status:      { type: String, enum: ['active', 'archived'], default: 'active' },
  archivedAt:  { type: Date },
  blockHash:   { type: String },
  blockIndex:  { type: Number },
}, { timestamps: true });

keyPairSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('KeyPair', keyPairSchema);
