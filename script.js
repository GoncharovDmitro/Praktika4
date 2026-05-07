/* ============================================================
   TechStore — головний JavaScript
   Коментарі (П.1 ... П.10) показують, де реалізовано кожен пункт ТЗ.
   ============================================================ */

// ------------------------------------------------------------
// П.1, П.3 — Кошик: дані зберігаються у localStorage між сесіями
// ------------------------------------------------------------
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let currentProducts = [];   // використовується на сторінці каталогу
let filteredProducts = [];

/* Резервні дані товарів — використовуються, якщо fetch JSON
   недоступний (наприклад, відкриття index.html напряму через file://).
   Поле image вказує на фото у папці pic/ (1.png ... 22.png) */
const defaultProducts = [
    { id: 1,  name: "Intel Core i9-13900K",        category: "CPU", price: 21500, image: "pic/1.png",  description: "24 ядра (8 P-core + 16 E-core), 32 потоки, частота до 5.8 ГГц, LGA 1700. Підтримка DDR5 та PCIe 5.0.", inStock: true,  specs: "Сокет: LGA 1700, TDP: 125W, Кеш: 36MB, Частота: 5.8 ГГц" },
    { id: 2,  name: "AMD Ryzen 9 7950X",            category: "CPU", price: 23500, image: "pic/2.png",  description: "16 ядер, 32 потоки, частота до 5.7 ГГц, AM5. Найпотужніший процесор для робочих станцій.", inStock: true,  specs: "Сокет: AM5, TDP: 170W, Кеш: 80MB, Частота: 5.7 ГГц" },
    { id: 3,  name: "Intel Core i7-13700K",         category: "CPU", price: 16500, image: "pic/3.png",  description: "16 ядер, 24 потоки, частота до 5.4 ГГц, 30 МБ кешу. Оптимальний вибір для геймінгу.", inStock: true,  specs: "Сокет: LGA 1700, TDP: 125W, Кеш: 30MB" },
    { id: 4,  name: "AMD Ryzen 7 7800X3D",          category: "CPU", price: 18900, image: "pic/4.png",  description: "8 ядер, 16 потоків, 3D V-Cache. Найкращий ігровий процесор на ринку.", inStock: true,  specs: "Сокет: AM5, TDP: 120W, 3D V-Cache: 96MB" },
    { id: 5,  name: "Intel Core i5-13600K",         category: "CPU", price: 11200, image: "pic/5.png",  description: "14 ядер, 20 потоків, частота до 5.1 ГГц, 24 МБ кешу.", inStock: false, specs: "Сокет: LGA 1700, TDP: 125W, Кеш: 24MB" },
    { id: 6,  name: "NVIDIA GeForce RTX 4090",      category: "GPU", price: 68000, image: "pic/6.png",  description: "24 ГБ GDDR6X, 16384 ядер CUDA, трасування променів, DLSS 3.", inStock: true,  specs: "VRAM: 24GB, Шина: 384-bit, TDP: 450W" },
    { id: 7,  name: "NVIDIA GeForce RTX 4080",      category: "GPU", price: 48000, image: "pic/7.png",  description: "16 ГБ GDDR6X, 9728 ядер CUDA, підтримка DLSS 3.", inStock: true,  specs: "VRAM: 16GB, Шина: 256-bit, TDP: 320W" },
    { id: 8,  name: "AMD Radeon RX 7900 XTX",       category: "GPU", price: 44500, image: "pic/8.png",  description: "24 ГБ GDDR6, 6144 потокових процесорів, 384-бітна шина.", inStock: true,  specs: "VRAM: 24GB, Шина: 384-bit, TDP: 355W" },
    { id: 9,  name: "NVIDIA GeForce RTX 4070 Ti",   category: "GPU", price: 32500, image: "pic/9.png",  description: "12 ГБ GDDR6X, 7680 ядер CUDA, енергоефективна.", inStock: true,  specs: "VRAM: 12GB, Шина: 192-bit, TDP: 285W" },
    { id: 10, name: "AMD Radeon RX 7800 XT",        category: "GPU", price: 27800, image: "pic/10.png", description: "16 ГБ GDDR6, 3840 потокових процесорів.", inStock: false, specs: "VRAM: 16GB, Шина: 256-bit, TDP: 263W" },
    { id: 11, name: "Corsair Vengeance 32 ГБ DDR5", category: "RAM", price: 5200,  image: "pic/11.png", description: "2x16 ГБ, частота 6000 МГц, CL36, чорний радіатор.", inStock: true,  specs: "Тип: DDR5, Обʼєм: 32GB, Частота: 6000MHz" },
    { id: 12, name: "Kingston Fury 64 ГБ DDR5",     category: "RAM", price: 9800,  image: "pic/12.png", description: "2x32 ГБ, частота 5600 МГц, RGB підсвітка.", inStock: true,  specs: "Тип: DDR5, Обʼєм: 64GB, Частота: 5600MHz" },
    { id: 13, name: "G.Skill Trident Z 16 ГБ DDR4", category: "RAM", price: 2800,  image: "pic/13.png", description: "2x8 ГБ, частота 3600 МГц, CL18, для старих систем.", inStock: true,  specs: "Тип: DDR4, Обʼєм: 16GB, Частота: 3600MHz" },
    { id: 14, name: "Crucial 16 ГБ DDR5",           category: "RAM", price: 2900,  image: "pic/14.png", description: "1x16 ГБ, частота 4800 МГц, бюджетний варіант.", inStock: true,  specs: "Тип: DDR5, Обʼєм: 16GB, Частота: 4800MHz" },
    { id: 15, name: "Patriot Viper 32 ГБ DDR4",     category: "RAM", price: 4100,  image: "pic/15.png", description: "2x16 ГБ, частота 3200 МГц, алюмінієвий радіатор.", inStock: false, specs: "Тип: DDR4, Обʼєм: 32GB, Частота: 3200MHz" },
    { id: 16, name: "Samsung 990 Pro 1TB NVMe",     category: "накопичувачі", price: 4800, image: "pic/16.png", description: "M.2 NVMe, читання 7450 МБ/с, запис 6900 МБ/с, PCIe 4.0.", inStock: true,  specs: "Формат: M.2, Обʼєм: 1TB, Швидкість: 7450 MB/s" },
    { id: 17, name: "WD Black SN850X 2TB",          category: "накопичувачі", price: 8900, image: "pic/17.png", description: "M.2 NVMe, читання 7300 МБ/с, з розсіювачем тепла.", inStock: true,  specs: "Формат: M.2, Обʼєм: 2TB, Швидкість: 7300 MB/s" },
    { id: 18, name: "Kingston KC3000 512GB",        category: "накопичувачі", price: 2850, image: "pic/18.png", description: "M.2 NVMe, читання 7000 МБ/с, бюджетний варіант.", inStock: true,  specs: "Формат: M.2, Обʼєм: 512GB, Швидкість: 7000 MB/s" },
    { id: 19, name: "Seagate BarraCuda 4TB HDD",    category: "накопичувачі", price: 3500, image: "pic/19.png", description: "7200 об/хв, SATA 6 Гб/с, 256 МБ кешу.", inStock: true,  specs: "Формат: 3.5, Обʼєм: 4TB, Швидкість: 7200 RPM" },
    { id: 20, name: "Crucial P3 Plus 2TB NVMe",     category: "накопичувачі", price: 5200, image: "pic/20.png", description: "M.2 NVMe, читання 5000 МБ/с, PCIe 4.0.", inStock: true,  specs: "Формат: M.2, Обʼєм: 2TB, Швидкість: 5000 MB/s" },
    { id: 21, name: "Toshiba 2TB HDD",              category: "накопичувачі", price: 2300, image: "pic/21.png", description: "5400 об/хв, SATA 6 Гб/с, для зберігання файлів.", inStock: false, specs: "Формат: 3.5, Обʼєм: 2TB, Швидкість: 5400 RPM" },
    { id: 22, name: "AMD Ryzen 5 7600X",            category: "CPU", price: 7800,  image: "pic/22.png", description: "6 ядер, 12 потоків, частота до 5.3 ГГц, AM5.", inStock: true,  specs: "Сокет: AM5, TDP: 105W, Кеш: 38MB" }
];

// ------------------------------------------------------------
// Допоміжні функції
// ------------------------------------------------------------
function getCategoryIcon(category) {
    const icons = {
        'CPU': '⚡',
        'GPU': '🎮',
        'RAM': '💾',
        'накопичувачі': '💿'
    };
    return icons[category] || '📦';
}

// Повертає шлях до фото товару. Якщо в JSON не вказано image —
// підставляємо pic/<id>.png (placeholder з папки pic/).
function getProductImage(product) {
    return product.image || `pic/${product.id}.png`;
}

function getCategoryName(category) {
    const names = {
        'CPU': 'Процесори',
        'GPU': 'Відеокарти',
        'RAM': 'Оперативна пам\'ять',
        'накопичувачі': 'Накопичувачі'
    };
    return names[category] || category;
}

function formatPrice(price) {
    return price.toLocaleString('uk-UA');
}

// Завантаження товарів з JSON, з fallback на defaultProducts
async function loadProducts() {
    if (products.length > 0) return products;
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('JSON не завантажено');
        const data = await response.json();
        products = data.products;
    } catch (error) {
        console.warn('Використовую резервні дані товарів:', error.message);
        products = defaultProducts;
    }
    return products;
}

// ============================================================
// П.8 — Toast-повідомлення з CSS-анімацією
// ============================================================
function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = 'success', duration = 2400) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '✓'}</span>
        <span class="toast-text">${message}</span>
    `;
    container.appendChild(toast);

    // П.8 — через `duration` ms запускаємо клас .hide (CSS анімація зникнення)
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
}

// ============================================================
// П.5 — Бейдж кошика, оновлюється динамічно
// ============================================================
function updateCartCount(animate = false) {
    const cartCountEls = document.querySelectorAll('#cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEls.forEach(el => {
        el.textContent = totalItems;
        if (animate) {
            el.classList.remove('bump');
            // force reflow для рестарту анімації
            void el.offsetWidth;
            el.classList.add('bump');
        }
    });
}

function saveCart() {
    // П.1, П.3 — синхронізуємо стан кошика з localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// ============================================================
// П.1, П.3 — Додавання товару в кошик / збільшення кількості
// ============================================================
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!product.inStock) {
        showToast('Товар тимчасово відсутній', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: product.category,
            image: getProductImage(product)
        });
    }
    saveCart();
    updateCartCount(true); // П.5 — анімація бейджу
    // П.8 — toast при додаванні
    showToast(`Додано до кошика: ${product.name}`, 'success');
}

// П.1, П.3 — видалення товару з кошика
function removeFromCart(productId) {
    const item = cart.find(i => i.id === productId);
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
    if (item) showToast(`Видалено: ${item.name}`, 'info');
}

// П.1, П.3 — зміна кількості (через кнопки +/− у кошику)
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    }
}

// П.4 — очищення всього кошика
function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('Очистити кошик?')) return;
    cart = [];
    saveCart();
    displayCart();
    showToast('Кошик очищено', 'info');
}

// ============================================================
// Live-пошук на головній сторінці (з реальним часом)
// П.9 — стан "нічого не знайдено"
// ============================================================
function setupLiveSearch() {
    const searchInput = document.getElementById('live-search');
    const clearBtn = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();
        if (term.length === 0) {
            searchResults.style.display = 'none';
            return;
        }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            getCategoryName(p.category).toLowerCase().includes(term)
        );
        searchResults.style.display = 'block';
        // П.9 — заглушка для пустого пошуку
        if (filtered.length === 0) {
            searchResults.innerHTML = `
                <div class="search-empty">
                    <div class="empty-icon">🔍</div>
                    <p>Нічого не знайдено за запитом "<b>${escapeHtml(term)}</b>"</p>
                </div>`;
            return;
        }
        searchResults.innerHTML = filtered.slice(0, 8).map(p => `
            <div class="search-result-item" onclick="goToProduct(${p.id})">
                <div class="search-result-thumb">
                    <img src="${getProductImage(p)}" alt="${escapeHtml(p.name)}"
                         onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${getCategoryIcon(p.category)}'}))">
                </div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(p.name)}</div>
                    <div class="search-result-price">${formatPrice(p.price)} грн</div>
                </div>
                <div class="${p.inStock ? 'in-stock' : 'out-stock'}">
                    ${p.inStock ? '✓' : '✗'}
                </div>
            </div>
        `).join('');
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchResults.style.display = 'none';
            searchInput.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function goToProduct(productId) {
    // П.2 — передача id через URL (?id=...)
    window.location.href = `product.html?id=${productId}`;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
}

// ============================================================
// Головна сторінка — рекомендовані товари + категорії
// ============================================================
async function displayFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    await loadProducts();
    const featured = products.slice(0, 8);

    container.innerHTML = featured.map(product => renderProductCard(product)).join('');
}

function renderProductCard(product) {
    return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-image" aria-label="${escapeHtml(product.name)}">
                <img src="${getProductImage(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
            </a>
            <div class="product-info">
                <p class="product-category">${getCategoryName(product.category)}</p>
                <h3 class="product-title">${escapeHtml(product.name)}</h3>
                <div class="product-stock">
                    ${product.inStock
                        ? '<span class="in-stock">● В наявності</span>'
                        : '<span class="out-stock">● Немає в наявності</span>'}
                </div>
                <div class="product-price">${formatPrice(product.price)} грн</div>
                <button onclick="addToCart(${product.id})"
                        class="btn-add-to-cart"
                        ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Додати в кошик' : 'Немає в наявності'}
                </button>
                <a href="product.html?id=${product.id}" class="product-link">Детальніше →</a>
            </div>
        </div>
    `;
}

function setupCategoryFilters() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            localStorage.setItem('selectedCategory', category);
            window.location.href = 'catalog.html';
        });
    });
}

// ============================================================
// Сторінка каталогу
// П.6 — Сортування за ціною (зростання/спадання) та назвою
// П.9 — стан "товарів не знайдено"
// ============================================================
async function loadCatalog() {
    await loadProducts();
    currentProducts = [...products];
    filteredProducts = [...currentProducts];

    // Якщо на головній обрали категорію — підставляємо чекбокс
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        document.querySelectorAll('.category-filter').forEach(cb => {
            if (cb.value === savedCategory) cb.checked = true;
        });
        localStorage.removeItem('selectedCategory');
    }

    setupCatalogEventListeners();
    setupCatalogSearch();
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    let results = [...currentProducts];

    // Категорії
    const selectedCategories = Array.from(
        document.querySelectorAll('.category-filter:checked')
    ).map(cb => cb.value);
    if (selectedCategories.length > 0) {
        results = results.filter(p => selectedCategories.includes(p.category));
    }

    // Ціна
    const minPrice = document.getElementById('min-price')?.value;
    const maxPrice = document.getElementById('max-price')?.value;
    if (minPrice) results = results.filter(p => p.price >= parseInt(minPrice, 10));
    if (maxPrice) results = results.filter(p => p.price <= parseInt(maxPrice, 10));

    // Тільки в наявності
    const inStockOnly = document.getElementById('in-stock-only')?.checked;
    if (inStockOnly) results = results.filter(p => p.inStock);

    // Текстовий пошук в каталозі
    const searchTerm = document.getElementById('catalog-search-input')?.value.trim().toLowerCase();
    if (searchTerm) {
        results = results.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    // П.6 — Сортування
    const sortBy = document.getElementById('sort-by')?.value;
    switch (sortBy) {
        case 'price-asc':  results.sort((a, b) => a.price - b.price); break;
        case 'price-desc': results.sort((a, b) => b.price - a.price); break;
        case 'name-asc':   results.sort((a, b) => a.name.localeCompare(b.name, 'uk')); break;
        case 'name-desc':  results.sort((a, b) => b.name.localeCompare(a.name, 'uk')); break;
    }

    filteredProducts = results;
    renderCatalogProducts();
    updateResultsCount();
}

function renderCatalogProducts() {
    const container = document.getElementById('catalog-products');
    if (!container) return;

    // П.9 — заглушка коли товарів не знайдено
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="empty-icon">🔍</div>
                <h3>Товарів не знайдено</h3>
                <p>Спробуйте змінити фільтри або пошуковий запит</p>
                <button class="btn btn-secondary" onclick="clearFilters()" style="margin-top:1rem;">
                    Скинути фільтри
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredProducts.map(product => renderProductCard(product)).join('');
}

function updateResultsCount() {
    const el = document.getElementById('results-count');
    if (el) el.textContent = `Знайдено товарів: ${filteredProducts.length}`;
}

function clearFilters() {
    document.querySelectorAll('.category-filter:checked').forEach(cb => cb.checked = false);
    const minPrice    = document.getElementById('min-price');
    const maxPrice    = document.getElementById('max-price');
    const inStockOnly = document.getElementById('in-stock-only');
    const sortBy      = document.getElementById('sort-by');
    const searchInput = document.getElementById('catalog-search-input');

    if (minPrice)    minPrice.value    = '';
    if (maxPrice)    maxPrice.value    = '';
    if (inStockOnly) inStockOnly.checked = false;
    if (sortBy)      sortBy.value      = 'default';
    if (searchInput) searchInput.value = '';

    applyFiltersAndRender();
}

function setupCatalogEventListeners() {
    document.querySelectorAll('.category-filter, #in-stock-only').forEach(filter => {
        filter.addEventListener('change', applyFiltersAndRender);
    });

    document.getElementById('apply-price')?.addEventListener('click', applyFiltersAndRender);
    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
    // П.6 — змінив сортування → оновлюємо
    document.getElementById('sort-by')?.addEventListener('change', applyFiltersAndRender);

    // Enter в полях ціни
    ['min-price', 'max-price'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') applyFiltersAndRender();
        });
    });
}

function setupCatalogSearch() {
    const input = document.getElementById('catalog-search-input');
    if (!input) return;
    input.addEventListener('input', applyFiltersAndRender);
}

// ============================================================
// П.2 — Сторінка товару: ?id=..., велике фото, опис, ціна, в кошик
// ============================================================
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'), 10);

    const container = document.getElementById('product-details');
    if (!container) return;

    if (!productId) {
        container.innerHTML = `
            <div class="no-results" style="background:white;border-radius:12px;margin:2rem 0;">
                <div class="empty-icon">❓</div>
                <h3>Не вказано ID товару</h3>
                <a href="catalog.html" class="btn btn-secondary" style="margin-top:1rem;">До каталогу</a>
            </div>
        `;
        return;
    }

    await loadProducts();
    const product = products.find(p => p.id === productId);

    if (!product) {
        container.innerHTML = `
            <div class="no-results" style="background:white;border-radius:12px;margin:2rem 0;">
                <div class="empty-icon">❌</div>
                <h3>Товар не знайдено</h3>
                <a href="catalog.html" class="btn btn-secondary" style="margin-top:1rem;">До каталогу</a>
            </div>
        `;
        return;
    }

    document.title = `${product.name} — TechStore`;
    displayProductDetails(product);
}

function displayProductDetails(product) {
    const container = document.getElementById('product-details');
    if (!container) return;

    container.innerHTML = `
        <div class="product-detail-wrapper">
            <div class="breadcrumbs">
                <a href="index.html">Головна</a> /
                <a href="catalog.html">Каталог</a> /
                <span>${product.name}</span>
            </div>

            <div class="product-detail">
                <!-- П.2 — велике фото товару -->
                <div class="product-detail-gallery">
                    <div class="product-detail-image-large">
                        <img src="${getProductImage(product)}" alt="${escapeHtml(product.name)}">
                    </div>
                    <div class="product-detail-badge ${product.inStock ? 'in-stock-badge' : 'out-stock-badge'}">
                        ${product.inStock ? 'В НАЯВНОСТІ' : 'НЕМАЄ В НАЯВНОСТІ'}
                    </div>
                </div>

                <div class="product-detail-info">
                    <h1 class="product-detail-title">${product.name}</h1>
                    <span class="category-tag">${getCategoryName(product.category)}</span>

                    <!-- П.2 — ціна -->
                    <div class="product-detail-price">${formatPrice(product.price)} грн</div>

                    <!-- П.2 — детальний опис -->
                    <div class="product-detail-description">
                        <h3>Опис товару</h3>
                        <p>${escapeHtml(product.description)}</p>
                    </div>

                    ${product.specs ? `
                    <div class="product-detail-specs">
                        <h3>Характеристики</h3>
                        <div class="specs-list">
                            ${product.specs.split(',').map(s => `<div class="spec-item">${escapeHtml(s.trim())}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${product.inStock ? `
                        <!-- П.2 — кнопка "В кошик" + вибір кількості -->
                        <div class="product-detail-quantity">
                            <div class="quantity-selector">
                                <button class="quantity-btn" id="decrease-qty" type="button">−</button>
                                <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="20">
                                <button class="quantity-btn" id="increase-qty" type="button">+</button>
                            </div>
                            <button id="add-to-cart-btn" class="btn-add-to-cart-large" type="button">
                                Додати в кошик
                            </button>
                        </div>
                    ` : `
                        <button class="btn-add-to-cart-large" disabled style="opacity:0.6;cursor:not-allowed;">
                            Товар тимчасово відсутній
                        </button>
                    `}

                    <a href="catalog.html" class="continue-shopping">← Повернутися до каталогу</a>
                </div>
            </div>

            <div class="product-detail-recommendations">
                <h3>Схожі товари</h3>
                <div class="products-grid" id="recommendations-grid"></div>
            </div>
        </div>
    `;

    if (product.inStock) {
        const quantityInput = document.getElementById('quantity');
        document.getElementById('decrease-qty').addEventListener('click', () => {
            const v = parseInt(quantityInput.value, 10) || 1;
            if (v > 1) quantityInput.value = v - 1;
        });
        document.getElementById('increase-qty').addEventListener('click', () => {
            const v = parseInt(quantityInput.value, 10) || 1;
            if (v < 20) quantityInput.value = v + 1;
        });
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            const qty = Math.max(1, parseInt(quantityInput.value, 10) || 1);
            addToCart(product.id, qty);
        });
    }

    showRecommendations(product);
}

function showRecommendations(currentProduct) {
    const container = document.getElementById('recommendations-grid');
    if (!container) return;
    const recs = products
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);
    if (recs.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;">Немає схожих товарів</p>';
        return;
    }
    container.innerHTML = recs.map(p => renderProductCard(p)).join('');
}

// ============================================================
// П.4 — Сторінка кошика: список, кількість, ціна, сума, очистити
// П.9 — Заглушка порожнього кошика
// ============================================================
async function displayCart() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    await loadProducts();

    if (cart.length === 0) {
        // П.9 — порожній кошик
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-icon">🛒</div>
                <h2>Ваш кошик порожній</h2>
                <p>Додайте товари до кошика, щоб оформити замовлення</p>
                <a href="catalog.html" class="btn btn-primary">Перейти до каталогу</a>
            </div>
        `;
        return;
    }

    let total = 0;
    const itemsHtml = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        // дістаємо повний product, щоб взяти image (бо в cart зберігаються легкі дані)
        const fullProduct = products.find(p => p.id === item.id) || item;
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${getProductImage(fullProduct)}" alt="${escapeHtml(item.name)}">
                </div>
                <div class="cart-item-info">
                    <h4><a href="product.html?id=${item.id}">${escapeHtml(item.name)}</a></h4>
                    <p class="cart-item-price">${formatPrice(item.price)} грн / шт</p>
                </div>
                <!-- П.1, П.3 — зміна кількості (+/−) -->
                <div class="cart-item-quantity">
                    <button class="quantity-btn" type="button"
                            onclick="updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" type="button"
                            onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">${formatPrice(itemTotal)} грн</div>
                <!-- П.1, П.3 — видалення -->
                <button class="remove-item-btn" type="button" title="Видалити"
                        onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        `;
    }).join('');

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    container.innerHTML = `
        <div class="cart-container">
            <div class="cart-items">
                <div class="cart-header">
                    <div></div>
                    <div>Товар</div>
                    <div>Ціна</div>
                    <div>Кількість</div>
                    <div>Сума</div>
                    <div></div>
                </div>
                ${itemsHtml}
            </div>

            <div class="cart-summary">
                <h3>Сума замовлення</h3>
                <div class="summary-row">
                    <span>Товарів:</span>
                    <span>${totalQty} шт.</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Всього:</span>
                    <span class="total-price">${formatPrice(total)} грн</span>
                </div>
                <button class="btn-checkout" type="button" onclick="scrollToOrderForm()">
                    Оформити замовлення
                </button>
                <!-- П.4 — кнопка "Очистити кошик" -->
                <button class="btn-clear-cart" type="button" onclick="clearCart()">
                    Очистити кошик
                </button>
                <a href="catalog.html" class="continue-shopping">← Продовжити покупки</a>
            </div>
        </div>

        ${renderOrderForm()}
    `;

    // П.7 — підключаємо валідацію форми
    setupOrderForm();
}

function scrollToOrderForm() {
    const form = document.getElementById('order-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// П.7 — Форма замовлення: ім'я, email, телефон, адреса + валідація
// ============================================================
function renderOrderForm() {
    return `
        <section class="order-form-section">
            <h2>📝 Оформлення замовлення</h2>
            <form id="order-form" class="order-form" novalidate>
                <div class="form-group">
                    <label for="order-name">Ім'я <span class="required">*</span></label>
                    <input type="text" id="order-name" name="name" required minlength="2">
                    <span class="error-message">Введіть ім'я (мінімум 2 символи)</span>
                </div>
                <div class="form-group">
                    <label for="order-email">Email <span class="required">*</span></label>
                    <input type="email" id="order-email" name="email" required>
                    <span class="error-message">Введіть коректний email</span>
                </div>
                <div class="form-group">
                    <label for="order-phone">Телефон <span class="required">*</span></label>
                    <input type="tel" id="order-phone" name="phone" required
                           placeholder="+380XXXXXXXXX">
                    <span class="error-message">Введіть коректний номер телефону (10-13 цифр)</span>
                </div>
                <div class="form-group">
                    <label for="order-city">Місто <span class="required">*</span></label>
                    <input type="text" id="order-city" name="city" required minlength="2">
                    <span class="error-message">Вкажіть місто</span>
                </div>
                <div class="form-group full-width">
                    <label for="order-address">Адреса доставки <span class="required">*</span></label>
                    <textarea id="order-address" name="address" required
                              placeholder="Вулиця, будинок, квартира або № відділення Нової Пошти"></textarea>
                    <span class="error-message">Вкажіть адресу доставки</span>
                </div>
                <div class="form-group full-width">
                    <label for="order-comment">Коментар (необов'язково)</label>
                    <textarea id="order-comment" name="comment"></textarea>
                </div>
                <button type="submit" class="btn-submit-order">Підтвердити замовлення</button>
            </form>
        </section>
    `;
}

function setupOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;

    // П.7 — Валідація на відправку
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateOrderForm(form)) {
            showToast('Перевірте поля форми', 'error');
            return;
        }
        submitOrder(form);
    });

    // Прибираємо помилку, як тільки користувач починає редагувати
    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', () => {
            field.closest('.form-group')?.classList.remove('error');
        });
    });
}

function validateOrderForm(form) {
    let valid = true;

    const name    = form.querySelector('#order-name');
    const email   = form.querySelector('#order-email');
    const phone   = form.querySelector('#order-phone');
    const city    = form.querySelector('#order-city');
    const address = form.querySelector('#order-address');

    const setError = (field, isErr) => {
        field.closest('.form-group').classList.toggle('error', isErr);
        if (isErr) valid = false;
    };

    setError(name,    name.value.trim().length < 2);
    setError(email,   !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
    // П.7 — телефон: + (необовʼязково) і 10-13 цифр (підходить +380XXXXXXXXX)
    setError(phone,   !/^\+?\d{10,13}$/.test(phone.value.replace(/[\s()-]/g, '')));
    setError(city,    city.value.trim().length < 2);
    setError(address, address.value.trim().length < 5);

    return valid;
}

function submitOrder(form) {
    // Збираємо дані для підтвердження
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

    // Зберігаємо замовлення в localStorage (історія для майбутнього використання)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push({
        number: orderNumber,
        date: new Date().toISOString(),
        customer: data,
        items: cart,
        total: total
    });
    localStorage.setItem('orders', JSON.stringify(orders));

    // Очищуємо кошик
    cart = [];
    saveCart();

    // П.7 — Виводимо підтвердження після відправки
    const container = document.getElementById('cart-content');
    if (container) {
        container.innerHTML = `
            <div class="order-success">
                <div class="success-icon">✅</div>
                <h2>Замовлення прийнято!</h2>
                <p>Дякуємо, <b>${escapeHtml(data.name)}</b>! Ваше замовлення оформлено.</p>
                <p>Номер замовлення: <span class="order-number">${orderNumber}</span></p>
                <p>Сума до сплати: <b>${formatPrice(total)} грн</b></p>
                <p>Ми звʼяжемось з вами на номер <b>${escapeHtml(data.phone)}</b> найближчим часом.</p>
                <a href="catalog.html" class="btn btn-primary" style="margin-top:1.5rem;">
                    Продовжити покупки
                </a>
            </div>
        `;
    }
    showToast('Замовлення успішно оформлено!', 'success', 3500);
}

// ============================================================
// Мобільне меню
// ============================================================
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('.nav');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => nav.classList.toggle('active'));
    }
}

// ============================================================
// Ініціалізація — визначаємо сторінку та запускаємо потрібний код
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();          // підвантажуємо товари відразу
    updateCartCount();              // П.5 — синхронізуємо бейдж із localStorage
    setupMobileMenu();
    setupLiveSearch();              // живий пошук на головній

    const path = window.location.pathname;

    if (path.includes('catalog.html')) {
        await loadCatalog();
    } else if (path.includes('product.html')) {
        await loadProductDetails();
    } else if (path.includes('cart.html')) {
        await displayCart();
    } else {
        // index.html або корінь
        await displayFeaturedProducts();
        setupCategoryFilters();
    }
});
