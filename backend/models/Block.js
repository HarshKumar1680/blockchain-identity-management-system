/* ============================================================
   models/Block.js — Blockchain Block Schema
   ============================================================ */
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index:        { type: Number,  required: true, unique: true },
  timestamp:    { type: Date,    default: Date.now },
  data:         { type: mongoose.Schema.Types.Mixed, required: true },
  previousHash: { type: String,  default: '0000000000000000' },
  hash:         { type: String,  required: true },
  nonce:        { type: Number,  default: 0 },
  difficulty:   { type: Number,  default: 3 },
}, { timestamps: false });

module.exports = mongoose.model('Block', blockSchema);
