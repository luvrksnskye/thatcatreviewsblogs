/* =====================================================
   ANIMATIONMANAGER.JS - Animation Controller (OPTIMIZED)
   RAF-based, reduced motion support
   ===================================================== */

import { Utils } from './Utils.js';

export class AnimationManager {
    constructor() {
        this.isPaused = false;
        this.reducedMotion = Utils.prefersReducedMotion();
        
        // Listen for reduced motion changes
        window.matchMedia('(prefers-reduced-motion: reduce)')
            .addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
            });
    }

    pauseAll() {
        this.isPaused = true;
        document.documentElement.style.setProperty('--animation-play-state', 'paused');
    }

    resumeAll() {
        if (this.reducedMotion) return;
        this.isPaused = false;
        document.documentElement.style.setProperty('--animation-play-state', 'running');
    }

    // Simple animate using Web Animations API
    animate(element, keyframes, options = {}) {
        if (this.reducedMotion || this.isPaused) {
            // Apply final state immediately
            const final = keyframes[keyframes.length - 1];
            if (final) Object.assign(element.style, final);
            return Promise.resolve();
        }

        const defaults = {
            duration: 300,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
        };

        const animation = element.animate(keyframes, { ...defaults, ...options });
        return animation.finished;
    }

    // Bounce effect
    bounce(element, intensity = 1) {
        if (this.reducedMotion) return Promise.resolve();
        
        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: `scale(${1 + 0.1 * intensity})` },
            { transform: 'scale(1)' }
        ], { duration: 300 });
    }

    // Pulse effect
    pulse(element, scale = 1.1) {
        if (this.reducedMotion) return Promise.resolve();
        
        return this.animate(element, [
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
        ], { duration: 300 });
    }

    // Fade in
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

    // Fade out
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

    // Ripple effect
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
        `;

        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.appendChild(ripple);

        this.animate(ripple, [
            { transform: 'scale(0)', opacity: 1 },
            { transform: 'scale(2)', opacity: 0 }
        ], { duration: 500 }).then(() => ripple.remove());
    }

    destroy() {
        this.pauseAll();
    }
}

export default AnimationManager;
