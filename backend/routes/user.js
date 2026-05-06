/* ============================================================
   routes/user.js — User Profile
   ============================================================ */
const express     = require('express');
const { protect } = require('../middleware/auth');
const router      = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
