const express = require('express');
const { query, run } = require('../db/database');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Place order (checkout)
router.post('/checkout', requireLogin, (req, res) => {
  const { address, payment_method } = req.body;
  if (!address || !payment_method) return res.json({ error: 'Address and payment method required' });

  const cartItems = query(`
    SELECT ci.*, b.price, b.stock, b.title FROM cart_items ci
    JOIN books b ON ci.book_id = b.id WHERE ci.user_id=?
  `, [req.session.user.id]);

  if (!cartItems.length) return res.json({ error: 'Cart is empty' });

  // Validate stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) return res.json({ error: `Insufficient stock for "${item.title}"` });
  }

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tracking = 'TRK' + Date.now().toString(36).toUpperCase();

  const result = run(
    "INSERT INTO orders (user_id, total, address, payment_method, payment_status, tracking_id, status) VALUES (?,?,?,?,?,?,?)",
    [req.session.user.id, Math.round(total * 100) / 100, address, payment_method, 'paid', tracking, 'processing']
  );
  const orderId = result.lastInsertRowid;

  cartItems.forEach(item => {
    run("INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase) VALUES (?,?,?,?)",
      [orderId, item.book_id, item.quantity, item.price]);
    run("UPDATE books SET stock=stock-? WHERE id=?", [item.quantity, item.book_id]);
  });

  run("DELETE FROM cart_items WHERE user_id=?", [req.session.user.id]);

  res.json({ success: true, orderId, tracking });
});

// Get my orders
router.get('/my', requireLogin, (req, res) => {
  const orders = query("SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC", [req.session.user.id]);
  const result = orders.map(order => {
    const items = query(`
      SELECT oi.*, b.title, b.author FROM order_items oi
      JOIN books b ON oi.book_id = b.id WHERE oi.order_id=?
    `, [order.id]);
    return { ...order, items };
  });
  res.json(result);
});

// Get all orders (admin)
router.get('/admin/all', requireAdmin, (req, res) => {
  const orders = query(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `);
  res.json(orders);
});

// Update order status (admin)
router.put('/:id/status', requireAdmin, (req, res) => {
  run("UPDATE orders SET status=? WHERE id=?", [req.body.status, req.params.id]);
  res.json({ success: true });
});

module.exports = router;
