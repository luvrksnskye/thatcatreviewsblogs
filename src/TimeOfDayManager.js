/* =====================================================
   TIMEOFDAYMANAGER.JS - Time-based Theme Controller
   Manages morning/sunset/night themes with settings button
   ===================================================== */

export class TimeOfDayManager {
    constructor(storage, soundManager, musicPlayer) {
        this.storage = storage;
        this.sound = soundManager;
        this.musicPlayer = musicPlayer;
        
        // Reference to welcome notice manager (set externally)
        this.welcomeNotice = null;
        
        this.currentTimeOfDay = 'morning';
        this.isModalOpen = false;
        this.isAnimating = false;
        
        // Time configurations
        this.timeConfig = {
            morning: { hours: '08', minutes: '30', label: 'Morning', icon: 'wb_sunny' },
            sunset: { hours: '17', minutes: '45', label: 'Sunset', icon: 'wb_twilight' },
            night: { hours: '22', minutes: '00', label: 'Night', icon: 'dark_mode' }
        };
        
        // Playlists
        this.playlists = {
            morning: [
                { id: 'morning-1', title: 'Peace and Tranquility', artist: 'A Hat in Time', duration: '15:00', src: './src/bgm/Peace_and_Tranquility.mp3' },
                { id: 'morning-2', title: 'Poems In The Fog', artist: 'OMORI', duration: '1:50', src: './src/bgm/fog.mp3' },
                { id: 'morning-3', title: 'A Home For Flowers (Sunflower)', artist: 'OMORI', duration: '1:25', src: './src/bgm/sunflower.mp3' }
            ],
            sunset: [
                { id: 'sunset-1', title: 'Crossroads', artist: 'OMORI', duration: '2:09', src: './src/bgm/fat_sunset.mp3' },
                { id: 'sunset-2', title: 'A Home For Flowers (Daisy)', artist: 'OMORI', duration: '1:20', src: './src/bgm/daisy.mp3' },
                { id: 'sunset-3', title: '12 AM', artist: 'Animal Crossing New Horizons', duration: '2:40', src: './src/bgm/12_AM.mp3' }
            ],
            night: [
                { id: 'night-1', title: 'A Home For Flowers (Empty)', artist: 'OMORI', duration: '1:16', src: './src/bgm/Empty.mp3' },
                { id: 'night-2', title: 'Sugar Star Planetarium', artist: 'OMORI', duration: '2:14', src: './src/bgm/sugar_star.mp3' },
                { id: 'night-3', title: 'Space Junk Road', artist: 'Mario Galaxy', duration: '3:21', src: './src/bgm/space_junk_road.mp3' },
                { id: 'night-4', title: '2 AM', artist: 'Animal Crossing New Horizons', duration: '3:42', src: './src/bgm/2_AM.mp3' },
                { id: 'night-5', title: 'Festivale', artist: 'Animal Crossing New Horizons', duration: '2:06', src: './src/bgm/Fireworks Show ACNH.mp3' }
            ]
        };
        
        this.elements = {};
    }

    // ========================================
    // SET WELCOME NOTICE REFERENCE
    // ========================================
    setWelcomeNotice(welcomeNotice) {
        this.welcomeNotice = welcomeNotice;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.createElements();
        this.cacheElements();
        this.setupEventListeners();
        this.loadSavedTimeOfDay();
        console.log('✧ Time of Day Manager initialized ✧');
    }

    // ========================================
    // CREATE DOM ELEMENTS
    // ========================================
    createElements() {
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.className = 'control-buttons-container';
        btnContainer.id = 'control-buttons-container';
        
        // Cat paw button (center)
        const catPawBtn = document.createElement('button');
        catPawBtn.className = 'cat-paw-btn';
        catPawBtn.id = 'cat-paw-btn';
        catPawBtn.setAttribute('aria-label', 'Change time of day');
        catPawBtn.innerHTML = `
            <svg class="paw-icon" viewBox="0 0 512 512" fill="currentColor">
                <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
            </svg>
        `;
        
        // Settings button (right of paw)
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'settings-btn';
        settingsBtn.id = 'settings-btn';
        settingsBtn.setAttribute('aria-label', 'Open settings');
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
        
        // Add buttons to container (Holiday button will be added by HolidayManager)
        btnContainer.appendChild(catPawBtn);
        btnContainer.appendChild(settingsBtn);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'time-modal';
        modal.id = 'time-modal';
        modal.innerHTML = `
            <div class="time-modal-backdrop"></div>
            <div class="time-modal-content">
                <div class="time-modal-header">
                    <div class="modal-cat-icon"><div class="cat-svg-mask"></div></div>
                    <h3>What time is it?</h3>
                    <p>Choose your preferred time of day</p>
                </div>
                <div class="time-options">
                    <button class="time-option" data-time="morning">
                        <span class="material-icons">wb_sunny</span>
                        <span class="time-label">Morning</span>
                        <span class="time-range">6:00 - 12:00</span>
                    </button>
                    <button class="time-option" data-time="sunset">
                        <span class="material-icons">wb_twilight</span>
                        <span class="time-label">Sunset</span>
                        <span class="time-range">12:00 - 19:00</span>
                    </button>
                    <button class="time-option" data-time="night">
                        <span class="material-icons">dark_mode</span>
                        <span class="time-label">Night</span>
                        <span class="time-range">19:00 - 6:00</span>
                    </button>
                </div>
                <button class="time-modal-close" id="time-modal-close">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Clock overlay
        const clockOverlay = document.createElement('div');
        clockOverlay.className = 'clock-overlay';
        clockOverlay.id = 'clock-overlay';
        clockOverlay.innerHTML = `
            <div class="clock-display">
                <div class="clock-digits">
                    <div class="digit-group hours">
                        <div class="digit" id="digit-h1">0</div>
                        <div class="digit" id="digit-h2">0</div>
                    </div>
                    <div class="clock-separator">:</div>
                    <div class="digit-group minutes">
                        <div class="digit" id="digit-m1">0</div>
                        <div class="digit" id="digit-m2">0</div>
                    </div>
                </div>
                <div class="clock-label" id="clock-label">Morning</div>
            </div>
        `;
        document.body.appendChild(clockOverlay);
        
        // Splash overlay
        const splashOverlay = document.createElement('div');
        splashOverlay.className = 'splash-overlay';
        splashOverlay.id = 'splash-overlay';
        splashOverlay.innerHTML = `
            <video class="splash-video" id="splash-video" muted playsinline webkit-playsinline preload="none">
                <source src="./src/assets/splash.webm" type="video/webm">
            </video>
        `;
        document.body.appendChild(splashOverlay);
    }

    // ========================================
    // CACHE ELEMENTS
    // ========================================
    cacheElements() {
        this.elements = {
            catPawBtn: document.getElementById('cat-paw-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            modal: document.getElementById('time-modal'),
            modalClose: document.getElementById('time-modal-close'),
            modalBackdrop: document.querySelector('.time-modal-backdrop'),
            timeOptions: document.querySelectorAll('.time-option'),
            clockOverlay: document.getElementById('clock-overlay'),
            clockLabel: document.getElementById('clock-label'),
            splashOverlay: document.getElementById('splash-overlay'),
            splashVideo: document.getElementById('splash-video'),
            digitH1: document.getElementById('digit-h1'),
            digitH2: document.getElementById('digit-h2'),
            digitM1: document.getElementById('digit-m1'),
            digitM2: document.getElementById('digit-m2')
        };
    }

    // ========================================
    // SETUP EVENT LISTENERS
    // ========================================
    setupEventListeners() {
        this.elements.catPawBtn?.addEventListener('click', () => {
            this._playMeow();
            this.openModal();
        });
        
        // Settings button opens preferences panel
        this.elements.settingsBtn?.addEventListener('click', () => {
            this._playClick();
            if (this.welcomeNotice) {
                this.welcomeNotice.showPreferencesPanel();
            }
        });
        
        this.elements.modalClose?.addEventListener('click', () => this.closeModal());
        this.elements.modalBackdrop?.addEventListener('click', () => this.closeModal());
        
        this.elements.timeOptions?.forEach(option => {
            option.addEventListener('click', () => {
                this.selectTimeOfDay(option.dataset.time);
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    }

    _playMeow() {
        if (this.sound) {
            this.sound.register('meow', { url: './src/sound/meow.mp3', volume: 0.8 });
            this.sound.play('meow');
        }
    }

    _playClick() {
        if (this.sound) {
            this.sound.register('click', { url: './src/sound/UI_Check.wav', volume: 0.5 });
            this.sound.play('click');
        }
    }

    openModal() {
        this.isModalOpen = true;
        this.elements.modal?.classList.add('active');
        
        this.elements.timeOptions?.forEach(option => {
            option.classList.toggle('active', option.dataset.time === this.currentTimeOfDay);
        });
        
        this.elements.catPawBtn?.classList.add('bouncing');
        setTimeout(() => this.elements.catPawBtn?.classList.remove('bouncing'), 500);
    }

    closeModal() {
        this.isModalOpen = false;
        this.elements.modal?.classList.remove('active');
    }

    async selectTimeOfDay(time) {
        if (this.isAnimating || time === this.currentTimeOfDay) {
            this.closeModal();
            return;
        }
        
        this.isAnimating = true;
        this.closeModal();
        
        this.sound?.register('codeFinish', { url: './src/sound/UI_Code_Finish.wav', volume: 0.8 });
        this.sound?.play('codeFinish');
        
        await this._sleep(250);
        await this._showClockAnimation(time);
        
        this.sound?.register('timerCountdown', { url: './src/sound/System_Timer_CountDown.wav', volume: 0.8 });
        this.sound?.play('timerCountdown');
        
        await this._sleep(400);
        await this._showSplashTransition();
        
        this._applyTimeOfDay(time);
        this._updatePlaylist(time);
        
        this.currentTimeOfDay = time;
        this.storage?.set('timeOfDay', time);
        
        this.isAnimating = false;
    }

    async _showClockAnimation(time) {
        const config = this.timeConfig[time];
        
        if (this.elements.clockLabel) {
            this.elements.clockLabel.textContent = config.label;
        }
        
        this.elements.clockOverlay?.classList.add('active');
        
        this.sound?.register('airportPanel', { url: './src/sound/UI_AirportPanel_Small.wav', volume: 0.6 });
        
        await this._sleep(250);
        this.sound?.play('airportPanel');
        
        await Promise.all([
            this._animateDigit(this.elements.digitH1, config.hours[0], 0),
            this._animateDigit(this.elements.digitH2, config.hours[1], 40),
            this._animateDigit(this.elements.digitM1, config.minutes[0], 80),
            this._animateDigit(this.elements.digitM2, config.minutes[1], 120)
        ]);
        
        await this._sleep(600);
        this.elements.clockOverlay?.classList.remove('active');
        await this._sleep(250);
    }

    async _animateDigit(element, targetValue, delay = 0) {
        if (!element) return;
        
        await this._sleep(delay);
        
        const steps = 6;
        const stepDuration = 60;
        
        element.classList.add('flipping');
        
        for (let i = 0; i < steps; i++) {
            element.textContent = Math.floor(Math.random() * 10);
            await this._sleep(stepDuration);
        }
        
        element.textContent = targetValue;
        element.classList.remove('flipping');
        element.classList.add('landed');
        
        await this._sleep(80);
        element.classList.remove('landed');
    }

    async _showSplashTransition() {
        return new Promise((resolve) => {
            const video = this.elements.splashVideo;
            const overlay = this.elements.splashOverlay;
            
            if (!video || !overlay) {
                resolve();
                return;
            }
            
            video.currentTime = 0;
            overlay.classList.add('active');
            
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    this._hideSplashTransition();
                    resolve();
                });
            }
            
            const timeout = setTimeout(() => {
                this._hideSplashTransition();
                resolve();
            }, 1800);
            
            video.onended = () => {
                clearTimeout(timeout);
                this._hideSplashTransition();
                resolve();
            };
        });
    }

    _hideSplashTransition() {
        this.elements.splashOverlay?.classList.remove('active');
        if (this.elements.splashVideo) {
            this.elements.splashVideo.pause();
            this.elements.splashVideo.currentTime = 0;
        }
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
        
        if (typeof this.musicPlayer.setPlaylist === 'function') {
            this.musicPlayer.setPlaylist(playlist, wasPlaying);
        }
    }

    getPlaylistForTime(time) {
        return this.playlists[time] || [];
    }

    setPlaylistForTime(time, playlist) {
        if (!['morning', 'sunset', 'night'].includes(time)) return;
        
        this.playlists[time] = [...playlist];
        
        if (time === this.currentTimeOfDay) {
            this._updatePlaylist(time);
        }
    }

    loadSavedTimeOfDay() {
        const savedTime = this.storage?.get('timeOfDay');
        
        if (savedTime && ['morning', 'sunset', 'night'].includes(savedTime)) {
            this.currentTimeOfDay = savedTime;
            this._applyTimeOfDay(savedTime);
            this._updatePlaylist(savedTime);
        } else {
            const hour = new Date().getHours();
            let defaultTime = 'morning';
            
            if (hour >= 6 && hour < 12) defaultTime = 'morning';
            else if (hour >= 12 && hour < 19) defaultTime = 'sunset';
            else defaultTime = 'night';
            
            this.currentTimeOfDay = defaultTime;
            this._applyTimeOfDay(defaultTime);
            this._updatePlaylist(defaultTime);
        }
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTimeOfDay() {
        return this.currentTimeOfDay;
    }

    destroy() {
        this.elements.catPawBtn?.remove();
        this.elements.settingsBtn?.remove();
        this.elements.modal?.remove();
        this.elements.clockOverlay?.remove();
        this.elements.splashOverlay?.remove();
        document.getElementById('control-buttons-container')?.remove();
    }
}

export default TimeOfDayManager;
