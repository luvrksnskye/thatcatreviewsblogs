/* =====================================================
   TIMEOFDAYMANAGER.JS - Time-based Theme Controller
   Manages morning/sunset/night themes with animated clock
   ===================================================== */

import { Utils } from './Utils.js';

export class TimeOfDayManager {
    constructor(storage, soundManager, musicPlayer) {
        this.storage = storage;
        this.sound = soundManager;
        this.musicPlayer = musicPlayer;
        
        this.currentTimeOfDay = 'morning'; // morning, sunset, night
        this.isModalOpen = false;
        this.isAnimating = false;
        
        // Time configurations
        this.timeConfig = {
            morning: {
                hours: '08',
                minutes: '30',
                label: 'Morning',
                icon: 'wb_sunny'
            },
            sunset: {
                hours: '17',
                minutes: '45',
                label: 'Sunset',
                icon: 'wb_twilight'
            },
            night: {
                hours: '22',
                minutes: '00',
                label: 'Night',
                icon: 'dark_mode'
            }
        };
        
        // Playlist configurations for each time of day
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
        // Create cat paw button
        const catPawBtn = document.createElement('button');
        catPawBtn.className = 'cat-paw-btn';
        catPawBtn.id = 'cat-paw-btn';
        catPawBtn.setAttribute('aria-label', 'Change time of day');
        catPawBtn.innerHTML = `
            <svg class="paw-icon" viewBox="0 0 512 512" fill="currentColor">
                <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
            </svg>
        `;
        
        // Insert after theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle && themeToggle.parentNode) {
            themeToggle.parentNode.insertBefore(catPawBtn, themeToggle.nextSibling);
        } else {
            document.body.appendChild(catPawBtn);
        }
        
        // Create time selection modal
        const modal = document.createElement('div');
        modal.className = 'time-modal';
        modal.id = 'time-modal';
        modal.innerHTML = `
            <div class="time-modal-backdrop"></div>
            <div class="time-modal-content">
                <div class="time-modal-header">
                    <div class="modal-cat-icon">
                        <div class="cat-svg-mask"></div>
                    </div>
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
        
        // Create clock display overlay
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
        
        // Create splash transition overlay
        const splashOverlay = document.createElement('div');
        splashOverlay.className = 'splash-overlay';
        splashOverlay.id = 'splash-overlay';
        splashOverlay.innerHTML = `
            <video 
                class="splash-video" 
                id="splash-video" 
                muted 
                playsinline 
                webkit-playsinline
                preload="auto"
            >
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
        // Cat paw button click
        this.elements.catPawBtn?.addEventListener('click', () => {
            this.playMeow();
            this.openModal();
        });
        
        // Modal close button
        this.elements.modalClose?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Modal backdrop click
        this.elements.modalBackdrop?.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Time options
        this.elements.timeOptions?.forEach(option => {
            option.addEventListener('click', () => {
                const time = option.dataset.time;
                this.selectTimeOfDay(time);
            });
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
        
        // Video ended event for Safari compatibility
        this.elements.splashVideo?.addEventListener('ended', () => {
            this.hideSplashTransition();
        });
    }

    // ========================================
    // PLAY MEOW SOUND
    // ========================================
    playMeow() {
        if (this.sound) {
            // Register meow sound if not already registered
            this.sound.register('meow', { url: './src/sound/meow.mp3', volume: 0.8 });
            this.sound.play('meow');
        }
    }

    // ========================================
    // OPEN MODAL
    // ========================================
    openModal() {
        this.isModalOpen = true;
        this.elements.modal?.classList.add('active');
        
        // Update active state for current time
        this.elements.timeOptions?.forEach(option => {
            option.classList.toggle('active', option.dataset.time === this.currentTimeOfDay);
        });
        
        // Add paw bounce animation
        this.elements.catPawBtn?.classList.add('bouncing');
        setTimeout(() => {
            this.elements.catPawBtn?.classList.remove('bouncing');
        }, 500);
    }

    // ========================================
    // CLOSE MODAL
    // ========================================
    closeModal() {
        this.isModalOpen = false;
        this.elements.modal?.classList.remove('active');
    }

    // ========================================
    // SELECT TIME OF DAY
    // ========================================
    async selectTimeOfDay(time) {
        if (this.isAnimating || time === this.currentTimeOfDay) {
            this.closeModal();
            return;
        }
        
        this.isAnimating = true;
        this.closeModal();
        
        // Play confirmation sound
        this.sound?.register('codeFinish', { url: './src/sound/UI_Code_Finish.wav', volume: 0.8 });
        this.sound?.play('codeFinish');
        
        // Short delay before showing clock
        await this.sleep(300);
        
        // Show clock animation
        await this.showClockAnimation(time);
        
        // Play countdown finish sound
        this.sound?.register('timerCountdown', { url: './src/sound/System_Timer_CountDown.wav', volume: 0.8 });
        this.sound?.play('timerCountdown');
        
        // Brief pause
        await this.sleep(500);
        
        // Show splash transition
        await this.showSplashTransition();
        
        // Apply the theme
        this.applyTimeOfDay(time);
        
        // Update music playlist using the public API
        this.updatePlaylist(time);
        
        // Save preference
        this.currentTimeOfDay = time;
        this.storage?.set('timeOfDay', time);
        
        this.isAnimating = false;
    }

    // ========================================
    // SHOW CLOCK ANIMATION
    // ========================================
    async showClockAnimation(time) {
        const config = this.timeConfig[time];
        const targetH1 = config.hours[0];
        const targetH2 = config.hours[1];
        const targetM1 = config.minutes[0];
        const targetM2 = config.minutes[1];
        
        // Set label
        if (this.elements.clockLabel) {
            this.elements.clockLabel.textContent = config.label;
        }
        
        // Show overlay
        this.elements.clockOverlay?.classList.add('active');
        
        // Register panel sound (plays ONCE at the start)
        this.sound?.register('airportPanel', { url: '/src/sound/UI_AirportPanel_Small.wav', volume: 0.6 });
        
        // Animate digits with stagger
        await this.sleep(300);
        
        // Play the sound ONCE before all digits animate
        this.sound?.play('airportPanel');
        
        // Animate all digits simultaneously (no sound per digit)
        await Promise.all([
            this.animateDigit(this.elements.digitH1, targetH1, 0),
            this.animateDigit(this.elements.digitH2, targetH2, 50),
            this.animateDigit(this.elements.digitM1, targetM1, 100),
            this.animateDigit(this.elements.digitM2, targetM2, 150)
        ]);
        
        // Hold for a moment
        await this.sleep(800);
        
        // Hide clock overlay
        this.elements.clockOverlay?.classList.remove('active');
        await this.sleep(300);
    }

    // ========================================
    // ANIMATE SINGLE DIGIT (no sound - plays once globally)
    // ========================================
    async animateDigit(element, targetValue, delay = 0) {
        if (!element) return;
        
        await this.sleep(delay);
        
        const steps = 8; // Number of flips before landing on target
        const stepDuration = 80;
        
        element.classList.add('flipping');
        
        for (let i = 0; i < steps; i++) {
            const randomDigit = Math.floor(Math.random() * 10);
            element.textContent = randomDigit;
            await this.sleep(stepDuration);
        }
        
        // Final value
        element.textContent = targetValue;
        element.classList.remove('flipping');
        element.classList.add('landed');
        
        await this.sleep(100);
        element.classList.remove('landed');
    }

    // ========================================
    // SHOW SPLASH TRANSITION
    // ========================================
    async showSplashTransition() {
        return new Promise((resolve) => {
            const video = this.elements.splashVideo;
            const overlay = this.elements.splashOverlay;
            
            if (!video || !overlay) {
                resolve();
                return;
            }
            
            // Reset video
            video.currentTime = 0;
            
            // Show overlay
            overlay.classList.add('active');
            
            // Play video with Safari compatibility
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Video started successfully
                }).catch((error) => {
                    // Autoplay was prevented, skip to end
                    console.log('Video autoplay prevented:', error);
                    this.hideSplashTransition();
                    resolve();
                });
            }
            
            // Set a timeout as fallback (2 seconds)
            setTimeout(() => {
                this.hideSplashTransition();
                resolve();
            }, 2000);
            
            // Also listen for video end
            video.onended = () => {
                this.hideSplashTransition();
                resolve();
            };
        });
    }

    // ========================================
    // HIDE SPLASH TRANSITION
    // ========================================
    hideSplashTransition() {
        this.elements.splashOverlay?.classList.remove('active');
        if (this.elements.splashVideo) {
            this.elements.splashVideo.pause();
            this.elements.splashVideo.currentTime = 0;
        }
    }

    // ========================================
    // APPLY TIME OF DAY THEME
    // ========================================
    applyTimeOfDay(time) {
        // Remove all time classes
        document.documentElement.classList.remove('time-morning', 'time-sunset', 'time-night');
        
        // Add new time class
        document.documentElement.classList.add(`time-${time}`);
    }

  updatePlaylist(time) {
    if (!this.musicPlayer) {
        console.warn('MusicPlayer not available for playlist update');
        return;
    }
    
    const playlist = this.playlists[time];
    if (!playlist || playlist.length === 0) {
        console.warn(`No playlist found for time: ${time}`);
        return;
    }
    
    // Check if music was playing before the change
    const wasPlaying = this.musicPlayer.isPlaying; // USAR LA PROPIEDAD DIRECTA
    
    // Use the public API to update playlist
    if (typeof this.musicPlayer.setPlaylist === 'function') {
        this.musicPlayer.setPlaylist(playlist, wasPlaying);
    }
    
    console.log(`Playlist updated to ${time}: ${playlist.length} tracks`);
}

    // ========================================
    // GET PLAYLIST FOR TIME
    // ========================================
    getPlaylistForTime(time) {
        return this.playlists[time] || [];
    }

    // ========================================
    // SET CUSTOM PLAYLIST FOR TIME
    // ========================================
    setPlaylistForTime(time, playlist) {
        if (!['morning', 'sunset', 'night'].includes(time)) {
            console.warn(`Invalid time: ${time}`);
            return;
        }
        
        this.playlists[time] = [...playlist];
        
        // If this is the current time, update the music player
        if (time === this.currentTimeOfDay) {
            this.updatePlaylist(time);
        }
    }

    // ========================================
    // LOAD SAVED TIME OF DAY
    // ========================================
    loadSavedTimeOfDay() {
        const savedTime = this.storage?.get('timeOfDay');
        
        if (savedTime && ['morning', 'sunset', 'night'].includes(savedTime)) {
            this.currentTimeOfDay = savedTime;
            this.applyTimeOfDay(savedTime);
            this.updatePlaylist(savedTime);
        } else {
            // Default to morning or detect based on actual time
            const hour = new Date().getHours();
            let defaultTime = 'morning';
            
            if (hour >= 6 && hour < 12) {
                defaultTime = 'morning';
            } else if (hour >= 12 && hour < 19) {
                defaultTime = 'sunset';
            } else {
                defaultTime = 'night';
            }
            
            this.currentTimeOfDay = defaultTime;
            this.applyTimeOfDay(defaultTime);
            this.updatePlaylist(defaultTime);
        }
    }

    // ========================================
    // UTILITY: SLEEP
    // ========================================
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // GET CURRENT TIME OF DAY
    // ========================================
    getTimeOfDay() {
        return this.currentTimeOfDay;
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        // Remove created elements
        this.elements.catPawBtn?.remove();
        this.elements.modal?.remove();
        this.elements.clockOverlay?.remove();
        this.elements.splashOverlay?.remove();
    }
}

export default TimeOfDayManager;
