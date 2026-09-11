// Shared cart storage (localStorage) and header badge sync, used on every page.

const CART_KEY = 'b2b-cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart, opts = {}) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (opts.pop) {
    updateCartBadgeWithPop();
  } else {
    updateCartBadge();
  }
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.name === item.name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name: item.name, price: item.price, category: item.category, qty: 1 });
  }
  saveCart(cart, { pop: true });
}

function removeFromCart(name) {
  const cart = getCart().filter(i => i.name !== name);
  saveCart(cart);
}

function setQty(name, qty) {
  const cart = getCart();
  const item = cart.find(i => i.name === name);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(name);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.qty * i.price, 0);
}

function formatNaira(amount) {
  return '\u20A6' + amount.toLocaleString('en-NG');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  const count = getCartCount();
  if (count > 0) {
    badge.textContent = String(count);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

function updateCartBadgeWithPop() {
  updateCartBadge();
  const badge = document.getElementById('cart-count');
  if (!badge || badge.hidden) return;
  badge.classList.remove('pop');
  void badge.offsetWidth;
  badge.classList.add('pop');
}

function clearCart() {
  saveCart([]);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
