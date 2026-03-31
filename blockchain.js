// === utils/blockchain.js ===
const crypto = require('crypto');
const Block = require('../models/Block');

const DIFFICULTY = parseInt(process.env.MINING_DIFFICULTY) || 2;

// ── Hash a block ──
function calculateHash(index, previousHash, timestamp, data, nonce) {
  const content = `${index}${previousHash}${timestamp}${JSON.stringify(data)}${nonce}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ── Mine block (Proof of Work) ──
function mineBlock(index, previousHash, data) {
  let nonce = 0;
  let hash = '';
  const timestamp = new Date().toISOString();
  const target = '0'.repeat(DIFFICULTY);

  do {
    nonce++;
    hash = calculateHash(index, previousHash, timestamp, data, nonce);
  } while (!hash.startsWith(target));

  return { hash, nonce, timestamp };
}

// ── Get or initialize blockchain ──
async function getBlockchain() {
  const count = await Block.countDocuments();
  if (count === 0) {
    // Create genesis block
    const genesisData = { message: 'Genesis Block — ChainID Identity System' };
    const genesisHash = calculateHash(0, '0000000000000000', new Date().toISOString(), genesisData, 0);
    await Block.create({
      index: 0,
      previousHash: '0000000000000000',
      hash: genesisHash,
      data: genesisData,
      nonce: 0,
      timestamp: new Date()
    });
    console.log('✓ Genesis block created');
  }
  return Block.find().sort({ index: 1 });
}

// ── Add a new block ──
async function addBlock(data) {
  const chain = await Block.find().sort({ index: -1 }).limit(1);
  const lastBlock = chain[0];
  const newIndex = lastBlock.index + 1;

  const { hash, nonce, timestamp } = mineBlock(newIndex, lastBlock.hash, data);

  const block = await Block.create({
    index: newIndex,
    previousHash: lastBlock.hash,
    hash,
    data,
    nonce,
    timestamp: new Date(timestamp)
  });

  return block;
}

// ── Verify chain integrity ──
async function verifyChain() {
  const chain = await Block.find().sort({ index: 1 });

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    // Check previous hash link
    if (current.previousHash !== previous.hash) return false;

    // Recalculate hash
    const recalculated = calculateHash(
      current.index,
      current.previousHash,
      current.timestamp.toISOString(),
      current.data,
      current.nonce
    );

    if (recalculated !== current.hash) return false;
  }

  return true;
}

// ── Get chain stats ──
async function getChainStats() {
  const blockCount = await Block.countDocuments();
  const userCount = await Block.countDocuments({ 'data.type': 'USER_REGISTRATION' });
  const docCount  = await Block.countDocuments({ 'data.type': 'DOCUMENT_REGISTRATION' });
  const isValid = await verifyChain();
  return { blockCount, userCount, docCount, isValid };
}

module.exports = { getBlockchain, addBlock, verifyChain, getChainStats, calculateHash };
