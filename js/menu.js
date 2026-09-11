const CATEGORY_ORDER = [
  'Breakfast & Brunch', 'Tacos', 'Soul Food', 'Melts', 'Burgers', 'Starters',
  'Salads', 'Sandwiches & Wraps', 'Stir Fry & Rice', 'Pizza', 'Main Courses',
  'Dessert', 'Drinks', 'Bar Menu'
];

const CATEGORY_SLUGS = {
  'Breakfast & Brunch': 'breakfast',
  'Burgers': 'burgers',
  'Pizza': 'pizza',
  'Dessert': 'dessert'
};

function skeletonHTML(rows = 4) {
  return `
    <div class="menu-category">
      ${Array.from({ length: rows }).map(() => `
        <div class="skeleton-row">
          <div class="skeleton-block skeleton-photo"></div>
          <div class="skeleton-lines">
            <div class="skeleton-block skeleton-line"></div>
            <div class="skeleton-block skeleton-line short"></div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let allItems = [];
let fuse = null;
let activeCategory = 'all';

const sectionsEl = document.getElementById('menu-sections');
const tabsEl = document.getElementById('category-tabs');
const searchInput = document.getElementById('menu-search');
const emptyState = document.getElementById('empty-state');

function slugify(name) {
  return CATEGORY_SLUGS[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function itemCard(item) {
  const orderable = !item.dineInOnly;
  const priceLabel = item.bottlePrice
    ? `${formatNaira(item.price)} shot &middot; ${formatNaira(item.bottlePrice)} bottle`
    : formatNaira(item.price);

  return `
    <div class="menu-item">
      <div class="menu-item-photo" aria-hidden="true"></div>
      <div class="menu-item-info">
        <div class="menu-item-top">
          <h4>${item.name}</h4>
          <span class="menu-item-price">${priceLabel}</span>
        </div>
        ${item.description ? `<p class="menu-item-desc">${item.description}</p>` : ''}
      </div>
      ${orderable
        ? `<button class="btn btn-add" data-name="${item.name.replace(/"/g, '&quot;')}">Add</button>`
        : `<span class="dine-in-badge">Dine-in only</span>`}
    </div>`;
}

function renderSections(items) {
  sectionsEl.classList.remove('fade-refresh');
  // Force reflow so the fade-in animation restarts on each update
  void sectionsEl.offsetWidth;
  sectionsEl.classList.add('fade-refresh');

  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const categoriesToShow = CATEGORY_ORDER.filter(cat => byCategory[cat]);

  sectionsEl.innerHTML = categoriesToShow.map(cat => {
    const catItems = byCategory[cat];
    const isBar = cat === 'Bar Menu';
    return `
      <div class="menu-category" id="${slugify(cat)}">
        <div class="menu-category-header">
          <h2>${cat}</h2>
          ${isBar ? '<p class="bar-note">Available for dine-in guests only.</p>' : ''}
        </div>
        <div class="menu-items">
          ${catItems.map(itemCard).join('')}
        </div>
      </div>`;
  }).join('');

  emptyState.hidden = categoriesToShow.length > 0;
  sectionsEl.hidden = categoriesToShow.length === 0;

  sectionsEl.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = allItems.find(i => i.name === btn.dataset.name);
      if (item) {
        addToCart(item);
        btn.textContent = 'Added';
        btn.classList.add('added');
        setTimeout(() => {
          btn.textContent = 'Add';
          btn.classList.remove('added');
        }, 900);
      }
    });
  });
}

function applyFilters() {
  const query = searchInput.value.trim();

  if (query.length > 0) {
    const results = fuse.search(query).map(r => r.item);
    renderSections(results);
    return;
  }

  if (activeCategory === 'all') {
    renderSections(allItems);
  } else {
    renderSections(allItems.filter(i => i.category === activeCategory));
  }
}

function buildTabs() {
  const categoriesPresent = CATEGORY_ORDER.filter(cat => allItems.some(i => i.category === cat));
  const tabs = ['all', ...categoriesPresent];

  tabsEl.innerHTML = tabs.map(cat => {
    const label = cat === 'all' ? 'All' : cat;
    return `<button class="tab${cat === activeCategory ? ' active' : ''}" data-cat="${cat}">${label}</button>`;
  }).join('');

  tabsEl.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.cat;
      searchInput.value = '';
      tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyFilters();
    });
  });
}

sectionsEl.innerHTML = skeletonHTML(5);

fetch('data/menu-data.json')
  .then(res => res.json())
  .then(data => {
    allItems = data.items;
    fuse = new Fuse(allItems, {
      keys: ['name', 'description'],
      threshold: 0.35,
      ignoreLocation: true
    });
    buildTabs();
    applyFilters();

    // Support #category deep links from the homepage
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = Object.entries(CATEGORY_SLUGS).find(([, slug]) => slug === hash);
      if (match) {
        activeCategory = match[0];
        buildTabs();
        applyFilters();
      }
    }
  });

searchInput.addEventListener('input', debounce(applyFilters, 180));
