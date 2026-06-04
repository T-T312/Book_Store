class AnalyticsController {
  constructor(orderRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
  }

  get(req, res) {
    const { period = 'month' } = req.query;
    const dateFilter = this._getDateFilter(period);

    const orders = this.orderRepository.findPaid(dateFilter);
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const orderIds = orders.map(o => o.id);
    const topBooks = this.orderRepository.findTopBooks(orderIds);
    const byGenre = this.orderRepository.findSalesByGenre(orderIds);

    const chartDays = 30;
    const now = new Date();
    const dailyData = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayOrders = this.orderRepository.findDailySales(dayStr);
      dailyData.push({ date: dayStr, revenue: dayOrders[0]?.rev || 0, orders: dayOrders[0]?.cnt || 0 });
    }

    res.json({
      period,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      topBooks,
      byGenre,
      dailyData,
      statusBreakdown: this.orderRepository.findStatusBreakdown(),
      userCount: this.userRepository.count(),
    });
  }

  _getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case 'day':   return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':  { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
      case 'year':  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
      default:      return new Date(now.getFullYear(), 0, 1).toISOString(); // ytd
    }
  }
}

module.exports = AnalyticsController;
