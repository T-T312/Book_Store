const express = require('express');
const session = require('express-session');
const path = require('path');

const Database = require('./db/database');
const UserRepository = require('./repositories/UserRepository');
const BookRepository = require('./repositories/BookRepository');
const CartRepository = require('./repositories/CartRepository');
const OrderRepository = require('./repositories/OrderRepository');
const InvoiceRepository = require('./repositories/InvoiceRepository');

const AuthController = require('./controllers/AuthController');
const BookController = require('./controllers/BookController');
const CartController = require('./controllers/CartController');
const OrderController = require('./controllers/OrderController');
const AnalyticsController = require('./controllers/AnalyticsController');
const InvoiceController = require('./controllers/InvoiceController');

const AuthRouter = require('./routes/auth');
const BookRouter = require('./routes/books');
const CartRouter = require('./routes/cart');
const OrderRouter = require('./routes/orders');
const AnalyticsRouter = require('./routes/analytics');
const InvoiceRouter = require('./routes/invoices');

class App {
  constructor(port = 3000) {
    this.port = port;
    this.express = express();
    this.db = new Database();
  }

  async init() {
    await this.db.init();
    this._setupMiddleware();
    this._setupRoutes();
  }

  _setupMiddleware() {
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(express.static(path.join(__dirname, 'public')));
    this.express.use(session({
      secret: 'fbobs-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    }));
  }

  _setupRoutes() {
    const userRepo    = new UserRepository(this.db);
    const bookRepo    = new BookRepository(this.db);
    const cartRepo    = new CartRepository(this.db);
    const orderRepo   = new OrderRepository(this.db);
    const invoiceRepo = new InvoiceRepository(this.db);

    const authController      = new AuthController(userRepo);
    const bookController      = new BookController(bookRepo);
    const cartController      = new CartController(cartRepo, bookRepo);
    const orderController     = new OrderController(orderRepo, cartRepo, bookRepo, invoiceRepo);
    const analyticsController = new AnalyticsController(orderRepo, userRepo);
    const invoiceController   = new InvoiceController(invoiceRepo, orderRepo);

    this.express.use('/api/auth',      new AuthRouter(authController).router);
    this.express.use('/api/books',     new BookRouter(bookController).router);
    this.express.use('/api/cart',      new CartRouter(cartController).router);
    this.express.use('/api/orders',    new OrderRouter(orderController).router);
    this.express.use('/api/analytics', new AnalyticsRouter(analyticsController).router);
    this.express.use('/api/invoices',  new InvoiceRouter(invoiceController).router);

    this.express.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  start() {
    this.express.listen(this.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║   FBOBS - Favourite Books Online       ║
║   Running at http://localhost:${this.port}     ║
║                                        ║
║   Admin: admin@fbobs.com               ║
║   Pass:  admin123                      ║
╚════════════════════════════════════════╝
      `);
    });
  }
}

module.exports = App;
