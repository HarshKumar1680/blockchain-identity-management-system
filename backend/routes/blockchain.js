/* ============================================================
   routes/blockchain.js — Chain, Stats, Verify, Single Block
   ============================================================ */
const express = require('express');
const Block   = require('../models/Block');
const { validateChain, getChainStats, createGenesisBlock } = require('../utils/blockchain');

const router = express.Router();

router.get('/chain', async (req, res) => {
  try {
    await createGenesisBlock();
    const blocks = await Block.find().sort({ index: 1 });
    res.json({ blocks, length: blocks.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    res.json(await getChainStats());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/verify', async (req, res) => {
  try {
    const isValid = await validateChain();
    res.json({ isValid, message: isValid ? 'Chain is valid' : 'Chain is invalid!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/block/:index', async (req, res) => {
  try {
    const block = await Block.findOne({ index: parseInt(req.params.index) });
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json({ block });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/latest', async (req, res) => {
  try {
    const block = await Block.findOne().sort({ index: -1 });
    res.json({ block });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
