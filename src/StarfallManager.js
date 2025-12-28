/* =====================================================
   STARFALLMANAGER.JS - Shooting Stars Background
   Creates and manages falling star animations
   With sound effects for falling stars
   ===================================================== */

import { Utils } from './Utils.js';

export class StarfallManager {
    constructor() {
        this.container = null;
        this.starfield = null;
        this.stars = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            starsPerSegment: 3.15,  // Increased 5% (was 3)
            baseAnimationDuration: 3000,
            durationVariance: 500,
            maxDelay: 9999,
            segments: [
                { x: [0, 33], y: [0, 33] },
                { x: [33, 66], y: [0, 33] },
                { x: [66, 100], y: [0, 33] },
                { x: [0, 33], y: [33, 66] },
                { x: [33, 66], y: [33, 66] },
                { x: [66, 100], y: [33, 66] },
                { x: [0, 33], y: [66, 100] },
                { x: [33, 66], y: [66, 100] },
                { x: [66, 100], y: [66, 100] }
            ],
            colors: ['white', 'pink', 'purple', 'gold']
        };

        // Sound configuration
        this.soundConfig = {
            enabled: true,
            volume: 0.3,
            soundInterval: 4545,      // Decreased 10% for more sounds (was 5000)
            soundChance: 0.33,        // Increased 10% - 33% chance (was 0.3)
            sounds: [
                '/src/sound/System_Lumi_01.wav',
                '/src/sound/System_Lumi_02.wav',
                '/src/sound/System_Lumi_03.wav',
                '/src/sound/System_Lumi_04.wav'
            ]
        };

        // Sound state
        this.audioCache = {};
        this.lastSoundTime = 0;
        this.soundsLoaded = false;

        // Sound event placeholders
        this.onStarCreate = null; // Sound callback
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        if (Utils.prefersReducedMotion()) {
            console.log('Starfall disabled: reduced motion preferred');
            return;
        }

        this.container = document.querySelector('.starfall-container');
        this.starfield = document.getElementById('starfield');

        if (!this.starfield) {
            console.warn('Starfield element not found');
            return;
        }

        // Preload sounds
        this.preloadSounds();

        this.createStars();
        this.createStaticStars();
        this.isInitialized = true;

        console.log('✧ Starfall initialized ✧');
    }

    // ========================================
    // SOUND SYSTEM
    // ========================================
    
    /**
     * Preload all star sounds for instant playback
     */
    preloadSounds() {
        if (!this.soundConfig.enabled) return;

        let loadedCount = 0;
        const totalSounds = this.soundConfig.sounds.length;

        this.soundConfig.sounds.forEach((soundPath, index) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.soundConfig.volume;
            
            audio.addEventListener('canplaythrough', () => {
                loadedCount++;
                if (loadedCount === totalSounds) {
                    this.soundsLoaded = true;
                    console.log('✧ Star sounds loaded ✧');
                }
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load sound: ${soundPath}`, e);
            });

            audio.src = soundPath;
            this.audioCache[index] = audio;
        });
    }

    /**
     * Play a random star sound
     */
    playStarSound() {
        if (!this.soundConfig.enabled || !this.soundsLoaded) return;

        const now = Date.now();
        
        // Check if enough time has passed since last sound
        if (now - this.lastSoundTime < this.soundConfig.soundInterval) {
            return;
        }

        // Random chance to play sound
        if (Math.random() > this.soundConfig.soundChance) {
            return;
        }

        // Select random sound (1-4)
        const soundIndex = Math.floor(Math.random() * this.soundConfig.sounds.length);
        
        // Clone the audio to allow overlapping sounds
        const originalAudio = this.audioCache[soundIndex];
        if (originalAudio) {
            const audioClone = originalAudio.cloneNode();
            audioClone.volume = this.soundConfig.volume;
            
            audioClone.play().catch(err => {
                // Silently fail - autoplay might be blocked
                console.debug('Star sound blocked by autoplay policy');
            });

            this.lastSoundTime = now;
        }
    }

    /**
     * Set sound volume (0.0 to 1.0)
     */
    setSoundVolume(volume) {
        this.soundConfig.volume = Math.max(0, Math.min(1, volume));
        
        // Update cached audio volumes
        Object.values(this.audioCache).forEach(audio => {
            audio.volume = this.soundConfig.volume;
        });
    }

    /**
     * Enable or disable sounds
     */
    setSoundEnabled(enabled) {
        this.soundConfig.enabled = enabled;
    }

    /**
     * Set minimum interval between sounds (in ms)
     */
    setSoundInterval(interval) {
        this.soundConfig.soundInterval = Math.max(1000, interval);
    }

    /**
     * Set probability of sound playing per star (0.0 to 1.0)
     */
    setSoundChance(chance) {
        this.soundConfig.soundChance = Math.max(0, Math.min(1, chance));
    }

    // ========================================
    // CREATE FALLING STARS
    // ========================================
    createStars() {
        this.config.segments.forEach(segment => {
            const starCount = Math.round(this.config.starsPerSegment);
            for (let i = 0; i < starCount; i++) {
                this.createStar(segment);
            }
        });
    }

    // ========================================
    // CREATE SINGLE STAR
    // ========================================
    createStar(segment, isExtra = false) {
        const star = document.createElement('div');
        star.className = 'falling-star';

        // Random color variation
        if (Math.random() > 0.7) {
            star.classList.add(Utils.randomItem(this.config.colors));
        }

        // Random size variation
        const sizeRandom = Math.random();
        if (sizeRandom > 0.8) {
            star.classList.add('large');
        } else if (sizeRandom < 0.3) {
            star.classList.add('small');
        }

        // Position within segment
        const x = segment.x[0] + Math.random() * (segment.x[1] - segment.x[0]);
        const y = segment.y[0] + Math.random() * (segment.y[1] - segment.y[0]);

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;

        // Animation timing
        const delay = Math.random() * this.config.maxDelay;
        const duration = this.config.baseAnimationDuration + 
                        (Math.random() * this.config.durationVariance * 2 - this.config.durationVariance);

        star.style.animationDelay = `${delay}ms`;
        star.style.animationDuration = `${duration}ms`;

        // Brightness variation
        const brightness = 0.75 + Math.random() * 0.5;
        star.style.opacity = brightness;

        this.starfield.appendChild(star);
        this.stars.push(star);

        // Play sound when star starts falling
        this.scheduleStarSound(delay);

        // Trigger legacy sound callback if set
        if (this.onStarCreate && isExtra) {
            this.onStarCreate();
        }

        return star;
    }

    /**
     * Schedule a sound to play when star starts falling
     */
    scheduleStarSound(delay) {
        setTimeout(() => {
            this.playStarSound();
        }, delay);
    }

    // ========================================
    // CREATE STATIC BACKGROUND STARS
    // ========================================
    createStaticStars() {
        const staticCount = 50;
        
        for (let i = 0; i < staticCount; i++) {
            const star = document.createElement('div');
            star.className = 'static-star';
            
            star.style.left = `${Utils.random(0, 100)}%`;
            star.style.top = `${Utils.random(0, 100)}%`;
            star.style.animationDelay = `${Utils.random(0, 3)}s`;
            
            // Size variation
            const size = Utils.random(1, 4);
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;

            document.body.appendChild(star);
        }
    }

    // ========================================
    // CREATE EXTRA SHOOTING STAR
    // ========================================
    createShootingStar() {
        if (!this.isInitialized || Utils.prefersReducedMotion()) return;

        const randomSegment = Utils.randomItem(this.config.segments);
        const star = this.createStar(randomSegment, true);

        // Play sound immediately for shooting stars
        this.playStarSound();

        // Remove after animation completes
        const duration = parseFloat(star.style.animationDuration) || 3000;
        setTimeout(() => {
            star.remove();
            const index = this.stars.indexOf(star);
            if (index > -1) {
                this.stars.splice(index, 1);
            }
        }, duration + 1000);
    }

    // ========================================
    // TRIGGER STAR BURST
    // ========================================
    starBurst(count = 5) {
        if (!this.isInitialized) return;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createShootingStar();
            }, i * 200);
        }
    }

    // ========================================
    // RECALCULATE ON RESIZE
    // ========================================
    recalculate() {
        // Stars are positioned with percentages, so no recalculation needed
        // But we can refresh if needed
    }

    // ========================================
    // PAUSE STARS
    // ========================================
    pause() {
        if (this.starfield) {
            this.starfield.style.animationPlayState = 'paused';
        }
        this.stars.forEach(star => {
            star.style.animationPlayState = 'paused';
        });
    }

    // ========================================
    // RESUME STARS
    // ========================================
    resume() {
        if (this.starfield) {
            this.starfield.style.animationPlayState = 'running';
        }
        this.stars.forEach(star => {
            star.style.animationPlayState = 'running';
        });
    }

    // ========================================
    // SET INTENSITY
    // ========================================
    setIntensity(level) {
        // Level: 'low', 'normal', 'high'
        switch (level) {
            case 'low':
                this.config.starsPerSegment = 1;
                break;
            case 'high':
                this.config.starsPerSegment = 5;
                break;
            default:
                this.config.starsPerSegment = 3;
        }
    }

    // ========================================
    // CLEAR ALL STARS
    // ========================================
    clear() {
        this.stars.forEach(star => star.remove());
        this.stars = [];
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        this.clear();
        
        // Remove static stars
        document.querySelectorAll('.static-star').forEach(star => star.remove());
        
        // Clear audio cache
        this.audioCache = {};
        this.soundsLoaded = false;
        
        this.isInitialized = false;
    }
}

export default StarfallManager;
