/* ============================================================
   models/Document.js — Document Schema (Phase 2)
   ============================================================ */
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  type:        {
    type: String,
    enum: ['identity', 'certificate', 'license', 'medical', 'financial', 'other'],
    default: 'other'
  },
  description: { type: String, default: '' },
  fileName:    { type: String },
  fileSize:    { type: Number },
  mimeType:    { type: String },
  hash:        { type: String, required: true },
  blockHash:   { type: String },
  blockIndex:  { type: Number },
  status:      { type: String, enum: ['active', 'revoked'], default: 'active' },
  revokedAt:   { type: Date },
}, { timestamps: true });

documentSchema.index({ userId: 1, hash: 1 });
documentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);
