class OrderRepository {
  constructor(db) {
    this.db = db;
  }

  create({ userId, total, address, paymentMethod, trackingId }) {
    return this.db.run(
      "INSERT INTO orders (user_id, total, address, payment_method, payment_status, tracking_id, status) VALUES (?,?,?,?,?,?,?)",
      [userId, total, address, paymentMethod, 'paid', trackingId, 'processing']
    );
  }

  addItem(orderId, bookId, quantity, price) {
    this.db.run(
      "INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase) VALUES (?,?,?,?)",
      [orderId, bookId, quantity, price]
    );
  }

  findByUser(userId) {
    return this.db.query(
      "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC",
      [userId]
    );
  }

  findItems(orderId) {
    return this.db.query(`
      SELECT oi.*, b.title, b.author FROM order_items oi
      JOIN books b ON oi.book_id = b.id WHERE oi.order_id=?
    `, [orderId]);
  }

  findAll() {
    return this.db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
  }

  updateStatus(id, status) {
    this.db.run("UPDATE orders SET status=? WHERE id=?", [status, id]);
  }

  findPaid(since) {
    return this.db.query(
      "SELECT * FROM orders WHERE created_at >= ? AND payment_status='paid'",
      [since]
    );
  }

  findTopBooks(orderIds) {
    if (!orderIds.length) return [];
    const placeholders = orderIds.map(() => '?').join(',');
    return this.db.query(`
      SELECT b.title, b.author, b.genre,
             SUM(oi.quantity) as units_sold,
             SUM(oi.quantity * oi.price_at_purchase) as revenue
      FROM order_items oi JOIN books b ON oi.book_id = b.id
      WHERE oi.order_id IN (${placeholders})
      GROUP BY b.id ORDER BY units_sold DESC LIMIT 10
    `, orderIds);
  }

  findSalesByGenre(orderIds) {
    if (!orderIds.length) return [];
    const placeholders = orderIds.map(() => '?').join(',');
    return this.db.query(`
      SELECT b.genre,
             SUM(oi.quantity) as units_sold,
             SUM(oi.quantity * oi.price_at_purchase) as revenue
      FROM order_items oi JOIN books b ON oi.book_id = b.id
      WHERE oi.order_id IN (${placeholders}) AND b.genre IS NOT NULL
      GROUP BY b.genre ORDER BY revenue DESC
    `, orderIds);
  }

  findDailySales(dateStr) {
    return this.db.query(
      "SELECT SUM(total) as rev, COUNT(*) as cnt FROM orders WHERE date(created_at)=? AND payment_status='paid'",
      [dateStr]
    );
  }

  findStatusBreakdown() {
    return this.db.query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
  }
}

module.exports = OrderRepository;
