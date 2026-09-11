const WHATSAPP_NUMBER = '2347047009393';
const FULFILMENT_KEY = 'b2b-fulfilment';

let fulfilment = localStorage.getItem(FULFILMENT_KEY) || 'pickup';

const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartEmptyEl = document.getElementById('cart-empty');
const cartContentEl = document.getElementById('cart-content');
const clearCartBtn = document.getElementById('clear-cart');
const whatsappBtn = document.getElementById('whatsapp-send');
const downloadBtn = document.getElementById('download-receipt');

const nameInput = document.getElementById('customer-name');
const phoneInput = document.getElementById('customer-phone');
const addressField = document.getElementById('address-field');
const addressInput = document.getElementById('customer-address');
const notesInput = document.getElementById('customer-notes');

function renderCartPage() {
  const cart = getCart();

  if (cart.length === 0) {
    cartEmptyEl.hidden = false;
    cartContentEl.hidden = true;
    return;
  }

  cartEmptyEl.hidden = true;
  cartContentEl.hidden = false;

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-row" data-name="${item.name.replace(/"/g, '&quot;')}">
      <div class="cart-row-info">
        <p class="cart-row-name">${item.name}</p>
        <p class="cart-row-price">${formatNaira(item.price)} each</p>
      </div>
      <div class="qty-stepper">
        <button class="qty-btn" data-action="decrease" aria-label="Decrease quantity">&minus;</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" data-action="increase" aria-label="Increase quantity">&plus;</button>
      </div>
      <span class="cart-row-total">${formatNaira(item.price * item.qty)}</span>
      <button class="remove-btn" data-action="remove" aria-label="Remove item">&times;</button>
    </div>
  `).join('');

  cartTotalEl.textContent = formatNaira(getCartTotal());
  updateWhatsAppLink();

  cartItemsEl.querySelectorAll('.cart-row').forEach(row => {
    const name = row.dataset.name;
    const cartItem = getCart().find(i => i.name === name);
    if (!cartItem) return;

    row.querySelector('[data-action="increase"]').addEventListener('click', () => {
      setQty(name, cartItem.qty + 1);
      renderCartPage();
      bumpQtyValue(name);
    });
    row.querySelector('[data-action="decrease"]').addEventListener('click', () => {
      setQty(name, cartItem.qty - 1);
      renderCartPage();
      bumpQtyValue(name);
    });
    row.querySelector('[data-action="remove"]').addEventListener('click', () => {
      const el = cartItemsEl.querySelector(`.cart-row[data-name="${CSS.escape(name)}"]`);
      if (el) {
        el.classList.add('removing');
        setTimeout(() => {
          removeFromCart(name);
          renderCartPage();
        }, 220);
      } else {
        removeFromCart(name);
        renderCartPage();
      }
    });
  });
}

function bumpQtyValue(name) {
  const el = cartItemsEl.querySelector(`.cart-row[data-name="${CSS.escape(name)}"] .qty-value`);
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function updateWhatsAppLink() {
  const message = "Hi, I'd like to place an order. I've attached my order receipt.";
  whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll('.fulfilment-option').forEach(btn => {
  btn.addEventListener('click', () => {
    fulfilment = btn.dataset.type;
    localStorage.setItem(FULFILMENT_KEY, fulfilment);
    document.querySelectorAll('.fulfilment-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateAddressVisibility();
    updateWhatsAppLink();
  });
});

document.querySelectorAll('.fulfilment-option').forEach(btn => {
  if (btn.dataset.type === fulfilment) btn.classList.add('active');
  else btn.classList.remove('active');
});

function updateAddressVisibility() {
  addressField.hidden = fulfilment !== 'delivery';
}
updateAddressVisibility();

function validateDetails() {
  let valid = true;

  const nameError = document.getElementById('error-name');
  const phoneError = document.getElementById('error-phone');
  const addressError = document.getElementById('error-address');

  if (!nameInput.value.trim()) {
    nameError.hidden = false;
    valid = false;
  } else {
    nameError.hidden = true;
  }

  if (!phoneInput.value.trim()) {
    phoneError.hidden = false;
    valid = false;
  } else {
    phoneError.hidden = true;
  }

  if (fulfilment === 'delivery' && !addressInput.value.trim()) {
    addressError.hidden = false;
    valid = false;
  } else {
    addressError.hidden = true;
  }

  return valid;
}

// ---- Receipt image generation ----
function generateReceiptImage() {
  const cart = getCart();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const notes = notesInput.value.trim();

  const detailLines = [`Customer: ${name}`, `Phone: ${phone}`];
  if (fulfilment === 'delivery') detailLines.push(`Address: ${address}`);
  if (notes) detailLines.push(`Notes: ${notes}`);

  const rowHeight = 30;
  const headerHeight = 150;
  const detailsHeight = detailLines.length * 20 + 30;
  const footerHeight = 90;
  const width = 640;
  const height = headerHeight + detailsHeight + cart.length * rowHeight + footerHeight + 60;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FAFAF7';
  ctx.fillRect(0, 0, width, height);

  // Logo circle
  ctx.fillStyle = '#008B9B';
  ctx.beginPath();
  ctx.arc(50, 50, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B2B', 50, 51);

  // Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#141414';
  ctx.font = '600 22px Georgia';
  ctx.fillText('Breakfast 2 Breakfast', 90, 44);
  ctx.font = '13px Arial';
  ctx.fillStyle = '#5B5B57';
  ctx.fillText(new Date().toLocaleString('en-NG'), 90, 66);

  // Customer details
  let y = headerHeight;
  ctx.font = '14px Arial';
  ctx.fillStyle = '#141414';
  detailLines.forEach(line => {
    ctx.fillText(line, 40, y);
    y += 20;
  });
  y += 10;

  // Divider
  ctx.strokeStyle = '#141414';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Items
  y += 26;
  ctx.font = '14px Arial';
  cart.forEach(item => {
    ctx.fillStyle = '#141414';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.qty}x ${item.name}`, 40, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatNaira(item.price * item.qty), width - 40, y);
    y += rowHeight;
  });

  // Divider
  y += 4;
  ctx.strokeStyle = '#141414';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Total
  y += 34;
  ctx.font = 'bold 18px Arial';
  ctx.fillStyle = '#008B9B';
  ctx.textAlign = 'left';
  ctx.fillText('Total', 40, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatNaira(getCartTotal()), width - 40, y);

  // Fulfilment
  y += 34;
  ctx.font = '14px Arial';
  ctx.fillStyle = '#5B5B57';
  ctx.textAlign = 'left';
  ctx.fillText(`Fulfilment: ${fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}`, 40, y);

  // Footer note
  y += 30;
  ctx.font = 'italic 12px Arial';
  ctx.fillText('Attach this receipt on WhatsApp to complete your order.', 40, y);

  return canvas.toDataURL('image/png');
}

downloadBtn.addEventListener('click', () => {
  if (!validateDetails()) return;

  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = 'Generating…';
  downloadBtn.disabled = true;

  setTimeout(() => {
    const dataUrl = generateReceiptImage();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'b2b-order-receipt.png';
    link.click();

    downloadBtn.textContent = originalText;
    downloadBtn.disabled = false;
  }, 250);
});
renderCartPage();

const clearModal = document.getElementById('clear-modal');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

function openClearModal() {
  clearModal.hidden = false;
  requestAnimationFrame(() => clearModal.classList.add('open'));
}

function closeClearModal() {
  clearModal.classList.remove('open');
  setTimeout(() => { clearModal.hidden = true; }, 200);
}

clearCartBtn.addEventListener('click', openClearModal);
modalCancel.addEventListener('click', closeClearModal);
clearModal.addEventListener('click', (e) => {
  if (e.target === clearModal) closeClearModal();
});
modalConfirm.addEventListener('click', () => {
  clearCart();
  renderCartPage();
  closeClearModal();
});

[nameInput, phoneInput, addressInput].forEach((input, i) => {
  const errorIds = ['error-name', 'error-phone', 'error-address'];
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      document.getElementById(errorIds[i]).hidden = true;
    }
  });
});
