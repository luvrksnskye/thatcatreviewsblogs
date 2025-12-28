/* =====================================================
   SITEPETMANAGER.JS - Site Pet Sprite (OPTIMIZED)
   RequestAnimationFrame-based animation, reduced intervals
   ===================================================== */

export class SitePetManager {
    constructor(storage, timeOfDayManager, soundManager) {
        this.storage = storage;
        this.timeOfDay = timeOfDayManager;
        this.sound = soundManager;
        
        // Holiday lock
        this.holidayLock = false;
        
        // Sprite configurations (condensed)
        this.sprites = {
            idle: {
                path: './src/site_pet_sprites/kitty_idle.svg',
                width: 2000, height: 1333, columns: 3, rows: 2,
                totalFrames: 6, displayWidth: 200, displayHeight: 200, bottom: -50,
                thoughts: ["Oh, hello there!", "Nice to see you~", "What a lovely day."]
            },
            sleeping: {
                path: './src/site_pet_sprites/kitty_sleeping.svg',
                width: 1866, height: 672, columns: 3, rows: 3,
                totalFrames: 7, displayWidth: 250, displayHeight: 90, bottom: 16,
                thoughts: ["zzZ... zzZ...", "Sweet dreams~", "...so cozy..."]
            },
            lookingAtSky: {
                path: './src/site_pet_sprites/kitty_looking_at_sky.svg',
                width: 2000, height: 1600, columns: 5, rows: 4,
                totalFrames: 20, displayWidth: 200, displayHeight: 200, bottom: -36,
                thoughts: ["The stars look lovely tonight...", "Making a wish~"]
            },
            christmasCute: {
                path: './src/site_pet_sprites/kitty_xmas_cute.svg',
                width: 2000, height: 2000, columns: 2, rows: 2,
                totalFrames: 3, displayWidth: 200, displayHeight: 200, bottom: -20,
                thoughts: ["Happy holidays~!", "I love the snow!"]
            },
            christmasHat: {
                path: './src/site_pet_sprites/kitty_xmas_hat.svg',
                width: 2000, height: 2000, columns: 2, rows: 2,
                totalFrames: 4, displayWidth: 200, displayHeight: 200, bottom: -20,
                thoughts: ["Merry Christmas!", "Where are the presents?"]
            }
        };
        
        // Animation state
        this.currentSprite = null;
        this.currentBehavior = 'idle';
        this.currentFrame = 0;
        this.direction = 1;
        this.animationSpeed = 120;
        this.isPaused = false;
        
        // Animation timing
        this._lastFrameTime = 0;
        this._rafId = null;
        
        // Thought bubble
        this.thoughtBubble = null;
        this.lastThoughtTime = 0;
        this.thoughtCooldown = 30000;
        
        // DOM elements
        this.container = null;
        this.element = null;
        
        // Schedule (simplified)
        this.schedule = {
            '0-6': 'sleeping',
            '6-12': 'idle',
            '12-18': 'idle',
            '18-22': 'lookingAtSky',
            '22-24': 'sleeping'
        };
    }

    init() {
        this.createPetElement();
        this.setBehavior(this._getBehaviorForTime());
        this.startAnimation();
        this.setupInteractions();
        
        // Check time every 10 minutes instead of every minute
        this._timeCheckInterval = setInterval(() => {
            if (!this.holidayLock) {
                this.updateBehaviorByTime();
            }
        }, 600000);
        
        console.log('✧ Site Pet initialized (optimized) ✧');
    }

    createPetElement() {
        this.container = document.createElement('div');
        this.container.className = 'site-pet-container';
        this.container.id = 'site-pet';
        
        this.element = document.createElement('div');
        this.element.className = 'pet-sprite';
        
        this.container.appendChild(this.element);
        document.body.appendChild(this.container);
        
        // Create thought bubble (hidden by default)
        this._createThoughtBubble();
    }

    _createThoughtBubble() {
        this.thoughtBubble = document.createElement('div');
        this.thoughtBubble.className = 'pet-thought-bubble';
        this.thoughtBubble.style.display = 'none';
        document.body.appendChild(this.thoughtBubble);
    }

    setBehavior(behaviorName) {
        if (behaviorName === this.currentBehavior && this.currentSprite) return;
        
        const sprite = this.sprites[behaviorName];
        if (!sprite) {
            console.warn(`Sprite "${behaviorName}" not found`);
            return;
        }
        
        this.currentBehavior = behaviorName;
        this.currentSprite = sprite;
        this.currentFrame = 0;
        this.direction = 1;
        
        // Update element
        if (this.element) {
            const frameWidth = sprite.width / sprite.columns;
            const frameHeight = sprite.height / sprite.rows;
            
            this.element.style.cssText = `
                width: ${sprite.displayWidth}px;
                height: ${sprite.displayHeight}px;
                background-image: url('${sprite.path}');
                background-size: ${sprite.width}px ${sprite.height}px;
                background-position: 0 0;
            `;
        }
        
        if (this.container) {
            this.container.style.bottom = `${sprite.bottom}px`;
        }
    }

    startAnimation() {
        if (this._rafId) return;
        
        const animate = (timestamp) => {
            if (this.isPaused) {
                this._rafId = requestAnimationFrame(animate);
                return;
            }
            
            if (timestamp - this._lastFrameTime >= this.animationSpeed) {
                this._lastFrameTime = timestamp;
                this._updateFrame();
            }
            
            this._rafId = requestAnimationFrame(animate);
        };
        
        this._rafId = requestAnimationFrame(animate);
    }

    _updateFrame() {
        if (!this.currentSprite || !this.element) return;
        
        const sprite = this.currentSprite;
        const frameWidth = sprite.width / sprite.columns;
        const frameHeight = sprite.height / sprite.rows;
        
        const col = this.currentFrame % sprite.columns;
        const row = Math.floor(this.currentFrame / sprite.columns);
        
        this.element.style.backgroundPosition = 
            `-${col * frameWidth}px -${row * frameHeight}px`;
        
        // Ping-pong animation
        this.currentFrame += this.direction;
        
        if (this.currentFrame >= sprite.totalFrames - 1) {
            this.direction = -1;
        } else if (this.currentFrame <= 0) {
            this.direction = 1;
        }
    }

    stopAnimation() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    setupInteractions() {
        if (!this.container) return;
        
        this.container.addEventListener('click', () => {
            this.showRandomThought();
            this.sound?.play('click');
        });
    }

    showRandomThought() {
        const now = Date.now();
        if (now - this.lastThoughtTime < this.thoughtCooldown) return;
        
        const thoughts = this.currentSprite?.thoughts || ["..."];
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        this.showThought(thought);
        this.lastThoughtTime = now;
    }

    showThought(text, duration = 4000) {
        if (!this.thoughtBubble || !this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        
        this.thoughtBubble.textContent = text;
        this.thoughtBubble.style.display = 'block';
        this.thoughtBubble.style.left = `${rect.left + rect.width / 2}px`;
        this.thoughtBubble.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        this.thoughtBubble.classList.add('visible');
        
        setTimeout(() => {
            this.thoughtBubble.classList.remove('visible');
            setTimeout(() => {
                this.thoughtBubble.style.display = 'none';
            }, 300);
        }, duration);
    }

    _getBehaviorForTime() {
        const hour = new Date().getHours();
        
        for (const [range, behavior] of Object.entries(this.schedule)) {
            const [start, end] = range.split('-').map(Number);
            if (hour >= start && hour < end) {
                return behavior;
            }
        }
        
        return 'idle';
    }

    updateBehaviorByTime() {
        if (this.holidayLock) return;
        
        const behavior = this._getBehaviorForTime();
        if (behavior !== this.currentBehavior) {
            this.setBehavior(behavior);
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    setSpeed(ms) {
        this.animationSpeed = Math.max(50, ms);
    }

    addSprite(name, config) {
        this.sprites[name] = config;
    }

    getState() {
        return {
            behavior: this.currentBehavior,
            frame: this.currentFrame,
            isPaused: this.isPaused
        };
    }

    destroy() {
        this.stopAnimation();
        
        if (this._timeCheckInterval) {
            clearInterval(this._timeCheckInterval);
        }
        
        this.container?.remove();
        this.thoughtBubble?.remove();
        
        this.element = null;
        this.container = null;
        this.thoughtBubble = null;
    }
}

export default SitePetManager;
