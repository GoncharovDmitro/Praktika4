

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];



// ============================================
// Допоміжні функції
// ============================================

function getCategoryIcon(category) {
    const icons = {
        'CPU': '⚡',
        'GPU': '🎮',
        'RAM': '💾',
        'накопичувачі': '💿'
    };
    return icons[category] || '📦';
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

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image
        });
    }
    
    saveCart();
    alert(`Товар "${product.name}" додано до кошика!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    }
}

async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('JSON не завантажено');
        const data = await response.json();
        products = data.products;
    } catch (error) {
        console.log('Використовую резервні дані товарів');
        products = defaultProducts;
    }
    return products;
}

// ============================================
// Функції для головної сторінки (index.html)
// ============================================

async function displayFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    await loadProducts();
    const featured = products.slice(0, 8);
    
    container.innerHTML = featured.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${getCategoryIcon(product.category)}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-category">${getCategoryName(product.category)}</p>
                <div class="product-price">${product.price.toLocaleString()} грн</div>
                <div class="product-stock">
                    ${product.inStock ? '<span class="in-stock">✓ В наявності</span>' : '<span class="out-stock">✗ Немає в наявності</span>'}
                </div>
                <button onclick="addToCart(${product.id})" class="btn-add-to-cart" ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Додати в кошик' : 'Немає в наявності'}
                </button>
                <a href="product.html?id=${product.id}" style="display: block; text-align: center; margin-top: 10px; color: #2563eb; text-decoration: none;">Детальніше →</a>
            </div>
        </div>
    `).join('');
}

function setupCategoryFilters() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            localStorage.setItem('selectedCategory', category);
            window.location.href = 'catalog.html';
        });
    });
}

// ============================================
// Функції для сторінки каталогу (catalog.html)
// ============================================

let currentProducts = [];
let filteredProducts = [];

async function loadCatalog() {
    await loadProducts();
    currentProducts = [...products];
    filteredProducts = [...currentProducts];
    
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        const categoryCheckboxes = document.querySelectorAll('.category-filter');
        categoryCheckboxes.forEach(cb => {
            if (cb.value === savedCategory) {
                cb.checked = true;
            }
        });
        localStorage.removeItem('selectedCategory');
    }
    
    applyFiltersAndRender();
    setupCatalogEventListeners();
}

function applyFiltersAndRender() {
    let results = [...currentProducts];
    
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);
    if (selectedCategories.length > 0) {
        results = results.filter(product => selectedCategories.includes(product.category));
    }
    
    const minPrice = document.getElementById('min-price')?.value;
    const maxPrice = document.getElementById('max-price')?.value;
    
    if (minPrice) {
        results = results.filter(product => product.price >= parseInt(minPrice));
    }
    if (maxPrice) {
        results = results.filter(product => product.price <= parseInt(maxPrice));
    }
    
    const inStockOnly = document.getElementById('in-stock-only')?.checked;
    if (inStockOnly) {
        results = results.filter(product => product.inStock);
    }
    
    const sortBy = document.getElementById('sort-by')?.value;
    switch(sortBy) {
        case 'price-asc':
            results.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            results.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            results.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            results.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }
    
    filteredProducts = results;
    renderCatalogProducts();
    updateResultsCount();
}

function renderCatalogProducts() {
    const container = document.getElementById('catalog-products');
    if (!container) return;
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="empty-cart" style="text-align: center; padding: 60px;"><p>Товарів не знайдено</p></div>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${getCategoryIcon(product.category)}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-category">${getCategoryName(product.category)}</p>
                <div class="product-price">${product.price.toLocaleString()} грн</div>
                <div class="product-stock">
                    ${product.inStock ? '<span class="in-stock">✓ В наявності</span>' : '<span class="out-stock">✗ Немає в наявності</span>'}
                </div>
                <button onclick="addToCart(${product.id})" class="btn-add-to-cart" ${!product.inStock ? 'disabled' : ''}>
                    ${product.inStock ? 'Додати в кошик' : 'Немає в наявності'}
                </button>
                <a href="product.html?id=${product.id}" style="display: block; text-align: center; margin-top: 10px; color: #2563eb; text-decoration: none;">Детальніше →</a>
            </div>
        </div>
    `).join('');
}

function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `Знайдено товарів: ${filteredProducts.length}`;
    }
}

function clearFilters() {
    document.querySelectorAll('.category-filter:checked').forEach(cb => cb.checked = false);
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');
    const inStockOnly = document.getElementById('in-stock-only');
    const sortBy = document.getElementById('sort-by');
    
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (inStockOnly) inStockOnly.checked = false;
    if (sortBy) sortBy.value = 'default';
    
    applyFiltersAndRender();
}

function setupCatalogEventListeners() {
    const filters = document.querySelectorAll('.category-filter, #in-stock-only');
    filters.forEach(filter => {
        filter.addEventListener('change', applyFiltersAndRender);
    });
    
    const applyPriceBtn = document.getElementById('apply-price');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', applyFiltersAndRender);
    }
    
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
    
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFiltersAndRender);
    }
}

// ============================================
// Функції для сторінки товару (product.html)
// ============================================

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        window.location.href = 'catalog.html';
        return;
    }
    
    await loadProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        const container = document.getElementById('product-details');
        if (container) {
            container.innerHTML = '<div class="container" style="text-align: center; padding: 60px;"><h2>Товар не знайдено</h2><a href="catalog.html" class="btn btn-primary">Повернутися до каталогу</a></div>';
        }
        return;
    }
    
    displayProductDetails(product);
}

function displayProductDetails(product) {
    const container = document.getElementById('product-details');
    if (!container) return;
    
    let currentQuantity = 1;
    
    container.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                ${getCategoryIcon(product.category)}
            </div>
            <div class="product-detail-info">
                <h1>${product.name}</h1>
                <p class="product-category">${getCategoryName(product.category)}</p>
                <div class="product-detail-price">${product.price.toLocaleString()} грн</div>
                <div class="product-stock" style="margin: 1rem 0;">
                    ${product.inStock ? '<span class="in-stock" style="font-size: 1.1rem;">✓ В наявності</span>' : '<span class="out-stock" style="font-size: 1.1rem;">✗ Немає в наявності</span>'}
                </div>
                <div class="product-detail-description">
                    <h3>Опис</h3>
                    <p>${product.description}</p>
                </div>
                ${product.inStock ? `
                    <div class="quantity-selector">
                        <button class="quantity-btn" id="decrease-qty">-</button>
                        <input type="number" id="quantity" class="quantity-input" value="1" min="1" max="10">
                        <button class="quantity-btn" id="increase-qty">+</button>
                    </div>
                    <button id="add-to-cart-btn" class="btn btn-primary" style="width: 100%;">Додати в кошик</button>
                ` : ''}
                <a href="catalog.html" style="display: block; text-align: center; margin-top: 1rem;">← Повернутися до каталогу</a>
            </div>
        </div>
    `;
    
    if (product.inStock) {
        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const quantityInput = document.getElementById('quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                if (quantityInput.value > 1) {
                    quantityInput.value = parseInt(quantityInput.value) - 1;
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (quantityInput.value < 10) {
                    quantityInput.value = parseInt(quantityInput.value) + 1;
                }
            });
        }
        
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const qty = parseInt(quantityInput.value);
                addToCart(product.id, qty);
            });
        }
    }
}

// ============================================
// Функції для сторінки кошика (cart.html)
// ============================================

async function displayCart() {
    const container = document.getElementById('cart-content');
    if (!container) return;
    
    await loadProducts();
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 60px; background: #f9fafb; border-radius: 10px;">
                <h2>Ваш кошик порожній</h2>
                <p>Додайте товари до кошика, щоб оформити замовлення</p>
                <a href="catalog.html" class="btn btn-primary" style="margin-top: 1rem;">Перейти до каталогу</a>
            </div>
        `;
        return;
    }
    
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cart-content');
    if (!container) return;
    
    let total = 0;
    
    const cartItemsHtml = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${getCategoryIcon(product?.category || '')}
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${item.price.toLocaleString()} грн</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="quantity-btn">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="quantity-btn">+</button>
                </div>
                <button onclick="removeFromCart(${item.id})" class="btn-filter" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">Видалити</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="cart-container">
            <div class="cart-items">
                ${cartItemsHtml}
            </div>
            <div class="cart-summary">
                <h3>Сума замовлення</h3>
                <div class="summary-row">
                    <span>Товарів:</span>
                    <span>${cart.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Всього:</span>
                    <span>${total.toLocaleString()} грн</span>
                </div>
                <button onclick="checkout()" class="btn-checkout">Оформити замовлення</button>
                <a href="catalog.html" style="display: block; text-align: center; margin-top: 1rem;">← Продовжити покупки</a>
            </div>
        </div>
    `;
}

function checkout() {
    if (cart.length === 0) {
        alert('Ваш кошик порожній!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsList = cart.map(item => `${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()} грн`).join('\n');
    const message = `Нове замовлення!\n\nТовари:\n${itemsList}\n\nЗагальна сума: ${total.toLocaleString()} грн\n\nДякуємо за покупку!`;
    
    alert(message);
    cart = [];
    saveCart();
    displayCart();
    updateCartCount();
}

// ============================================
// Загальні функції для всіх сторінок
// ============================================

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// ============================================
// Ініціалізація в залежності від сторінки
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Оновлюємо лічильник кошика на всіх сторінках
    updateCartCount();
    
    // Налаштовуємо мобільне меню
    setupMobileMenu();
    
    // Визначаємо, яка сторінка відкрита, і запускаємо відповідну функцію
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
        await displayFeaturedProducts();
        setupCategoryFilters();
    }
    
    if (currentPage.includes('catalog.html')) {
        await loadCatalog();
    }
    
    if (currentPage.includes('product.html')) {
        await loadProductDetails();
    }
    
    if (currentPage.includes('cart.html')) {
        await displayCart();
    }
    
    // Додаємо стилі для кошика, якщо їх немає
    const style = document.createElement('style');
    style.textContent = `
        .cart-container {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 2rem;
            margin-bottom: 60px;
        }
        .cart-items {
            background: white;
            border-radius: 10px;
        }
        .cart-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 1rem;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        .cart-item-image {
            width: 80px;
            height: 80px;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            border-radius: 5px;
        }
        .cart-item-info h4 {
            margin-bottom: 0.5rem;
        }
        .cart-item-price {
            color: #2563eb;
            font-weight: 600;
        }
        .cart-item-quantity {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .cart-summary {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 10px;
            height: fit-content;
            position: sticky;
            top: 100px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 1rem 0;
            padding: 0.5rem 0;
        }
        .summary-total {
            font-size: 1.2rem;
            font-weight: 700;
            border-top: 1px solid #d1d5db;
        }
        .btn-checkout {
            width: 100%;
            padding: 15px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
        }
        .quantity-btn {
            padding: 5px 10px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            cursor: pointer;
            border-radius: 5px;
        }
        @media (max-width: 768px) {
            .cart-container {
                grid-template-columns: 1fr;
            }
            .cart-item {
                grid-template-columns: auto 1fr auto;
                flex-wrap: wrap;
            }
            .cart-item button:last-child {
                grid-column: 1 / -1;
            }
        }
    `;
    document.head.appendChild(style);
});