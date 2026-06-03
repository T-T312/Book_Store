const express = require('express');
const { query, run } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  const items = query(`
    SELECT ci.id, ci.quantity, b.id as book_id, b.title, b.author, b.price, b.stock, b.cover_url
    FROM cart_items ci JOIN books b ON ci.book_id = b.id
    WHERE ci.user_id=?
  `, [req.session.user.id]);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ items, total: Math.round(total * 100) / 100 });
});

router.post('/add', requireLogin, (req, res) => {
  const { book_id, quantity = 1 } = req.body;
  const books = query("SELECT * FROM books WHERE id=? AND status='active'", [book_id]);
  if (!books.length) return res.json({ error: 'Book not found' });
  const book = books[0];
  
  const existing = query("SELECT * FROM cart_items WHERE user_id=? AND book_id=?", [req.session.user.id, book_id]);
  const newQty = (existing[0]?.quantity || 0) + parseInt(quantity);
  if (newQty > book.stock) return res.json({ error: `Only ${book.stock} in stock` });

  if (existing.length) {
    run("UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?", [newQty, req.session.user.id, book_id]);
  } else {
    run("INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?,?,?)", [req.session.user.id, book_id, quantity]);
  }
  res.json({ success: true });
});

router.put('/update', requireLogin, (req, res) => {
  const { book_id, quantity } = req.body;
  if (quantity <= 0) {
    run("DELETE FROM cart_items WHERE user_id=? AND book_id=?", [req.session.user.id, book_id]);
  } else {
    const books = query("SELECT stock FROM books WHERE id=?", [book_id]);
    if (quantity > books[0]?.stock) return res.json({ error: `Only ${books[0]?.stock} in stock` });
    run("UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?", [quantity, req.session.user.id, book_id]);
  }
  res.json({ success: true });
});

router.delete('/remove/:bookId', requireLogin, (req, res) => {
  run("DELETE FROM cart_items WHERE user_id=? AND book_id=?", [req.session.user.id, req.params.bookId]);
  res.json({ success: true });
});

router.delete('/clear', requireLogin, (req, res) => {
  run("DELETE FROM cart_items WHERE user_id=?", [req.session.user.id]);
  res.json({ success: true });
});

module.exports = router;
