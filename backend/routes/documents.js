/* ============================================================
   routes/documents.js — Document Upload, Verify, Revoke
   ============================================================ */
const express  = require('express');
const Document = require('../models/Document');
const { addBlock }  = require('../utils/blockchain');
const { protect }   = require('../middleware/auth');

const router = express.Router();

/* POST /api/documents/upload */
router.post('/upload', protect, async (req, res) => {
  try {
    const { name, type, description, hash, fileName, fileSize, mimeType } = req.body;
    if (!name || !hash)
      return res.status(400).json({ message: 'Name and hash are required' });
    if (!/^[a-f0-9]{64}$/i.test(hash))
      return res.status(400).json({ message: 'Invalid SHA-256 hash format' });

    const existing = await Document.findOne({ userId: req.user._id, hash, status: 'active' });
    if (existing)
      return res.status(409).json({ message: 'This document has already been uploaded', document: existing });

    const block = await addBlock({
      type: 'document_upload', userId: req.user._id.toString(),
      did: req.user.did, docName: name, docType: type || 'other',
      hash, fileName: fileName || 'unknown', timestamp: new Date().toISOString(),
    });

    const doc = new Document({
      userId: req.user._id, name, type: type || 'other',
      description: description || '', hash,
      fileName: fileName || '', fileSize: fileSize || 0, mimeType: mimeType || '',
      blockHash: block.hash, blockIndex: block.index, status: 'active',
    });
    await doc.save();

    res.status(201).json({ message: 'Document anchored to blockchain', document: doc, block: { index: block.index, hash: block.hash } });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/documents */
router.get('/', protect, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ documents, count: documents.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/documents/:id */
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ document: doc });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/documents/verify */
router.post('/verify', protect, async (req, res) => {
  try {
    const { hash } = req.body;
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash))
      return res.status(400).json({ message: 'Valid SHA-256 hash required' });
    const doc = await Document.findOne({ userId: req.user._id, hash });
    if (!doc) return res.json({ found: false, message: 'Hash not found in blockchain' });
    res.json({ found: true, document: doc, message: 'Document verified on blockchain' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/documents/:id */
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.status === 'revoked') return res.status(400).json({ message: 'Document is already revoked' });

    await addBlock({
      type: 'document_revocation', userId: req.user._id.toString(),
      did: req.user.did, docId: doc._id.toString(),
      docName: doc.name, docHash: doc.hash, timestamp: new Date().toISOString(),
    });

    doc.status    = 'revoked';
    doc.revokedAt = new Date();
    await doc.save();
    res.json({ message: 'Document revoked and recorded on blockchain', document: doc });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
