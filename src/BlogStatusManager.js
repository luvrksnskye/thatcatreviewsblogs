/* =====================================================
   BLOGSTATUSMANAGER.JS - Dynamic Blog Status Handler
   Manages dynamic content in status tab based on blog posts
   + Automatic time-based status (sleeping/online/offline)
   + Dynamic blog tab rendering
   
   ACTUALIZADO: Ahora usa estructura de carpetas
   /blogs/nombre-post/index.html en vez de /blogs/nombre-post.html
   ===================================================== */

export class BlogStatusManager {
    constructor(soundManager = null) {
        this.sound = soundManager;
        this.blogPosts = [];
        this.offlineCards = [];
        this.statusCards = [];
        this.statusCheckInterval = null;
        
        // Cat faces for different states
        this.catFaces = {
            offline: ['x_x', '𐔌˙.', '(ᵕ̣̣̣̣̣̣﹏ᵕ̣̣̣̣̣̣)'],
            online: ['₍^.  ̫.^₎⟆ ‍', '≽(•⩊ •マ≼', '^. .^₎⟆', 'ฅ≽(•⩊ •マ≼', 'ᓚ₍ ^. .^₎', 'ₓ˚. ୭ ˚○◦˚.˚◦○˚ ୧ .˚ₓ'],
            sleeping: ['≽₍^_ ‸ _ ^₎≼⟆ zzZ', '(=^-ω-^=)zzZ', '(-.-)...zzZ', '/ᐠ - ˕ -マ']
        };
        
        // Messages for different states
        this.statusMessages = {
            offline: ['no signal . . .', 'away~', 'brb!', 'busy...'],
            online: ['meow', 'online!', 'purring...', 'active', 'streaming!!', 'hello~!'],
            sleeping: ['zzZ...', 'sleeping~', 'nap time...', 'dreaming...', 'goodnight']
        };
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    async init() {
        await this.loadBlogManifest();
        this.initStatusCards();
        this.updateDateDisplays();
        this.initAutoStatus();
        this.renderBlogTab();
        console.log('✧ Blog Status Manager initialized ✧');
    }

    // ========================================
    // AUTOMATIC STATUS BASED ON TIME
    // ========================================
    initAutoStatus() {
        // Update status immediately
        this.updateAutoStatus();
        
        // Check every minute for status changes
        this.statusCheckInterval = setInterval(() => {
            this.updateAutoStatus();
        }, 60000); // Check every minute
    }

    // ========================================
    // GET CURRENT STATUS BASED ON HOUR
    // ========================================
    getCurrentStatus() {
        const hour = new Date().getHours();
        
        // 6 PM (18:00) to 8 AM (08:00) = sleeping
        // 8 AM (08:00) to 12 PM (12:00) = online (morning)
        // 12 PM (12:00) to 6 PM (18:00) = offline (afternoon)
        
        if (hour >= 18 || hour < 8) {
            return 'sleeping';
        } else if (hour >= 8 && hour < 12) {
            return 'online';
        } else {
            return 'offline';
        }
    }

    // ========================================
    // UPDATE ALL STATUS CARDS AUTOMATICALLY
    // ========================================
    updateAutoStatus() {
        const status = this.getCurrentStatus();
        
        // Update all offline cards
        const allOfflineCards = document.querySelectorAll('.card-offline');
        allOfflineCards.forEach(card => {
            this.setCardStatus(card, status);
        });
        
        // Update mini banner
        const miniBanner = document.querySelector('.mini-offline-banner');
        if (miniBanner) {
            this.setMiniStatus(miniBanner, status);
        }
    }

    // ========================================
    // SET CARD STATUS (Main Cards)
    // ========================================
    setCardStatus(card, status) {
        const titleEl = card.querySelector('.offline-title');
        const subtitleEl = card.querySelector('.offline-subtitle');
        const faceEl = card.querySelector('.pixel-face');
        
        // Remove all state classes
        card.classList.remove('is-online', 'is-offline', 'is-sleeping', 'card-online', 'card-sleeping');
        if (titleEl) titleEl.classList.remove('online-state', 'sleeping-state');
        if (subtitleEl) subtitleEl.classList.remove('online-state', 'sleeping-state');
        if (faceEl) faceEl.classList.remove('online-state', 'sleeping-state');
        
        switch (status) {
            case 'online':
                card.dataset.status = 'online';
                card.classList.add('is-online', 'card-online');
                if (titleEl) {
                    titleEl.textContent = 'online';
                    titleEl.classList.add('online-state');
                }
                if (subtitleEl) {
                    subtitleEl.textContent = this.randomItem(this.statusMessages.online);
                    subtitleEl.classList.add('online-state');
                }
                if (faceEl) {
                    faceEl.textContent = this.randomItem(this.catFaces.online);
                    faceEl.classList.add('online-state');
                }
                break;
                
            case 'sleeping':
                card.dataset.status = 'sleeping';
                card.classList.add('is-sleeping', 'card-sleeping');
                if (titleEl) {
                    titleEl.textContent = 'sleeping';
                    titleEl.classList.add('sleeping-state');
                }
                if (subtitleEl) {
                    subtitleEl.textContent = this.randomItem(this.statusMessages.sleeping);
                    subtitleEl.classList.add('sleeping-state');
                }
                if (faceEl) {
                    faceEl.textContent = this.randomItem(this.catFaces.sleeping);
                    faceEl.classList.add('sleeping-state');
                }
                break;
                
            default: // offline
                card.dataset.status = 'offline';
                card.classList.add('is-offline');
                if (titleEl) {
                    titleEl.textContent = 'offline';
                }
                if (subtitleEl) {
                    subtitleEl.textContent = this.randomItem(this.statusMessages.offline);
                }
                if (faceEl) {
                    faceEl.textContent = this.randomItem(this.catFaces.offline);
                }
                break;
        }
    }

    // ========================================
    // SET MINI BANNER STATUS
    // ========================================
    setMiniStatus(banner, status) {
        const textEl = banner.querySelector('.mini-offline-text');
        const faceEl = banner.querySelector('.mini-offline-face');
        const signalEl = banner.querySelector('.mini-offline-signal');
        
        // Remove all state classes
        banner.classList.remove('is-online', 'is-offline', 'is-sleeping');
        if (textEl) textEl.classList.remove('online-state', 'sleeping-state');
        if (faceEl) faceEl.classList.remove('online-state', 'sleeping-state');
        if (signalEl) signalEl.classList.remove('online-state', 'sleeping-state');
        
        switch (status) {
            case 'online':
                banner.dataset.status = 'online';
                banner.classList.add('is-online');
                if (textEl) {
                    textEl.textContent = 'online';
                    textEl.classList.add('online-state');
                }
                if (faceEl) {
                    faceEl.textContent = this.randomItem(this.catFaces.online);
                    faceEl.classList.add('online-state');
                }
                if (signalEl) {
                    signalEl.textContent = this.randomItem(this.statusMessages.online);
                    signalEl.classList.add('online-state');
                }
                break;
                
            case 'sleeping':
                banner.dataset.status = 'sleeping';
                banner.classList.add('is-sleeping');
                if (textEl) {
                    textEl.textContent = 'sleeping';
                    textEl.classList.add('sleeping-state');
                }
                if (faceEl) {
                    faceEl.textContent = this.randomItem(this.catFaces.sleeping);
                    faceEl.classList.add('sleeping-state');
                }
                if (signalEl) {
                    signalEl.textContent = this.randomItem(this.statusMessages.sleeping);
                    signalEl.classList.add('sleeping-state');
                }
                break;
                
            default: // offline
                banner.dataset.status = 'offline';
                banner.classList.add('is-offline');
                if (textEl) textEl.textContent = 'offline';
                if (faceEl) faceEl.textContent = 'x_x';
                if (signalEl) signalEl.textContent = 'no signal . . .';
                break;
        }
    }

    // ========================================
    // LOAD BLOG MANIFEST
    // ========================================
    async loadBlogManifest() {
        const basePath = this.getBasePath();
        
        // Intentar múltiples rutas posibles
        const sources = [
            './src/blogs/manifest.json',
            `${basePath}/src/blogs/manifest.json`,
            '/src/blogs/manifest.json'
        ];
        
        for (const source of sources) {
            try {
                const response = await fetch(source);
                if (response.ok) {
                    const data = await response.json();
                    if (data.posts && data.posts.length > 0) {
                        this.blogPosts = data.posts;
                        console.log(`✧ Loaded ${data.posts.length} posts from ${source} ✧`);
                        this.blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
                        return;
                    }
                }
            } catch (error) {
                console.log(`Source ${source} not available, trying next...`);
            }
        }
        
        console.log('Using default demo posts');
        this.blogPosts = this.getDefaultPosts();
        this.blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // ========================================
    // DEFAULT POSTS (DEMO DATA)
    // ========================================
    getDefaultPosts() {
        return [
            {
                id: 1,
                title: 'Welcome to my Blog!',
                subtitle: 'First post ever~',
                excerpt: 'Hey everyone! This is my very first blog post. I\'m so excited to share my thoughts and adventures with you all!',
                date: new Date().toISOString(),
                file: 'welcome',  // Folder name
                category: 'Updates',
                readTime: '3 min read',
                reactions: { hearts: 24, comments: 8 }
            },
            {
                id: 2,
                title: 'My Favorite Games',
                subtitle: 'Cozy gaming list',
                excerpt: 'Let me share some of my favorite cozy games that I\'ve been playing lately. Perfect for rainy days!',
                date: new Date(Date.now() - 86400000).toISOString(),
                file: 'favorite-games',  // Folder name
                category: 'Gaming',
                readTime: '5 min read',
                reactions: { hearts: 42, comments: 15 }
            },
            {
                id: 3,
                title: 'Art Process',
                subtitle: 'How I create~',
                excerpt: 'Ever wondered how I make my digital art? Here\'s a peek behind the scenes of my creative process!',
                date: new Date(Date.now() - 172800000).toISOString(),
                file: 'art-process',  // Folder name
                category: 'Art',
                readTime: '4 min read',
                reactions: { hearts: 67, comments: 23 }
            }
        ];
    }

    // ========================================
    // RENDER BLOG TAB
    // ========================================
    renderBlogTab() {
        const blogContainer = document.querySelector('#tab-blog .blog-posts');
        if (!blogContainer) return;
        
        // Clear existing static posts
        blogContainer.innerHTML = '';
        
        // Render each post
        this.blogPosts.forEach((post, index) => {
            const postElement = this.createBlogPostElement(post, index);
            blogContainer.appendChild(postElement);
        });
        
        console.log(`✧ Rendered ${this.blogPosts.length} posts in Blog tab ✧`);
    }

    // ========================================
    // CREATE BLOG POST ELEMENT
    // ========================================
    createBlogPostElement(post, index) {
        const article = document.createElement('article');
        article.className = 'blog-post';
        article.dataset.sound = 'card';
        article.dataset.postId = post.id;
        
        const postDate = new Date(post.date);
        const day = postDate.getDate().toString().padStart(2, '0');
        const month = postDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        
        const hearts = post.reactions?.hearts || Math.floor(Math.random() * 50) + 10;
        const comments = post.reactions?.comments || Math.floor(Math.random() * 20) + 5;
        const readTime = post.readTime || '3 min read';
        const excerpt = post.excerpt || post.subtitle || 'Click to read more...';
        
        article.innerHTML = `
            <div class="post-header">
                <div class="post-date">
                    <span class="date-day">${day}</span>
                    <span class="date-month">${month}</span>
                </div>
                <div class="post-meta">
                    <span class="post-category">${post.category || 'General'}</span>
                    <span class="post-read-time">
                        <span class="material-icons">schedule</span>
                        ${readTime}
                    </span>
                </div>
            </div>
            <div class="post-content">
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${excerpt}</p>
                <button class="read-more-btn" data-sound="click" data-post-file="${post.file || ''}">
                    Read More
                    <span class="material-icons">arrow_forward</span>
                </button>
            </div>
            <div class="post-footer">
                <div class="post-reactions">
                    <button class="reaction-btn" data-reaction="heart" data-sound="pop">
                        <span class="material-icons">favorite</span>
                        <span class="reaction-count">${hearts}</span>
                    </button>
                    <button class="reaction-btn" data-reaction="comment" data-sound="pop">
                        <span class="material-icons">chat_bubble</span>
                        <span class="reaction-count">${comments}</span>
                    </button>
                    <button class="reaction-btn" data-reaction="share" data-sound="pop">
                        <span class="material-icons">share</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for reactions
        const reactionBtns = article.querySelectorAll('.reaction-btn');
        reactionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleReaction(btn, post.id);
            });
        });
        
        // Add event listener for read more
        const readMoreBtn = article.querySelector('.read-more-btn');
        if (readMoreBtn) {
            readMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openBlogPost(post);
            });
        }
        
        return article;
    }

    // ========================================
    // HANDLE REACTION CLICK
    // ========================================
    handleReaction(btn, postId) {
        const reaction = btn.dataset.reaction;
        
        if (reaction === 'heart') {
            btn.classList.toggle('active');
            const countEl = btn.querySelector('.reaction-count');
            if (countEl) {
                let count = parseInt(countEl.textContent);
                count = btn.classList.contains('active') ? count + 1 : count - 1;
                countEl.textContent = count;
            }
            this.sound?.play('pop');
        } else if (reaction === 'share') {
            // Simple share functionality
            if (navigator.share) {
                navigator.share({
                    title: 'Check out this post!',
                    url: window.location.href
                });
            }
            this.sound?.play('pop');
        }
    }

    // ========================================
    // OPEN BLOG POST
    // ========================================
    openBlogPost(post) {
        if (post.file) {
            // Detectar la base URL del sitio (para GitHub Pages con subcarpeta)
            const basePath = this.getBasePath();
            
            // Limpiar el file de cualquier prefijo que ya tenga
            let cleanFile = post.file
                .replace(/^\/src\/blogs\//g, '')
                .replace(/^src\/blogs\//g, '')
                .replace(/\/+/g, '/');
            
            // Detectar si es estructura vieja (.html) o nueva (carpeta)
            let url;
            if (cleanFile.endsWith('.html')) {
                url = `${basePath}/src/blogs/${cleanFile}`;
            } else {
                url = `${basePath}/src/blogs/${cleanFile}/`;
            }
            
            console.log('Opening blog:', url); // Debug
            window.location.href = url;
        }
        this.sound?.play('click');
    }
    
    // ========================================
    // GET BASE PATH (para GitHub Pages)
    // ========================================
    getBasePath() {
        // Detectar si estamos en GitHub Pages con subcarpeta
        const path = window.location.pathname;
        
        // Si la ruta contiene /thatcatreviewsblogs/, usarla como base
        if (path.includes('/thatcatreviewsblogs')) {
            return '/thatcatreviewsblogs';
        }
        
        // Si no, asumir que está en la raíz
        return '';
    }

    // ========================================
    // INITIALIZE STATUS CARDS (DAY CARDS)
    // ========================================
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

    // ========================================
    // UPDATE STATUS CARDS WITH BLOG DATA
    // ========================================
    updateStatusCards() {
        this.statusCards.forEach((cardData, idx) => {
            const post = this.blogPosts[idx];
            if (!post) return;
            
            const { element, isThursday } = cardData;
            
            const dayBadge = element.querySelector('.day-badge span');
            if (dayBadge) {
                const postDate = new Date(post.date);
                dayBadge.textContent = this.formatDayBadge(postDate);
            }
            
            const titleEl = isThursday 
                ? element.querySelector('.thursday-info .stream-title')
                : element.querySelector('.stream-title');
            if (titleEl) {
                titleEl.textContent = post.title;
            }
            
            const subtitleEl = isThursday
                ? element.querySelector('.thursday-info .stream-subtitle')
                : element.querySelector('.stream-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = post.subtitle || post.category;
            }
            
            this.updateTimeSlots(element, post.date);
        });
    }

    // ========================================
    // UPDATE TIME SLOTS
    // ========================================
    updateTimeSlots(element, dateString) {
        const timeSlots = element.querySelectorAll('.time-slot');
        const postDate = new Date(dateString);
        
        if (timeSlots.length >= 1) {
            const timeBadge1 = timeSlots[0].querySelector('.time-badge');
            const timezone1 = timeSlots[0].querySelector('.timezone');
            if (timeBadge1) {
                timeBadge1.textContent = this.formatTime(postDate);
            }
            if (timezone1) {
                timezone1.textContent = this.getTimezoneAbbr();
            }
        }
        
        if (timeSlots.length >= 2) {
            const timeBadge2 = timeSlots[1].querySelector('.time-badge');
            const timezone2 = timeSlots[1].querySelector('.timezone');
            if (timeBadge2) {
                timeBadge2.textContent = this.getRelativeTime(postDate);
            }
            if (timezone2) {
                timezone2.textContent = 'ago';
            }
        }
    }

    // ========================================
    // UPDATE DATE DISPLAYS
    // ========================================
    updateDateDisplays() {
        const topbarDate = document.getElementById('topbar-date');
        if (topbarDate) {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            topbarDate.textContent = `WEEK OF ${this.formatDateShort(weekStart)} TO ${this.formatDateShort(weekEnd)}`;
        }
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    formatDayBadge(date) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
            return 'today';
        }
        
        return `${days[date.getDay()]} ${date.getDate()}`;
    }

    formatTime(date) {
        const hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}${ampm}`;
    }

    getTimezoneAbbr() {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const abbrs = {
            'America/New_York': 'EST',
            'America/Los_Angeles': 'PST',
            'Europe/London': 'GMT',
            'Asia/Tokyo': 'JST',
            'Asia/Seoul': 'KST'
        };
        return abbrs[tz] || 'LOCAL';
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes}m`;
        } else if (hours < 24) {
            return `${hours}h`;
        } else if (days < 7) {
            return `${days}d`;
        } else {
            return `${Math.floor(days / 7)}w`;
        }
    }

    formatDateShort(date) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // ========================================
    // API METHODS
    // ========================================
    addBlogPost(post) {
        this.blogPosts.unshift({
            id: Date.now(),
            ...post,
            date: post.date || new Date().toISOString()
        });
        this.updateStatusCards();
        this.renderBlogTab();
    }

    async refresh() {
        await this.loadBlogManifest();
        this.updateStatusCards();
        this.updateDateDisplays();
        this.renderBlogTab();
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
        this.blogPosts = [];
        this.offlineCards = [];
        this.statusCards = [];
    }
}

export default BlogStatusManager;
