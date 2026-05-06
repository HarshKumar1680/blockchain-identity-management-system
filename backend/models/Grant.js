/* ============================================================
   models/Grant.js — Access Grant Schema (Phase 3)
   ============================================================ */
const mongoose = require('mongoose');

const grantSchema = new mongoose.Schema({
  grantorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  granteeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  granteeUsername: { type: String },
  granteeEmail:    { type: String },
  docIds:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  docNames:        [{ type: String }],
  level:           { type: String, enum: ['view', 'verify', 'full'], default: 'view' },
  purpose:         { type: String, default: '' },
  expiry:          { type: String, default: '30d' },
  expiresAt:       { type: Date },
  status:          { type: String, enum: ['active', 'revoked'], default: 'active' },
  revokedAt:       { type: Date },
  blockHash:       { type: String },
  blockIndex:      { type: Number },
}, { timestamps: true });

grantSchema.index({ grantorId: 1, status: 1 });

module.exports = mongoose.model('Grant', grantSchema);
