/* =====================================================
   ANIMATIONMANAGER.JS - Animation Controller
   Manages all animations and effects
   ===================================================== */

import { Utils } from './Utils.js';

export class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.isPaused = false;
        this.reducedMotion = Utils.prefersReducedMotion();
        
        // Listen for reduced motion preference changes
        this.setupMotionListener();
    }

    // ========================================
    // SETUP MOTION PREFERENCE LISTENER
    // ========================================
    setupMotionListener() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            if (this.reducedMotion) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });
    }

    // ========================================
    // REGISTER ANIMATION
    // ========================================
    register(id, animation) {
        this.animations.set(id, {
            animation,
            isPlaying: false,
            element: null
        });
        return id;
    }

    // ========================================
    // PLAY ANIMATION
    // ========================================
    play(id) {
        if (this.reducedMotion || this.isPaused) return;
        
        const anim = this.animations.get(id);
        if (anim) {
            anim.isPlaying = true;
            if (typeof anim.animation === 'function') {
                anim.animation();
            }
        }
    }

    // ========================================
    // STOP ANIMATION
    // ========================================
    stop(id) {
        const anim = this.animations.get(id);
        if (anim) {
            anim.isPlaying = false;
        }
    }

    // ========================================
    // PAUSE ALL ANIMATIONS
    // ========================================
    pauseAll() {
        this.isPaused = true;
        document.documentElement.style.setProperty('--animation-play-state', 'paused');
    }

    // ========================================
    // RESUME ALL ANIMATIONS
    // ========================================
    resumeAll() {
        if (this.reducedMotion) return;
        this.isPaused = false;
        document.documentElement.style.setProperty('--animation-play-state', 'running');
    }

    // ========================================
    // ANIMATE ELEMENT
    // ========================================
    animate(element, keyframes, options = {}) {
        if (this.reducedMotion) {
            // Apply final state immediately
            const finalFrame = keyframes[keyframes.length - 1];
            Object.assign(element.style, finalFrame);
            return Promise.resolve();
        }

        const defaults = {
            duration: 300,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
        };

        const animation = element.animate(keyframes, { ...defaults, ...options });
        
        return new Promise(resolve => {
            animation.onfinish = resolve;
        });
    }

    // ========================================
    // BOUNCE ANIMATION
    // ========================================
    bounce(element, intensity = 1) {
        if (this.reducedMotion) return Promise.resolve();
        
        return this.animate(element, [
            { transform: 'scale(1)', offset: 0 },
            { transform: `scale(${1 + 0.1 * intensity})`, offset: 0.3 },
            { transform: `scale(${1 - 0.05 * intensity})`, offset: 0.5 },
            { transform: `scale(${1 + 0.03 * intensity})`, offset: 0.7 },
            { transform: 'scale(1)', offset: 1 }
        ], { duration: 400 });
    }

    // ========================================
    // SHAKE ANIMATION
    // ========================================
    shake(element, intensity = 5) {
        if (this.reducedMotion) return Promise.resolve();
        
        return this.animate(element, [
            { transform: 'translateX(0)' },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: `translateX(-${intensity}px)` },
            { transform: 'translateX(0)' }
        ], { duration: 300 });
    }

    // ========================================
    // PULSE ANIMATION
    // ========================================
    pulse(element, scale = 1.1) {
        if (this.reducedMotion) return Promise.resolve();
        
        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
        ], { duration: 300 });
    }

    // ========================================
    // FADE IN ANIMATION
    // ========================================
    fadeIn(element, duration = 300) {
        if (this.reducedMotion) {
            element.style.opacity = '1';
            return Promise.resolve();
        }
        
        element.style.opacity = '0';
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    // ========================================
    // FADE OUT ANIMATION
    // ========================================
    fadeOut(element, duration = 300) {
        if (this.reducedMotion) {
            element.style.opacity = '0';
            return Promise.resolve();
        }
        
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    // ========================================
    // SLIDE IN ANIMATION
    // ========================================
    slideIn(element, direction = 'up', distance = 20) {
        if (this.reducedMotion) {
            element.style.opacity = '1';
            element.style.transform = 'translate(0)';
            return Promise.resolve();
        }

        const transforms = {
            up: `translateY(${distance}px)`,
            down: `translateY(-${distance}px)`,
            left: `translateX(${distance}px)`,
            right: `translateX(-${distance}px)`
        };

        return this.animate(element, [
            { opacity: 0, transform: transforms[direction] },
            { opacity: 1, transform: 'translate(0)' }
        ], { duration: 400 });
    }

    // ========================================
    // RIPPLE EFFECT
    // ========================================
    createRipple(event, container) {
        if (this.reducedMotion) return;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';

        const rect = container.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,143,171,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
            z-index: 100;
        `;

        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(ripple);

        this.animate(ripple, [
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], { duration: 600 }).then(() => {
            ripple.remove();
        });
    }

    // ========================================
    // CONFETTI EFFECT
    // ========================================
    createConfetti(count = 50) {
        if (this.reducedMotion) return;

        const colors = ['#FF8FAB', '#A99ED0', '#F5D0E8', '#C4B8E0', '#FFB6C1'];
        const container = document.body;

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${Utils.randomItem(colors)};
                left: ${Utils.random(0, 100)}vw;
                top: -10px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                z-index: 9999;
                pointer-events: none;
            `;

            container.appendChild(confetti);

            this.animate(confetti, [
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(100vh) rotate(${Utils.random(360, 720)}deg)`, opacity: 0 }
            ], { 
                duration: Utils.random(2000, 5000),
                easing: 'linear'
            }).then(() => {
                confetti.remove();
            });
        }
    }

    // ========================================
    // TYPEWRITER EFFECT
    // ========================================
    async typewriter(element, text, speed = 50) {
        if (this.reducedMotion) {
            element.textContent = text;
            return;
        }

        element.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await Utils.sleep(speed);
        }
    }

    // ========================================
    // STAGGER ANIMATION
    // ========================================
    stagger(elements, animation, delay = 100) {
        if (this.reducedMotion) {
            elements.forEach(el => {
                if (typeof animation === 'function') {
                    animation(el);
                }
            });
            return Promise.resolve();
        }

        const promises = Array.from(elements).map((el, i) => {
            return Utils.sleep(i * delay).then(() => {
                if (typeof animation === 'function') {
                    return animation(el);
                }
            });
        });

        return Promise.all(promises);
    }

    // ========================================
    // ADD CSS CLASS ANIMATION
    // ========================================
    addAnimationClass(element, className, duration = 1000) {
        element.classList.add(className);
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.classList.remove(className);
                resolve();
            }, duration);
        });
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        this.animations.clear();
        this.pauseAll();
    }
}

export default AnimationManager;
