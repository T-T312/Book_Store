const express = require('express');

class AuthRouter {
  constructor(authController) {
    this.controller = authController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.post('/register', (req, res) => this.controller.register(req, res));
    this.router.post('/login',    (req, res) => this.controller.login(req, res));
    this.router.post('/logout',   (req, res) => this.controller.logout(req, res));
    this.router.get('/me',        (req, res) => this.controller.me(req, res));
  }
}

module.exports = AuthRouter;
