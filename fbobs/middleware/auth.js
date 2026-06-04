class AuthMiddleware {
  static requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  }

  static requireAdmin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  }
}

module.exports = AuthMiddleware;
