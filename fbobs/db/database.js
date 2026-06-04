const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor(dbPath = path.join(__dirname, 'fbobs.db')) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      this.db = new SQL.Database(fs.readFileSync(this.dbPath));
    } else {
      this.db = new SQL.Database();
    }
    this._createTables();
    this._seedData();
    this.save();
    console.log('Database initialized');
  }

  _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        genre TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        description TEXT,
        cover_url TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        address TEXT,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        tracking_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_purchase REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(book_id) REFERENCES books(id)
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        UNIQUE(user_id, book_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(book_id) REFERENCES books(id)
      )
    `);
  }

  _seedData() {
    const existing = this.db.exec("SELECT id FROM users WHERE email='admin@fbobs.com'");
    if (!existing.length || !existing[0].values.length) {
      const hash = bcrypt.hashSync('admin123', 10);
      this.db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['Admin User', 'admin@fbobs.com', hash, 'admin']);
    }

    const books = this.db.exec("SELECT id FROM books LIMIT 1");
    if (!books.length || !books[0].values.length) {
      const sampleBooks = [
        ['The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Classic', 18.99, 45, 'A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.'],
        ['To Kill a Mockingbird', 'Harper Lee', '9780061935466', 'Classic', 16.99, 30, 'The unforgettable novel of a childhood in a sleepy Southern town.'],
        ['1984', 'George Orwell', '9780451524935', 'Dystopian', 14.99, 60, 'A chilling prophecy about the future from the brilliant mind of George Orwell.'],
        ['Sapiens', 'Yuval Noah Harari', '9780062316097', 'Non-Fiction', 24.99, 25, 'A brief history of humankind, from the Stone Age to the present.'],
        ['The Alchemist', 'Paulo Coelho', '9780062315007', 'Fiction', 17.99, 40, 'A magical story about following your dreams.'],
        ['Educated', 'Tara Westover', '9780399590504', 'Memoir', 22.99, 18, 'An unforgettable memoir about the struggle for self-invention.'],
        ['Atomic Habits', 'James Clear', '9780735211292', 'Self-Help', 26.99, 55, 'An easy and proven way to build good habits and break bad ones.'],
        ['The Silent Patient', 'Alex Michaelides', '9781250301697', 'Thriller', 19.99, 35, 'A shocking psychological thriller of a famous painter who shoots her husband.'],
        ['Where the Crawdads Sing', 'Delia Owens', '9780735224292', 'Mystery', 21.99, 20, 'A mystery set in the marshes of North Carolina.'],
        ['The Midnight Library', 'Matt Haig', '9780525559474', 'Fiction', 20.99, 42, 'Between life and death there is a library, and its shelves go on forever.'],
      ];
      sampleBooks.forEach(b => {
        this.db.run("INSERT INTO books (title, author, isbn, genre, price, stock, description) VALUES (?,?,?,?,?,?,?)", b);
      });
    }
  }

  query(sql, params = []) {
    try {
      const result = this.db.exec(sql, params);
      if (!result.length) return [];
      const { columns, values } = result[0];
      return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
      });
    } catch (e) {
      console.error('Query error:', e.message, sql);
      return [];
    }
  }

  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      this.save();
      return { lastInsertRowid: this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] };
    } catch (e) {
      console.error('Run error:', e.message);
      throw e;
    }
  }

  save() {
    if (this.db) {
      fs.writeFileSync(this.dbPath, Buffer.from(this.db.export()));
    }
  }
}

module.exports = Database;
