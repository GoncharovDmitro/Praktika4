// ========== DOM CONTENT LOADED ==========
document.addEventListener('DOMContentLoaded', async function() {

    // ========== LOAD DATABASE ==========
    await FrispesDB.load();

    // ========== PRELOADER ==========
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hidden'), 1800);
    }

    // ========== CURSOR GLOW ==========
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
            cursorGlow.classList.add('active');
        });
        document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
    }

    // ========== HEADER SCROLL EFFECT ==========
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ========== TO TOP BUTTON ==========
    const toTopBtn = document.getElementById('toTopBtn');
    if (toTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                toTopBtn.classList.add('show');
            } else {
                toTopBtn.classList.remove('show');
            }
        });
        toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // ========== DARK THEME TOGGLE ==========
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('frispes_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('frispes_theme', next);
            themeToggle.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            showToast(next === 'dark' ? 'Темна тема активована' : 'Світла тема активована', '', 'info');
        });
    }

    // ========== SCROLL ANIMATIONS ==========
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // ========== ANIMATED COUNTERS ==========
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        }
        requestAnimationFrame(update);
    }

    // ========== TYPING EFFECT ==========
    const typingEl = document.getElementById('typingText');
    if (typingEl) {
        const words = ['інновацій', 'стартапів', 'ідей', 'мрій', 'проєктів'];
        let wordIdx = 0, charIdx = 0, deleting = false;
        function typeEffect() {
            const word = words[wordIdx];
            if (deleting) {
                typingEl.textContent = word.substring(0, charIdx--);
                if (charIdx < 0) {
                    deleting = false;
                    wordIdx = (wordIdx + 1) % words.length;
                    setTimeout(typeEffect, 400);
                    return;
                }
            } else {
                typingEl.textContent = word.substring(0, charIdx++);
                if (charIdx > word.length) {
                    deleting = true;
                    setTimeout(typeEffect, 2000);
                    return;
                }
            }
            setTimeout(typeEffect, deleting ? 50 : 100);
        }
        typeEffect();
    }

    // ========== PARTICLE ANIMATION ==========
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        function resizeCanvas() {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
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
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
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
                ctx.fillStyle = `rgba(255, 107, 53, ${this.opacity})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) particles.push(new Particle());

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 107, 53, ${0.1 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // ========== TOAST NOTIFICATION SYSTEM ==========
    window.showToast = function(title, message, type = 'success', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => removeToast(toast));

        setTimeout(() => removeToast(toast), duration);
    };

    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    // ========== CONFETTI EFFECT ==========
    window.launchConfetti = function() {
        const colors = ['#FF6B35', '#FFD93D', '#00C2BA', '#667eea', '#764ba2', '#10B981'];
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.top = '-10px';
            piece.style.width = Math.random() * 10 + 5 + 'px';
            piece.style.height = Math.random() * 10 + 5 + 'px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            piece.style.animationDuration = Math.random() * 2 + 1.5 + 's';
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    };

    // ========== MODAL MANAGEMENT ==========
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) { modal.classList.remove('show'); document.body.style.overflow = ''; }
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // ========== MOBILE MENU ==========
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');

    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', () => mobileMenuOverlay.classList.add('show'));
        if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => mobileMenuOverlay.classList.remove('show'));
        mobileMenuOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenuOverlay.classList.remove('show'));
        });
    }

    // Mobile auth buttons
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => { mobileMenuOverlay.classList.remove('show'); openModal('authModal'); });
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', () => { mobileMenuOverlay.classList.remove('show'); openModal('authModal'); });

    // ========== SEARCH ==========
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('show');
            setTimeout(() => searchInput.focus(), 300);
        });
        searchClose.addEventListener('click', () => searchOverlay.classList.remove('show'));
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) searchOverlay.classList.remove('show');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (query.length < 2) { searchResults.innerHTML = ''; return; }
            const results = FrispesDB.searchAll(query);
            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item"><div class="result-info"><h4>Нічого не знайдено</h4><small>Спробуйте інший запит</small></div></div>';
                return;
            }
            const icons = { space: 'fa-building', event: 'fa-calendar', service: 'fa-concierge-bell' };
            const links = { space: 'workspace.html', event: 'events.html', service: 'services.html' };
            searchResults.innerHTML = results.map(r => `
                <a href="${links[r.type]}" class="search-result-item" style="text-decoration:none;color:inherit;">
                    <div class="result-icon"><i class="fas ${icons[r.type]}"></i></div>
                    <div class="result-info">
                        <h4>${r.item.name || r.item.title}</h4>
                        <small>${r.type === 'space' ? 'Простір' : r.type === 'event' ? 'Подія' : 'Послуга'}</small>
                    </div>
                </a>
            `).join('');
        });
    }

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchOverlay) {
                searchOverlay.classList.add('show');
                setTimeout(() => searchInput.focus(), 300);
            }
        }
        if (e.key === 'Escape' && searchOverlay) {
            searchOverlay.classList.remove('show');
        }
    });

    // ========== AUTH MODAL ==========
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('authModal'));
    if (signupBtn) signupBtn.addEventListener('click', () => openModal('authModal'));

    const loginContainer = document.getElementById('loginFormContainer');
    const regContainer = document.getElementById('regFormContainer');
    const switchToReg = document.getElementById('switchToReg');
    const switchToLogin = document.getElementById('switchToLogin');

    if (switchToReg) {
        switchToReg.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            regContainer.classList.remove('hidden');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.remove('hidden');
            regContainer.classList.add('hidden');
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const result = FrispesDB.loginUser(email, password);
            if (result.success) {
                showToast('Ласкаво просимо!', `Вхід виконано, ${result.user.name}`, 'success');
                launchConfetti();
                setTimeout(() => { closeModal('authModal'); location.reload(); }, 1500);
            } else {
                showToast('Помилка входу', result.message, 'error');
            }
        });
    }

    // Registration form
    const regForm = document.getElementById('regForm');

    if (regForm) {
        regForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regPasswordConfirm').value;

            if (password !== confirm) {
                showToast('Помилка', 'Паролі не співпадають!', 'error');
                return;
            }
            if (password.length < 6) {
                showToast('Помилка', 'Пароль повинен містити мінімум 6 символів', 'error');
                return;
            }

            const result = FrispesDB.addUser(email, name, password);
            if (result.success) {
                FrispesDB.loginUser(email, password);
                showToast('Вітаємо!', 'Реєстрація успішна!', 'success');
                launchConfetti();
                setTimeout(() => { closeModal('authModal'); location.reload(); }, 1500);
            } else {
                showToast('Помилка', result.message, 'error');
            }
        });
    }

    // Update auth UI
    function updateAuthUI() {
        const currentUser = FrispesDB.getCurrentUser();
        const authButtons = document.querySelector('.auth-buttons');

        if (currentUser && authButtons) {
            authButtons.innerHTML = `
                <div class="user-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${currentUser.name}</span>
                </div>
                <button class="btn-logout" id="logoutBtn">Вийти</button>
            `;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    FrispesDB.logoutUser();
                    showToast('До побачення!', 'Ви вийшли з акаунту', 'info');
                    setTimeout(() => location.reload(), 1000);
                });
            }
        }
    }
    updateAuthUI();

    // ========== BOOKING MODAL ==========
    const openBookingBtn = document.getElementById('openBookingModal');
    const exploreSpaceBtn = document.getElementById('exploreSpaceBtn');

    if (openBookingBtn) openBookingBtn.addEventListener('click', () => openModal('bookingModal'));
    if (exploreSpaceBtn) exploreSpaceBtn.addEventListener('click', () => { window.location.href = 'workspace.html'; });

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const booking = {
                type: document.getElementById('bookingType').value,
                start: document.getElementById('bookingStart').value,
                end: document.getElementById('bookingEnd').value,
                persons: document.getElementById('bookingPersons').value,
                name: document.getElementById('bookingName').value,
                phone: document.getElementById('bookingPhone').value,
                email: document.getElementById('bookingEmail').value,
            };

            FrispesDB.addBooking(booking);
            showToast('Бронювання підтверджено!', `Дякуємо, ${booking.name}! Ми зателефонуємо вам.`, 'success');
            launchConfetti();
            bookingForm.reset();
            setTimeout(() => closeModal('bookingModal'), 2000);
        });
    }

    // ========== VIRTUAL TOUR ==========
    const virtualTourBtn = document.getElementById('virtualTourBtn');
    if (virtualTourBtn) {
        virtualTourBtn.addEventListener('click', function() {
            openModal('videoModal');
            const videoPlaceholder = document.getElementById('videoPlaceholder');
            const virtualVideo = document.getElementById('virtualVideo');
            if (videoPlaceholder) videoPlaceholder.style.display = 'block';
            if (virtualVideo) virtualVideo.style.display = 'none';
        });
    }

    // ========== FOOTER SIGNUP ==========
    const footerSignupBtn = document.getElementById('footerSignupBtn');
    if (footerSignupBtn) footerSignupBtn.addEventListener('click', () => openModal('authModal'));

    // ========== POPULATE SPACES FROM DB ==========
    const spacesGrid = document.getElementById('spacesGrid');
    if (spacesGrid) {
        const spaces = FrispesDB.getSpaces().slice(0, 3);
        spacesGrid.innerHTML = spaces.map(space => `
            <div class="space-card animate-on-scroll">
                <div style="overflow:hidden;border-radius:1.5rem 1.5rem 0 0;">
                    <img src="${space.image}" alt="${space.name}">
                </div>
                <div class="space-card-overlay">
                    <span class="space-card-badge">${space.available} вільних</span>
                    <button class="favorite-btn ${FrispesDB.isFavorite(space.id) ? 'active' : ''}" data-id="${space.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="space-card-content">
                    <h3>${space.name}</h3>
                    <p>${space.description}</p>
                    <div class="space-card-footer">
                        <span class="space-price">від ${space.price}₴/${space.priceUnit}</span>
                        <div class="space-rating">
                            <i class="fas fa-star"></i> ${space.rating}
                            <span>(${space.reviews_count})</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-observe new elements
        spacesGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

        // Favorite buttons
        spacesGrid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                FrispesDB.toggleFavorite(id);
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    showToast('Додано до обраного', '', 'success');
                } else {
                    showToast('Видалено з обраного', '', 'info');
                }
            });
        });
    }

    // ========== POPULATE FACILITIES FROM DB ==========
    const facilitiesGrid = document.getElementById('facilitiesGrid');
    if (facilitiesGrid) {
        const facilities = FrispesDB.getFacilities();
        facilitiesGrid.innerHTML = facilities.map(f => `
            <div class="facility-item animate-on-scroll">
                <i class="${f.icon}"></i>
                <h4>${f.name}</h4>
                <p>${f.description}</p>
            </div>
        `).join('');
        facilitiesGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    // ========== POPULATE TESTIMONIALS FROM DB ==========
    const testimonialsSlider = document.getElementById('testimonialsSlider');
    const sliderDots = document.getElementById('sliderDots');
    if (testimonialsSlider) {
        const reviews = FrispesDB.getReviews();
        testimonialsSlider.innerHTML = reviews.map(r => `
            <div class="testimonial-card">
                <div class="testimonial-header">
                    <img src="${r.image}" alt="${r.name}">
                    <div>
                        <h4>${r.name}</h4>
                        <small>${r.role || ''}</small>
                    </div>
                </div>
                <div class="testimonial-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                <p class="testimonial-text">"${r.text}"</p>
                ${r.verified ? '<span class="testimonial-verified"><i class="fas fa-check-circle"></i> Верифікований відгук</span>' : ''}
            </div>
        `).join('');

        // Slider dots
        if (sliderDots) {
            const cardCount = reviews.length;
            for (let i = 0; i < Math.min(cardCount, 5); i++) {
                const dot = document.createElement('button');
                dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
                dot.addEventListener('click', () => {
                    const cardWidth = testimonialsSlider.querySelector('.testimonial-card').offsetWidth + 32;
                    testimonialsSlider.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
                    sliderDots.querySelectorAll('.slider-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                });
                sliderDots.appendChild(dot);
            }
        }
    }

    // ========== POPULATE FAQ FROM DB ==========
    const faqAccordion = document.getElementById('faqAccordion');
    if (faqAccordion) {
        const faqs = FrispesDB.getFAQ();
        faqAccordion.innerHTML = faqs.map((f, i) => `
            <div class="faq-item animate-on-scroll${i === 0 ? ' open' : ''}">
                <div class="faq-question">
                    <span>${f.question}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer"><p>${f.answer}</p></div>
            </div>
        `).join('');

        faqAccordion.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', function() {
                const item = this.parentElement;
                const wasOpen = item.classList.contains('open');
                faqAccordion.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
                if (!wasOpen) item.classList.add('open');
            });
        });

        faqAccordion.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    // ========== CHAT BOT ==========
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatMinimize = document.getElementById('chatMinimize');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (chatToggle && chatWindow) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('show');
            const badge = chatToggle.querySelector('.chat-badge');
            if (badge) badge.style.display = 'none';
        });
        if (chatMinimize) chatMinimize.addEventListener('click', () => chatWindow.classList.remove('show'));
    }

    // Quick replies
    document.querySelectorAll('.quick-reply').forEach(btn => {
        btn.addEventListener('click', function() {
            const reply = this.dataset.reply;
            addChatMessage(reply, 'user');
            this.parentElement.remove();
            setTimeout(() => botReply(reply), 800);
        });
    });

    if (chatSend && chatInput) {
        chatSend.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    }

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addChatMessage(text, 'user');
        chatInput.value = '';
        setTimeout(() => botReply(text), 800);
    }

    function addChatMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${sender}`;
        msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function botReply(userText) {
        const lower = userText.toLowerCase();
        let response;

        if (lower.includes('бронюва') || lower.includes('забронюват')) {
            response = 'Ви можете забронювати простір прямо на нашому сайті! Натисніть кнопку "Забронювати" на головній сторінці або перейдіть у розділ <a href="workspace.html" style="color:var(--primary)">Простори</a>.';
        } else if (lower.includes('цін') || lower.includes('вартість') || lower.includes('скільки')) {
            response = 'Наші ціни:<br>• Відкритий простір — від 150₴/день<br>• Приватний офіс — від 800₴/день<br>• Переговорна — від 400₴/год<br>• Місячний абонемент — від 2000₴<br>Детальніше на сторінці <a href="services.html" style="color:var(--primary)">Послуги</a>.';
        } else if (lower.includes('адрес') || lower.includes('знаход') || lower.includes('де ви')) {
            response = 'Ми знаходимося за адресою: м. Київ, вул. Хрещатик 15, офіс 5. Працюємо Пн-Пт: 09:00-21:00, Сб-Нд: 10:00-18:00. <a href="contacts.html" style="color:var(--primary)">Карта</a>';
        } else if (lower.includes('поді') || lower.includes('івент') || lower.includes('хакатон')) {
            response = 'У нас регулярно проходять нетворкінг-зустрічі, майстер-класи та хакатони! Перегляньте актуальні події на сторінці <a href="events.html" style="color:var(--primary)">Події</a>.';
        } else if (lower.includes('привіт') || lower.includes('hi') || lower.includes('hello')) {
            response = 'Привіт! Радий вас бачити! Чим можу допомогти? Я можу розповісти про наші простори, ціни, події або допомогти з бронюванням.';
        } else if (lower.includes('wifi') || lower.includes('інтернет')) {
            response = 'У нас швидкісний Wi-Fi 1 Gbps по всьому простору. Підключення безкоштовне для всіх відвідувачів!';
        } else if (lower.includes('кав') || lower.includes('їж') || lower.includes('їсти')) {
            response = 'Безкоштовна кава та чай для всіх резидентів! Також є кафе зі здоровими перекусами та обідами.';
        } else {
            response = 'Дякую за ваше питання! Для детальної консультації зателефонуйте нам за номером +38 (044) 123 45 67 або напишіть на hello@frispes.com. Також ви можете переглянути розділ <a href="contacts.html" style="color:var(--primary)">Контакти</a>.';
        }

        addChatMessage(response, 'bot');
    }

    // ========== LOAD EVENTS PAGE ==========
    if (window.location.pathname.includes('events.html')) {
        loadEventsPage();
    }

    function loadEventsPage() {
        const events = FrispesDB.getEvents();
        const eventsGrid = document.getElementById('eventsGrid');
        if (eventsGrid) {
            eventsGrid.innerHTML = events.map(event => `
                <div class="event-card animate-on-scroll">
                    <div style="overflow:hidden;">
                        <img src="${event.image}" alt="${event.title}">
                    </div>
                    <div class="event-content">
                        <span class="event-badge ${event.price === 0 ? 'free' : 'paid'}">${event.price === 0 ? 'Безкоштовно' : event.price + '₴'}</span>
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                        <p><i class="fas fa-calendar"></i> ${event.date} | ${event.time}</p>
                        <p><i class="fas fa-clock"></i> Тривалість: ${event.duration}</p>
                        <p><i class="fas fa-users"></i> ${event.booked}/${event.spots} місць зайнято</p>
                        <p><i class="fas fa-user-tie"></i> ${event.speaker}</p>
                        <div style="background:var(--bg-secondary);border-radius:0.5rem;overflow:hidden;height:6px;margin-top:0.75rem;">
                            <div style="width:${(event.booked/event.spots)*100}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:0.5rem;transition:width 1s ease;"></div>
                        </div>
                        <button class="register-event" data-id="${event.id}">Зареєструватись <i class="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            `).join('');

            eventsGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

            document.querySelectorAll('.register-event').forEach(btn => {
                btn.addEventListener('click', function() {
                    const currentUser = FrispesDB.getCurrentUser();
                    if (!currentUser) {
                        showToast('Потрібен вхід', 'Увійдіть або зареєструйтесь', 'warning');
                        openModal('authModal');
                        return;
                    }
                    const eventId = this.dataset.id;
                    let registered = JSON.parse(localStorage.getItem('registered_events') || '[]');
                    if (!registered.includes(eventId)) {
                        registered.push(eventId);
                        localStorage.setItem('registered_events', JSON.stringify(registered));
                        showToast('Реєстрація успішна!', 'Ви зареєстровані на подію', 'success');
                        launchConfetti();
                    } else {
                        showToast('Увага', 'Ви вже зареєстровані на цю подію', 'warning');
                    }
                });
            });
        }
    }

    // ========== LOAD REVIEWS PAGE ==========
    if (window.location.pathname.includes('reviews.html')) {
        loadReviewsPage();
    }

    function loadReviewsPage() {
        const reviews = FrispesDB.getReviews();
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (reviewsGrid) {
            reviewsGrid.innerHTML = reviews.map(review => `
                <div class="review-card animate-on-scroll">
                    <div class="review-header">
                        <img src="${review.image}" alt="${review.name}">
                        <div>
                            <h4>${review.name}</h4>
                            ${review.role ? `<small>${review.role}</small>` : ''}
                            <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                        </div>
                    </div>
                    <p style="color:var(--text-secondary);line-height:1.7;">${review.text}</p>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
                        <small style="color:var(--text-secondary);">${review.date}</small>
                        ${review.verified ? '<span style="color:var(--success);font-size:0.8rem;"><i class="fas fa-check-circle"></i> Верифіковано</span>' : ''}
                    </div>
                </div>
            `).join('');

            reviewsGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        }

        // Star rating interactive
        const ratingSelect = document.getElementById('ratingSelect');
        const reviewRating = document.getElementById('reviewRating');
        if (ratingSelect) {
            ratingSelect.querySelectorAll('.star-rating').forEach(star => {
                star.addEventListener('click', function() {
                    const rating = this.dataset.rating;
                    reviewRating.value = rating;
                    ratingSelect.querySelectorAll('.star-rating').forEach((s, i) => {
                        s.classList.toggle('selected', i < rating);
                    });
                });
                star.addEventListener('mouseenter', function() {
                    const rating = this.dataset.rating;
                    ratingSelect.querySelectorAll('.star-rating').forEach((s, i) => {
                        s.style.color = i < rating ? '#FFD700' : '#ddd';
                    });
                });
            });
            ratingSelect.addEventListener('mouseleave', () => {
                const current = reviewRating.value;
                ratingSelect.querySelectorAll('.star-rating').forEach((s, i) => {
                    s.style.color = i < current ? '#FFD700' : '#ddd';
                });
            });
        }

        // Review form (using button instead of form)
        const submitReview = document.getElementById('submitReview');
        if (submitReview) {
            submitReview.addEventListener('click', function() {
                const currentUser = FrispesDB.getCurrentUser();
                if (!currentUser) {
                    showToast('Потрібен вхід', 'Увійдіть, щоб залишити відгук', 'warning');
                    openModal('authModal');
                    return;
                }

                const rating = parseInt(reviewRating.value);
                const text = document.getElementById('reviewText').value.trim();
                if (!text) {
                    showToast('Помилка', 'Напишіть текст відгуку', 'error');
                    return;
                }

                const newReview = {
                    id: Date.now(),
                    name: currentUser.name,
                    role: '',
                    rating: rating,
                    text: text,
                    date: new Date().toISOString().split('T')[0],
                    image: 'https://randomuser.me/api/portraits/lego/1.jpg',
                    verified: false
                };

                FrispesDB.addReview(newReview);
                showToast('Дякуємо!', 'Ваш відгук додано', 'success');
                launchConfetti();
                document.getElementById('reviewText').value = '';
                loadReviewsPage();
            });
        }

        // Review form submission (form-based)
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (submitReview) submitReview.click();
            });
        }
    }

    // ========== CONTACTS PAGE ==========
    if (window.location.pathname.includes('contacts.html')) {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('contactName').value;
                const email = document.getElementById('contactEmail').value;
                const message = document.getElementById('contactMessage').value;

                FrispesDB.addContactMessage({ name, email, message });
                showToast('Повідомлення відправлено!', "Ми зв'яжемося з вами найближчим часом", 'success');
                launchConfetti();
                contactForm.reset();
            });
        }
    }

    // ========== SERVICES PAGE ==========
    if (window.location.pathname.includes('services.html')) {
        loadServicesPage();
    }

    function loadServicesPage() {
        const services = FrispesDB.getServices();
        const servicesGrid = document.querySelector('.services-grid');
        if (servicesGrid && services.length) {
            servicesGrid.innerHTML = services.map(s => `
                <div class="service-card animate-on-scroll${s.popular ? ' popular' : ''}">
                    <i class="${s.icon}"></i>
                    <h3>${s.name}</h3>
                    <p>${s.description}</p>
                    <div class="service-price">${s.price}₴<small>/${s.priceUnit}</small></div>
                    <ul class="service-features">
                        ${s.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <button class="service-btn" data-service="${s.id}">Забронювати</button>
                </div>
            `).join('');

            servicesGrid.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

            document.querySelectorAll('.service-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    openModal('bookingModal');
                });
            });
        }
    }

    // ========== WORKSPACE PAGE ==========
    if (window.location.pathname.includes('workspace.html')) {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        const galleryItems = document.querySelectorAll('.gallery-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.classList.remove('hidden');
                        item.style.animation = 'scaleIn 0.4s ease';
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });

        // Book now buttons
        document.querySelectorAll('.book-now-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal('bookingModal'));
        });
    }

    // ========== KONAMI CODE EASTER EGG ==========
    let konamiSequence = [];
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    document.addEventListener('keydown', (e) => {
        konamiSequence.push(e.keyCode);
        if (konamiSequence.length > konamiCode.length) konamiSequence.shift();
        if (JSON.stringify(konamiSequence) === JSON.stringify(konamiCode)) {
            document.body.style.animation = 'rainbow 2s linear';
            showToast('Easter Egg!', 'Ви знайшли секретний код Konami!', 'success');
            launchConfetti();
            setTimeout(() => document.body.style.animation = '', 2000);
        }
    });

    // ========== SMOOTH PAGE TRANSITIONS ==========
    document.querySelectorAll('a[href]').forEach(link => {
        if (link.hostname === window.location.hostname && !link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href && !href.startsWith('javascript') && !href.startsWith('mailto')) {
                    e.preventDefault();
                    document.body.style.opacity = '0';
                    document.body.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => window.location.href = href, 300);
                }
            });
        }
    });

    // Fade in on load
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });

});
