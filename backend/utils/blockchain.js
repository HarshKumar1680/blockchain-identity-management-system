/* ============================================================
   utils/blockchain.js — SHA-256 Hashing + Proof-of-Work Miner
   ============================================================ */
const crypto = require('crypto');
const Block  = require('../models/Block');

function sha256(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function computeHash(index, previousHash, timestamp, data, nonce) {
  return sha256({ index, previousHash, timestamp, data, nonce });
}

function mineBlock(index, previousHash, data, difficulty) {
  const target    = '0'.repeat(difficulty);
  const timestamp = new Date();
  let nonce = 0;
  let hash  = '';
  while (true) {
    hash = computeHash(index, previousHash, timestamp, data, nonce);
    if (hash.startsWith(target)) break;
    nonce++;
  }
  return { hash, nonce, timestamp };
}

async function createGenesisBlock() {
  const existing = await Block.findOne({ index: 0 });
  if (existing) return existing;

  const difficulty = parseInt(process.env.MINING_DIFFICULTY) || 3;
  const data = {
    type:    'genesis',
    message: 'BlockID Genesis Block — Blockchain Identity System',
    creator: 'BlockID',
  };
  const { hash, nonce, timestamp } = mineBlock(0, '0000000000000000', data, difficulty);
  const genesis = new Block({ index: 0, timestamp, data, previousHash: '0000000000000000', hash, nonce, difficulty });
  await genesis.save();
  console.log('✓ Genesis block created:', hash.substring(0, 16) + '...');
  return genesis;
}

async function addBlock(data) {
  await createGenesisBlock();
  const difficulty  = parseInt(process.env.MINING_DIFFICULTY) || 3;
  const lastBlock   = await Block.findOne().sort({ index: -1 });
  const index       = lastBlock.index + 1;
  const previousHash= lastBlock.hash;
  const { hash, nonce, timestamp } = mineBlock(index, previousHash, data, difficulty);
  const block = new Block({ index, timestamp, data, previousHash, hash, nonce, difficulty });
  await block.save();
  return block;
}

async function validateChain() {
  const blocks    = await Block.find().sort({ index: 1 });
  if (blocks.length === 0) return true;
  const difficulty= parseInt(process.env.MINING_DIFFICULTY) || 3;
  const target    = '0'.repeat(difficulty);
  for (let i = 1; i < blocks.length; i++) {
    const current  = blocks[i];
    const previous = blocks[i - 1];
    if (current.previousHash !== previous.hash) return false;
    const recomputed = computeHash(current.index, current.previousHash, current.timestamp, current.data, current.nonce);
    if (recomputed !== current.hash) return false;
    if (!current.hash.startsWith(target)) return false;
  }
  return true;
}

async function getChainStats() {
  const totalBlocks     = await Block.countDocuments();
  const difficulty      = parseInt(process.env.MINING_DIFFICULTY) || 3;
  const isValid         = await validateChain();
  const totalIdentities = await Block.countDocuments({ 'data.type': 'identity_registration' });
  return { totalBlocks, difficulty, isValid, totalIdentities };
}

module.exports = { sha256, computeHash, mineBlock, createGenesisBlock, addBlock, validateChain, getChainStats };
