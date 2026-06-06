class InvoiceRepository {
  constructor(db) {
    this.db = db;
  }

  create(orderId, invoiceNumber) {
    return this.db.run(
      "INSERT INTO invoices (invoice_number, order_id) VALUES (?, ?)",
      [invoiceNumber, orderId]
    );
  }

  findByOrder(orderId) {
    const rows = this.db.query("SELECT * FROM invoices WHERE order_id=?", [orderId]);
    return rows[0] || null;
  }

  findByUser(userId) {
    return this.db.query(`
      SELECT i.*, o.total, o.created_at as order_date, o.status as order_status
      FROM invoices i JOIN orders o ON i.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY i.issued_at DESC
    `, [userId]);
  }
}

module.exports = InvoiceRepository;
