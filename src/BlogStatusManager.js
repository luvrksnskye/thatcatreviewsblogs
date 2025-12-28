/* =====================================================
   BLOGSTATUSMANAGER.JS - Dynamic Blog Status (OPTIMIZED)
   Cached DOM queries, reduced intervals, efficient updates
   ===================================================== */

export class BlogStatusManager {
    constructor(soundManager = null) {
        this.sound = soundManager;
        this.blogPosts = [];
        this.statusCards = [];
        this.statusCheckInterval = null;
        this.currentStatus = null;
        
        // Cached DOM elements
        this._cachedElements = {
            offlineCards: null,
            miniBanner: null
        };
        
        // Status configurations
        this.catFaces = {
            offline: ['x_x', '𐔌˙.', '(ᵕ̣̣̣̣̣̣﹏ᵕ̣̣̣̣̣̣)'],
            online: ['₍^.  ̫.^₎⟆ ‍', '≽(•⩊ •マ≼', '^. .^₎⟆'],
            sleeping: ['≽₍^_ ‸ _ ^₎≼⟆ zzZ', '(=^-ω-^=)zzZ']
        };
        
        this.statusMessages = {
            offline: ['no signal . . .', 'away~', 'brb!'],
            online: ['meow', 'online!', 'active'],
            sleeping: ['zzZ...', 'sleeping~', 'nap time...']
        };
    }

    async init() {
        // Cache DOM elements once
        this._cacheElements();
        
        // Load blog data
        await this.loadBlogManifest();
        
        // Initialize with current status
        this.currentStatus = this.getCurrentStatus();
        this.updateAutoStatus();
        
        // Update other displays
        this.initStatusCards();
        this.updateDateDisplays();
        
        // Render blog tab if exists
        this.renderBlogTab();
        
        // Reduced interval: check every 5 minutes instead of every minute
        this.statusCheckInterval = setInterval(() => {
            const newStatus = this.getCurrentStatus();
            if (newStatus !== this.currentStatus) {
                this.currentStatus = newStatus;
                this.updateAutoStatus();
            }
        }, 300000); // 5 minutes
        
        console.log('✧ Blog Status Manager initialized (optimized) ✧');
    }

    _cacheElements() {
        this._cachedElements.offlineCards = document.querySelectorAll('.card-offline');
        this._cachedElements.miniBanner = document.querySelector('.mini-offline-banner');
    }

    getCurrentStatus() {
        const hour = new Date().getHours();
        
        if (hour >= 18 || hour < 8) return 'sleeping';
        if (hour >= 8 && hour < 12) return 'online';
        return 'offline';
    }

    updateAutoStatus() {
        const status = this.currentStatus;
        
        // Update cached cards
        this._cachedElements.offlineCards?.forEach(card => {
            this.setCardStatus(card, status);
        });
        
        // Update mini banner
        if (this._cachedElements.miniBanner) {
            this.setMiniStatus(this._cachedElements.miniBanner, status);
        }
    }

    setCardStatus(card, status) {
        const titleEl = card.querySelector('.offline-title');
        const subtitleEl = card.querySelector('.offline-subtitle');
        const faceEl = card.querySelector('.pixel-face');
        
        // Remove all state classes at once
        card.className = card.className.replace(/\b(is-online|is-offline|is-sleeping|card-online|card-sleeping)\b/g, '').trim();
        
        const stateClass = `is-${status}`;
        const cardClass = status !== 'offline' ? `card-${status}` : '';
        
        card.classList.add(stateClass);
        if (cardClass) card.classList.add(cardClass);
        card.dataset.status = status;
        
        if (titleEl) {
            titleEl.textContent = status;
            titleEl.className = titleEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') titleEl.classList.add(`${status}-state`);
        }
        
        if (subtitleEl) {
            subtitleEl.textContent = this._randomItem(this.statusMessages[status]);
            subtitleEl.className = subtitleEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') subtitleEl.classList.add(`${status}-state`);
        }
        
        if (faceEl) {
            faceEl.textContent = this._randomItem(this.catFaces[status]);
            faceEl.className = faceEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') faceEl.classList.add(`${status}-state`);
        }
    }

    setMiniStatus(banner, status) {
        const textEl = banner.querySelector('.mini-offline-text');
        const faceEl = banner.querySelector('.mini-offline-face');
        const signalEl = banner.querySelector('.mini-offline-signal');
        
        banner.className = banner.className.replace(/\b(is-online|is-offline|is-sleeping)\b/g, '').trim();
        banner.classList.add(`is-${status}`);
        banner.dataset.status = status;
        
        if (textEl) {
            textEl.textContent = status;
            textEl.className = textEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') textEl.classList.add(`${status}-state`);
        }
        
        if (faceEl) {
            faceEl.textContent = this._randomItem(this.catFaces[status]);
            faceEl.className = faceEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') faceEl.classList.add(`${status}-state`);
        }
        
        if (signalEl) {
            signalEl.textContent = this._randomItem(this.statusMessages[status]);
            signalEl.className = signalEl.className.replace(/\b(online-state|sleeping-state)\b/g, '').trim();
            if (status !== 'offline') signalEl.classList.add(`${status}-state`);
        }
    }

    async loadBlogManifest() {
        try {
            const basePath = this._getBasePath();
            const response = await fetch(`${basePath}/src/blogs/blog-manifest.json`);
            
            if (!response.ok) throw new Error('Manifest not found');
            
            const data = await response.json();
            this.blogPosts = data.posts || [];
            
        } catch (e) {
            console.warn('Blog manifest not found, using empty list');
            this.blogPosts = [];
        }
    }

    _getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/thatcatreviewsblogs')) {
            return '/thatcatreviewsblogs';
        }
        return '';
    }

    initStatusCards() {
        const tuesdayCard = document.querySelector('.card-tuesday');
        const thursdayContent = document.querySelector('.thursday-content');
        const fridayCard = document.querySelector('.card-friday');
        const saturdayCard = document.querySelector('.card-saturday');
        
        this.statusCards = [
            { element: tuesdayCard, index: 0 },
            { element: thursdayContent, index: 1, isThursday: true },
            { element: fridayCard, index: 2 },
            { element: saturdayCard, index: 3 }
        ].filter(c => c.element);
        
        this.updateStatusCards();
    }

    updateStatusCards() {
        this.statusCards.forEach((cardData, idx) => {
            const post = this.blogPosts[idx];
            if (!post) return;
            
            const { element, isThursday } = cardData;
            
            const dayBadge = element.querySelector('.day-badge span');
            if (dayBadge) {
                dayBadge.textContent = this._formatDayBadge(new Date(post.date));
            }
            
            const titleEl = isThursday 
                ? element.querySelector('.thursday-info .stream-title')
                : element.querySelector('.stream-title');
            if (titleEl) titleEl.textContent = post.title;
            
            const subtitleEl = isThursday
                ? element.querySelector('.thursday-info .stream-subtitle')
                : element.querySelector('.stream-subtitle');
            if (subtitleEl) subtitleEl.textContent = post.subtitle || post.category;
        });
    }

    updateDateDisplays() {
        const topbarDate = document.getElementById('topbar-date');
        if (!topbarDate) return;
        
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        topbarDate.textContent = `WEEK OF ${this._formatDateShort(weekStart)} TO ${this._formatDateShort(weekEnd)}`;
    }

    renderBlogTab() {
        const container = document.querySelector('.blog-posts-container');
        if (!container || this.blogPosts.length === 0) return;
        
        const fragment = document.createDocumentFragment();
        
        this.blogPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.dataset.url = post.url;
            
            card.innerHTML = `
                <div class="blog-card-header">
                    <span class="blog-category">${post.category || 'Blog'}</span>
                    <span class="blog-date">${this._formatDateShort(new Date(post.date))}</span>
                </div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-subtitle">${post.subtitle || ''}</p>
            `;
            
            card.addEventListener('click', () => this._openBlog(post.url));
            fragment.appendChild(card);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    _openBlog(url) {
        if (url) {
            const basePath = this._getBasePath();
            window.location.href = `${basePath}${url}`;
        }
        this.sound?.play('click');
    }

    // Helper methods
    _randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    _formatDayBadge(date) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) return 'today';
        return `${days[date.getDay()]} ${date.getDate()}`;
    }

    _formatDateShort(date) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
        this.blogPosts = [];
        this.statusCards = [];
        this._cachedElements = {};
    }
}

export default BlogStatusManager;
