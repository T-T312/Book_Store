class InvoiceController {
  constructor(invoiceRepository, orderRepository) {
    this.invoiceRepository = invoiceRepository;
    this.orderRepository = orderRepository;
  }

  getInvoice(req, res) {
    const orderId = parseInt(req.params.orderId);
    const userOrders = this.orderRepository.findByUser(req.session.user.id);
    const order = userOrders.find(o => o.id === orderId);

    if (!order) return res.json({ error: 'Order not found' });

    let invoice = this.invoiceRepository.findByOrder(orderId);
    if (!invoice) {
      try {
        const invoiceNumber = 'INV-' + String(orderId).padStart(5, '0');
        this.invoiceRepository.create(orderId, invoiceNumber);
        invoice = this.invoiceRepository.findByOrder(orderId);
      } catch (e) {
        console.error('Invoice auto-create failed for order', orderId, ':', e.message);
        return res.json({ error: 'Invoice could not be generated: ' + e.message });
      }
    }

    const items = this.orderRepository.findItems(orderId);
    res.json({ ...invoice, order: { ...order, items } });
  }
}

module.exports = InvoiceController;
