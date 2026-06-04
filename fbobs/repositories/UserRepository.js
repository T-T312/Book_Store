const bcrypt = require('bcryptjs');

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findByEmail(email) {
    return this.db.query("SELECT * FROM users WHERE email=?", [email])[0] || null;
  }

  findById(id) {
    return this.db.query("SELECT id, name, email, role FROM users WHERE id=?", [id])[0] || null;
  }

  create(name, email, passwordHash) {
    const result = this.db.run(
      "INSERT INTO users (name, email, password) VALUES (?,?,?)",
      [name, email, passwordHash]
    );
    return this.findById(result.lastInsertRowid);
  }

  count() {
    return this.db.query("SELECT COUNT(*) as c FROM users WHERE role='customer'")[0]?.c || 0;
  }
}

module.exports = UserRepository;
