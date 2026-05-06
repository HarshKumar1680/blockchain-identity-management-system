/* ============================================================
   routes/access.js — Access Control, Consent & Audit Log
   ============================================================ */
const express  = require('express');
const User     = require('../models/User');
const Document = require('../models/Document');
const Grant    = require('../models/Grant');
const Block    = require('../models/Block');
const { addBlock } = require('../utils/blockchain');
const { protect }  = require('../middleware/auth');

const router = express.Router();

function computeExpiresAt(expiry) {
  if (!expiry || expiry === 'never') return null;
  const map  = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
  const days = map[expiry];
  if (!days) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/* POST /api/access/grant */
router.post('/grant', protect, async (req, res) => {
  try {
    const { target, level, expiry, purpose, docIds } = req.body;
    if (!target) return res.status(400).json({ message: 'Target user is required' });

    const grantee = await User.findOne({
      $or: [{ username: target.toLowerCase() }, { email: target.toLowerCase() }]
    });
    if (!grantee) return res.status(404).json({ message: `User "${target}" not found` });
    if (grantee._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'You cannot grant access to yourself' });

    let resolvedDocs = [], docNames = [];
    if (docIds && docIds.length > 0) {
      resolvedDocs = await Document.find({ _id: { $in: docIds }, userId: req.user._id, status: 'active' });
      docNames     = resolvedDocs.map(d => d.name);
    }

    const expiresAt = computeExpiresAt(expiry);
    const block = await addBlock({
      type: 'access_granted', grantorDid: req.user.did, granteeDid: grantee.did,
      granteeUsername: grantee.username, level: level || 'view',
      purpose: purpose || '', docNames, expiresAt: expiresAt?.toISOString() || 'never',
      timestamp: new Date().toISOString(),
    });

    const grant = new Grant({
      grantorId: req.user._id, granteeId: grantee._id,
      granteeUsername: grantee.username, granteeEmail: grantee.email,
      docIds: resolvedDocs.map(d => d._id), docNames,
      level: level || 'view', purpose: purpose || '',
      expiry: expiry || '30d', expiresAt,
      blockHash: block.hash, blockIndex: block.index,
    });
    await grant.save();
    res.status(201).json({ message: 'Access granted successfully', grant });
  } catch (err) {
    console.error('Grant error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/access/grants */
router.get('/grants', protect, async (req, res) => {
  try {
    const grants = await Grant.find({ grantorId: req.user._id }).sort({ createdAt: -1 });
    res.json({ grants, count: grants.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/access/grant/:id */
router.delete('/grant/:id', protect, async (req, res) => {
  try {
    const grant = await Grant.findOne({ _id: req.params.id, grantorId: req.user._id });
    if (!grant) return res.status(404).json({ message: 'Grant not found' });
    if (grant.status === 'revoked') return res.status(400).json({ message: 'Grant already revoked' });

    await addBlock({
      type: 'access_revoked', grantorDid: req.user.did,
      granteeUsername: grant.granteeUsername, grantId: grant._id.toString(),
      timestamp: new Date().toISOString(),
    });

    grant.status    = 'revoked';
    grant.revokedAt = new Date();
    await grant.save();
    res.json({ message: 'Access revoked and recorded on blockchain', grant });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/access/audit */
router.get('/audit', protect, async (req, res) => {
  try {
    const consentTypes = ['access_granted','access_revoked','document_upload','document_revocation','keypair_generated'];
    const blocks = await Block.find({
      $or: [
        { 'data.grantorDid': req.user.did },
        { 'data.did':        req.user.did },
        { 'data.userId':     req.user._id.toString() },
      ],
      'data.type': { $in: consentTypes },
    }).sort({ index: -1 }).limit(50);

    const log = blocks.map(b => ({
      action: b.data.type, details: b.data,
      blockIndex: b.index, blockHash: b.hash, timestamp: b.timestamp,
    }));
    res.json({ log, count: log.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
