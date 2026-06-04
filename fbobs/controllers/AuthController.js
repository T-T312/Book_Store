const bcrypt = require('bcryptjs');

class AuthController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.json({ error: 'All fields required' });
    if (password.length < 6) return res.json({ error: 'Password must be at least 6 characters' });

    if (this.userRepository.findByEmail(email)) return res.json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const user = this.userRepository.create(name, email, hash);
    req.session.user = user;
    res.json({ success: true, user });
  }

  login(req, res) {
    const { email, password } = req.body;
    const user = this.userRepository.findByEmail(email);
    if (!user) return res.json({ error: 'Invalid email or password' });
    if (!bcrypt.compareSync(password, user.password)) return res.json({ error: 'Invalid email or password' });
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ success: true, user: req.session.user });
  }

  logout(req, res) {
    req.session.destroy();
    res.json({ success: true });
  }

  me(req, res) {
    res.json({ user: req.session.user || null });
  }
}

module.exports = AuthController;
