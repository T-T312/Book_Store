const express = require('express');
const AuthMiddleware = require('../middleware/auth');

class BookRouter {
  constructor(bookController) {
    this.controller = bookController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.get('/',           (req, res) => this.controller.getAll(req, res));
    this.router.get('/admin/all',  AuthMiddleware.requireAdmin, (req, res) => this.controller.getAllAdmin(req, res));
    this.router.get('/genres',     (req, res) => this.controller.getGenres(req, res));
    this.router.get('/:id',        (req, res) => this.controller.getOne(req, res));
    this.router.post('/',          AuthMiddleware.requireAdmin, (req, res) => this.controller.create(req, res));
    this.router.put('/:id',        AuthMiddleware.requireAdmin, (req, res) => this.controller.update(req, res));
    this.router.delete('/:id',     AuthMiddleware.requireAdmin, (req, res) => this.controller.delete(req, res));
  }
}

module.exports = BookRouter;
