document.addEventListener('DOMContentLoaded', function() {

    // =========================================
    // DATABASE - Load from db.json
    // =========================================
    let DB = null;

    async function loadDatabase() {
        try {
            const response = await fetch('db.json');
            DB = await response.json();
            console.log('Database loaded:', DB);
            initDynamicContent();
        } catch (e) {
            console.warn('Could not load db.json, using fallback data');
            DB = getFallbackDB();
            initDynamicContent();
        }
    }

    function getFallbackDB() {
        return {
            routes: [],
            blogPosts: [],
            equipment: [],
            testimonials: [],
            faq: [],
            achievements: [],
            tips: ["Завжди перевіряйте погоду перед виходом"]
        };
    }

    // =========================================
    // LOADING SCREEN
    // =========================================
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hide');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                document.body.style.overflow = '';
            }, 600);
        }, 1800);
    }

    // =========================================
    // PARTICLE BACKGROUND
    // =========================================
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animFrame;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 180, 71, ${this.opacity})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 180, 71, ${0.05 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animFrame = requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // =========================================
    // CUSTOM CURSOR — Disabled for cleaner UX
    // =========================================

    // =========================================
    // HEADER SCROLL EFFECT
    // =========================================
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // =========================================
    // THEME TOGGLE
    // =========================================
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
        });
    }

    function updateThemeIcon(theme) {
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark'
                ? '<i class="fas fa-moon"></i>'
                : '<i class="fas fa-sun"></i>';
        }
    }

    // =========================================
    // SEARCH FUNCTIONALITY
    // =========================================
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => searchInput && searchInput.focus(), 300);
        });

        if (searchClose) searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !searchOverlay.classList.contains('active')) {
                e.preventDefault();
                searchOverlay.classList.add('active');
                setTimeout(() => searchInput && searchInput.focus(), 300);
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', debounce(performSearch, 300));
        }
    }

    function performSearch() {
        if (!DB || !searchInput || !searchResults) return;
        const query = searchInput.value.toLowerCase().trim();
        if (!query) { searchResults.innerHTML = ''; return; }

        let results = [];

        DB.routes.forEach(r => {
            if (r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)) {
                results.push({ title: r.name, type: 'Маршрут', icon: 'fa-route', link: 'routes.html' });
            }
        });

        DB.blogPosts.forEach(b => {
            if (b.title.toLowerCase().includes(query) || b.excerpt.toLowerCase().includes(query)) {
                results.push({ title: b.title, type: 'Блог', icon: 'fa-newspaper', link: 'blog.html' });
            }
        });

        DB.equipment.forEach(e => {
            if (e.name.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)) {
                results.push({ title: e.name, type: 'Спорядження', icon: 'fa-hiking', link: 'equipment.html' });
            }
        });

        searchResults.innerHTML = results.length ? results.slice(0, 6).map(r => `
            <a href="${r.link}" class="search-result-item">
                <div class="result-icon"><i class="fas ${r.icon}"></i></div>
                <div class="result-info">
                    <h4>${r.title}</h4>
                    <span>${r.type}</span>
                </div>
            </a>
        `).join('') : '<p style="padding:20px;color:var(--text-gray);text-align:center;">Нічого не знайдено</p>';
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // =========================================
    // TYPED TEXT EFFECT
    // =========================================
    const typedEl = document.getElementById('typedText');
    if (typedEl) {
        const phrases = [
            'Відкрийте для себе найкращі маршрути Карпат',
            'Знайдіть своє ідеальне спорядження',
            'Приєднуйтесь до спільноти мандрівників',
            'Будьте завжди готові до пригод'
        ];
        let phraseIndex = 0, charIndex = 0, isDeleting = false;

        function typeEffect() {
            const current = phrases[phraseIndex];
            if (isDeleting) {
                typedEl.textContent = current.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typedEl.textContent = current.substring(0, charIndex + 1);
                charIndex++;
            }

            let speed = isDeleting ? 30 : 60;

            if (!isDeleting && charIndex === current.length) {
                speed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                speed = 500;
            }

            setTimeout(typeEffect, speed);
        }
        setTimeout(typeEffect, 1000);
    }

    // =========================================
    // STATS COUNTER
    // =========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length) {
        const animateNumbers = () => {
            statNumbers.forEach(stat => {
                const target = parseInt(stat.dataset.count);
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    stat.textContent = Math.floor(eased * target);
                    if (progress < 1) requestAnimationFrame(update);
                    else stat.textContent = target + '+';
                }
                requestAnimationFrame(update);
            });
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateNumbers();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.stats-bar').forEach(el => statsObserver.observe(el));
    }

    // =========================================
    // DAILY TIP
    // =========================================
    function loadDailyTip() {
        if (!DB) return;
        const tipEl = document.getElementById('dailyTip');
        if (tipEl && DB.tips && DB.tips.length) {
            const randomTip = DB.tips[Math.floor(Math.random() * DB.tips.length)];
            tipEl.textContent = randomTip;
        }
    }

    const refreshTip = document.getElementById('refreshTip');
    if (refreshTip) {
        refreshTip.addEventListener('click', () => {
            refreshTip.style.transform = 'rotate(360deg)';
            setTimeout(() => { refreshTip.style.transform = ''; }, 400);
            loadDailyTip();
        });
    }

    // =========================================
    // WEATHER WIDGET
    // =========================================
    const weatherWidget = document.getElementById('weatherWidget');
    if (weatherWidget) {
        setTimeout(() => weatherWidget.classList.add('visible'), 2500);

        // Simulated weather data for Carpathians
        const weatherData = [
            { temp: '12°C', icon: 'fa-cloud-sun', wind: '15 км/г', humidity: '65%' },
            { temp: '8°C', icon: 'fa-cloud-rain', wind: '20 км/г', humidity: '82%' },
            { temp: '15°C', icon: 'fa-sun', wind: '10 км/г', humidity: '45%' },
            { temp: '5°C', icon: 'fa-snowflake', wind: '25 км/г', humidity: '70%' }
        ];
        const weather = weatherData[Math.floor(Math.random() * weatherData.length)];
        weatherWidget.querySelector('.weather-temp').textContent = weather.temp;
        weatherWidget.querySelector('.weather-icon i').className = `fas ${weather.icon}`;
    }

    // =========================================
    // SWIPER SLIDERS
    // =========================================
    let featuredSwiper, testimonialsSwiper;

    function initSwipers() {
        if (typeof Swiper === 'undefined') return;

        if (document.querySelector('.featuredSwiper')) {
            featuredSwiper = new Swiper('.featuredSwiper', {
                slidesPerView: 1,
                spaceBetween: 25,
                pagination: { el: '.swiper-pagination', clickable: true },
                breakpoints: {
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                },
                autoplay: { delay: 4000, disableOnInteraction: false }
            });
        }

        if (document.querySelector('.testimonialsSwiper')) {
            testimonialsSwiper = new Swiper('.testimonialsSwiper', {
                slidesPerView: 1,
                spaceBetween: 25,
                autoplay: { delay: 5000, disableOnInteraction: false },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 }
                }
            });
        }
    }

    // =========================================
    // DYNAMIC CONTENT FROM DB
    // =========================================
    function initDynamicContent() {
        renderFeaturedRoutes();
        renderTestimonials();
        renderFAQ();
        renderBlogPosts();
        renderEquipment();
        renderRoutes();
        loadDailyTip();
        initSwipers();
        initAchievements();
    }

    function renderFeaturedRoutes() {
        const container = document.getElementById('featuredRoutesContainer');
        if (!container || !DB || !DB.routes) return;

        container.innerHTML = DB.routes.slice(0, 4).map(route => `
            <div class="swiper-slide">
                <div class="featured-card">
                    <img src="${route.image}" alt="${route.name}">
                    <div class="featured-card-content">
                        <span class="difficulty ${route.difficulty}">${getDifficultyLabel(route.difficulty)}</span>
                        <h3>${route.name}</h3>
                        <p>${route.description.substring(0, 60)}...</p>
                        <div class="card-meta">
                            <span><i class="fas fa-clock"></i> ${route.duration}</span>
                            <span><i class="fas fa-road"></i> ${route.distance}</span>
                        </div>
                        <div class="card-rating">
                            <i class="fas fa-star"></i>
                            <span>${route.rating}</span>
                            <span style="color:var(--text-gray);font-size:12px">(${route.reviews})</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderTestimonials() {
        const container = document.getElementById('testimonialsContainer');
        if (!container || !DB || !DB.testimonials) return;

        container.innerHTML = DB.testimonials.map(t => `
            <div class="swiper-slide">
                <div class="testimonial-card">
                    <div class="testimonial-stars">
                        ${'<i class="fas fa-star"></i>'.repeat(t.rating)}
                    </div>
                    <p>"${t.text}"</p>
                    <div class="testimonial-author">
                        <img src="${t.avatar}" alt="${t.name}">
                        <div>
                            <h4>${t.name}</h4>
                            <span>${t.city}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderFAQ() {
        const container = document.getElementById('faqContainer');
        if (!container || !DB || !DB.faq) return;

        container.innerHTML = DB.faq.map(item => `
            <div class="faq-item">
                <div class="faq-question">
                    <span>${item.question}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer">
                    <p>${item.answer}</p>
                </div>
            </div>
        `).join('');

        // Re-attach FAQ events
        container.querySelectorAll('.faq-item').forEach(item => {
            item.querySelector('.faq-question').addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });
    }

    function renderBlogPosts() {
        const container = document.getElementById('blogGrid');
        if (!container || !DB || !DB.blogPosts) return;

        container.innerHTML = DB.blogPosts.map(post => `
            <article class="blog-card" data-post-id="${post.id}">
                <img src="${post.image}" alt="${post.title}" class="blog-image">
                <div class="blog-content">
                    <span class="blog-meta">${formatDate(post.date)} • ${post.readTime} • ${post.category}</span>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <div class="blog-full-content">${post.fullContent || post.content}</div>
                    <div class="blog-footer">
                        <div class="blog-likes" data-post-id="${post.id}">
                            <i class="fas fa-heart"></i> <span>${post.likes}</span>
                        </div>
                        <span class="blog-read-time"><i class="fas fa-clock"></i> ${post.readTime}</span>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <a href="#" class="read-more blog-expand-btn">читати далі →</a>
                        <button class="share-btn" onclick="shareBlogPost('${post.title}')"><i class="fas fa-share-alt"></i> Поділитися</button>
                    </div>
                    <div class="reading-progress"><div class="reading-progress-fill"></div></div>
                </div>
            </article>
        `).join('');

        // Like functionality
        container.querySelectorAll('.blog-likes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.postId;
                const liked = JSON.parse(localStorage.getItem('likedPosts') || '[]');
                const span = btn.querySelector('span');
                if (liked.includes(id)) {
                    liked.splice(liked.indexOf(id), 1);
                    btn.classList.remove('liked');
                    span.textContent = parseInt(span.textContent) - 1;
                } else {
                    liked.push(id);
                    btn.classList.add('liked');
                    span.textContent = parseInt(span.textContent) + 1;
                    showToast('❤️ Вам сподобалася стаття!');
                }
                localStorage.setItem('likedPosts', JSON.stringify(liked));
            });
        });

        // Read More expand functionality
        container.querySelectorAll('.blog-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest('.blog-card');
                const isExpanded = card.classList.toggle('expanded');
                btn.textContent = isExpanded ? '← згорнути' : 'читати далі →';
                // Track reading achievement
                const readPosts = JSON.parse(localStorage.getItem('readBlogPosts') || '[]');
                const postId = card.dataset.postId;
                if (!readPosts.includes(postId) && isExpanded) {
                    readPosts.push(postId);
                    localStorage.setItem('readBlogPosts', JSON.stringify(readPosts));
                    if (readPosts.length >= 3) trackAchievement('bookworm');
                }
            });
        });
    }

    // Share blog post
    window.shareBlogPost = function(title) {
        if (navigator.share) {
            navigator.share({ title: title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Посилання скопійовано!');
            });
        }
    };

    function renderEquipment() {
        const container = document.getElementById('equipmentGrid');
        if (!container || !DB || !DB.equipment) return;

        container.innerHTML = DB.equipment.map(item => {
            const d = item.detailedInfo || {};
            return `
            <div class="equipment-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="equipment-image">
                <h3>${item.name}</h3>
                <span style="color:var(--accent-primary);font-size:12px;font-weight:600">${item.category}</span>
                <p>${item.description}</p>
                <div class="equipment-meta">
                    <span class="equipment-price">${item.priceRange}</span>
                    <span class="equipment-importance ${item.importance}">${getImportanceLabel(item.importance)}</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
                    ${item.brands.map(b => `<span style="background:rgba(255,180,71,0.1);color:var(--accent-primary);padding:2px 10px;border-radius:12px;font-size:11px;border:1px solid rgba(255,180,71,0.2)">${b}</span>`).join('')}
                </div>
                <button class="equipment-toggle-btn"><i class="fas fa-chevron-down"></i> Детальніше</button>
                <div class="equipment-details">
                    <div class="equipment-details-grid">
                        ${d.features ? `<div class="detail-block">
                            <h5><i class="fas fa-list-check"></i> Характеристики</h5>
                            <ul>${d.features.map(f => `<li>${f}</li>`).join('')}</ul>
                        </div>` : ''}
                        ${d.howToChoose ? `<div class="detail-block">
                            <h5><i class="fas fa-hand-pointer"></i> Як обрати</h5>
                            <p>${d.howToChoose}</p>
                        </div>` : ''}
                        ${d.care ? `<div class="detail-block">
                            <h5><i class="fas fa-broom"></i> Догляд</h5>
                            <p>${d.care}</p>
                        </div>` : ''}
                        ${d.lifespan ? `<div class="detail-block">
                            <h5><i class="fas fa-hourglass-half"></i> Термін служби</h5>
                            <p>${d.lifespan}</p>
                        </div>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

        // Toggle equipment details
        container.querySelectorAll('.equipment-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.equipment-item');
                item.classList.toggle('expanded');
                const isExpanded = item.classList.contains('expanded');
                btn.innerHTML = isExpanded
                    ? '<i class="fas fa-chevron-up"></i> Згорнути'
                    : '<i class="fas fa-chevron-down"></i> Детальніше';
            });
        });
    }

    function renderRoutes() {
        const container = document.getElementById('routesGrid');
        if (!container || !DB || !DB.routes) return;

        container.innerHTML = DB.routes.map(route => {
            const d = route.detailedInfo || {};
            return `
            <div class="route-card" data-difficulty="${route.difficulty}" data-route-id="${route.id}">
                <div class="route-image">
                    <img src="${route.image}" alt="${route.name}">
                    <span class="route-difficulty ${route.difficulty}">${getDifficultyLabel(route.difficulty)}</span>
                </div>
                <div class="route-content">
                    <h3>${route.name}</h3>
                    <div class="route-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${route.location}</span>
                        <span><i class="fas fa-clock"></i> ${route.duration}</span>
                        <span><i class="fas fa-road"></i> ${route.distance}</span>
                        <span><i class="fas fa-mountain"></i> ${route.elevation}</span>
                    </div>
                    <p>${route.description}</p>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
                        ${route.highlights.map(h => `<span style="background:rgba(255,180,71,0.1);color:var(--accent-primary);padding:3px 10px;border-radius:12px;font-size:11px;border:1px solid rgba(255,180,71,0.2)">${h}</span>`).join('')}
                    </div>
                    <div class="card-rating" style="margin-bottom:12px">
                        <i class="fas fa-star"></i>
                        <span>${route.rating}</span>
                        <span style="color:var(--text-gray);font-size:12px">(${route.reviews} відгуків)</span>
                    </div>
                    <a href="#" class="read-more route-details route-expand-btn" data-route="${route.id}">Детальніше →</a>

                    <div class="route-expanded-details">
                        ${d.fullDescription ? `<div class="route-detail-section">
                            <h4><i class="fas fa-info-circle"></i> Повний опис</h4>
                            <p>${d.fullDescription}</p>
                        </div>` : ''}

                        <div class="route-info-grid">
                            ${d.startPoint ? `<div class="route-info-item">
                                <i class="fas fa-flag"></i>
                                <span>Старт</span>
                                <strong>${d.startPoint}</strong>
                            </div>` : ''}
                            <div class="route-info-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Сезон</span>
                                <strong>${route.bestSeason}</strong>
                            </div>
                            ${d.terrain ? `<div class="route-info-item">
                                <i class="fas fa-layer-group"></i>
                                <span>Рельєф</span>
                                <strong>${d.terrain}</strong>
                            </div>` : ''}
                            ${d.coordinates ? `<div class="route-info-item">
                                <i class="fas fa-map-pin"></i>
                                <span>Координати</span>
                                <strong style="font-size:11px">${d.coordinates}</strong>
                            </div>` : ''}
                        </div>

                        ${d.whatToBring ? `<div class="route-detail-section">
                            <h4><i class="fas fa-backpack"></i> Що взяти з собою</h4>
                            <ul>${d.whatToBring.map(i => `<li>${i}</li>`).join('')}</ul>
                        </div>` : ''}

                        ${d.wildlife ? `<div class="route-detail-section">
                            <h4><i class="fas fa-paw"></i> Флора і фауна</h4>
                            <ul>${d.wildlife.map(w => `<li>${w}</li>`).join('')}</ul>
                        </div>` : ''}

                        ${d.tips ? `<div class="route-detail-section">
                            <h4><i class="fas fa-lightbulb"></i> Поради</h4>
                            <p>${d.tips}</p>
                        </div>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

        // Route expand functionality
        container.querySelectorAll('.route-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest('.route-card');
                const isExpanded = card.classList.toggle('expanded');
                btn.textContent = isExpanded ? '← Згорнути' : 'Детальніше →';
            });
        });

        // Route filter
        initRouteFilter();
    }

    function getDifficultyLabel(d) {
        return { easy: 'Легкий', medium: 'Середній', hard: 'Складний' }[d] || d;
    }

    function getImportanceLabel(i) {
        return { critical: 'Критичне', high: 'Важливе', medium: 'Корисне' }[i] || i;
    }

    function formatDate(dateStr) {
        const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня',
                       'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    // =========================================
    // ROUTE FILTER
    // =========================================
    function initRouteFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const routeCards = document.querySelectorAll('.route-card');

        if (!filterBtns.length || !routeCards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;

                routeCards.forEach(card => {
                    if (filter === 'all' || card.dataset.difficulty === filter) {
                        card.style.display = 'block';
                        card.style.animation = 'fadeInUp 0.4s ease forwards';
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Track achievement
                trackAchievement('explorer');
            });
        });
    }

    // =========================================
    // TO TOP BUTTON WITH PROGRESS
    // =========================================
    const toTopBtn = document.getElementById('toTopBtn');
    if (toTopBtn) {
        const progressCircle = toTopBtn.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 22;

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollTop / docHeight;

            toTopBtn.classList.toggle('active', scrollTop > 300);

            if (progressCircle) {
                progressCircle.style.strokeDashoffset = circumference * (1 - scrollPercent);
            }
        });

        toTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================
    // MOBILE MENU
    // =========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        function closeMobileMenu() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') &&
                !mobileMenu.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }

    // =========================================
    // AUTH SYSTEM
    // =========================================
    let currentUser = localStorage.getItem('currentUser');

    function showToast(message, isError = false) {
        const toast = document.getElementById('toastMessage');
        if (toast) {
            toast.textContent = message;
            toast.style.background = isError
                ? 'rgba(244, 67, 54, 0.9)'
                : 'linear-gradient(135deg, rgba(255, 180, 71, 0.95), rgba(255, 140, 0, 0.95))';
            toast.style.color = isError ? '#fff' : '#1a1f2e';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }
    }

    function updateAuthButton() {
        const accountBtn = document.getElementById('accountBtn');
        if (accountBtn) {
            if (currentUser) {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === currentUser);
                accountBtn.innerHTML = `<i class="fas fa-user-astronaut"></i><span>${user ? user.username : 'Профіль'}</span>`;
            } else {
                accountBtn.innerHTML = `<i class="fas fa-user-astronaut"></i><span>Акаунт</span>`;
            }
        }
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Registration
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (!username || !email || !password || !confirmPassword) {
                showToast('Будь ласка, заповніть всі поля!', true);
                return;
            }
            if (password.length < 6) {
                showToast('Пароль повинен містити не менше 6 символів!', true);
                return;
            }
            if (password !== confirmPassword) {
                showToast('Паролі не співпадають!', true);
                return;
            }

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === email)) {
                showToast('Користувач з таким email вже існує!', true);
                return;
            }

            users.push({ username, email, password, registeredAt: new Date().toISOString(), xp: 50 });
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', email);
            currentUser = email;

            // Confetti celebration!
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ffb347', '#ff8c00', '#667eea', '#764ba2']
                });
            }

            showToast(`Вітаємо, ${username}! Реєстрація пройшла успішно.`);
            closeAllModals();
            regForm.reset();
            updateAuthButton();
            trackAchievement('registered');
        });
    }

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('currentUser', email);
                currentUser = email;
                showToast(`Ласкаво просимо назад, ${user.username}!`);
                closeAllModals();
                loginForm.reset();
                updateAuthButton();
            } else {
                showToast('Невірний email або пароль!', true);
            }
        });
    }

    // Profile
    function showProfile() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === currentUser);
        if (!user) return;

        document.getElementById('profileName').textContent = user.username;
        const xp = user.xp || 0;
        const maxXp = 200;
        document.getElementById('xpFill').style.width = Math.min(100, (xp / maxXp) * 100) + '%';
        document.getElementById('xpText').textContent = `${xp} / ${maxXp} XP`;

        const visits = parseInt(localStorage.getItem('visitCount') || '0');
        document.getElementById('profileVisits').textContent = visits;
        document.getElementById('profileBookmarks').textContent = JSON.parse(localStorage.getItem('bookmarks') || '[]').length;
        document.getElementById('profileComments').textContent = JSON.parse(localStorage.getItem('userComments') || '[]').length;

        // Render achievements
        const achievementsEl = document.getElementById('profileAchievements');
        const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (achievementsEl && DB && DB.achievements) {
            achievementsEl.innerHTML = DB.achievements.map(a => `
                <div class="profile-achievement ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}" title="${a.name}: ${a.description}">
                    <i class="fas ${a.icon}"></i>
                </div>
            `).join('');
        }

        openModal('profileModal');
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateAuthButton();
            closeAllModals();
            showToast('Ви вийшли з акаунту');
        });
    }

    const accountBtn = document.getElementById('accountBtn');
    if (accountBtn) {
        accountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                showProfile();
            } else {
                openModal('registrationModal');
            }
        });
    }

    // Modal switches
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    if (showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); closeAllModals(); openModal('loginModal'); });
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); closeAllModals(); openModal('registrationModal'); });

    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeAllModals));
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.addEventListener('click', closeAllModals);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeAllModals(); if (searchOverlay) searchOverlay.classList.remove('active'); }
    });

    updateAuthButton();

    // =========================================
    // ACHIEVEMENTS SYSTEM
    // =========================================
    function initAchievements() {
        // Track first visit
        if (!localStorage.getItem('hasVisited')) {
            localStorage.setItem('hasVisited', 'true');
            trackAchievement('first_visit');
        }

        // Track visit count
        let visits = parseInt(localStorage.getItem('visitCount') || '0');
        localStorage.setItem('visitCount', String(visits + 1));

        // Night owl achievement
        const hour = new Date().getHours();
        if (hour >= 23 || hour < 5) {
            trackAchievement('night_owl');
        }
    }

    function trackAchievement(id) {
        const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (unlocked.includes(id)) return;

        unlocked.push(id);
        localStorage.setItem('achievements', JSON.stringify(unlocked));

        if (DB && DB.achievements) {
            const achievement = DB.achievements.find(a => a.id === id);
            if (achievement) {
                showAchievementPopup(achievement);
                // Add XP
                if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const user = users.find(u => u.email === currentUser);
                    if (user) {
                        user.xp = (user.xp || 0) + achievement.xp;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }
            }
        }
    }

    function showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        const nameEl = document.getElementById('achievementName');
        if (popup && nameEl) {
            nameEl.textContent = achievement.name;
            popup.classList.add('show');
            setTimeout(() => popup.classList.remove('show'), 4000);
        }
    }

    // Make trackAchievement available globally
    window.trackAchievement = trackAchievement;

    // =========================================
    // NEWSLETTER
    // =========================================
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            if (email) {
                showToast('Дякуємо за підписку! Ви будете отримувати найкращі поради.');
                newsletterForm.reset();
                trackAchievement('subscriber');

                if (typeof confetti !== 'undefined') {
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
                }
            }
        });
    }

    // =========================================
    // CONTACT FORM
    // =========================================
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName')?.value;
            if (name) {
                // Save to localStorage as "messages DB"
                const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
                messages.push({
                    name,
                    email: document.getElementById('contactEmail')?.value,
                    subject: document.getElementById('contactSubject')?.value,
                    message: document.getElementById('contactMessage')?.value,
                    date: new Date().toISOString()
                });
                localStorage.setItem('contactMessages', JSON.stringify(messages));
                showToast(`Дякуємо, ${name}! Ваше повідомлення надіслано.`);
                contactForm.reset();
            }
        });
    }

    // =========================================
    // COMMENTS SYSTEM
    // =========================================
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = commentForm.querySelector('input');
            const text = input.value.trim();
            if (!text) return;

            const username = currentUser
                ? (JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === currentUser)?.username || 'Анонім')
                : 'Анонім';

            const comments = JSON.parse(localStorage.getItem('userComments') || '[]');
            comments.push({ username, text, date: new Date().toISOString() });
            localStorage.setItem('userComments', JSON.stringify(comments));

            input.value = '';
            renderComments();
            showToast('Коментар додано!');
            trackAchievement('social');
        });
    }

    function renderComments() {
        const list = document.querySelector('.comments-list');
        if (!list) return;
        const comments = JSON.parse(localStorage.getItem('userComments') || '[]');
        list.innerHTML = comments.slice(-10).reverse().map(c => `
            <div class="comment-item">
                <div class="comment-avatar">${c.username.charAt(0).toUpperCase()}</div>
                <div class="comment-body">
                    <h4>${c.username}</h4>
                    <p>${c.text}</p>
                    <time>${new Date(c.date).toLocaleDateString('uk-UA')}</time>
                </div>
            </div>
        `).join('');
    }
    renderComments();

    // =========================================
    // SCROLL ANIMATIONS
    // =========================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.get-started .text-column, .get-started .image-column, .featured-card, .testimonial-card, .route-card, .blog-card, .equipment-item, .contact-card')
        .forEach(el => revealObserver.observe(el));

    // =========================================
    // SCROLL BUTTON
    // =========================================
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector('.stats-bar') || document.querySelector('.get-started');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // =========================================
    // PARALLAX EFFECT
    // =========================================
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const bgLayers = document.querySelectorAll('.background-layer');
                bgLayers.forEach((layer, index) => {
                    const speed = 0.15 + index * 0.08;
                    layer.style.transform = `translateY(${scrolled * speed}px)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    });

    // =========================================
    // TILT EFFECT ON IMAGES
    // =========================================
    document.querySelectorAll('[data-tilt]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
            el.style.transition = 'transform 0.5s ease';
        });
        el.addEventListener('mouseenter', () => {
            el.style.transition = 'none';
        });
    });

    // =========================================
    // ACTIVE NAV LINK
    // =========================================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a, .mobile-menu ul li a').forEach(link => {
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
        else link.classList.remove('active');
    });

    // =========================================
    // KONAMI CODE EASTER EGG
    // =========================================
    let konamiIndex = 0;
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                konamiIndex = 0;
                document.body.style.animation = 'rainbow 2s linear';
                showToast('You found the secret! Konami Code activated!');
                if (typeof confetti !== 'undefined') {
                    confetti({ particleCount: 300, spread: 120, origin: { y: 0.5 } });
                }
                setTimeout(() => { document.body.style.animation = ''; }, 2000);
            }
        } else {
            konamiIndex = 0;
        }
    });

    // =========================================
    // SCROLL PROGRESS BAR
    // =========================================
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    document.body.appendChild(scrollProgress);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    });

    // =========================================
    // KEYBOARD SHORTCUTS HELP (Press ?)
    // =========================================
    const keyboardHelp = document.createElement('div');
    keyboardHelp.className = 'keyboard-help';
    keyboardHelp.innerHTML = `
        <h4><i class="fas fa-keyboard"></i> Гарячі клавіші</h4>
        <div class="shortcut-row"><kbd>/</kbd><span>Пошук</span></div>
        <div class="shortcut-row"><kbd>?</kbd><span>Ця довідка</span></div>
        <div class="shortcut-row"><kbd>T</kbd><span>Змінити тему</span></div>
        <div class="shortcut-row"><kbd>Home</kbd><span>На початок</span></div>
        <div class="shortcut-row"><kbd>Esc</kbd><span>Закрити</span></div>
    `;
    document.body.appendChild(keyboardHelp);

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '?') {
            keyboardHelp.classList.toggle('visible');
        }
        if (e.key === 't' || e.key === 'T') {
            if (themeToggle) themeToggle.click();
        }
        if (e.key === 'Home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // =========================================
    // SMOOTH PAGE TRANSITIONS (internal links)
    // =========================================
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.25s ease';
                setTimeout(() => { window.location.href = href; }, 250);
            }
        });
    });

    // Fade in on page load
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity = '1';
    });

    // =========================================
    // LAZY IMAGE LOADING WITH ANIMATION
    // =========================================
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'scale(1)';
                    imgObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('img').forEach(img => {
            img.style.opacity = '0';
            img.style.transform = 'scale(0.95)';
            img.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            if (img.complete) {
                img.style.opacity = '1';
                img.style.transform = 'scale(1)';
            } else {
                imgObserver.observe(img);
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                    img.style.transform = 'scale(1)';
                });
            }
        });
    }

    // =========================================
    // LOAD DATABASE & INITIALIZE
    // =========================================
    loadDatabase();

    console.log('%c⛰️ MNTN Enhanced v3.0', 'font-size:20px;color:#ffb347;font-weight:bold;');
    console.log('%cPress "/" for search, "?" for shortcuts, Konami Code for a surprise!', 'color:#667eea;');
});
