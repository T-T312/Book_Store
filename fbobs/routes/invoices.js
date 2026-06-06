const express = require('express');
const AuthMiddleware = require('../middleware/auth');

class InvoiceRouter {
  constructor(invoiceController) {
    this.controller = invoiceController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.get('/order/:orderId', AuthMiddleware.requireLogin, (req, res) => this.controller.getInvoice(req, res));
  }
}

module.exports = InvoiceRouter;
