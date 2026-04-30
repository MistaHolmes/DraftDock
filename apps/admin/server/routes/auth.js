const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'super_secret_admin_key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Simple hardcoded login for Admin Panel
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ username, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, message: 'Login successful' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
