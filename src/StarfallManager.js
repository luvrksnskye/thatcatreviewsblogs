/* =====================================================
   STARFALLMANAGER.JS - Shooting Stars Background (OPTIMIZED)
   Reduced DOM elements, deferred creation, pooling
   ===================================================== */

import { Utils } from './Utils.js';

export class StarfallManager {
    constructor() {
        this.container = null;
        this.starfield = null;
        this.stars = [];
        this.staticStars = [];
        this.isInitialized = false;
        this.isPaused = false;
        
        // Reduced configuration for better performance
        this.config = {
            starsPerSegment: 2,  // Reduced from 3.15
            baseAnimationDuration: 3000,
            durationVariance: 500,
            maxDelay: 8000,
            // Fewer segments for less stars
            segments: [
                { x: [0, 50], y: [0, 50] },
                { x: [50, 100], y: [0, 50] },
                { x: [0, 50], y: [50, 100] },
                { x: [50, 100], y: [50, 100] }
            ],
            colors: ['white', 'pink', 'purple', 'gold'],
            staticStarCount: 30  // Reduced from 50
        };

        // Simplified sound config - sounds handled externally
        this.soundConfig = {
            enabled: false, // Disabled by default - too many sounds cause lag
            soundInterval: 5000,
            soundChance: 0.2
        };
        
        this.lastSoundTime = 0;
    }

    init() {
        // Check reduced motion preference
        if (Utils.prefersReducedMotion()) {
            console.log('Starfall disabled: reduced motion preferred');
            return;
        }

        this.starfield = document.getElementById('starfield');
        if (!this.starfield) {
            console.warn('Starfield element not found');
            return;
        }

        this.container = document.querySelector('.starfall-container');
        
        // Batch create all stars in a single operation
        this._batchCreateStars();
        
        this.isInitialized = true;
        console.log('✧ Starfall initialized (optimized) ✧');
    }

    _batchCreateStars() {
        // Create all stars as a DocumentFragment for single DOM insertion
        const fallingFragment = document.createDocumentFragment();
        const staticFragment = document.createDocumentFragment();
        
        // Create falling stars
        this.config.segments.forEach(segment => {
            const count = Math.round(this.config.starsPerSegment);
            for (let i = 0; i < count; i++) {
                const star = this._createStarElement(segment);
                fallingFragment.appendChild(star);
                this.stars.push(star);
            }
        });
        
        // Create static stars
        for (let i = 0; i < this.config.staticStarCount; i++) {
            const star = this._createStaticStarElement();
            staticFragment.appendChild(star);
            this.staticStars.push(star);
        }
        
        // Single DOM insertion
        this.starfield.appendChild(fallingFragment);
        document.body.appendChild(staticFragment);
    }

    _createStarElement(segment) {
        const star = document.createElement('div');
        star.className = 'falling-star';
        
        // Random color (30% chance)
        if (Math.random() > 0.7) {
            star.classList.add(Utils.randomItem(this.config.colors));
        }
        
        // Size variation
        const sizeRandom = Math.random();
        if (sizeRandom > 0.85) {
            star.classList.add('large');
        } else if (sizeRandom < 0.25) {
            star.classList.add('small');
        }
        
        // Position
        const x = segment.x[0] + Math.random() * (segment.x[1] - segment.x[0]);
        const y = segment.y[0] + Math.random() * (segment.y[1] - segment.y[0]);
        
        // Use transform for position (GPU accelerated)
        star.style.cssText = `
            left: ${x}%;
            top: ${y}%;
            animation-delay: ${Math.random() * this.config.maxDelay}ms;
            animation-duration: ${this.config.baseAnimationDuration + (Math.random() - 0.5) * this.config.durationVariance}ms;
            opacity: ${0.75 + Math.random() * 0.25};
        `;
        
        return star;
    }

    _createStaticStarElement() {
        const star = document.createElement('div');
        star.className = 'static-star';
        
        const size = Utils.random(1, 3);
        star.style.cssText = `
            left: ${Utils.random(0, 100)}%;
            top: ${Utils.random(0, 100)}%;
            width: ${size}px;
            height: ${size}px;
            animation-delay: ${Utils.random(0, 3)}s;
        `;
        
        return star;
    }

    createShootingStar() {
        if (!this.isInitialized || this.isPaused || Utils.prefersReducedMotion()) return;
        
        const segment = Utils.randomItem(this.config.segments);
        const star = this._createStarElement(segment);
        star.style.animationDelay = '0ms';
        
        this.starfield.appendChild(star);
        this.stars.push(star);
        
        // Play sound with throttling
        if (this.soundConfig.enabled) {
            this._tryPlaySound();
        }
        
        // Clean up after animation
        const duration = parseFloat(star.style.animationDuration) || 3000;
        setTimeout(() => {
            star.remove();
            const idx = this.stars.indexOf(star);
            if (idx > -1) this.stars.splice(idx, 1);
        }, duration + 500);
    }

    _tryPlaySound() {
        const now = Date.now();
        if (now - this.lastSoundTime < this.soundConfig.soundInterval) return;
        if (Math.random() > this.soundConfig.soundChance) return;
        
        this.lastSoundTime = now;
        // Sound playing delegated to external sound manager
        this.onStarSound?.();
    }

    starBurst(count = 3) {
        if (!this.isInitialized || this.isPaused) return;
        
        // Limit burst size for performance
        const actualCount = Math.min(count, 5);
        
        for (let i = 0; i < actualCount; i++) {
            setTimeout(() => this.createShootingStar(), i * 250);
        }
    }

    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        
        if (this.starfield) {
            this.starfield.style.animationPlayState = 'paused';
        }
        
        // Pause all stars with a single class toggle
        document.body.classList.add('stars-paused');
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        
        if (this.starfield) {
            this.starfield.style.animationPlayState = 'running';
        }
        
        document.body.classList.remove('stars-paused');
    }

    setIntensity(level) {
        const levels = {
            low: 1,
            normal: 2,
            high: 3
        };
        this.config.starsPerSegment = levels[level] || 2;
    }

    setSoundEnabled(enabled) {
        this.soundConfig.enabled = enabled;
    }

    recalculate() {
        // Stars use percentages, no recalculation needed
    }

    clear() {
        this.stars.forEach(star => star.remove());
        this.stars = [];
    }

    destroy() {
        this.clear();
        
        // Remove static stars
        this.staticStars.forEach(star => star.remove());
        this.staticStars = [];
        
        document.body.classList.remove('stars-paused');
        this.isInitialized = false;
    }
}

export default StarfallManager;
