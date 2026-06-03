// ====================== STATE ======================
let state = {
  user: null,
  cart: { items: [], total: 0 },
  currentPage: 'home',
  adminSection: 'dashboard'
};

// ====================== API ======================
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ====================== TOAST ======================
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ====================== MODAL ======================
function showModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }
document.addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// ====================== NAV ======================
function renderNav() {
  const u = state.user;
  const links = document.getElementById('navLinks');
  const userMenu = document.getElementById('userMenu');
  const cartBtn = document.getElementById('cartBtn');

  if (u) {
    cartBtn.style.display = 'flex';
    const pages = u.role === 'admin'
      ? [['home', '🏠 Home'], ['admin', '⚙️ Admin']]
      : [['home', '🏠 Home'], ['catalogue', '📚 Catalogue'], ['orders', '📦 My Orders']];
    links.innerHTML = pages.map(([p, l]) =>
      `<button class="nav-link ${state.currentPage === p ? 'active' : ''}" onclick="navigate('${p}')">${l}</button>`
    ).join('');
    userMenu.innerHTML = `
      <button class="user-btn" onclick="showUserMenu(this)">👤 ${u.name.split(' ')[0]} ▾</button>
      <div id="userDropdown" style="display:none;position:absolute;right:1rem;top:58px;background:white;border-radius:8px;border:1px solid var(--border);box-shadow:0 8px 24px var(--shadow);z-index:200;min-width:160px;">
        <div style="padding:0.75rem 1rem;font-size:0.8rem;color:var(--muted);border-bottom:1px solid var(--border)">${u.email}</div>
        <button onclick="navigate('orders');closeDropdown()" style="display:block;width:100%;padding:0.6rem 1rem;text-align:left;background:none;border:none;cursor:pointer;font-size:0.9rem">📦 My Orders</button>
        <button onclick="handleLogout()" style="display:block;width:100%;padding:0.6rem 1rem;text-align:left;background:none;border:none;cursor:pointer;font-size:0.9rem;color:var(--rust)">🚪 Logout</button>
      </div>`;
  } else {
    cartBtn.style.display = 'none';
    links.innerHTML = `<button class="nav-link ${state.currentPage==='home'?'active':''}" onclick="navigate('home')">🏠 Home</button>
      <button class="nav-link ${state.currentPage==='catalogue'?'active':''}" onclick="navigate('catalogue')">📚 Catalogue</button>`;
    userMenu.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="navigate('login')" style="color:white;border-color:rgba(255,255,255,0.4)">Login</button>
      <button class="btn btn-primary btn-sm" onclick="navigate('register')">Sign Up</button>`;
  }
  updateCartBadge();
}

function showUserMenu(btn) {
  const d = document.getElementById('userDropdown');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}
function closeDropdown() {
  const d = document.getElementById('userDropdown');
  if (d) d.style.display = 'none';
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-btn') && !e.target.closest('#userDropdown')) closeDropdown();
});

function updateCartBadge() {
  const count = state.cart.items.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

// ====================== NAVIGATE ======================
function navigate(page, params = {}) {
  state.currentPage = page;
  renderNav();
  const main = document.getElementById('main');
  main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  switch(page) {
    case 'home': renderHome(); break;
    case 'catalogue': renderCatalogue(params); break;
    case 'book': renderBookDetail(params.id); break;
    case 'cart': renderCart(); break;
    case 'checkout': renderCheckout(); break;
    case 'orders': renderOrders(); break;
    case 'order-success': renderOrderSuccess(params); break;
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'admin': renderAdmin(); break;
    default: renderHome();
  }
}

// ====================== HOME ======================
async function renderHome() {
  const books = await api('GET', '/api/books?limit=8');
  document.getElementById('main').innerHTML = `
    <div class="page-hero">
      <h1>Your <span class="gold-accent">Story</span> Starts Here</h1>
      <p>Discover thousands of titles — from Glenferrie Road to your doorstep</p>
      <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center">
        <button class="btn btn-primary" onclick="navigate('catalogue')">Browse Catalogue</button>
        ${!state.user ? '<button class="btn btn-outline" onclick="navigate(\'register\')" style="color:white;border-color:rgba(255,255,255,0.5)">Create Account</button>' : ''}
      </div>
    </div>
    <div class="page">
      <h2 class="section-title">📚 New Arrivals</h2>
      <div class="book-grid">
        ${books.slice(0,8).map(bookCard).join('')}
      </div>
      <div style="text-align:center;margin-top:2rem">
        <button class="btn btn-dark" onclick="navigate('catalogue')">View All Books →</button>
      </div>
    </div>`;
}

function bookCard(b) {
  const stockClass = b.stock === 0 ? 'out-stock' : b.stock < 5 ? 'low-stock' : 'in-stock';
  const stockText = b.stock === 0 ? 'Out of Stock' : b.stock < 5 ? `Only ${b.stock} left` : 'In Stock';
  return `<div class="book-card" onclick="navigate('book',{id:${b.id}})">
    <div class="book-cover">${b.cover_url ? `<img class="book-cover-img" src="${b.cover_url}" alt="${b.title}">` : '📖'}</div>
    <div class="book-info">
      <div class="book-title">${b.title}</div>
      <div class="book-author">${b.author}</div>
      ${b.genre ? `<span class="book-genre">${b.genre}</span>` : ''}
      <div class="book-footer">
        <span class="book-price">$${Number(b.price).toFixed(2)}</span>
        <span class="book-stock-badge ${stockClass}">${stockText}</span>
      </div>
    </div>
  </div>`;
}

// ====================== CATALOGUE ======================
let catalogueState = { search: '', genre: '', books: [] };

async function renderCatalogue(params = {}) {
  if (params.search !== undefined) catalogueState.search = params.search;
  if (params.genre !== undefined) catalogueState.genre = params.genre;

  const genres = await api('GET', '/api/books/genres');
  let url = '/api/books?';
  if (catalogueState.search) url += `search=${encodeURIComponent(catalogueState.search)}&`;
  if (catalogueState.genre) url += `genre=${encodeURIComponent(catalogueState.genre)}&`;
  catalogueState.books = await api('GET', url);

  document.getElementById('main').innerHTML = `
    <div style="background:white;border-bottom:1px solid var(--border);padding:1.25rem 2rem;">
      <div class="search-bar">
        <input type="text" class="search-input" id="searchInput" placeholder="Search by title, author, or ISBN…" value="${catalogueState.search}">
        <select class="genre-filter" id="genreFilter">
          <option value="">All Genres</option>
          ${genres.map(g => `<option value="${g}" ${g===catalogueState.genre?'selected':''}>${g}</option>`).join('')}
        </select>
        <button class="btn btn-dark" onclick="doSearch()">Search</button>
        ${catalogueState.search||catalogueState.genre ? `<button class="btn btn-outline" onclick="catalogueState.search='';catalogueState.genre='';renderCatalogue()">Clear</button>` : ''}
      </div>
    </div>
    <div class="page">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <h2 class="section-title" style="margin-bottom:0">
          ${catalogueState.genre || 'All Books'}
          <span style="font-size:0.9rem;font-weight:400;color:var(--muted)">${catalogueState.books.length} titles</span>
        </h2>
      </div>
      ${catalogueState.books.length
        ? `<div class="book-grid">${catalogueState.books.map(bookCard).join('')}</div>`
        : `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>No books found</h3><p>Try a different search or browse all categories</p></div>`}
    </div>`;

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

function doSearch() {
  catalogueState.search = document.getElementById('searchInput').value;
  catalogueState.genre = document.getElementById('genreFilter').value;
  renderCatalogue();
}

// ====================== BOOK DETAIL ======================
async function renderBookDetail(id) {
  const b = await api('GET', `/api/books/${id}`);
  const stockClass = b.stock === 0 ? 'out-stock' : b.stock < 5 ? 'low-stock' : 'in-stock';
  const stockText = b.stock === 0 ? 'Out of Stock' : b.stock < 5 ? `Only ${b.stock} left` : 'In Stock';

  document.getElementById('main').innerHTML = `
    <div class="breadcrumb">
      <span onclick="navigate('home')">Home</span><span class="sep">›</span>
      <span onclick="navigate('catalogue')">Catalogue</span><span class="sep">›</span>
      <span>${b.title}</span>
    </div>
    <div class="book-detail">
      <div>
        <div class="book-detail-cover">${b.cover_url ? `<img src="${b.cover_url}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)">` : '📖'}</div>
      </div>
      <div>
        <div class="book-detail-title">${b.title}</div>
        <div class="book-detail-author">by ${b.author}</div>
        <div class="book-detail-price">$${Number(b.price).toFixed(2)}</div>
        <div class="book-meta">
          ${b.genre ? `<div class="book-meta-item"><div class="book-meta-label">Genre</div><div class="book-meta-val">${b.genre}</div></div>` : ''}
          ${b.isbn ? `<div class="book-meta-item"><div class="book-meta-label">ISBN</div><div class="book-meta-val">${b.isbn}</div></div>` : ''}
          <div class="book-meta-item"><div class="book-meta-label">Availability</div><div class="book-meta-val"><span class="book-stock-badge ${stockClass}">${stockText}</span></div></div>
        </div>
        ${b.description ? `<p class="book-detail-desc">${b.description}</p>` : ''}
        ${b.stock > 0 ? `
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <label style="font-weight:600;font-size:0.9rem">Qty:</label>
              <input type="number" id="qtyInput" value="1" min="1" max="${b.stock}" style="width:70px;padding:0.4rem;border:2px solid var(--border);border-radius:var(--radius);font-size:1rem">
            </div>
            <button class="btn btn-primary" onclick="addToCart(${b.id})">🛒 Add to Cart</button>
            <button class="btn btn-dark" onclick="addToCartAndCheckout(${b.id})">Buy Now</button>
          </div>` : `<button class="btn btn-outline" disabled>Out of Stock</button>`}
      </div>
    </div>`;
}

async function addToCart(bookId, goCheckout = false) {
  if (!state.user) { navigate('login'); toast('Please login to add items to cart', 'info'); return; }
  const qty = parseInt(document.getElementById('qtyInput')?.value || 1);
  const r = await api('POST', '/api/cart/add', { book_id: bookId, quantity: qty });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Added to cart! 🛒', 'success');
  await loadCart();
  if (goCheckout) navigate('checkout');
}
async function addToCartAndCheckout(bookId) { await addToCart(bookId, true); }

// ====================== CART ======================
async function loadCart() {
  if (!state.user) return;
  state.cart = await api('GET', '/api/cart');
  updateCartBadge();
}

async function renderCart() {
  await loadCart();
  const { items, total } = state.cart;
  const gst = total * 0.1;

  document.getElementById('main').innerHTML = `
    <div class="page">
      <h2 class="section-title">🛒 Shopping Cart</h2>
      ${items.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse our catalogue and add some books!</p>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('catalogue')">Browse Books</button>
        </div>` : `
        <div style="display:grid;grid-template-columns:1fr 320px;gap:2rem;align-items:start">
          <div>
            <table class="cart-table">
              <thead>
                <tr><th>Book</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody id="cartRows">
                ${items.map(item => `
                  <tr id="cartRow_${item.book_id}">
                    <td>
                      <div style="display:flex;align-items:center;gap:0.75rem">
                        <div style="width:40px;height:55px;background:linear-gradient(135deg,var(--brown),var(--gold));border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">📖</div>
                        <div>
                          <div style="font-weight:600;font-size:0.9rem;cursor:pointer" onclick="navigate('book',{id:${item.book_id}})">${item.title}</div>
                          <div style="font-size:0.8rem;color:var(--muted)">${item.author}</div>
                        </div>
                      </div>
                    </td>
                    <td>$${Number(item.price).toFixed(2)}</td>
                    <td>
                      <div class="cart-qty">
                        <button onclick="updateQty(${item.book_id}, ${item.quantity - 1})">−</button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.stock}"
                          onchange="updateQty(${item.book_id}, parseInt(this.value))">
                        <button onclick="updateQty(${item.book_id}, ${item.quantity + 1})">+</button>
                      </div>
                    </td>
                    <td><strong>$${(item.price * item.quantity).toFixed(2)}</strong></td>
                    <td><button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.book_id})">✕</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <div style="margin-top:1rem;display:flex;gap:0.75rem">
              <button class="btn btn-outline" onclick="navigate('catalogue')">← Continue Shopping</button>
              <button class="btn btn-danger btn-sm" onclick="clearCart()">Clear Cart</button>
            </div>
          </div>
          <div class="cart-summary">
            <h3 style="font-family:var(--font-display);margin-bottom:1rem">Order Summary</h3>
            <div class="cart-total-row"><span>Subtotal</span><span>$${total.toFixed(2)}</span></div>
            <div class="cart-total-row"><span>GST (10%)</span><span>$${gst.toFixed(2)}</span></div>
            <div class="cart-total-row"><span>Shipping</span><span style="color:var(--sage)">Free</span></div>
            <div class="cart-total-row grand"><span>Total</span><span>$${(total + gst).toFixed(2)}</span></div>
            <button class="btn btn-primary btn-block" style="margin-top:1rem" onclick="${state.user ? 'navigate(\'checkout\')' : 'navigate(\'login\')'}">
              ${state.user ? 'Proceed to Checkout →' : 'Login to Checkout'}
            </button>
          </div>
        </div>`}
    </div>`;
}

async function updateQty(bookId, qty) {
  const r = await api('PUT', '/api/cart/update', { book_id: bookId, quantity: qty });
  if (r.error) { toast(r.error, 'error'); renderCart(); return; }
  await loadCart();
  renderCart();
}

async function removeFromCart(bookId) {
  await api('DELETE', `/api/cart/remove/${bookId}`);
  await loadCart();
  renderCart();
}

async function clearCart() {
  if (!confirm('Clear all items from cart?')) return;
  await api('DELETE', '/api/cart/clear');
  await loadCart();
  renderCart();
}

// ====================== CHECKOUT ======================
async function renderCheckout() {
  if (!state.user) { navigate('login'); return; }
  await loadCart();
  if (!state.cart.items.length) { navigate('cart'); toast('Cart is empty', 'error'); return; }
  const { items, total } = state.cart;
  const gst = total * 0.1;
  const grand = total + gst;

  document.getElementById('main').innerHTML = `
    <div class="page">
      <h2 class="section-title">💳 Checkout</h2>
      <div class="checkout-grid">
        <div class="checkout-form-card">
          <h3 style="font-weight:700;margin-bottom:1.25rem">Delivery Information</h3>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="shipName" value="${state.user.name}" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Address</label>
            <input type="text" class="form-input" id="shipAddr" placeholder="Street address">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Suburb</label>
              <input type="text" class="form-input" id="shipSuburb" placeholder="Suburb">
            </div>
            <div class="form-group">
              <label class="form-label">Postcode</label>
              <input type="text" class="form-input" id="shipPost" placeholder="e.g. 3122" maxlength="4">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <select class="form-select" id="shipState">
              <option>VIC</option><option>NSW</option><option>QLD</option><option>SA</option><option>WA</option><option>TAS</option><option>ACT</option><option>NT</option>
            </select>
          </div>

          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:1rem">Payment Method</h3>
          <div class="payment-options" id="paymentOptions">
            <div class="payment-option selected" data-method="paypal" onclick="selectPayment(this)">💳 PayPal</div>
            <div class="payment-option" data-method="card" onclick="selectPayment(this)">🏦 Credit Card</div>
            <div class="payment-option" data-method="afterpay" onclick="selectPayment(this)">✨ Afterpay</div>
            <div class="payment-option" data-method="zip" onclick="selectPayment(this)">⚡ Zip Pay</div>
          </div>
        </div>

        <div class="checkout-summary">
          <h3 style="font-weight:700;margin-bottom:1rem">Order Summary</h3>
          ${items.map(i => `
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;font-size:0.9rem;border-bottom:1px solid var(--border)">
              <span>${i.title} <span style="color:var(--muted)">×${i.quantity}</span></span>
              <span>$${(i.price * i.quantity).toFixed(2)}</span>
            </div>`).join('')}
          <div style="padding:0.5rem 0;display:flex;justify-content:space-between;font-size:0.9rem"><span>Subtotal</span><span>$${total.toFixed(2)}</span></div>
          <div style="padding:0.5rem 0;display:flex;justify-content:space-between;font-size:0.9rem"><span>GST (10%)</span><span>$${gst.toFixed(2)}</span></div>
          <div style="padding:0.75rem 0;display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem;border-top:2px solid var(--border);color:var(--brown)">
            <span>Total</span><span>$${grand.toFixed(2)}</span>
          </div>
          <button class="btn btn-primary btn-block" style="margin-top:1rem" onclick="placeOrder()">
            Place Order — $${grand.toFixed(2)}
          </button>
          <p style="font-size:0.75rem;color:var(--muted);text-align:center;margin-top:0.75rem">🔒 Secure checkout via PaymentGateway</p>
        </div>
      </div>
    </div>`;
}

function selectPayment(el) {
  document.querySelectorAll('.payment-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

async function placeOrder() {
  const addr = document.getElementById('shipAddr')?.value.trim();
  const suburb = document.getElementById('shipSuburb')?.value.trim();
  const post = document.getElementById('shipPost')?.value.trim();
  const stateVal = document.getElementById('shipState')?.value;
  const method = document.querySelector('.payment-option.selected')?.dataset.method || 'card';

  if (!addr || !suburb || !post) { toast('Please fill in delivery address', 'error'); return; }
  if (!/^\d{4}$/.test(post)) { toast('Postcode must be 4 digits', 'error'); return; }

  const address = `${addr}, ${suburb} ${stateVal} ${post}, Australia`;
  const r = await api('POST', '/api/orders/checkout', { address, payment_method: method });
  if (r.error) { toast(r.error, 'error'); return; }
  await loadCart();
  navigate('order-success', { orderId: r.orderId, tracking: r.tracking });
}

// ====================== ORDER SUCCESS ======================
function renderOrderSuccess({ orderId, tracking }) {
  document.getElementById('main').innerHTML = `
    <div class="success-page">
      <div class="success-icon">🎉</div>
      <div class="success-title">Order Placed!</div>
      <p style="color:var(--muted);margin-bottom:1.5rem">Thank you for your purchase. Your books are on their way!</p>
      <div style="background:var(--cream);border-radius:var(--radius);border:1px solid var(--border);padding:1.25rem;margin-bottom:1.5rem;text-align:left">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span style="color:var(--muted);font-size:0.85rem">Order ID</span>
          <strong>#${orderId}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--muted);font-size:0.85rem">Tracking</span>
          <strong style="color:var(--brown)">${tracking}</strong>
        </div>
      </div>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-dark" onclick="navigate('orders')">View My Orders</button>
        <button class="btn btn-primary" onclick="navigate('catalogue')">Continue Shopping</button>
      </div>
    </div>`;
}

// ====================== ORDERS ======================
async function renderOrders() {
  if (!state.user) { navigate('login'); return; }
  const orders = await api('GET', '/api/orders/my');

  document.getElementById('main').innerHTML = `
    <div class="page">
      <h2 class="section-title">📦 My Orders</h2>
      ${orders.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Place your first order today!</p>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="navigate('catalogue')">Browse Books</button>
        </div>` :
        orders.map(o => `
          <div class="order-card">
            <div class="order-header">
              <div>
                <div class="order-id">Order #${o.id}</div>
                <div style="font-size:0.8rem;color:var(--muted)">${new Date(o.created_at).toLocaleDateString('en-AU', {dateStyle:'long'})}</div>
              </div>
              <div style="text-align:right">
                <span class="status-badge status-${o.status}">${o.status}</span>
                <div style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem">via ${o.payment_method}</div>
              </div>
            </div>
            <div class="order-items-list">
              ${o.items.map(i => `
                <div class="order-item-row">
                  <span>${i.title} <span style="color:var(--muted)">×${i.quantity}</span></span>
                  <span>$${(i.price_at_purchase * i.quantity).toFixed(2)}</span>
                </div>`).join('')}
              <div style="display:flex;justify-content:space-between;padding:0.75rem 0 0;font-weight:700">
                <span>Total (inc. GST)</span>
                <span style="color:var(--brown)">$${Number(o.total * 1.1).toFixed(2)}</span>
              </div>
              ${o.tracking_id ? `<div style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem">Tracking: <strong>${o.tracking_id}</strong></div>` : ''}
              ${o.address ? `<div style="font-size:0.8rem;color:var(--muted)">Delivery to: ${o.address}</div>` : ''}
            </div>
          </div>`).join('')}
    </div>`;
}

// ====================== AUTH ======================
function renderLogin() {
  document.getElementById('main').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div style="text-align:center;font-size:2rem;margin-bottom:0.75rem">📚</div>
        <div class="auth-title">Welcome back</div>
        <div class="auth-subtitle">Sign in to your account</div>
        <div id="loginError" style="display:none;background:#fce4ec;border:1px solid #ef9a9a;border-radius:var(--radius);padding:0.75rem;font-size:0.85rem;color:var(--rust);margin-bottom:1rem"></div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="loginEmail" placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="loginPass" placeholder="••••••••">
        </div>
        <button class="btn btn-primary btn-block" onclick="handleLogin()">Sign In</button>
        <div style="text-align:center;margin-top:1.25rem;font-size:0.9rem;color:var(--muted)">
          Don't have an account? <a href="#" onclick="navigate('register')" style="color:var(--brown);font-weight:600">Sign up</a>
        </div>
        <div style="margin-top:1rem;padding:0.75rem;background:var(--cream);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--muted)">
          <strong>Demo Admin:</strong> admin@fbobs.com / admin123
        </div>
      </div>
    </div>`;
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key==='Enter') handleLogin(); });
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const r = await api('POST', '/api/auth/login', { email, password: pass });
  if (r.error) {
    const errEl = document.getElementById('loginError');
    errEl.textContent = r.error; errEl.style.display = 'block';
    return;
  }
  state.user = r.user;
  await loadCart();
  toast(`Welcome back, ${r.user.name}! 👋`, 'success');
  navigate(r.user.role === 'admin' ? 'admin' : 'home');
}

function renderRegister() {
  document.getElementById('main').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div style="text-align:center;font-size:2rem;margin-bottom:0.75rem">📚</div>
        <div class="auth-title">Create Account</div>
        <div class="auth-subtitle">Join Favourite Books today</div>
        <div id="regError" style="display:none;background:#fce4ec;border:1px solid #ef9a9a;border-radius:var(--radius);padding:0.75rem;font-size:0.85rem;color:var(--rust);margin-bottom:1rem"></div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-input" id="regName" placeholder="Your name">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="regEmail" placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="regPass" placeholder="At least 6 characters">
        </div>
        <button class="btn btn-primary btn-block" onclick="handleRegister()">Create Account</button>
        <div style="text-align:center;margin-top:1.25rem;font-size:0.9rem;color:var(--muted)">
          Already have an account? <a href="#" onclick="navigate('login')" style="color:var(--brown);font-weight:600">Sign in</a>
        </div>
      </div>
    </div>`;
}

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const r = await api('POST', '/api/auth/register', { name, email, password: pass });
  if (r.error) {
    const errEl = document.getElementById('regError');
    errEl.textContent = r.error; errEl.style.display = 'block';
    return;
  }
  state.user = r.user;
  await loadCart();
  toast('Account created! Welcome 🎉', 'success');
  navigate('home');
}

async function handleLogout() {
  await api('POST', '/api/auth/logout');
  state.user = null;
  state.cart = { items: [], total: 0 };
  updateCartBadge();
  toast('Logged out', 'info');
  navigate('home');
}

// ====================== ADMIN ======================
function renderAdmin() {
  if (!state.user || state.user.role !== 'admin') { navigate('home'); return; }
  document.getElementById('main').innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-title">Management</div>
        <button class="admin-nav-btn ${state.adminSection==='dashboard'?'active':''}" onclick="setAdminSection('dashboard')">📊 Dashboard</button>
        <button class="admin-nav-btn ${state.adminSection==='books'?'active':''}" onclick="setAdminSection('books')">📚 Books</button>
        <button class="admin-nav-btn ${state.adminSection==='orders'?'active':''}" onclick="setAdminSection('orders')">📦 Orders</button>
        <div class="admin-sidebar-title" style="margin-top:1.5rem">Analytics</div>
        <button class="admin-nav-btn ${state.adminSection==='analytics'?'active':''}" onclick="setAdminSection('analytics')">📈 Sales Analytics</button>
      </aside>
      <div class="admin-content" id="adminContent">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>`;
  loadAdminSection(state.adminSection);
}

function setAdminSection(section) {
  state.adminSection = section;
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  loadAdminSection(section);
}

async function loadAdminSection(section) {
  switch(section) {
    case 'dashboard': await renderAdminDashboard(); break;
    case 'books': await renderAdminBooks(); break;
    case 'orders': await renderAdminOrders(); break;
    case 'analytics': await renderAdminAnalytics('month'); break;
  }
}

async function renderAdminDashboard() {
  const stats = await api('GET', '/api/analytics?period=month');
  const books = await api('GET', '/api/books/admin/all');
  const totalBooks = books.length;
  const activeBooks = books.filter(b => b.status === 'active').length;
  const lowStock = books.filter(b => b.stock < 5 && b.status === 'active').length;

  document.getElementById('adminContent').innerHTML = `
    <h2 class="section-title">📊 Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Revenue (Month)</div><div class="stat-value">$${stats.totalRevenue.toFixed(0)}</div><div class="stat-sub">${stats.totalOrders} orders</div></div>
      <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Orders (Month)</div><div class="stat-value">${stats.totalOrders}</div><div class="stat-sub">Avg $${stats.avgOrderValue.toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-label">Books in Catalogue</div><div class="stat-value">${activeBooks}</div><div class="stat-sub">${lowStock} low stock</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Customers</div><div class="stat-value">${stats.userCount}</div><div class="stat-sub">Registered users</div></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Revenue — Last 30 Days</div>
      <div class="bar-chart">
        ${(() => {
          const maxRev = Math.max(...stats.dailyData.map(d => d.revenue), 1);
          return stats.dailyData.map(d => `
            <div class="bar-chart-bar" style="height:${Math.max((d.revenue/maxRev)*100, 2)}%">
              <div class="tooltip">${d.date.slice(5)}: $${d.revenue.toFixed(0)}</div>
            </div>`).join('');
        })()}
      </div>
    </div>

    <h3 class="section-title">🏆 Top Books This Month</h3>
    <table class="data-table">
      <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Genre</th><th>Units Sold</th><th>Revenue</th></tr></thead>
      <tbody>
        ${stats.topBooks.slice(0,5).map((b,i) => `
          <tr><td>${i+1}</td><td><strong>${b.title}</strong></td><td>${b.author}</td><td>${b.genre||'-'}</td><td>${b.units_sold}</td><td>$${Number(b.revenue).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:2rem">No sales data yet</td></tr>'}
      </tbody>
    </table>`;
}

async function renderAdminBooks() {
  const books = await api('GET', '/api/books/admin/all');
  document.getElementById('adminContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <h2 class="section-title" style="margin-bottom:0">📚 Book Catalogue</h2>
      <button class="btn btn-primary" onclick="showAddBookModal()">+ Add Book</button>
    </div>
    <div style="margin-bottom:1rem">
      <input type="text" class="search-input" id="adminBookSearch" placeholder="Search books…" oninput="filterAdminBooks()" style="max-width:320px">
    </div>
    <table class="data-table" id="adminBooksTable">
      <thead><tr><th>Title</th><th>Author</th><th>Genre</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${books.map(b => `
          <tr data-search="${b.title.toLowerCase()} ${b.author.toLowerCase()}">
            <td><strong>${b.title}</strong></td>
            <td>${b.author}</td>
            <td>${b.genre||'-'}</td>
            <td>$${Number(b.price).toFixed(2)}</td>
            <td><span style="font-weight:600;color:${b.stock<5?'var(--rust)':'var(--sage)'}">${b.stock}</span></td>
            <td><span class="status-badge ${b.status==='active'?'status-shipped':'status-cancelled'}">${b.status}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="showEditBookModal(${b.id})">Edit</button>
              ${b.status==='active'
                ? `<button class="btn btn-danger btn-sm" style="margin-left:0.4rem" onclick="deactivateBook(${b.id})">Deactivate</button>`
                : `<button class="btn btn-sage btn-sm" style="margin-left:0.4rem" onclick="activateBook(${b.id})">Activate</button>`}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  window._adminBooks = books;
}

function filterAdminBooks() {
  const q = document.getElementById('adminBookSearch').value.toLowerCase();
  document.querySelectorAll('#adminBooksTable tbody tr').forEach(tr => {
    tr.style.display = tr.dataset.search.includes(q) ? '' : 'none';
  });
}

function showAddBookModal() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Add New Book</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Title *</label><input type="text" class="form-input" id="mTitle" placeholder="Book title"></div>
      <div class="form-group"><label class="form-label">Author *</label><input type="text" class="form-input" id="mAuthor" placeholder="Author name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ISBN</label><input type="text" class="form-input" id="mIsbn" placeholder="9780..."></div>
      <div class="form-group"><label class="form-label">Genre</label>
        <select class="form-select" id="mGenre">
          <option value="">Select genre</option>
          ${['Classic','Fiction','Non-Fiction','Thriller','Mystery','Memoir','Self-Help','Science','Dystopian','Fantasy','Romance','Biography'].map(g=>`<option>${g}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Price * (AUD)</label><input type="number" class="form-input" id="mPrice" step="0.01" min="0" placeholder="19.99"></div>
      <div class="form-group"><label class="form-label">Stock Quantity</label><input type="number" class="form-input" id="mStock" min="0" placeholder="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="mDesc" placeholder="Brief description…"></textarea></div>
    <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addBook()">Add Book</button>
    </div>`);
}

async function addBook() {
  const data = {
    title: document.getElementById('mTitle').value.trim(),
    author: document.getElementById('mAuthor').value.trim(),
    isbn: document.getElementById('mIsbn').value.trim(),
    genre: document.getElementById('mGenre').value,
    price: parseFloat(document.getElementById('mPrice').value),
    stock: parseInt(document.getElementById('mStock').value || 0),
    description: document.getElementById('mDesc').value.trim()
  };
  if (!data.title || !data.author || !data.price) { toast('Title, author and price are required', 'error'); return; }
  const r = await api('POST', '/api/books', data);
  if (r.error) { toast(r.error, 'error'); return; }
  closeModal(); toast('Book added! 📚', 'success');
  renderAdminBooks();
}

async function showEditBookModal(id) {
  const b = window._adminBooks.find(x => x.id === id);
  if (!b) return;
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Edit Book</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="eTitle" value="${b.title}"></div>
      <div class="form-group"><label class="form-label">Author</label><input type="text" class="form-input" id="eAuthor" value="${b.author}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ISBN</label><input type="text" class="form-input" id="eIsbn" value="${b.isbn||''}"></div>
      <div class="form-group"><label class="form-label">Genre</label>
        <select class="form-select" id="eGenre">
          <option value="">Select genre</option>
          ${['Classic','Fiction','Non-Fiction','Thriller','Mystery','Memoir','Self-Help','Science','Dystopian','Fantasy','Romance','Biography'].map(g=>`<option ${g===b.genre?'selected':''}>${g}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Price (AUD)</label><input type="number" class="form-input" id="ePrice" step="0.01" value="${b.price}"></div>
      <div class="form-group"><label class="form-label">Stock</label><input type="number" class="form-input" id="eStock" min="0" value="${b.stock}"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="eDesc">${b.description||''}</textarea></div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-select" id="eStatus">
        <option value="active" ${b.status==='active'?'selected':''}>Active</option>
        <option value="inactive" ${b.status==='inactive'?'selected':''}>Inactive</option>
      </select>
    </div>
    <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="updateBook(${id})">Save Changes</button>
    </div>`);
}

async function updateBook(id) {
  const data = {
    title: document.getElementById('eTitle').value.trim(),
    author: document.getElementById('eAuthor').value.trim(),
    isbn: document.getElementById('eIsbn').value.trim(),
    genre: document.getElementById('eGenre').value,
    price: parseFloat(document.getElementById('ePrice').value),
    stock: parseInt(document.getElementById('eStock').value),
    description: document.getElementById('eDesc').value.trim(),
    status: document.getElementById('eStatus').value
  };
  await api('PUT', `/api/books/${id}`, data);
  closeModal(); toast('Book updated!', 'success');
  renderAdminBooks();
}

async function deactivateBook(id) {
  if (!confirm('Deactivate this book? Customers won\'t be able to see it.')) return;
  await api('DELETE', `/api/books/${id}`);
  toast('Book deactivated', 'info');
  renderAdminBooks();
}

async function activateBook(id) {
  const b = window._adminBooks.find(x => x.id === id);
  await api('PUT', `/api/books/${id}`, { ...b, status: 'active' });
  toast('Book activated', 'success');
  renderAdminBooks();
}

async function renderAdminOrders() {
  const orders = await api('GET', '/api/orders/admin/all');
  document.getElementById('adminContent').innerHTML = `
    <h2 class="section-title">📦 All Orders</h2>
    <table class="data-table">
      <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${orders.length ? orders.map(o => `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td><div>${o.customer_name}</div><div style="font-size:0.75rem;color:var(--muted)">${o.customer_email}</div></td>
            <td>$${Number(o.total).toFixed(2)}</td>
            <td>${o.payment_method}</td>
            <td style="font-size:0.85rem">${new Date(o.created_at).toLocaleDateString('en-AU')}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td>
              <select class="form-select" style="padding:0.25rem 0.5rem;font-size:0.8rem;width:auto" onchange="updateOrderStatus(${o.id}, this.value)">
                ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
              </select>
            </td>
          </tr>`).join('')
        : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">No orders yet</td></tr>'}
      </tbody>
    </table>`;
}

async function updateOrderStatus(id, status) {
  await api('PUT', `/api/orders/${id}/status`, { status });
  toast('Order status updated', 'success');
}

async function renderAdminAnalytics(period) {
  const stats = await api('GET', `/api/analytics?period=${period}`);
  document.getElementById('adminContent').innerHTML = `
    <h2 class="section-title">📈 Sales Analytics</h2>
    <div class="period-tabs">
      ${[['day','Today'],['week','This Week'],['month','This Month'],['year','This Year'],['ytd','Year to Date']].map(([p,l]) =>
        `<button class="period-tab ${p===period?'active':''}" onclick="renderAdminAnalytics('${p}')">${l}</button>`
      ).join('')}
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Revenue</div><div class="stat-value">$${stats.totalRevenue.toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Total Orders</div><div class="stat-value">${stats.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-label">Avg Order Value</div><div class="stat-value">$${stats.avgOrderValue.toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Total Customers</div><div class="stat-value">${stats.userCount}</div></div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Daily Revenue — Last 30 Days</div>
      <div class="bar-chart">
        ${(() => {
          const maxRev = Math.max(...stats.dailyData.map(d => d.revenue), 1);
          return stats.dailyData.map(d => `
            <div class="bar-chart-bar" style="height:${Math.max((d.revenue/maxRev)*100, 2)}%">
              <div class="tooltip">${d.date.slice(5)}<br>$${Number(d.revenue).toFixed(0)}<br>${d.orders} orders</div>
            </div>`).join('');
        })()}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <h3 class="section-title">🏆 Top Books</h3>
        <table class="data-table">
          <thead><tr><th>Title</th><th>Units</th><th>Revenue</th></tr></thead>
          <tbody>
            ${stats.topBooks.slice(0,8).map(b => `
              <tr><td><div style="font-weight:600">${b.title}</div><div style="font-size:0.75rem;color:var(--muted)">${b.author}</div></td>
              <td>${b.units_sold}</td><td>$${Number(b.revenue).toFixed(2)}</td></tr>`).join('') ||
            '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--muted)">No data</td></tr>'}
          </tbody>
        </table>
      </div>
      <div>
        <h3 class="section-title">📚 Revenue by Genre</h3>
        <table class="data-table">
          <thead><tr><th>Genre</th><th>Units</th><th>Revenue</th></tr></thead>
          <tbody>
            ${stats.byGenre.map(g => `
              <tr><td>${g.genre}</td><td>${g.units_sold}</td><td>$${Number(g.revenue).toFixed(2)}</td></tr>`).join('') ||
            '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--muted)">No data</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div style="margin-top:1.5rem">
      <h3 class="section-title">📊 Order Status Breakdown</h3>
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        ${stats.statusBreakdown.map(s => `
          <div class="stat-card" style="flex:1;min-width:120px">
            <div class="stat-label">${s.status}</div>
            <div class="stat-value" style="font-size:1.5rem">${s.count}</div>
          </div>`).join('') || '<p style="color:var(--muted)">No orders yet</p>'}
      </div>
    </div>`;
}

// ====================== SEED TEST DATA ======================
async function seedTestOrders() {
  // This would normally happen through real user interaction
  // Here we just show analytics are ready
}

// ====================== INIT ======================
async function init() {
  // Check logged in state
  const r = await api('GET', '/api/auth/me');
  if (r.user) {
    state.user = r.user;
    await loadCart();
  }
  renderNav();
  navigate('home');
}

init();
