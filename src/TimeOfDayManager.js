/* =====================================================
   TIMEOFDAYMANAGER.JS - Time-based Theme (OPTIMIZED)
   Lazy element creation, efficient transitions
   ===================================================== */

export class TimeOfDayManager {
    constructor(storage, soundManager, musicPlayer) {
        this.storage = storage;
        this.sound = soundManager;
        this.musicPlayer = musicPlayer;
        this.welcomeNotice = null;
        
        this.currentTimeOfDay = 'morning';
        this.isModalOpen = false;
        this.isAnimating = false;
        
        // Time configs
        this.timeConfig = {
            morning: { hours: '08', minutes: '30', label: 'Morning', icon: 'wb_sunny' },
            sunset: { hours: '17', minutes: '45', label: 'Sunset', icon: 'wb_twilight' },
            night: { hours: '22', minutes: '00', label: 'Night', icon: 'dark_mode' }
        };
        
        // Playlists
        this.playlists = {
            morning: [
                { id: 'morning-1', title: 'Peace and Tranquility', artist: 'A Hat in Time', duration: '15:00', src: './src/bgm/Peace_and_Tranquility.mp3' }
            ],
            sunset: [
                { id: 'sunset-1', title: 'Crossroads', artist: 'OMORI', duration: '2:09', src: './src/bgm/fat_sunset.mp3' }
            ],
            night: [
                { id: 'night-1', title: 'Sugar Star Planetarium', artist: 'OMORI', duration: '2:14', src: './src/bgm/sugar_star.mp3' }
            ]
        };
        
        this.elements = {};
    }

    setWelcomeNotice(welcomeNotice) {
        this.welcomeNotice = welcomeNotice;
    }

    init() {
        this._createElements();
        this._cacheElements();
        this._setupEventListeners();
        this._loadSavedTimeOfDay();
        
        console.log('✧ Time of Day Manager initialized ✧');
    }

    _createElements() {
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'control-buttons-container';
        btnContainer.id = 'control-buttons-container';
        
        // Cat paw button
        const catPawBtn = document.createElement('button');
        catPawBtn.className = 'cat-paw-btn';
        catPawBtn.id = 'cat-paw-btn';
        catPawBtn.innerHTML = `
            <svg class="paw-icon" viewBox="0 0 512 512" fill="currentColor">
                <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
            </svg>
        `;
        
        // Settings button
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'settings-btn';
        settingsBtn.id = 'settings-btn';
        settingsBtn.innerHTML = `
            <div class="settings-btn-bg"></div>
            <span class="material-icons settings-icon">settings</span>
            <span class="settings-tooltip">Settings</span>
        `;
        
        // Insert after theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle?.parentNode) {
            themeToggle.parentNode.insertBefore(btnContainer, themeToggle.nextSibling);
        } else {
            document.body.appendChild(btnContainer);
        }
        
        btnContainer.appendChild(catPawBtn);
        btnContainer.appendChild(settingsBtn);
    }

    _cacheElements() {
        this.elements = {
            catPawBtn: document.getElementById('cat-paw-btn'),
            settingsBtn: document.getElementById('settings-btn')
        };
    }

    _setupEventListeners() {
        this.elements.catPawBtn?.addEventListener('click', () => this.openModal());
        this.elements.settingsBtn?.addEventListener('click', () => {
            this.welcomeNotice?.showPreferencesPanel();
            this.sound?.play('click');
        });
    }

    openModal() {
        if (this.isModalOpen || this.isAnimating) return;
        
        // Lazy create modal
        this._createModal();
        
        this.isModalOpen = true;
        this.elements.modal?.classList.add('active');
        this.sound?.play('toggle');
    }

    _createModal() {
        if (this.elements.modal) return;
        
        const modal = document.createElement('div');
        modal.className = 'time-modal';
        modal.id = 'time-modal';
        modal.innerHTML = `
            <div class="time-modal-backdrop"></div>
            <div class="time-modal-content">
                <div class="time-modal-header">
                    <h3>What time is it?</h3>
                    <p>Choose your preferred time of day</p>
                </div>
                <div class="time-options">
                    <button class="time-option" data-time="morning">
                        <span class="material-icons">wb_sunny</span>
                        <span class="time-label">Morning</span>
                    </button>
                    <button class="time-option" data-time="sunset">
                        <span class="material-icons">wb_twilight</span>
                        <span class="time-label">Sunset</span>
                    </button>
                    <button class="time-option" data-time="night">
                        <span class="material-icons">dark_mode</span>
                        <span class="time-label">Night</span>
                    </button>
                </div>
                <button class="time-modal-close" id="time-modal-close">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.elements.modal = modal;
        
        // Event listeners
        modal.querySelector('.time-modal-backdrop')
            ?.addEventListener('click', () => this.closeModal());
        modal.querySelector('#time-modal-close')
            ?.addEventListener('click', () => this.closeModal());
        
        modal.querySelectorAll('.time-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTimeOfDay(btn.dataset.time);
            });
        });
        
        // Mark current time
        this._updateModalSelection();
    }

    _updateModalSelection() {
        this.elements.modal?.querySelectorAll('.time-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.time === this.currentTimeOfDay);
        });
    }

    closeModal() {
        if (!this.isModalOpen) return;
        
        this.elements.modal?.classList.remove('active');
        this.isModalOpen = false;
        this.sound?.play('click');
    }

    async selectTimeOfDay(time) {
        if (this.isAnimating || time === this.currentTimeOfDay) {
            this.closeModal();
            return;
        }
        
        this.isAnimating = true;
        this.closeModal();
        
        this.sound?.play('toggle');
        
        // Simple transition
        document.body.classList.add('time-transitioning');
        
        await this._sleep(300);
        
        this._applyTimeOfDay(time);
        this._updatePlaylist(time);
        
        this.currentTimeOfDay = time;
        this.storage?.set('timeOfDay', time);
        
        await this._sleep(300);
        
        document.body.classList.remove('time-transitioning');
        this.isAnimating = false;
    }

    _applyTimeOfDay(time) {
        document.documentElement.classList.remove('time-morning', 'time-sunset', 'time-night');
        document.documentElement.classList.add(`time-${time}`);
    }

    _updatePlaylist(time) {
        if (!this.musicPlayer) return;
        
        const playlist = this.playlists[time];
        if (!playlist?.length) return;
        
        const wasPlaying = this.musicPlayer.isPlaying;
        
        if (this.musicPlayer.setPlaylist) {
            this.musicPlayer.setPlaylist(playlist, wasPlaying);
        }
    }

    _loadSavedTimeOfDay() {
        const saved = this.storage?.get('timeOfDay');
        
        if (saved && ['morning', 'sunset', 'night'].includes(saved)) {
            this.currentTimeOfDay = saved;
        } else {
            // Auto-detect based on current hour
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 12) this.currentTimeOfDay = 'morning';
            else if (hour >= 12 && hour < 19) this.currentTimeOfDay = 'sunset';
            else this.currentTimeOfDay = 'night';
        }
        
        this._applyTimeOfDay(this.currentTimeOfDay);
        this._updatePlaylist(this.currentTimeOfDay);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTimeOfDay() {
        return this.currentTimeOfDay;
    }

    getPlaylistForTime(time) {
        return this.playlists[time] || [];
    }

    destroy() {
        this.elements.catPawBtn?.remove();
        this.elements.settingsBtn?.remove();
        this.elements.modal?.remove();
        document.getElementById('control-buttons-container')?.remove();
    }
}

export default TimeOfDayManager;
