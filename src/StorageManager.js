/* =====================================================
   STORAGEMANAGER.JS - Optimized Local Storage Handler
   Manages persistent data storage with preferences system
   ===================================================== */

export class StorageManager {
    constructor(prefix = 'kawaii-blog') {
        this.prefix = prefix;
        this.isAvailable = this.checkAvailability();
        
        // In-memory cache
        this._cache = new Map();
        this._cacheLoaded = false;
        
        // Default preferences
        this._defaultPreferences = {
            musicAutoplay: false,
            holidayManualMode: false,
            holidayEnabled: true,
            soundEnabled: true,
            reducedMotion: false
        };
        
        if (this.isAvailable) {
            this._loadCache();
        }
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return false;
        }
    }

    _loadCache() {
        if (this._cacheLoaded) return;
        
        try {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        this._cache.set(key, JSON.parse(item));
                    }
                }
            }
            this._cacheLoaded = true;
        } catch (e) {
            console.error('Cache load error:', e);
        }
    }

    getKey(key) {
        return `${this.prefix}-${key}`;
    }

    set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            const fullKey = this.getKey(key);
            const data = {
                value,
                timestamp: Date.now()
            };
            
            this._cache.set(fullKey, data);
            
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => {
                    localStorage.setItem(fullKey, JSON.stringify(data));
                });
            } else {
                localStorage.setItem(fullKey, JSON.stringify(data));
            }
            
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const fullKey = this.getKey(key);
            
            if (this._cache.has(fullKey)) {
                const cached = this._cache.get(fullKey);
                return cached.value !== undefined ? cached.value : defaultValue;
            }
            
            const item = localStorage.getItem(fullKey);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            this._cache.set(fullKey, parsed);
            return parsed.value !== undefined ? parsed.value : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            const fullKey = this.getKey(key);
            this._cache.delete(fullKey);
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    has(key) {
        if (!this.isAvailable) return false;
        const fullKey = this.getKey(key);
        return this._cache.has(fullKey) || localStorage.getItem(fullKey) !== null;
    }

    clear() {
        if (!this.isAvailable) return false;
        
        try {
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            }
            this._cache.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    // ========================================
    // PREFERENCES SYSTEM
    // ========================================
    
    getPreferences() {
        const saved = this.get('preferences', {});
        return { ...this._defaultPreferences, ...saved };
    }

    getPreference(key) {
        const prefs = this.getPreferences();
        return prefs[key] !== undefined ? prefs[key] : this._defaultPreferences[key];
    }

    setPreference(key, value) {
        const prefs = this.getPreferences();
        prefs[key] = value;
        return this.set('preferences', prefs);
    }

    setPreferences(updates) {
        const prefs = this.getPreferences();
        Object.assign(prefs, updates);
        return this.set('preferences', prefs);
    }

    resetPreferences() {
        return this.set('preferences', { ...this._defaultPreferences });
    }

    hasSeenNotice(noticeId) {
        return this.get(`notice-${noticeId}`, false);
    }

    markNoticeSeen(noticeId) {
        return this.set(`notice-${noticeId}`, true);
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    getWithExpiry(key, maxAge = 86400000) {
        if (!this.isAvailable) return null;
        
        try {
            const fullKey = this.getKey(key);
            const cached = this._cache.get(fullKey);
            
            if (cached) {
                const now = Date.now();
                if (now - cached.timestamp > maxAge) {
                    this.remove(key);
                    return null;
                }
                return cached.value;
            }
            
            return null;
        } catch (e) {
            console.error('Storage getWithExpiry error:', e);
            return null;
        }
    }

    update(key, updates) {
        const current = this.get(key, {});
        
        if (typeof current === 'object' && typeof updates === 'object') {
            return this.set(key, { ...current, ...updates });
        }
        
        return this.set(key, updates);
    }

    increment(key, amount = 1) {
        const current = this.get(key, 0);
        return this.set(key, current + amount);
    }

    push(key, value, maxLength = null) {
        const arr = this.get(key, []);
        
        if (!Array.isArray(arr)) {
            return this.set(key, [value]);
        }
        
        arr.push(value);
        
        if (maxLength && arr.length > maxLength) {
            arr.shift();
        }
        
        return this.set(key, arr);
    }

    getSize() {
        if (!this.isAvailable) return 0;
        
        let total = 0;
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        }
        
        return total;
    }
}

export default StorageManager;
