class BookRepository {
  constructor(db) {
    this.db = db;
  }

  findAll(search, genre) {
    let sql = "SELECT * FROM books WHERE status='active'";
    const params = [];
    if (search) {
      sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (genre) {
      sql += " AND genre=?";
      params.push(genre);
    }
    sql += " ORDER BY created_at DESC";
    return this.db.query(sql, params);
  }

  findAllAdmin() {
    return this.db.query("SELECT * FROM books ORDER BY created_at DESC");
  }

  findById(id) {
    return this.db.query("SELECT * FROM books WHERE id=?", [id])[0] || null;
  }

  getGenres() {
    return this.db.query(
      "SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL ORDER BY genre"
    ).map(r => r.genre);
  }

  create({ title, author, isbn, genre, price, stock, description, cover_url }) {
    return this.db.run(
      "INSERT INTO books (title, author, isbn, genre, price, stock, description, cover_url) VALUES (?,?,?,?,?,?,?,?)",
      [title, author, isbn || null, genre || null, price, stock || 0, description || null, cover_url || null]
    );
  }

  update(id, { title, author, isbn, genre, price, stock, description, cover_url, status }) {
    this.db.run(
      "UPDATE books SET title=?, author=?, isbn=?, genre=?, price=?, stock=?, description=?, cover_url=?, status=? WHERE id=?",
      [title, author, isbn || null, genre || null, price, stock, description || null, cover_url || null, status || 'active', id]
    );
  }

  deactivate(id) {
    this.db.run("UPDATE books SET status='inactive' WHERE id=?", [id]);
  }

  decrementStock(id, quantity) {
    this.db.run("UPDATE books SET stock=stock-? WHERE id=?", [quantity, id]);
  }
}

module.exports = BookRepository;
