const express = require('express');
const AuthMiddleware = require('../middleware/auth');

class OrderRouter {
  constructor(orderController) {
    this.controller = orderController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.post('/checkout',    AuthMiddleware.requireLogin, (req, res) => this.controller.checkout(req, res));
    this.router.get('/my',           AuthMiddleware.requireLogin, (req, res) => this.controller.getMyOrders(req, res));
    this.router.get('/admin/all',    AuthMiddleware.requireAdmin, (req, res) => this.controller.getAllOrders(req, res));
    this.router.put('/:id/status',   AuthMiddleware.requireAdmin, (req, res) => this.controller.updateStatus(req, res));
  }
}

module.exports = OrderRouter;
