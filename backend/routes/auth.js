/* ============================================================
   routes/auth.js — Register + Login
   ============================================================ */
const express  = require('express');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const { addBlock, createGenesisBlock } = require('../utils/blockchain');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;
    if (!firstName || !lastName || !email || !username || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already registered' });
    if (await User.findOne({ username: username.toLowerCase() }))
      return res.status(409).json({ message: 'Username already taken' });

    const user = new User({ firstName, lastName, email, username, password });
    await user.save();
    await createGenesisBlock();

    const block = await addBlock({
      type: 'identity_registration',
      did: user.did, username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email, timestamp: new Date().toISOString(),
    });

    user.blockHash  = block.hash;
    user.blockIndex = block.index;
    await user.save();

    res.status(201).json({
      message: 'Identity created and anchored to blockchain',
      token: signToken(user._id),
      user: user.toSafeObject(),
      block: { index: block.index, hash: block.hash },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed: ' + err.message });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ message: 'Login successful', token: signToken(user._id), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed: ' + err.message });
  }
});

module.exports = router;
