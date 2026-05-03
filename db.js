// ========== FRISPES JSON DATABASE MODULE ==========
const FrispesDB = {
    _cache: null,
    _loaded: false,

    async load() {
        if (this._loaded) return this._cache;
        try {
            const response = await fetch('db.json');
            this._cache = await response.json();
            this._loaded = true;
            this._syncWithLocalStorage();
            return this._cache;
        } catch (e) {
            console.warn('DB: Could not load db.json, using localStorage fallback');
            this._cache = this._getLocalFallback();
            this._loaded = true;
            return this._cache;
        }
    },

    _syncWithLocalStorage() {
        const localUsers = JSON.parse(localStorage.getItem('frispes_users') || '{}');
        const localBookings = JSON.parse(localStorage.getItem('frispes_bookings') || '[]');
        const localReviews = localStorage.getItem('frispes_reviews');
        const localEvents = localStorage.getItem('frispes_events');
        const localFavorites = JSON.parse(localStorage.getItem('frispes_favorites') || '[]');

        if (Object.keys(localUsers).length) this._cache._localUsers = localUsers;
        if (localBookings.length) this._cache._localBookings = localBookings;
        if (localReviews) {
            try { this._cache._localReviews = JSON.parse(localReviews); } catch(e) {}
        }
        if (localEvents) {
            try { this._cache._localEvents = JSON.parse(localEvents); } catch(e) {}
        }
        this._cache._favorites = localFavorites;
    },

    _getLocalFallback() {
        return {
            spaces: [], events: [], reviews: [], services: [],
            team: [], stats: {}, facilities: [], faq: [],
            _localUsers: JSON.parse(localStorage.getItem('frispes_users') || '{}'),
            _localBookings: JSON.parse(localStorage.getItem('frispes_bookings') || '[]'),
            _favorites: JSON.parse(localStorage.getItem('frispes_favorites') || '[]')
        };
    },

    getSpaces(filter) {
        if (!this._cache) return [];
        let spaces = this._cache.spaces || [];
        if (filter && filter !== 'all') {
            spaces = spaces.filter(s => s.type === filter);
        }
        return spaces;
    },

    getSpaceById(id) {
        if (!this._cache) return null;
        return (this._cache.spaces || []).find(s => s.id === parseInt(id));
    },

    getEvents() {
        const localEvents = this._cache?._localEvents;
        if (localEvents && localEvents.length) return localEvents;
        return this._cache?.events || [];
    },

    getReviews() {
        const localReviews = this._cache?._localReviews;
        const dbReviews = this._cache?.reviews || [];
        if (localReviews && localReviews.length > dbReviews.length) return localReviews;
        return dbReviews;
    },

    addReview(review) {
        const reviews = this.getReviews();
        reviews.push(review);
        localStorage.setItem('frispes_reviews', JSON.stringify(reviews));
        if (this._cache) this._cache._localReviews = reviews;
        return reviews;
    },

    getServices() {
        return this._cache?.services || [];
    },

    getTeam() {
        return this._cache?.team || [];
    },

    getStats() {
        return this._cache?.stats || {};
    },

    getFacilities() {
        return this._cache?.facilities || [];
    },

    getFAQ() {
        return this._cache?.faq || [];
    },

    getBookings() {
        return JSON.parse(localStorage.getItem('frispes_bookings') || '[]');
    },

    addBooking(booking) {
        const bookings = this.getBookings();
        booking.id = Date.now();
        booking.date = new Date().toISOString();
        bookings.push(booking);
        localStorage.setItem('frispes_bookings', JSON.stringify(bookings));
        return booking;
    },

    getFavorites() {
        return JSON.parse(localStorage.getItem('frispes_favorites') || '[]');
    },

    toggleFavorite(spaceId) {
        const favs = this.getFavorites();
        const idx = favs.indexOf(spaceId);
        if (idx > -1) {
            favs.splice(idx, 1);
        } else {
            favs.push(spaceId);
        }
        localStorage.setItem('frispes_favorites', JSON.stringify(favs));
        return favs;
    },

    isFavorite(spaceId) {
        return this.getFavorites().includes(spaceId);
    },

    getUsers() {
        return JSON.parse(localStorage.getItem('frispes_users') || '{}');
    },

    addUser(email, name, password) {
        const users = this.getUsers();
        if (users[email]) return { success: false, message: 'Користувач з таким email вже існує!' };
        users[email] = { name, password };
        localStorage.setItem('frispes_users', JSON.stringify(users));
        return { success: true };
    },

    loginUser(email, password) {
        const users = this.getUsers();
        if (users[email] && users[email].password === password) {
            const user = { email, name: users[email].name };
            localStorage.setItem('frispes_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Невірний email або пароль!' };
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('frispes_current_user'));
        } catch(e) {
            return null;
        }
    },

    logoutUser() {
        localStorage.removeItem('frispes_current_user');
    },

    addContactMessage(msg) {
        const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
        msg.date = new Date().toISOString();
        messages.push(msg);
        localStorage.setItem('contact_messages', JSON.stringify(messages));
        return msg;
    },

    searchAll(query) {
        if (!query || !this._cache) return [];
        const q = query.toLowerCase();
        const results = [];

        (this._cache.spaces || []).forEach(s => {
            if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
                results.push({ type: 'space', item: s });
            }
        });
        (this._cache.events || []).forEach(e => {
            if (e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) {
                results.push({ type: 'event', item: e });
            }
        });
        (this._cache.services || []).forEach(s => {
            if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) {
                results.push({ type: 'service', item: s });
            }
        });

        return results;
    }
};
