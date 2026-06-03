const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'fbobs-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   FBOBS - Favourite Books Online       ║
║   Running at http://localhost:${PORT}     ║
║                                        ║
║   Admin: admin@fbobs.com               ║
║   Pass:  admin123                      ║
╚════════════════════════════════════════╝
    `);
  });
});
