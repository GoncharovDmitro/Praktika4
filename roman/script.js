/* ============================================
   Роман Горін — Gallery Site Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== PARTICLES ====================
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];

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
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(123, 47, 247, ${this.opacity})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 80; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // ==================== NAVBAR SCROLL ====================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ==================== MOBILE MENU ====================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('active');
        });
    });

    // ==================== ACTIVE NAV LINK ====================
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    });

    // ==================== COUNTER ANIMATION ====================
    const counters = document.querySelectorAll('.stat-number');
    let counterStarted = false;

    function animateCounters() {
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const duration = 2000;
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.floor(target * eased);
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = target;
                }
            }
            requestAnimationFrame(update);
        });
    }

    const heroObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !counterStarted) {
                counterStarted = true;
                animateCounters();
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) heroObserver.observe(heroStats);

    // ==================== GALLERY FILTER ====================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            galleryItems.forEach((item, i) => {
                const match = filter === 'all' || item.dataset.category === filter;
                item.classList.toggle('hidden', !match);
                if (match) {
                    item.style.animationDelay = (i * 0.02) + 's';
                }
            });

            updateLoadMore();
        });
    });

    // ==================== LOAD MORE ====================
    const INITIAL_VISIBLE = 40;
    const LOAD_MORE_COUNT = 40;
    const loadMoreBtn = document.getElementById('loadMore');

    function getVisibleItems() {
        return Array.from(galleryItems).filter(item => !item.classList.contains('hidden'));
    }

    function updateLoadMore() {
        const visible = getVisibleItems();
        let shown = 0;
        visible.forEach((item, i) => {
            if (i < INITIAL_VISIBLE) {
                item.style.display = '';
                shown++;
            } else {
                item.style.display = 'none';
            }
        });
        item_show_count = INITIAL_VISIBLE;
        loadMoreBtn.classList.toggle('hidden-btn', visible.length <= INITIAL_VISIBLE);
    }

    let item_show_count = INITIAL_VISIBLE;

    loadMoreBtn.addEventListener('click', () => {
        const visible = getVisibleItems();
        const newCount = item_show_count + LOAD_MORE_COUNT;
        visible.forEach((item, i) => {
            if (i < newCount) {
                item.style.display = '';
                item.style.animation = 'fadeInUp 0.4s ease forwards';
                item.style.animationDelay = ((i - item_show_count) * 0.03) + 's';
            }
        });
        item_show_count = newCount;
        if (newCount >= visible.length) {
            loadMoreBtn.classList.add('hidden-btn');
        }
    });

    updateLoadMore();

    // ==================== LIGHTBOX ====================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    let currentLightboxIndex = 0;
    let lightboxImages = [];

    function openLightbox(items, index) {
        lightboxImages = items;
        currentLightboxIndex = index;
        showLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function showLightboxImage() {
        const item = lightboxImages[currentLightboxIndex];
        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-overlay span, .screenshot-date');
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = caption ? caption.textContent : '';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        showLightboxImage();
    });

    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
        showLightboxImage();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
            currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            showLightboxImage();
        }
        if (e.key === 'ArrowRight') {
            currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
            showLightboxImage();
        }
    });

    // Attach lightbox to gallery items
    galleryItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            const visibleItems = Array.from(galleryItems).filter(
                el => !el.classList.contains('hidden') && el.style.display !== 'none'
            );
            const idx = visibleItems.indexOf(item);
            openLightbox(visibleItems, idx >= 0 ? idx : 0);
        });
    });

    // Attach lightbox to screenshots
    const screenshotItems = document.querySelectorAll('.screenshot-item');
    screenshotItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            openLightbox(Array.from(screenshotItems), i);
        });
    });

    // ==================== BACK TO TOP ====================
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==================== SCROLL REVEAL ====================
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section-header, .video-card, .audio-card, .screenshot-item').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
});
