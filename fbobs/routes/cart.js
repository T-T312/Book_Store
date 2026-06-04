const express = require('express');
const AuthMiddleware = require('../middleware/auth');

class CartRouter {
  constructor(cartController) {
    this.controller = cartController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.get('/',               AuthMiddleware.requireLogin, (req, res) => this.controller.get(req, res));
    this.router.post('/add',           AuthMiddleware.requireLogin, (req, res) => this.controller.add(req, res));
    this.router.put('/update',         AuthMiddleware.requireLogin, (req, res) => this.controller.update(req, res));
    this.router.delete('/remove/:bookId', AuthMiddleware.requireLogin, (req, res) => this.controller.remove(req, res));
    this.router.delete('/clear',       AuthMiddleware.requireLogin, (req, res) => this.controller.clear(req, res));
  }
}

module.exports = CartRouter;
