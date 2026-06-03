const express = require('express');
const bcrypt = require('bcryptjs');
const { query, run } = require('../db/database');
const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.json({ error: 'All fields required' });
  if (password.length < 6) return res.json({ error: 'Password must be at least 6 characters' });

  const existing = query("SELECT id FROM users WHERE email=?", [email]);
  if (existing.length) return res.json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = run("INSERT INTO users (name, email, password) VALUES (?,?,?)", [name, email, hash]);
  const user = query("SELECT id, name, email, role FROM users WHERE id=?", [result.lastInsertRowid])[0];
  req.session.user = user;
  res.json({ success: true, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = query("SELECT * FROM users WHERE email=?", [email]);
  if (!users.length) return res.json({ error: 'Invalid email or password' });
  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) return res.json({ error: 'Invalid email or password' });
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ success: true, user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
