/* =====================================================
   HOLIDAYMANAGER.JS - Seasonal Holiday Controller
   Manages Christmas mode with snowflake toggle button
   ===================================================== */

export class HolidayManager {
    constructor(storage, sound, music, sitePet, welcomeNotice = null) {
        this.storage = storage;
        this.sound = sound;
        this.music = music;
        this.sitePet = sitePet;
        this.welcomeNotice = welcomeNotice;
        
        // Holiday state
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.selectedSprite = null;
        this.holidayLock = false;
        this.isTransitioning = false;
        
        // Manual override
        this.manualOverride = null;
        
        // Christmas config
        this.christmas = {
            month: 11,
            startHour: 0,
            endHour: 10,
            sprites: ['christmasCute', 'christmasHat'],
            sounds: {
                jingleBells: './src/sound/jingle-bells.mp3',
                transition: './src/sound/christmas-transition.mp3'
            },
            playlist: [
                { id: 'xmas-1', title: "It's Beginning To Look A Lot Like Christmas", artist: 'Holiday Music', duration: '3:00', src: './src/bgm_xmas/xmas.mp3' },
            ],
            decorations: {
                lightsVideo: './src/xmas_theme/Christmas Lights With Snow V3 -  By ViperVex.webm',
                confettiIcons: 12
            }
        };
        
        // Sprite configurations
        this.christmasSprites = {
            christmasCute: {
                path: './src/site_pet_sprites/kitty_xmas_cute.svg',
                width: 2000, height: 2000,
                columns: 2, rows: 2, totalFrames: 3,
                displayWidth: 200, displayHeight: 200,
                bottom: -39, right: 20,
                thoughts: ["Happy holidays~!", "I love the snow!", "So warm and cozy...", "Best time of the year!"]
            },
            christmasHat: {
                path: './src/site_pet_sprites/kitty_xmas_hat.svg',
                width: 2000, height: 2000,
                columns: 2, rows: 2, totalFrames: 4,
                displayWidth: 200, displayHeight: 200,
                bottom: -20,
                thoughts: ["Merry Christmas!", "Where are the presents?", "This scarf is so warm~"]
            }
        };
        
        // DOM elements
        this.overlay = null;
        this.lightsContainer = null;
        this.confettiContainer = null;
        this.toggleButton = null;
        
        // Audio
        this.jingleAudio = null;
        this.transitionAudio = null;
        
        this.checkInterval = null;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.registerChristmasSprites();
        this.loadManualOverride();
        this.createToggleButton();
        this.listenForPreferenceChanges();
        
        // Delay initial check to allow other systems to initialize
        setTimeout(() => {
            this.checkHolidayMode();
        }, 500);
        
        // Check every 10 minutes instead of 2 (reduced CPU usage)
        this.checkInterval = setInterval(() => {
            this.checkHolidayMode();
        }, 600000);
        
        console.log('✧ Holiday Manager initialized ✧');
    }

    // ========================================
    // LISTEN FOR PREFERENCE CHANGES
    // ========================================
    listenForPreferenceChanges() {
        window.addEventListener('preferenceChanged', (e) => {
            if (e.detail.key === 'holidayEnabled') {
                if (!e.detail.value && this.isHolidayMode) {
                    this.deactivateHoliday(true); // true = with transition
                }
                this.updateToggleVisual();
            }
        });
    }

    loadManualOverride() {
        const saved = this.storage.get('holidayManualOverride');
        if (saved !== null) {
            this.manualOverride = saved;
        }
    }

    saveManualOverride() {
        if (this.manualOverride === null) {
            this.storage.remove('holidayManualOverride');
        } else {
            this.storage.set('holidayManualOverride', this.manualOverride);
        }
    }

    // ========================================
    // CREATE TOGGLE BUTTON (Snowflake)
    // ========================================
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'holiday-toggle-btn';
        this.toggleButton.id = 'holiday-toggle-btn';
        this.toggleButton.setAttribute('aria-label', 'Toggle holiday mode');
        
        this.toggleButton.innerHTML = `
            <div class="holiday-btn-bg"></div>
            <span class="material-icons holiday-icon">ac_unit</span>
            <div class="holiday-glow"></div>
            <span class="holiday-tooltip">Holiday Mode</span>
        `;
        
        // Insert to the LEFT of cat paw button
        const catPawBtn = document.getElementById('cat-paw-btn');
        if (catPawBtn?.parentNode) {
            catPawBtn.parentNode.insertBefore(this.toggleButton, catPawBtn);
        } else {
            document.body.appendChild(this.toggleButton);
        }
        
        this.updateToggleVisual();
        
        this.toggleButton.addEventListener('click', () => {
            this.toggleHolidayMode();
        });
    }

    // ========================================
    // UPDATE TOGGLE VISUAL
    // ========================================
    updateToggleVisual() {
        if (!this.toggleButton) return;
        
        const holidayEnabled = this.storage.getPreference('holidayEnabled');
        const isActive = this.isHolidayMode && holidayEnabled;
        
        this.toggleButton.classList.toggle('active', isActive);
        this.toggleButton.classList.toggle('disabled', !holidayEnabled);
    }

    // ========================================
    // TOGGLE HOLIDAY MODE
    // ========================================
    async toggleHolidayMode() {
        if (this.isTransitioning) return;
        
        const holidayEnabled = this.storage.getPreference('holidayEnabled');
        if (!holidayEnabled) {
            // Show a subtle shake animation
            this.toggleButton.classList.add('shake');
            setTimeout(() => this.toggleButton.classList.remove('shake'), 500);
            return;
        }
        
        if (this.isHolidayMode) {
            this.manualOverride = false;
            await this.deactivateHoliday(true);
        } else {
            this.manualOverride = true;
            await this.activateChristmas(true);
        }
        
        this.saveManualOverride();
        this.updateToggleVisual();
    }

    registerChristmasSprites() {
        if (!this.sitePet) return;
        
        for (const [name, config] of Object.entries(this.christmasSprites)) {
            this.sitePet.addSprite(name, config);
        }
    }

    _preloadSounds() {
        if (!this.jingleAudio) {
            this.jingleAudio = new Audio(this.christmas.sounds.jingleBells);
            this.jingleAudio.preload = 'auto';
            this.jingleAudio.volume = 0.5;
        }
        
        if (!this.transitionAudio) {
            this.transitionAudio = new Audio(this.christmas.sounds.transition);
            this.transitionAudio.preload = 'auto';
            this.transitionAudio.volume = 0.6;
        }
    }

    isWelcomeNoticeActive() {
        return this.welcomeNotice?.isActive?.();
    }

    isHolidaySeason() {
        return new Date().getMonth() === this.christmas.month;
    }

    isHolidayTimeRange() {
        const hour = new Date().getHours();
        return hour >= this.christmas.startHour && hour < this.christmas.endHour;
    }

    // ========================================
    // CHECK HOLIDAY MODE
    // ========================================
    checkHolidayMode() {
        if (this.isWelcomeNoticeActive()) return;
        if (this.isTransitioning) return;
        
        const holidayEnabled = this.storage.getPreference('holidayEnabled');
        if (!holidayEnabled) {
            if (this.isHolidayMode) {
                this.deactivateHoliday(false);
            }
            return;
        }
        
        if (this.manualOverride === true) {
            if (!this.isHolidayMode) {
                this.activateChristmas(true);
            }
            return;
        }
        
        if (this.manualOverride === false) {
            if (this.isHolidayMode) {
                this.deactivateHoliday(false);
            }
            return;
        }
        
        const inSeason = this.isHolidaySeason();
        const inTimeRange = this.isHolidayTimeRange();
        
        if (inSeason && inTimeRange && !this.isHolidayMode) {
            this.activateChristmas(false);
        } else if ((!inSeason || !inTimeRange) && this.isHolidayMode && this.manualOverride === null) {
            this.deactivateHoliday(false);
        }
    }

    // ========================================
    // ACTIVATE CHRISTMAS
    // ========================================
    async activateChristmas(instant = false) {
        if (this.isHolidayMode || this.isTransitioning) return;
        if (this.isWelcomeNoticeActive()) return;
        
        this.isTransitioning = true;
        console.log('✧ Activating Christmas Mode ✧');
        
        this.isHolidayMode = true;
        this.currentHoliday = 'christmas';
        this.holidayLock = true;
        
        if (this.sitePet) {
            this.sitePet.holidayLock = true;
        }
        
        if (!instant) {
            await this._sleep(3000);
            if (this.isWelcomeNoticeActive()) {
                this._resetState();
                return;
            }
        }
        
        this._preloadSounds();
        await this._playActivationTransition();
        
        this.storage.set('holidayMode', {
            active: true,
            holiday: 'christmas',
            sprite: this.selectedSprite,
            date: new Date().toDateString()
        });
        
        this.isTransitioning = false;
        this.updateToggleVisual();
    }

    // ========================================
    // DEACTIVATE HOLIDAY
    // ========================================
    async deactivateHoliday(withTransition = true) {
        if (!this.isHolidayMode) return;
        
        console.log('✧ Deactivating Holiday Mode ✧');
        this.isTransitioning = true;
        
        if (withTransition) {
            await this._playDeactivationTransition();
        } else {
            this._removeAllDecorations();
        }
        
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.holidayLock = false;
        this.isTransitioning = false;
        
        if (this.sitePet) {
            this.sitePet.holidayLock = false;
            this.sitePet.updateBehaviorByTime?.();
        }
        
        this.storage.remove('holidayMode');
        this.updateToggleVisual();
    }

    // ========================================
    // PLAY ACTIVATION TRANSITION
    // ========================================
    async _playActivationTransition() {
        return new Promise((resolve) => {
            this.overlay = document.createElement('div');
            this.overlay.className = 'holiday-transition-overlay';
            document.body.appendChild(this.overlay);
            
            if (this.jingleAudio) {
                this.jingleAudio.currentTime = 0;
                this.jingleAudio.play().catch(() => {});
            }
            
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
            
            setTimeout(() => {
                if (this.transitionAudio) {
                    this.transitionAudio.currentTime = 0;
                    this.transitionAudio.play().catch(() => {});
                }
                
                this.selectRandomChristmasSprite();
                this.addChristmasLights();
                this.setupConfetti();
                this.setChristmasPlaylist();
            }, 800);
            
            setTimeout(() => {
                this.overlay.classList.remove('active');
                
                setTimeout(() => {
                    this.overlay?.remove();
                    this.overlay = null;
                    resolve();
                }, 800);
            }, 2500);
        });
    }

    // ========================================
    // PLAY DEACTIVATION TRANSITION
    // ========================================
    async _playDeactivationTransition() {
        return new Promise((resolve) => {
            this.overlay = document.createElement('div');
            this.overlay.className = 'holiday-transition-overlay';
            document.body.appendChild(this.overlay);
            
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
            
            // Remove everything while dark
            setTimeout(() => {
                this._removeAllDecorations();
            }, 800);
            
            // Fade back
            setTimeout(() => {
                this.overlay.classList.remove('active');
                
                setTimeout(() => {
                    this.overlay?.remove();
                    this.overlay = null;
                    resolve();
                }, 800);
            }, 1500);
        });
    }

    // ========================================
    // REMOVE ALL DECORATIONS
    // ========================================
    _removeAllDecorations() {
        this.removeChristmasLights();
        this.removeConfetti();
        this.restoreNormalPlaylist();
    }

    _resetState() {
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.holidayLock = false;
        this.isTransitioning = false;
        
        if (this.sitePet) {
            this.sitePet.holidayLock = false;
        }
    }

    selectRandomChristmasSprite() {
        const saved = this.storage.get('holidayMode');
        const today = new Date().toDateString();
        
        if (saved?.date === today && saved?.sprite) {
            this.selectedSprite = saved.sprite;
        } else {
            const sprites = this.christmas.sprites;
            this.selectedSprite = sprites[Math.floor(Math.random() * sprites.length)];
        }
        
        if (this.sitePet) {
            this.sitePet.currentBehavior = null;
            this.sitePet.setBehavior(this.selectedSprite);
        }
    }

    addChristmasLights() {
        this.lightsContainer = document.createElement('div');
        this.lightsContainer.className = 'christmas-lights-container';
        
        const video = document.createElement('video');
        video.className = 'christmas-lights-video';
        video.src = this.christmas.decorations.lightsVideo;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        
        video.addEventListener('loadeddata', () => {
            video.play().catch(() => {});
        }, { once: true });
        
        this.lightsContainer.appendChild(video);
        document.body.appendChild(this.lightsContainer);
        document.body.classList.add('christmas-mode');
    }

    removeChristmasLights() {
        if (this.lightsContainer) {
            const video = this.lightsContainer.querySelector('video');
            if (video) {
                video.pause();
                video.src = '';
            }
            this.lightsContainer.remove();
            this.lightsContainer = null;
        }
        document.body.classList.remove('christmas-mode');
    }

    setupConfetti() {
        if (!this.sitePet?.container) return;
        
        this.confettiContainer = document.createElement('div');
        this.confettiContainer.className = 'christmas-confetti-container';
        document.body.appendChild(this.confettiContainer);
        
        this.petClickHandler = () => this.spawnConfetti();
        this.sitePet.container.addEventListener('click', this.petClickHandler);
    }

    removeConfetti() {
        if (this.confettiContainer) {
            this.confettiContainer.remove();
            this.confettiContainer = null;
        }
        
        if (this.sitePet?.container && this.petClickHandler) {
            this.sitePet.container.removeEventListener('click', this.petClickHandler);
            this.petClickHandler = null;
        }
    }

    spawnConfetti() {
        if (!this.confettiContainer) return;
        
        const petRect = this.sitePet.container.getBoundingClientRect();
        const centerX = petRect.left + petRect.width / 2;
        const centerY = petRect.top + petRect.height / 2;
        
        const count = 25 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < count; i++) {
            this._createConfettiPiece(centerX, centerY, i);
        }
        
        const audio = new Audio('./src/sound/confeti.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
    }

    _createConfettiPiece(x, y, index) {
        const confetti = document.createElement('div');
        confetti.className = 'christmas-confetti';
        
        const iconNum = Math.floor(Math.random() * this.christmas.decorations.confettiIcons) + 1;
        confetti.style.backgroundImage = `url('./src/xmas_theme/18x18_christmas_${iconNum}.png')`;
        confetti.style.left = `${x}px`;
        confetti.style.top = `${y}px`;
        
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 180 + Math.random() * 250;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 200;
        const rotation = Math.random() * 1080 - 540;
        
        confetti.style.setProperty('--vx', `${vx}px`);
        confetti.style.setProperty('--vy', `${vy}px`);
        confetti.style.setProperty('--rotation', `${rotation}deg`);
        confetti.style.animationDelay = `${index * 8}ms`;
        
        this.confettiContainer.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2000);
    }

    setChristmasPlaylist() {
        if (!this.music) return;
        
        this.savedPlaylist = this.music.playlist ? [...this.music.playlist] : [];
        this.savedTrackIndex = this.music.currentTrackIndex || 0;
        
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.christmas.playlist);
        }
    }

    restoreNormalPlaylist() {
        if (!this.music || !this.savedPlaylist) return;
        
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.savedPlaylist);
            this.music.currentTrackIndex = this.savedTrackIndex;
        }
        
        this.savedPlaylist = null;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatus() {
        return {
            isActive: this.isHolidayMode,
            holiday: this.currentHoliday,
            sprite: this.selectedSprite,
            manualOverride: this.manualOverride
        };
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.deactivateHoliday(false);
        this.toggleButton?.remove();
        
        this.jingleAudio = null;
        this.transitionAudio = null;
    }
}

export default HolidayManager;
