/* =====================================================
   SITEPETMANAGER.JS - Site Pet Sprite Controller
   Manages animated sprite pet with time-based behaviors
   Includes thought bubbles, seasonal sprites, and interactions
   ===================================================== */

export class SitePetManager {
    constructor(storage, timeOfDayManager, soundManager) {
        this.storage = storage;
        this.timeOfDay = timeOfDayManager;
        this.sound = soundManager;
        
        // Holiday lock - prevents normal schedule from overriding seasonal sprites
        this.holidayLock = false;
        
        // Sprite configurations (each sprite can have different dimensions)
        this.sprites = {
            lookingAtSky: {
                path: './src/site_pet_sprites/kitty_looking_at_sky.svg',
                width: 2000,
                height: 1600,
                columns: 5,
                rows: 4,
                totalFrames: 20,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -36,
                thoughts: [
                    "The stars look lovely tonight...",
                    "I wonder what's beyond the clouds.",
                    "Making a little wish~",
                    "Such a peaceful evening.",
                    "The moon is so bright!"
                ]
            },
            sleeping: {
                path: './src/site_pet_sprites/kitty_sleeping.svg',
                width: 1866,
                height: 672,
                columns: 3,
                rows: 3,
                totalFrames: 7,
                displayWidth: 250,
                displayHeight: 90,
                bottom: 16,
                thoughts: [
                    "zzZ... zzZ...",
                    "Shhh... they're sleeping.",
                    "Sweet dreams~",
                    "...dreaming of sunny spots...",
                    "...so cozy..."
                ]
            },
            idle: {
                path: './src/site_pet_sprites/kitty_idle.svg',
                width: 2000,
                height: 1333,
                columns: 3,
                rows: 2,
                totalFrames: 6,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -50,
                thoughts: [
                    "Oh, hello there!",
                    "Nice to see you~",
                    "What a lovely day.",
                    "la la la~",
                    "Just enjoying the breeze."
                ]
            },
            idleSit: {
                path: './src/site_pet_sprites/kitty_idle_sit.svg',
                width: 2000,
                height: 1333,
                columns: 3,
                rows: 2,
                totalFrames: 6,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -50,
                thoughts: [
                    "This spot is quite nice.",
                    "...stretches...",
                    "Hmm? What's over there?",
                    "Feeling relaxed~",
                    "I could sit here all day."
                ]
            },
            reading: {
                path: './src/site_pet_sprites/kitty_reading.svg',
                width: 2000,
                height: 1333,
                columns: 3,
                rows: 2,
                totalFrames: 6,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -50,
                thoughts: [
                    "What a wonderful story!",
                    "Ooh, how interesting...",
                    "Just one more chapter~",
                    "I didn't see that coming!",
                    "Books are the best."
                ]
            },
            silly: {
                path: '/src/site_pet_sprites/kitty_silly.svg',
                width: 2000,
                height: 1333,
                columns: 3,
                rows: 2,
                totalFrames: 6,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -50,
                thoughts: [
                    "Wheeeee~!",
                    "Hehe, that was fun!",
                    "Can't stop, won't stop!",
                    "...spins around...",
                    "Feeling a bit silly today~",
                    "Nyoom!"
                ]
            },
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
                    "Ho ho ho!",
                    "Let it snow~"
                ]
            },
            halloween: {
                path: './src/site_pet_sprites/kitty_halloween.svg',
                width: 2000,
                height: 1333,
                columns: 3,
                rows: 2,
                totalFrames: 6,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -50,
                thoughts: [
                    "Boo~!",
                    "Spooky, isn't it?",
                    "I love this time of year.",
                    "Trick or treat~",
                    "...mysterious vibes...",
                    "The perfect night for adventure!"
                ]
            },
            playing: {
                path: './src/site_pet_sprites/kitty_playing.svg',
                width: 2000,
                height: 1600,
                columns: 5,
                rows: 4,
                totalFrames: 20,
                displayWidth: 200,
                displayHeight: 200,
                bottom: -36,
                thoughts: [
                    "This is so much fun!",
                    "Yay, playtime~!",
                    "I'm getting pretty good at this.",
                    "One more round!"
                ]
            }
        };
        
        // Current sprite config
        this.currentSprite = null;
        this.currentBehavior = 'idle';
        
        // Animation state
        this.currentFrame = 0;
        this.direction = 1;
        this.animationSpeed = 120;
        this.animationId = null;
        this.isPaused = false;
        
        // Thought bubble state
        this.thoughtBubble = null;
        this.thoughtTimeout = null;
        this.lastThoughtTime = 0;
        this.thoughtCooldown = 15000; // 15 seconds between thoughts
        
        // Time-based behavior schedule (24h format)
        this.defaultSchedule = [
            { start: 23, end: 2, behavior: 'lookingAtSky' },
            { start: 2, end: 6, behavior: 'sleeping' },
            { start: 6, end: 8, behavior: 'idle' },
            { start: 8, end: 10, behavior: 'idleSit' },
            { start: 10, end: 12, behavior: 'reading' },
            { start: 12, end: 14, behavior: 'silly' },
            { start: 14, end: 16, behavior: 'playing' },
            { start: 16, end: 18, behavior: 'idleSit' },
            { start: 18, end: 20, behavior: 'reading' },
            { start: 20, end: 23, behavior: 'idle' }
        ];
        
        this.schedule = [...this.defaultSchedule];
        
        this.element = null;
        this.container = null;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.createElements();
        this.createThoughtBubble();
        this.checkSeasonalOverrides();
        this.updateBehaviorByTime();
        this.startAnimation();
        this.setupInteractions();
        this.registerConsoleCommands();
        
        // Check time every minute for behavior changes
        this.timeCheckInterval = setInterval(() => {
            this.checkSeasonalOverrides();
            this.updateBehaviorByTime();
        }, 60000);
        
        // Random thoughts
        this.thoughtInterval = setInterval(() => {
            this.maybeShowThought();
        }, 10000);
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        console.log('✧ Site Pet Manager initialized ✧');
    }

    // ========================================
    // CREATE DOM ELEMENTS
    // ========================================
    createElements() {
        this.container = document.createElement('div');
        this.container.className = 'site-pet';
        this.container.setAttribute('data-pet', 'true');
        
        document.body.appendChild(this.container);
        this.element = this.container;
    }

    // ========================================
    // CREATE THOUGHT BUBBLE
    // ========================================
    createThoughtBubble() {
        this.thoughtBubble = document.createElement('div');
        this.thoughtBubble.className = 'pet-thought-bubble';
        this.thoughtBubble.innerHTML = `
            <div class="thought-cloud">
                <div class="thought-text"></div>
            </div>
            <div class="thought-dots">
                <span class="dot dot-1"></span>
                <span class="dot dot-2"></span>
                <span class="dot dot-3"></span>
            </div>
        `;
        document.body.appendChild(this.thoughtBubble);
    }

    // ========================================
    // SHOW THOUGHT BUBBLE
    // ========================================
    showThought(text, duration = 4000) {
        if (!this.thoughtBubble) return;
        
        const now = Date.now();
        if (now - this.lastThoughtTime < this.thoughtCooldown) return;
        this.lastThoughtTime = now;
        
        // Update position based on pet
        this.updateThoughtPosition();
        
        // Set text and show
        const textEl = this.thoughtBubble.querySelector('.thought-text');
        if (textEl) textEl.textContent = text;
        
        this.thoughtBubble.classList.add('visible');
        
        // Clear existing timeout
        if (this.thoughtTimeout) {
            clearTimeout(this.thoughtTimeout);
        }
        
        // Hide after duration
        this.thoughtTimeout = setTimeout(() => {
            this.hideThought();
        }, duration);
    }

    // ========================================
    // HIDE THOUGHT BUBBLE
    // ========================================
    hideThought() {
        if (this.thoughtBubble) {
            this.thoughtBubble.classList.remove('visible');
        }
    }

    // ========================================
    // UPDATE THOUGHT POSITION
    // ========================================
    updateThoughtPosition() {
        if (!this.thoughtBubble || !this.container) return;
        
        const petRect = this.container.getBoundingClientRect();
        
        this.thoughtBubble.style.left = `${petRect.left + petRect.width / 2 + 40}px`;
        this.thoughtBubble.style.bottom = `${window.innerHeight - petRect.top - 30}px`;
    }

    // ========================================
    // MAYBE SHOW RANDOM THOUGHT
    // ========================================
    maybeShowThought() {
        if (this.isPaused || !this.currentSprite) return;
        
        // 20% chance to show thought
        if (Math.random() > 0.2) return;
        
        const thoughts = this.currentSprite.thoughts;
        if (!thoughts || thoughts.length === 0) return;
        
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        this.showThought(randomThought);
    }

    // ========================================
    // CHECK SEASONAL OVERRIDES
    // ========================================
    checkSeasonalOverrides() {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const hour = now.getHours();
        
        // Halloween: October (month 9), show at certain hours
        if (month === 9) {
            // Halloween sprite from 6 PM to 11 PM
            if (hour >= 18 && hour < 23) {
                this.setSeasonalSchedule('halloween', 18, 23);
                return;
            }
        }
        
        // Christmas: December (month 11), show at certain hours
        if (month === 11) {
            // Christmas sprite from 6 AM to 10 PM
            if (hour >= 6 && hour < 22) {
                this.setSeasonalSchedule('christmas', 6, 22);
                return;
            }
        }
        
        // Reset to default if no seasonal override
        this.schedule = [...this.defaultSchedule];
    }

    // ========================================
    // SET SEASONAL SCHEDULE
    // ========================================
    setSeasonalSchedule(behavior, startHour, endHour) {
        // Modify schedule to include seasonal behavior
        this.schedule = this.defaultSchedule.map(slot => {
            // If slot overlaps with seasonal hours, replace with seasonal
            if (slot.start >= startHour && slot.start < endHour) {
                return { ...slot, behavior };
            }
            return slot;
        });
    }

    // ========================================
    // SETUP INTERACTIONS
    // ========================================
    setupInteractions() {
        // Hover on pet to trigger thought
        this.container.addEventListener('mouseenter', () => {
            if (this.sound) {
                this.sound.play('hover');
            }
            
            // Show thought on hover
            this.lastThoughtTime = 0;
            this.showRandomThought();
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.hideThought();
        });
        
        // Make pet interactive
        this.container.style.cursor = 'default';
    }
    
    // ========================================
    // SHOW RANDOM THOUGHT (forced)
    // ========================================
    showRandomThought() {
        if (!this.currentSprite) return;
        
        const thoughts = this.currentSprite.thoughts;
        if (!thoughts || thoughts.length === 0) return;
        
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        this.showThought(randomThought, 10000);
    }

    // ========================================
    // APPLY SPRITE STYLES
    // ========================================
    applyStyles() {
        if (!this.currentSprite || !this.container) return;
        
        const { path, columns, rows, displayWidth, displayHeight, bottom } = this.currentSprite;
        
        this.container.style.width = `${displayWidth}px`;
        this.container.style.height = `${displayHeight}px`;
        this.container.style.bottom = `${bottom}px`;
        
        this.container.style.backgroundImage = `url('${path}')`;
        this.container.style.backgroundSize = `${displayWidth * columns}px ${displayHeight * rows}px`;
        this.container.style.backgroundPosition = '0 0';
        this.container.style.backgroundRepeat = 'no-repeat';
        this.container.style.imageRendering = 'auto';
    }

    // ========================================
    // FRAME POSITION CALCULATOR
    // ========================================
    getFramePosition(frameIndex) {
        if (!this.currentSprite) return { x: 0, y: 0 };
        
        const { columns, displayWidth, displayHeight } = this.currentSprite;
        const col = frameIndex % columns;
        const row = Math.floor(frameIndex / columns);
        return {
            x: col * displayWidth,
            y: row * displayHeight
        };
    }

    // ========================================
    // UPDATE FRAME DISPLAY
    // ========================================
    updateFrame() {
        if (!this.container) return;
        
        const pos = this.getFramePosition(this.currentFrame);
        this.container.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
    }

    // ========================================
    // NEXT FRAME (PING-PONG)
    // ========================================
    nextFrame() {
        if (!this.currentSprite) return;
        
        const { totalFrames } = this.currentSprite;
        
        this.currentFrame += this.direction;
        
        if (this.currentFrame >= totalFrames - 1) {
            this.currentFrame = totalFrames - 1;
            this.direction = -1;
        } else if (this.currentFrame <= 0) {
            this.currentFrame = 0;
            this.direction = 1;
        }
        
        this.updateFrame();
    }

    // ========================================
    // START ANIMATION
    // ========================================
    startAnimation() {
        if (this.animationId) return;
        
        this.updateFrame();
        this.animationId = setInterval(() => {
            if (!this.isPaused) {
                this.nextFrame();
            }
        }, this.animationSpeed);
    }

    // ========================================
    // STOP ANIMATION
    // ========================================
    stopAnimation() {
        if (this.animationId) {
            clearInterval(this.animationId);
            this.animationId = null;
        }
    }

    // ========================================
    // PAUSE / RESUME
    // ========================================
    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    // ========================================
    // SET BEHAVIOR (CHANGE SPRITE)
    // ========================================
    setBehavior(behavior) {
        if (!this.sprites[behavior]) return;
        
        if (behavior === this.currentBehavior && this.currentSprite) {
            return;
        }
        
        this.currentBehavior = behavior;
        this.currentSprite = this.sprites[behavior];
        
        this.applyStyles();
        
        this.currentFrame = 0;
        this.direction = 1;
        this.updateFrame();
        
        console.log(`✧ Pet behavior changed to: ${behavior} ✧`);
    }

    // ========================================
    // UPDATE BEHAVIOR BY TIME
    // ========================================
    updateBehaviorByTime() {
        // Don't change if holiday mode is active
        if (this.holidayLock) {
            return;
        }
        
        const hour = new Date().getHours();
        
        for (const slot of this.schedule) {
            let inRange = false;
            
            if (slot.start > slot.end) {
                inRange = hour >= slot.start || hour < slot.end;
            } else {
                inRange = hour >= slot.start && hour < slot.end;
            }
            
            if (inRange) {
                if (this.sprites[slot.behavior]) {
                    this.setBehavior(slot.behavior);
                } else {
                    this.setBehavior('idle');
                }
                return;
            }
        }
        
        this.setBehavior('idle');
    }

    // ========================================
    // SET ANIMATION SPEED
    // ========================================
    setSpeed(ms) {
        this.animationSpeed = ms;
        this.stopAnimation();
        this.startAnimation();
    }

    // ========================================
    // SET CUSTOM SCHEDULE
    // ========================================
    setSchedule(newSchedule) {
        this.schedule = newSchedule;
        this.updateBehaviorByTime();
    }

    // ========================================
    // ADD/UPDATE SPRITE CONFIG
    // ========================================
    addSprite(name, config) {
        this.sprites[name] = config;
    }

    // ========================================
    // GET CURRENT STATE
    // ========================================
    getState() {
        return {
            behavior: this.currentBehavior,
            frame: this.currentFrame,
            isPaused: this.isPaused
        };
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        this.stopAnimation();
        
        if (this.timeCheckInterval) {
            clearInterval(this.timeCheckInterval);
        }
        
        if (this.thoughtInterval) {
            clearInterval(this.thoughtInterval);
        }
        
        if (this.thoughtTimeout) {
            clearTimeout(this.thoughtTimeout);
        }
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        if (this.thoughtBubble && this.thoughtBubble.parentNode) {
            this.thoughtBubble.parentNode.removeChild(this.thoughtBubble);
        }
        
        // Remove console commands
        this.removeConsoleCommands();
        
        this.element = null;
        this.container = null;
        this.thoughtBubble = null;
    }
    
    // ========================================
    // CONSOLE COMMANDS FOR DEBUG
    // ========================================
    registerConsoleCommands() {
        // Store reference for removal
        window.pet = {
            // List all available behaviors
            list: () => {
                console.log('%c✧ Available Pet Behaviors ✧', 'color: #8B7CB3; font-weight: bold; font-size: 14px;');
                console.log('─'.repeat(30));
                Object.keys(this.sprites).forEach(name => {
                    const sprite = this.sprites[name];
                    const isCurrent = name === this.currentBehavior ? ' ◄ current' : '';
                    console.log(`%c${name}%c - ${sprite.totalFrames} frames${isCurrent}`, 
                        'color: #D4A5C9; font-weight: bold;', 
                        'color: #6B5B8A;');
                });
                console.log('─'.repeat(30));
                console.log('%cUse: pet.set("behaviorName")', 'color: #A99ED0; font-style: italic;');
            },
            
            // Set behavior by name
            set: (name) => {
                if (this.sprites[name]) {
                    this.currentBehavior = null; // Force change
                    this.setBehavior(name);
                    this.resume(); // Asegurar que no esté pausado
                    console.log(`%c✧ Pet set to: ${name} ✧`, 'color: #8B7CB3; font-weight: bold;');
                } else {
                    console.log(`%c✗ Behavior "${name}" not found`, 'color: #FF6B9D;');
                    console.log('%cUse pet.list() to see available behaviors', 'color: #A99ED0;');
                }
            },
            
            // Quick setters for each behavior
            lookingAtSky: () => window.pet.set('lookingAtSky'),
            sleeping: () => window.pet.set('sleeping'),
            idle: () => window.pet.set('idle'),
            idleSit: () => window.pet.set('idleSit'),
            reading: () => window.pet.set('reading'),
            silly: () => window.pet.set('silly'),
            christmas: () => window.pet.set('christmas'),
            christmasCute: () => window.pet.set('christmasCute'),
            christmasHat: () => window.pet.set('christmasHat'),
            halloween: () => window.pet.set('halloween'),
            playing: () => window.pet.set('playing'),
            
            // Animation controls
            pause: () => {
                this.pause();
                console.log('%c⏸ Pet animation paused', 'color: #A99ED0;');
            },
            
            resume: () => {
                this.resume();
                console.log('%c▶ Pet animation resumed', 'color: #A99ED0;');
            },
            
            // Speed control
            speed: (ms) => {
                if (typeof ms === 'number' && ms > 0) {
                    this.setSpeed(ms);
                    console.log(`%c⚡ Animation speed set to ${ms}ms`, 'color: #A99ED0;');
                } else {
                    console.log(`%cCurrent speed: ${this.animationSpeed}ms`, 'color: #6B5B8A;');
                    console.log('%cUse: pet.speed(100) for faster, pet.speed(200) for slower', 'color: #A99ED0;');
                }
            },
            
            // Thought bubble controls
            think: (text) => {
                if (text) {
                    this.lastThoughtTime = 0;
                    this.showThought(text, 5000);
                    console.log(`%c💭 Thought: "${text}"`, 'color: #A99ED0;');
                } else {
                    this.lastThoughtTime = 0;
                    this.showRandomThought();
                    console.log('%c💭 Showing random thought', 'color: #A99ED0;');
                }
            },
            
            // Get current state
            state: () => {
                const state = this.getState();
                console.log('%c✧ Pet State ✧', 'color: #8B7CB3; font-weight: bold; font-size: 14px;');
                console.log('─'.repeat(30));
                console.log(`%cBehavior:%c ${state.behavior}`, 'color: #D4A5C9; font-weight: bold;', 'color: #6B5B8A;');
                console.log(`%cFrame:%c ${state.frame}/${this.currentSprite?.totalFrames || '?'}`, 'color: #D4A5C9; font-weight: bold;', 'color: #6B5B8A;');
                console.log(`%cPaused:%c ${state.isPaused}`, 'color: #D4A5C9; font-weight: bold;', 'color: #6B5B8A;');
                console.log(`%cSpeed:%c ${this.animationSpeed}ms`, 'color: #D4A5C9; font-weight: bold;', 'color: #6B5B8A;');
                console.log('─'.repeat(30));
            },
            
            // Help
            help: () => {
                console.log('%c✧ Pet Console Commands ✧', 'color: #8B7CB3; font-weight: bold; font-size: 16px;');
                console.log('═'.repeat(40));
                console.log('%cBehaviors:', 'color: #D4A5C9; font-weight: bold;');
                console.log('  pet.list()          - Show all behaviors');
                console.log('  pet.set("name")     - Set behavior by name');
                console.log('  pet.idle()          - Quick set to idle');
                console.log('  pet.sleeping()      - Quick set to sleeping');
                console.log('  pet.silly()         - Quick set to silly');
                console.log('  etc...');
                console.log('');
                console.log('%cAnimation:', 'color: #D4A5C9; font-weight: bold;');
                console.log('  pet.pause()         - Pause animation');
                console.log('  pet.resume()        - Resume animation');
                console.log('  pet.speed(ms)       - Set frame speed');
                console.log('');
                console.log('%cThoughts:', 'color: #D4A5C9; font-weight: bold;');
                console.log('  pet.think()         - Show random thought');
                console.log('  pet.think("text")   - Show custom thought');
                console.log('');
                console.log('%cInfo:', 'color: #D4A5C9; font-weight: bold;');
                console.log('  pet.state()         - Show current state');
                console.log('  pet.help()          - Show this help');
                console.log('═'.repeat(40));
            }
        };
        
        // Welcome message
        console.log('%c✧ Site Pet loaded! Type pet.help() for commands ✧', 
            'color: #8B7CB3; font-weight: bold; background: #E8E0F7; padding: 4px 8px; border-radius: 4px;');
    }
    
    removeConsoleCommands() {
        if (window.pet) {
            delete window.pet;
        }
    }
}

export default SitePetManager;