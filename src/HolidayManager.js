/* =====================================================
   HOLIDAYMANAGER.JS - Seasonal Holiday Controller
   Manages Christmas mode: sprites, music, decorations
   Active: December 1-31, 12:00 AM - 10:00 AM
   ===================================================== */

export class HolidayManager {
    constructor(storage, sound, music, sitePet) {
        this.storage = storage;
        this.sound = sound;
        this.music = music;
        this.sitePet = sitePet;
        
        // Holiday state
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.selectedSprite = null;
        this.holidayLock = false; // Prevents normal schedule from overriding
        
        // Christmas config
        this.christmas = {
            month: 11, // December (0-indexed)
            startHour: 0,  // 12:00 AM
            endHour: 10,   // 10:00 AM
            sprites: ['christmasCute', 'christmasHat'],
            sounds: {
                jingleBells: './src/sound/jingle-bells.mp3',
                transition: './src/sound/christmas-transition.mp3'
            },
            playlist: [
                { id: 'xmas-1', title: "It's Beginning To Look A Lot Like Christmas", artist: 'Holiday Music', duration: '3:00', src: './src/bgm_xmas/xmas.mp3' },
                // Agrega más canciones aquí con el mismo formato:
                // { id: 'xmas-2', title: 'Nombre de la canción', artist: 'Holiday Music', duration: '0:00', src: './src/bgm_xmas/archivo.mp3' },
            ],
            decorations: {
                lightsVideo: './src/xmas_theme/Christmas Lights With Snow V3 -  By ViperVex.webm',
                confettiIcons: 12
            }
        };
        
        // Sprite configurations for Christmas
        this.christmasSprites = {
            christmasCute: {
                path: './src/site_pet_sprites/kitty_xmas_cute.svg',
                width: 2000,
                height: 2000,
                columns: 2,
                rows: 2,
                totalFrames: 3,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -20,
                thoughts: [
                    "Happy holidays~!",
                    "I love the snow!",
                    "So warm and cozy...",
                    "Jingle jingle~",
                    "Best time of the year!"
                ]
            },
            christmasHat: {
                path: './src/site_pet_sprites/kitty_xmas_hat.svg',
                width: 2000,
                height: 2000,
                columns: 2,
                rows: 2,
                totalFrames: 4,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -20,
                thoughts: [
                    "Merry Christmas!",
                    "Where are the presents?",
                    "This scarf is so warm~",
                ]
            }
        };
        
        // DOM elements
        this.overlay = null;
        this.lightsContainer = null;
        this.confettiContainer = null;
        
        // Confetti state
        this.confettiActive = false;
        
        // Audio elements
        this.jingleAudio = null;
        this.transitionAudio = null;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        // Register Christmas sprites with SitePetManager
        this.registerChristmasSprites();
        
        // Preload sounds
        this.preloadSounds();
        
        // Check if we should activate holiday mode
        this.checkHolidayMode();
        
        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkHolidayMode();
        }, 60000);
        
        console.log('✧ Holiday Manager initialized ✧');
    }

    // ========================================
    // REGISTER CHRISTMAS SPRITES
    // ========================================
    registerChristmasSprites() {
        if (!this.sitePet) return;
        
        Object.entries(this.christmasSprites).forEach(([name, config]) => {
            this.sitePet.addSprite(name, config);
        });
    }

    // ========================================
    // PRELOAD SOUNDS
    // ========================================
    preloadSounds() {
        this.jingleAudio = new Audio(this.christmas.sounds.jingleBells);
        this.jingleAudio.preload = 'auto';
        this.jingleAudio.volume = 0.5;
        
        this.transitionAudio = new Audio(this.christmas.sounds.transition);
        this.transitionAudio.preload = 'auto';
        this.transitionAudio.volume = 0.6;
    }

    // ========================================
    // CHECK HOLIDAY MODE
    // ========================================
    checkHolidayMode() {
        const now = new Date();
        const month = now.getMonth();
        const hour = now.getHours();
        const day = now.getDate();
        
        // Check Christmas (December, 12AM - 10AM)
        if (month === this.christmas.month) {
            const inTimeRange = hour >= this.christmas.startHour && hour < this.christmas.endHour;
            
            if (inTimeRange && !this.isHolidayMode) {
                this.activateChristmas();
            } else if (!inTimeRange && this.isHolidayMode && this.currentHoliday === 'christmas') {
                this.deactivateHoliday();
            }
        } else if (this.isHolidayMode) {
            this.deactivateHoliday();
        }
    }

    // ========================================
    // ACTIVATE CHRISTMAS MODE
    // ========================================
    async activateChristmas() {
        if (this.isHolidayMode) return;
        
        console.log('✧ Activating Christmas Mode (waiting 10 seconds...) ✧');
        
        this.isHolidayMode = true;
        this.currentHoliday = 'christmas';
        this.holidayLock = true;
        
        // Lock the pet so normal schedule doesn't override
        if (this.sitePet) {
            this.sitePet.holidayLock = true;
        }
        
        // Wait 10 seconds before starting the magic
        await this.sleep(10000);
        
        console.log('✧ Starting Christmas transition... ✧');
        
        // Play jingle bells and fade - everything appears while screen is dark
        await this.playJingleBellsWithFade();
        
        // Save state
        this.storage.set('holidayMode', {
            active: true,
            holiday: 'christmas',
            sprite: this.selectedSprite,
            date: new Date().toDateString()
        });
    }

    // ========================================
    // DEACTIVATE HOLIDAY MODE
    // ========================================
    deactivateHoliday() {
        if (!this.isHolidayMode) return;
        
        console.log('✧ Deactivating Holiday Mode ✧');
        
        this.isHolidayMode = false;
        this.currentHoliday = null;
        this.holidayLock = false;
        
        // Unlock the pet
        if (this.sitePet) {
            this.sitePet.holidayLock = false;
        }
        
        // Remove decorations
        this.removeChristmasLights();
        
        // Remove confetti listener
        this.removeConfetti();
        
        // Restore normal playlist
        this.restoreNormalPlaylist();
        
        // Reset pet to normal behavior
        if (this.sitePet) {
            this.sitePet.updateBehaviorByTime();
        }
        
        this.storage.remove('holidayMode');
    }

    // ========================================
    // PLAY JINGLE BELLS WITH FADE
    // Plays jingle bells, fades to black, sets up everything while dark, then reveals
    // ========================================
    playJingleBellsWithFade() {
        return new Promise((resolve) => {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'holiday-transition-overlay';
            document.body.appendChild(this.overlay);
            
            // Start playing jingle bells
            if (this.jingleAudio) {
                this.jingleAudio.currentTime = 0;
                this.jingleAudio.play().catch(() => {});
            }
            
            // Start fade to black immediately with jingle bells
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
            
            // After 1 second (screen is now dark), set up EVERYTHING
            setTimeout(() => {
                // Play transition sound while dark
                if (this.transitionAudio) {
                    this.transitionAudio.currentTime = 0;
                    this.transitionAudio.play().catch(() => {});
                }
                
                // === SETUP EVERYTHING WHILE SCREEN IS DARK ===
                
                // Select random Christmas sprite
                this.selectRandomChristmasSprite();
                
                // Add Christmas lights
                this.addChristmasLights();
                
                // Setup confetti on pet click
                this.setupConfetti();
                
                // Change music playlist
                this.setChristmasPlaylist();
                
                console.log('✧ Christmas decorations ready (still dark) ✧');
                
            }, 1000); // 1 second after fade starts = screen is dark
            
            // After 3 seconds total, start fading back (reveal everything)
            setTimeout(() => {
                this.overlay.classList.remove('active');
                
                // Remove overlay after fade out completes
                setTimeout(() => {
                    this.overlay?.remove();
                    this.overlay = null;
                    console.log('✧ Christmas Mode fully revealed! ✧');
                    resolve();
                }, 1000);
            }, 3000);
        });
    }

    // ========================================
    // PLAY JINGLE BELLS (legacy - kept for compatibility)
    // ========================================
    playJingleBells() {
        return new Promise((resolve) => {
            if (!this.jingleAudio) {
                resolve();
                return;
            }
            
            this.jingleAudio.currentTime = 0;
            this.jingleAudio.play().catch(() => {});
            
            // Resolve after 2 seconds
            setTimeout(resolve, 2000);
        });
    }

    // ========================================
    // PLAY TRANSITION WITH FADE (legacy - kept for compatibility)
    // ========================================
    playTransitionWithFade() {
        return new Promise((resolve) => {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'holiday-transition-overlay';
            document.body.appendChild(this.overlay);
            
            // Fade to black
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });
            
            // Play transition sound after fade starts
            setTimeout(() => {
                if (this.transitionAudio) {
                    this.transitionAudio.currentTime = 0;
                    this.transitionAudio.play().catch(() => {});
                }
            }, 500);
            
            // Fade back after transition
            setTimeout(() => {
                this.overlay.classList.remove('active');
                
                // Remove overlay after fade out
                setTimeout(() => {
                    this.overlay?.remove();
                    this.overlay = null;
                    resolve();
                }, 1000);
            }, 2000);
        });
    }

    // ========================================
    // SELECT RANDOM CHRISTMAS SPRITE
    // ========================================
    selectRandomChristmasSprite() {
        // Check if we already selected one today
        const saved = this.storage.get('holidayMode');
        const today = new Date().toDateString();
        
        if (saved && saved.date === today && saved.sprite) {
            this.selectedSprite = saved.sprite;
        } else {
            // Random selection
            const sprites = this.christmas.sprites;
            this.selectedSprite = sprites[Math.floor(Math.random() * sprites.length)];
        }
        
        // Set the sprite
        if (this.sitePet) {
            this.sitePet.currentBehavior = null; // Force change
            this.sitePet.setBehavior(this.selectedSprite);
        }
        
        console.log(`✧ Christmas sprite selected: ${this.selectedSprite} ✧`);
    }

    // ========================================
    // ADD CHRISTMAS LIGHTS
    // ========================================
    addChristmasLights() {
        // Create container for lights video
        this.lightsContainer = document.createElement('div');
        this.lightsContainer.className = 'christmas-lights-container';
        
        // Create video element
        const video = document.createElement('video');
        video.className = 'christmas-lights-video';
        video.src = this.christmas.decorations.lightsVideo;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true; // Important for iOS
        video.setAttribute('playsinline', ''); // Safari iOS
        video.setAttribute('webkit-playsinline', ''); // Older Safari
        
        // Handle video load
        video.addEventListener('loadeddata', () => {
            video.play().catch(() => {
                console.log('Christmas lights autoplay blocked');
            });
        });
        
        this.lightsContainer.appendChild(video);
        document.body.appendChild(this.lightsContainer);
        
        // Add class to body for CSS hooks
        document.body.classList.add('christmas-mode');
    }

    // ========================================
    // REMOVE CHRISTMAS LIGHTS
    // ========================================
    removeChristmasLights() {
        if (this.lightsContainer) {
            this.lightsContainer.remove();
            this.lightsContainer = null;
        }
        document.body.classList.remove('christmas-mode');
    }

    // ========================================
    // SETUP CONFETTI
    // ========================================
    setupConfetti() {
        if (!this.sitePet?.container) return;
        
        // Create confetti container
        this.confettiContainer = document.createElement('div');
        this.confettiContainer.className = 'christmas-confetti-container';
        document.body.appendChild(this.confettiContainer);
        
        // Add click listener to pet
        this.petClickHandler = () => {
            this.spawnConfetti();
        };
        
        this.sitePet.container.addEventListener('click', this.petClickHandler);
    }

    // ========================================
    // REMOVE CONFETTI
    // ========================================
    removeConfetti() {
        if (this.confettiContainer) {
            this.confettiContainer.remove();
            this.confettiContainer = null;
        }
        
        if (this.sitePet?.container && this.petClickHandler) {
            this.sitePet.container.removeEventListener('click', this.petClickHandler);
        }
    }

    // ========================================
    // SPAWN CONFETTI
    // ========================================
    spawnConfetti() {
        if (!this.confettiContainer) return;
        
        const petRect = this.sitePet.container.getBoundingClientRect();
        const centerX = petRect.left + petRect.width / 2;
        const centerY = petRect.top + petRect.height / 2;
        
        // Spawn 30-45 confetti pieces for a bigger explosion!
        const count = 30 + Math.floor(Math.random() * 15);
        
        for (let i = 0; i < count; i++) {
            this.createConfettiPiece(centerX, centerY, i);
        }
        
        // Play confetti sound
        this.playConfettiSound();
    }

    // ========================================
    // PLAY CONFETTI SOUND
    // ========================================
    playConfettiSound() {
        const confettiAudio = new Audio('./src/sound/confeti.mp3');
        confettiAudio.volume = 0.6;
        confettiAudio.play().catch(() => {});
    }

    // ========================================
    // CREATE CONFETTI PIECE
    // ========================================
    createConfettiPiece(x, y, index) {
        const confetti = document.createElement('div');
        confetti.className = 'christmas-confetti';
        
        // Random icon (1-12)
        const iconNum = Math.floor(Math.random() * this.christmas.decorations.confettiIcons) + 1;
        confetti.style.backgroundImage = `url('./src/xmas_theme/18x18_christmas_${iconNum}.png')`;
        
        // Starting position
        confetti.style.left = `${x}px`;
        confetti.style.top = `${y}px`;
        
        // Random trajectory - MORE EXPLOSIVE! 🎉
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 200 + Math.random() * 300; // Much faster!
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 250; // Stronger upward bias
        
        // Random rotation - more spin!
        const rotation = Math.random() * 1080 - 540;
        
        // Set CSS variables for animation
        confetti.style.setProperty('--vx', `${vx}px`);
        confetti.style.setProperty('--vy', `${vy}px`);
        confetti.style.setProperty('--rotation', `${rotation}deg`);
        confetti.style.animationDelay = `${index * 10}ms`; // Faster stagger
        
        this.confettiContainer.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 2500);
    }

    // ========================================
    // SET CHRISTMAS PLAYLIST
    // ========================================
    setChristmasPlaylist() {
        if (!this.music) return;
        
        // Save current playlist
        this.savedPlaylist = this.music.playlist ? [...this.music.playlist] : [];
        this.savedTrackIndex = this.music.currentTrackIndex || 0;
        
        // Set Christmas playlist (already in correct format)
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.christmas.playlist);
        }
        
        console.log('✧ Christmas playlist loaded ✧');
    }

    // ========================================
    // RESTORE NORMAL PLAYLIST
    // ========================================
    restoreNormalPlaylist() {
        if (!this.music || !this.savedPlaylist) return;
        
        if (this.music.setPlaylist) {
            this.music.setPlaylist(this.savedPlaylist);
            this.music.currentTrackIndex = this.savedTrackIndex;
        }
        
        this.savedPlaylist = null;
    }

    // ========================================
    // UTILITY: SLEEP
    // ========================================
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // FORCE ACTIVATE (for testing)
    // ========================================
    forceActivate() {
        this.activateChristmas();
    }

    // ========================================
    // FORCE DEACTIVATE (for testing)
    // ========================================
    forceDeactivate() {
        this.deactivateHoliday();
    }

    // ========================================
    // GET STATUS
    // ========================================
    getStatus() {
        return {
            isActive: this.isHolidayMode,
            holiday: this.currentHoliday,
            sprite: this.selectedSprite
        };
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.deactivateHoliday();
        
        this.jingleAudio = null;
        this.transitionAudio = null;
    }
}

export default HolidayManager;
