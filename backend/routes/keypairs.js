/* ============================================================
   routes/keypairs.js — Key Pair Management (Phase 3)
   Private keys NEVER stored on server
   ============================================================ */
const express  = require('express');
const KeyPair  = require('../models/KeyPair');
const { addBlock } = require('../utils/blockchain');
const { protect }  = require('../middleware/auth');

const router = express.Router();

/* POST /api/keypairs/generate */
router.post('/generate', protect, async (req, res) => {
  try {
    const { label, algorithm, publicKey, fingerprint } = req.body;
    if (!label || !publicKey)
      return res.status(400).json({ message: 'Label and public key are required' });

    await KeyPair.updateMany({ userId: req.user._id, status: 'active' }, { status: 'archived', archivedAt: new Date() });

    const block = await addBlock({
      type: 'keypair_generated', did: req.user.did,
      userId: req.user._id.toString(), label,
      algorithm: algorithm || 'RSA-PSS', fingerprint: fingerprint || '',
      timestamp: new Date().toISOString(),
    });

    const keyPair = new KeyPair({
      userId: req.user._id, label, algorithm: algorithm || 'RSA-PSS',
      publicKey, fingerprint: fingerprint || '', status: 'active',
      blockHash: block.hash, blockIndex: block.index,
    });
    await keyPair.save();

    res.status(201).json({
      message: 'Key pair generated and anchored to blockchain',
      keyPair: {
        _id: keyPair._id, label: keyPair.label, algorithm: keyPair.algorithm,
        publicKey: keyPair.publicKey, fingerprint: keyPair.fingerprint,
        status: keyPair.status, blockIndex: keyPair.blockIndex, createdAt: keyPair.createdAt,
      },
    });
  } catch (err) {
    console.error('Keypair error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/keypairs/active */
router.get('/active', protect, async (req, res) => {
  try {
    const keyPair = await KeyPair.findOne({ userId: req.user._id, status: 'active' });
    res.json({ keyPair: keyPair || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/keypairs */
router.get('/', protect, async (req, res) => {
  try {
    const keyPairs = await KeyPair.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ keyPairs, count: keyPairs.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/keypairs/:id */
router.get('/:id', protect, async (req, res) => {
  try {
    const keyPair = await KeyPair.findOne({ _id: req.params.id, userId: req.user._id });
    if (!keyPair) return res.status(404).json({ message: 'Key pair not found' });
    res.json({ keyPair });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
