class CartController {
  constructor(cartRepository, bookRepository) {
    this.cartRepository = cartRepository;
    this.bookRepository = bookRepository;
  }

  get(req, res) {
    const items = this.cartRepository.getItems(req.session.user.id);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ items, total: Math.round(total * 100) / 100 });
  }

  add(req, res) {
    const { book_id, quantity = 1 } = req.body;
    const book = this.bookRepository.findById(book_id);
    if (!book || book.status !== 'active') return res.json({ error: 'Book not found' });

    const existing = this.cartRepository.findItem(req.session.user.id, book_id);
    const newQty = (existing?.quantity || 0) + parseInt(quantity);
    if (newQty > book.stock) return res.json({ error: `Only ${book.stock} in stock` });

    if (existing) {
      this.cartRepository.updateItem(req.session.user.id, book_id, newQty);
    } else {
      this.cartRepository.addItem(req.session.user.id, book_id, quantity);
    }
    res.json({ success: true });
  }

  update(req, res) {
    const { book_id, quantity } = req.body;
    if (quantity <= 0) {
      this.cartRepository.removeItem(req.session.user.id, book_id);
    } else {
      const book = this.bookRepository.findById(book_id);
      if (quantity > book?.stock) return res.json({ error: `Only ${book?.stock} in stock` });
      this.cartRepository.updateItem(req.session.user.id, book_id, quantity);
    }
    res.json({ success: true });
  }

  remove(req, res) {
    this.cartRepository.removeItem(req.session.user.id, req.params.bookId);
    res.json({ success: true });
  }

  clear(req, res) {
    this.cartRepository.clear(req.session.user.id);
    res.json({ success: true });
  }
}

module.exports = CartController;
