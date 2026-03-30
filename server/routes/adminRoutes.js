const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// @route   POST /api/admin/login
// @desc    Auth admin & get token
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.json({
      token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ message: 'Invalid Admin Password' });
  }
});

module.exports = router;
