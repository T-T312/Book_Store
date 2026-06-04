class OrderController {
  constructor(orderRepository, cartRepository, bookRepository) {
    this.orderRepository = orderRepository;
    this.cartRepository = cartRepository;
    this.bookRepository = bookRepository;
  }

  checkout(req, res) {
    const { address, payment_method } = req.body;
    if (!address || !payment_method) return res.json({ error: 'Address and payment method required' });

    const cartItems = this.cartRepository.getItems(req.session.user.id);
    if (!cartItems.length) return res.json({ error: 'Cart is empty' });

    for (const item of cartItems) {
      if (item.quantity > item.stock) return res.json({ error: `Insufficient stock for "${item.title}"` });
    }

    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const trackingId = 'TRK' + Date.now().toString(36).toUpperCase();

    const result = this.orderRepository.create({
      userId: req.session.user.id,
      total: Math.round(total * 100) / 100,
      address,
      paymentMethod: payment_method,
      trackingId,
    });
    const orderId = result.lastInsertRowid;

    cartItems.forEach(item => {
      this.orderRepository.addItem(orderId, item.book_id, item.quantity, item.price);
      this.bookRepository.decrementStock(item.book_id, item.quantity);
    });

    this.cartRepository.clear(req.session.user.id);
    res.json({ success: true, orderId, tracking: trackingId });
  }

  getMyOrders(req, res) {
    const orders = this.orderRepository.findByUser(req.session.user.id);
    const result = orders.map(order => ({
      ...order,
      items: this.orderRepository.findItems(order.id),
    }));
    res.json(result);
  }

  getAllOrders(req, res) {
    res.json(this.orderRepository.findAll());
  }

  updateStatus(req, res) {
    this.orderRepository.updateStatus(req.params.id, req.body.status);
    res.json({ success: true });
  }
}

module.exports = OrderController;
