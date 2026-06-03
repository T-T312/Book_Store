# FBOBS — Favourite Books Online Bookstore System
## SWE30003 Group 5 — Full Stack Implementation

A complete full-stack web application based on the FBOBS object design (Assignment 2).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js

# 3. Open in browser
# http://localhost:3000
```

---

## Login Credentials

| Role     | Email               | Password   |
|----------|---------------------|------------|
| Admin    | admin@fbobs.com     | admin123   |
| Customer | (register yourself) |            |

---

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (via sql.js — pure JavaScript, no native build needed)
- **Auth**: bcryptjs + express-session
- **Frontend**: Vanilla JS SPA (no framework required)

---

## Project Structure

```
fbobs/
├── server.js              # Express app entry point
├── db/
│   └── database.js        # DB init, schema, helper functions
├── routes/
│   ├── auth.js            # Login, register, logout
│   ├── books.js           # Catalogue CRUD
│   ├── cart.js            # Cart management
│   ├── orders.js          # Checkout & order history
│   └── analytics.js       # Sales statistics
├── middleware/
│   └── auth.js            # requireLogin, requireAdmin
└── public/
    ├── index.html         # SPA shell
    ├── css/style.css      # Full stylesheet
    └── js/app.js          # Frontend SPA (all pages)
```

---

## Features Implemented

### Customer
- ✅ Register & Login with email/password
- ✅ Browse & search catalogue (by title, author, ISBN, genre)
- ✅ View book details (price, stock, description)
- ✅ Add to cart, update quantities, remove items
- ✅ Checkout with delivery address & payment method
- ✅ Order confirmation with tracking ID
- ✅ View order history

### Admin
- ✅ Admin dashboard with KPI cards
- ✅ Add / Edit / Deactivate books
- ✅ View & update all orders
- ✅ Sales analytics (daily/weekly/monthly/yearly/YTD)
- ✅ Top-selling books & revenue by genre
- ✅ Revenue bar chart (last 30 days)

---

## Database Schema

| Table        | Purpose                          |
|-------------|----------------------------------|
| users        | Customers and admin accounts     |
| books        | Catalogue with stock tracking    |
| orders       | Placed orders                    |
| order_items  | Line items (price snapshot)      |
| cart_items   | Session cart contents            |

---

## Extending the Project

The architecture follows the Assignment 2 class design:
- **CheckoutService** → `routes/orders.js` `POST /checkout`
- **Catalogue** → `routes/books.js`
- **Authentication** → `routes/auth.js`
- **Notification** → extend `routes/orders.js` (add nodemailer)
- **Courier** → extend `routes/orders.js` (add AusPost API)
- **PaymentGateway** → replace the mock in checkout with Stripe SDK

