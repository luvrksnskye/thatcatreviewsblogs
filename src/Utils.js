/* =====================================================
   UTILS.JS - Utility Functions Module
   Helper functions used across the application
   ===================================================== */

export class Utils {
    
    // ========================================
    // TIMING UTILITIES
    // ========================================
    
    /**
     * Debounce function - delays execution until after wait ms
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function - limits execution to once per limit ms
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} Throttled function
     */
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

    /**
     * Sleep/delay utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Resolves after ms
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // DOM UTILITIES
    // ========================================
    
    /**
     * Query selector shorthand
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {Element|null}
     */
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    /**
     * Query selector all shorthand
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element
     * @returns {NodeList}
     */
    static $$(selector, context = document) {
        return context.querySelectorAll(selector);
    }

    /**
     * Create element with attributes and content
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes object
     * @param {string|Element} content - Inner content
     * @returns {Element}
     */
    static createElement(tag, attrs = {}, content = '') {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('data')) {
                el.dataset[key.replace('data', '').toLowerCase()] = value;
            } else {
                el.setAttribute(key, value);
            }
        });
        
        if (typeof content === 'string') {
            el.innerHTML = content;
        } else if (content instanceof Element) {
            el.appendChild(content);
        }
        
        return el;
    }

    /**
     * Add event listener with auto-cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    static on(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Visibility threshold (0-1)
     * @returns {boolean}
     */
    static isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
        const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
        
        return vertInView && horInView;
    }

    // ========================================
    // NUMBER UTILITIES
    // ========================================
    
    /**
     * Clamp a number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    static clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Get random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Get random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number}
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Linear interpolation
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number}
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Map value from one range to another
     * @param {number} value - Value to map
     * @param {number} inMin - Input minimum
     * @param {number} inMax - Input maximum
     * @param {number} outMin - Output minimum
     * @param {number} outMax - Output maximum
     * @returns {number}
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    // ========================================
    // STRING UTILITIES
    // ========================================
    
    /**
     * Generate unique ID
     * @param {string} prefix - Optional prefix
     * @returns {string}
     */
    static generateId(prefix = '') {
        const id = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}-${id}` : id;
    }

    /**
     * Format time from seconds
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time (m:ss)
     */
    static formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Capitalize first letter
     * @param {string} str - String to capitalize
     * @returns {string}
     */
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========================================
    // ARRAY UTILITIES
    // ========================================
    
    /**
     * Shuffle array (Fisher-Yates)
     * @param {Array} array - Array to shuffle
     * @returns {Array} New shuffled array
     */
    static shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Get random item from array
     * @param {Array} array - Source array
     * @returns {*}
     */
    static randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // ========================================
    // EASING FUNCTIONS
    // ========================================
    
    static easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeOutBounce: t => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        },
        easeOutElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
    };

    // ========================================
    // BROWSER UTILITIES
    // ========================================
    
    /**
     * Check if reduced motion is preferred
     * @returns {boolean}
     */
    static prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Check if dark mode is preferred
     * @returns {boolean}
     */
    static prefersDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Check if touch device
     * @returns {boolean}
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Get scroll position
     * @returns {Object} {x, y}
     */
    static getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }
}

export default Utils;
