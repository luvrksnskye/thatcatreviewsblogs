/* =====================================================
   HOLIDAYMANAGER.JS - Seasonal Controller (OPTIMIZED)
   Lazy loading, reduced intervals, efficient transitions
   ===================================================== */

export class HolidayManager {
    constructor(storage, sound, music, sitePet, welcomeNotice = null) {
        this.storage = storage;
        this.sound = sound;
        this.music = music;
        this.sitePet = sitePet;
        this.welcomeNotice = welcomeNotice;
        
        // State
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.selectedSprite = null;
        this.isTransitioning = false;
        this.manualOverride = null;
        
        // Christmas config
        this.christmas = {
            month: 11, // December
            startHour: 0,
            endHour: 10,
            sprites: ['christmasCute', 'christmasHat'],
            playlist: [
                { id: 'xmas-1', title: "It's Beginning To Look Like Christmas", artist: 'Holiday Music', duration: '3:00', src: './src/bgm_xmas/xmas.mp3' }
            ],
            lightsVideo: './src/xmas_theme/Christmas Lights With Snow V3 -  By ViperVex.webm'
        };
        
        // DOM elements (created on demand)
        this.toggleButton = null;
        this.lightsContainer = null;
        this.overlay = null;
        
        // Saved state
        this.savedPlaylist = null;
        
        this._checkInterval = null;
    }

    init() {
        this._registerSprites();
        this._loadManualOverride();
        this._createToggleButton();
        this._listenForPreferences();
        
        // Delayed initial check
        setTimeout(() => this._checkHolidayMode(), 500);
        
        // Check every 10 minutes instead of 2 minutes
        this._checkInterval = setInterval(() => {
            this._checkHolidayMode();
        }, 600000);
        
        console.log('✧ Holiday Manager initialized (optimized) ✧');
    }

    _registerSprites() {
        if (!this.sitePet) return;
        
        this.sitePet.addSprite('christmasCute', {
            path: './src/site_pet_sprites/kitty_xmas_cute.svg',
            width: 2000, height: 2000, columns: 2, rows: 2,
            totalFrames: 3, displayWidth: 200, displayHeight: 200, bottom: -20,
            thoughts: ["Happy holidays~!", "I love the snow!"]
        });
        
        this.sitePet.addSprite('christmasHat', {
            path: './src/site_pet_sprites/kitty_xmas_hat.svg',
            width: 2000, height: 2000, columns: 2, rows: 2,
            totalFrames: 4, displayWidth: 200, displayHeight: 200, bottom: -20,
            thoughts: ["Merry Christmas!", "Where are the presents?"]
        });
    }

    _loadManualOverride() {
        this.manualOverride = this.storage.get('holidayManualOverride');
    }

    _saveManualOverride() {
        if (this.manualOverride === null) {
            this.storage.remove('holidayManualOverride');
        } else {
            this.storage.set('holidayManualOverride', this.manualOverride);
        }
    }

    _listenForPreferences() {
        window.addEventListener('preferenceChanged', (e) => {
            if (e.detail.key === 'holidayEnabled') {
                if (!e.detail.value && this.isHolidayMode) {
                    this._deactivateHoliday(true);
                }
                this._updateToggleVisual();
            }
        });
    }

    _createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'holiday-toggle-btn';
        this.toggleButton.id = 'holiday-toggle-btn';
        this.toggleButton.setAttribute('aria-label', 'Toggle holiday mode');
        
        this.toggleButton.innerHTML = `
            <div class="holiday-btn-bg"></div>
            <span class="material-icons holiday-icon">ac_unit</span>
            <span class="holiday-tooltip">Holiday Mode</span>
        `;
        
        const catPawBtn = document.getElementById('cat-paw-btn');
        if (catPawBtn?.parentNode) {
            catPawBtn.parentNode.insertBefore(this.toggleButton, catPawBtn);
        }
        
        this._updateToggleVisual();
        this.toggleButton.addEventListener('click', () => this._toggleHolidayMode());
    }

    _updateToggleVisual() {
        if (!this.toggleButton) return;
        
        const enabled = this.storage.getPreference('holidayEnabled');
        this.toggleButton.classList.toggle('active', this.isHolidayMode && enabled);
        this.toggleButton.classList.toggle('disabled', !enabled);
    }

    async _toggleHolidayMode() {
        if (this.isTransitioning) return;
        
        const enabled = this.storage.getPreference('holidayEnabled');
        if (!enabled) {
            this.toggleButton?.classList.add('shake');
            setTimeout(() => this.toggleButton?.classList.remove('shake'), 500);
            return;
        }
        
        if (this.isHolidayMode) {
            this.manualOverride = false;
            await this._deactivateHoliday(true);
        } else {
            this.manualOverride = true;
            await this._activateChristmas(true);
        }
        
        this._saveManualOverride();
        this._updateToggleVisual();
    }

    _checkHolidayMode() {
        if (this.welcomeNotice?.isActive?.()) return;
        if (this.isTransitioning) return;
        
        const enabled = this.storage.getPreference('holidayEnabled');
        if (!enabled) {
            if (this.isHolidayMode) this._deactivateHoliday(false);
            return;
        }
        
        // Manual override takes priority
        if (this.manualOverride === true && !this.isHolidayMode) {
            this._activateChristmas(false);
            return;
        }
        
        if (this.manualOverride === false && this.isHolidayMode) {
            this._deactivateHoliday(false);
            return;
        }
        
        // Auto-check based on date/time
        if (this.manualOverride === null) {
            const isChristmasSeason = new Date().getMonth() === this.christmas.month;
            const hour = new Date().getHours();
            const isTimeRange = hour >= this.christmas.startHour && hour < this.christmas.endHour;
            
            if (isChristmasSeason && isTimeRange && !this.isHolidayMode) {
                this._activateChristmas(false);
            } else if ((!isChristmasSeason || !isTimeRange) && this.isHolidayMode) {
                this._deactivateHoliday(false);
            }
        }
    }

    async _activateChristmas(withTransition = true) {
        if (this.isHolidayMode || this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        if (withTransition) {
            await this._playTransition();
        }
        
        this.isHolidayMode = true;
        this.currentHoliday = 'christmas';
        
        // Select random sprite
        const sprites = this.christmas.sprites;
        this.selectedSprite = sprites[Math.floor(Math.random() * sprites.length)];
        
        // Update pet
        if (this.sitePet) {
            this.sitePet.holidayLock = true;
            this.sitePet.currentBehavior = null;
            this.sitePet.setBehavior(this.selectedSprite);
        }
        
        // Add lights
        this._addChristmasLights();
        
        // Update playlist
        this._setChristmasPlaylist();
        
        // Save state
        this.storage.set('holidayMode', {
            date: new Date().toDateString(),
            sprite: this.selectedSprite
        });
        
        this.isTransitioning = false;
        this._updateToggleVisual();
        
        console.log('✧ Christmas mode activated ✧');
    }

    async _deactivateHoliday(withTransition = true) {
        if (!this.isHolidayMode || this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        if (withTransition) {
            await this._playTransition();
        }
        
        // Remove decorations
        this._removeChristmasLights();
        this._restorePlaylist();
        
        // Reset pet
        if (this.sitePet) {
            this.sitePet.holidayLock = false;
            this.sitePet.updateBehaviorByTime();
        }
        
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.selectedSprite = null;
        this.isTransitioning = false;
        
        this._updateToggleVisual();
        
        console.log('✧ Holiday mode deactivated ✧');
    }

    async _playTransition() {
        return new Promise(resolve => {
            this.overlay = document.createElement('div');
            this.overlay.className = 'holiday-transition-overlay';
            document.body.appendChild(this.overlay);
            
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
            
            setTimeout(() => {
                this.overlay.classList.remove('active');
                setTimeout(() => {
                    this.overlay?.remove();
                    this.overlay = null;
                    resolve();
                }, 600);
            }, 800);
        });
    }

    _addChristmasLights() {
        if (this.lightsContainer) return;
        
        this.lightsContainer = document.createElement('div');
        this.lightsContainer.className = 'christmas-lights-container';
        
        const video = document.createElement('video');
        video.className = 'christmas-lights-video';
        video.src = this.christmas.lightsVideo;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        
        video.addEventListener('loadeddata', () => {
            video.play().catch(() => {});
        }, { once: true });
        
        this.lightsContainer.appendChild(video);
        document.body.appendChild(this.lightsContainer);
        document.body.classList.add('christmas-mode');
    }

    _removeChristmasLights() {
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

    _setChristmasPlaylist() {
        if (!this.music) return;
        
        this.savedPlaylist = this.music.playlist ? [...this.music.playlist] : [];
        
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.christmas.playlist);
        }
    }

    _restorePlaylist() {
        if (!this.music || !this.savedPlaylist) return;
        
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.savedPlaylist);
        }
        
        this.savedPlaylist = null;
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
        if (this._checkInterval) {
            clearInterval(this._checkInterval);
        }
        
        this._removeChristmasLights();
        this.toggleButton?.remove();
        this.overlay?.remove();
    }
}

export default HolidayManager;
