const express = require('express');
const { query, run } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all active books (public)
router.get('/', (req, res) => {
  const { search, genre } = req.query;
  let sql = "SELECT * FROM books WHERE status='active'";
  const params = [];
  if (search) {
    sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (genre) { sql += " AND genre=?"; params.push(genre); }
  sql += " ORDER BY created_at DESC";
  res.json(query(sql, params));
});

// Get all books (admin, includes inactive)
router.get('/admin/all', requireAdmin, (req, res) => {
  res.json(query("SELECT * FROM books ORDER BY created_at DESC"));
});

// Get genres
router.get('/genres', (req, res) => {
  const rows = query("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL ORDER BY genre");
  res.json(rows.map(r => r.genre));
});

// Get single book
router.get('/:id', (req, res) => {
  const books = query("SELECT * FROM books WHERE id=?", [req.params.id]);
  if (!books.length) return res.status(404).json({ error: 'Not found' });
  res.json(books[0]);
});

// Add book (admin)
router.post('/', requireAdmin, (req, res) => {
  const { title, author, isbn, genre, price, stock, description, cover_url } = req.body;
  if (!title || !author || !price) return res.json({ error: 'Title, author, price required' });
  const result = run(
    "INSERT INTO books (title, author, isbn, genre, price, stock, description, cover_url) VALUES (?,?,?,?,?,?,?,?)",
    [title, author, isbn||null, genre||null, price, stock||0, description||null, cover_url||null]
  );
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update book (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { title, author, isbn, genre, price, stock, description, cover_url, status } = req.body;
  run(
    "UPDATE books SET title=?, author=?, isbn=?, genre=?, price=?, stock=?, description=?, cover_url=?, status=? WHERE id=?",
    [title, author, isbn||null, genre||null, price, stock, description||null, cover_url||null, status||'active', req.params.id]
  );
  res.json({ success: true });
});

// Delete/deactivate book (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  run("UPDATE books SET status='inactive' WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
