const express = require('express');
const AuthMiddleware = require('../middleware/auth');

class AnalyticsRouter {
  constructor(analyticsController) {
    this.controller = analyticsController;
    this.router = express.Router();
    this._setupRoutes();
  }

  _setupRoutes() {
    this.router.get('/', AuthMiddleware.requireAdmin, (req, res) => this.controller.get(req, res));
  }
}

module.exports = AnalyticsRouter;
