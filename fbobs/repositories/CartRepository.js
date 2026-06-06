class CartRepository {
  constructor(db) {
    this.db = db;
  }

  getItems(userId) {
    return this.db.query(`
      SELECT ci.id, ci.quantity, b.id as book_id, b.title, b.author, b.price, b.stock, b.cover_url, b.status
      FROM cart_items ci JOIN books b ON ci.book_id = b.id
      WHERE ci.user_id=?
    `, [userId]);
  }

  findItem(userId, bookId) {
    return this.db.query(
      "SELECT * FROM cart_items WHERE user_id=? AND book_id=?",
      [userId, bookId]
    )[0] || null;
  }

  addItem(userId, bookId, quantity) {
    this.db.run(
      "INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?,?,?)",
      [userId, bookId, quantity]
    );
  }

  updateItem(userId, bookId, quantity) {
    this.db.run(
      "UPDATE cart_items SET quantity=? WHERE user_id=? AND book_id=?",
      [quantity, userId, bookId]
    );
  }

  removeItem(userId, bookId) {
    this.db.run(
      "DELETE FROM cart_items WHERE user_id=? AND book_id=?",
      [userId, bookId]
    );
  }

  clear(userId) {
    this.db.run("DELETE FROM cart_items WHERE user_id=?", [userId]);
  }
}

module.exports = CartRepository;
