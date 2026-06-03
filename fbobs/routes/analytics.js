const express = require('express');
const { query } = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  const { period = 'month' } = req.query;

  let dateFilter;
  const now = new Date();
  if (period === 'day') {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else if (period === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    dateFilter = d.toISOString();
  } else if (period === 'month') {
    const d = new Date(now); d.setMonth(d.getMonth() - 1);
    dateFilter = d.toISOString();
  } else if (period === 'year') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
    dateFilter = d.toISOString();
  } else { // ytd
    dateFilter = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  const orders = query("SELECT * FROM orders WHERE created_at >= ? AND payment_status='paid'", [dateFilter]);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  // Top selling books
  const orderIds = orders.map(o => o.id);
  let topBooks = [];
  if (orderIds.length) {
    const placeholders = orderIds.map(() => '?').join(',');
    topBooks = query(`
      SELECT b.title, b.author, b.genre, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price_at_purchase) as revenue
      FROM order_items oi JOIN books b ON oi.book_id = b.id
      WHERE oi.order_id IN (${placeholders})
      GROUP BY b.id ORDER BY units_sold DESC LIMIT 10
    `, orderIds);
  }

  // Sales by genre
  let byGenre = [];
  if (orderIds.length) {
    const placeholders = orderIds.map(() => '?').join(',');
    byGenre = query(`
      SELECT b.genre, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.price_at_purchase) as revenue
      FROM order_items oi JOIN books b ON oi.book_id = b.id
      WHERE oi.order_id IN (${placeholders}) AND b.genre IS NOT NULL
      GROUP BY b.genre ORDER BY revenue DESC
    `, orderIds);
  }

  // Daily breakdown (last 30 days for chart)
  const chartDays = 30;
  const dailyData = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayOrders = query(
      "SELECT SUM(total) as rev, COUNT(*) as cnt FROM orders WHERE date(created_at)=? AND payment_status='paid'",
      [dayStr]
    );
    dailyData.push({ date: dayStr, revenue: dayOrders[0]?.rev || 0, orders: dayOrders[0]?.cnt || 0 });
  }

  // Order status breakdown
  const statusBreakdown = query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");

  // Total users
  const userCount = query("SELECT COUNT(*) as c FROM users WHERE role='customer'")[0]?.c || 0;

  res.json({
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    topBooks,
    byGenre,
    dailyData,
    statusBreakdown,
    userCount
  });
});

module.exports = router;
