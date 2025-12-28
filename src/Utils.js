/* =====================================================
   UTILS.JS - Utility Functions (OPTIMIZED)
   Minimal, efficient helpers
   ===================================================== */

export class Utils {
    
    // Debounce with leading edge option
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    // Throttle
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Sleep
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clamp
    static clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    // Random number
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Random integer
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Random array item
    static randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Format time (seconds to mm:ss)
    static formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Generate unique ID
    static generateId(prefix = '') {
        const id = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}-${id}` : id;
    }

    // Check reduced motion preference (cached)
    static _reducedMotion = null;
    static prefersReducedMotion() {
        if (this._reducedMotion === null) {
            this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return this._reducedMotion;
    }

    // Check if touch device (cached)
    static _isTouch = null;
    static isTouchDevice() {
        if (this._isTouch === null) {
            this._isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        }
        return this._isTouch;
    }

    // Simple element creation
    static createElement(tag, attrs = {}, content = '') {
        const el = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else {
                el.setAttribute(key, value);
            }
        }
        
        if (typeof content === 'string') {
            el.innerHTML = content;
        } else if (content instanceof Element) {
            el.appendChild(content);
        }
        
        return el;
    }

    // Easing functions
    static easing = {
        linear: t => t,
        easeOutQuad: t => t * (2 - t),
        easeOutCubic: t => (--t) * t * t + 1,
        easeOutElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : 
                Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
    };
}

export default Utils;
