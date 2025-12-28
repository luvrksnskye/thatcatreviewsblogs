/* =====================================================
   STORAGEMANAGER.JS - Local Storage Handler (OPTIMIZED)
   Efficient caching, batched writes, minimal reads
   ===================================================== */

export class StorageManager {
    constructor(prefix = 'kawaii-blog') {
        this.prefix = prefix;
        this.isAvailable = this._checkAvailability();
        
        // In-memory cache - single source of truth
        this._cache = new Map();
        this._dirty = new Set(); // Track modified keys for batched writes
        this._writeScheduled = false;
        
        // Default preferences
        this._defaultPreferences = {
            musicAutoplay: false,
            holidayManualMode: false,
            holidayEnabled: true,
            soundEnabled: true,
            reducedMotion: false
        };
        
        // Load cache once at startup
        if (this.isAvailable) {
            this._loadCache();
        }
        
        // Schedule periodic flush
        this._setupAutoFlush();
    }

    _checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage not available');
            return false;
        }
    }

    _loadCache() {
        try {
            const prefixLen = this.prefix.length + 1;
            for (let i = 0; i < localStorage.length; i++) {
                const fullKey = localStorage.key(i);
                if (fullKey?.startsWith(this.prefix + '-')) {
                    const item = localStorage.getItem(fullKey);
                    if (item) {
                        try {
                            this._cache.set(fullKey, JSON.parse(item));
                        } catch {
                            // Invalid JSON, skip
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Cache load error:', e);
        }
    }

    _setupAutoFlush() {
        // Flush dirty entries every 5 seconds
        setInterval(() => this._flushDirty(), 5000);
        
        // Also flush on page hide/unload
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this._flushDirty();
        });
        
        window.addEventListener('beforeunload', () => this._flushDirty());
    }

    _flushDirty() {
        if (this._dirty.size === 0 || !this.isAvailable) return;
        
        for (const fullKey of this._dirty) {
            try {
                const data = this._cache.get(fullKey);
                if (data !== undefined) {
                    localStorage.setItem(fullKey, JSON.stringify(data));
                }
            } catch (e) {
                console.warn('Storage write error:', e);
            }
        }
        
        this._dirty.clear();
    }

    _scheduleWrite(fullKey) {
        this._dirty.add(fullKey);
        
        // Use requestIdleCallback for non-blocking writes
        if (!this._writeScheduled) {
            this._writeScheduled = true;
            
            const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
            schedule(() => {
                this._flushDirty();
                this._writeScheduled = false;
            }, { timeout: 2000 });
        }
    }

    getKey(key) {
        return `${this.prefix}-${key}`;
    }

    set(key, value) {
        const fullKey = this.getKey(key);
        const data = {
            value,
            timestamp: Date.now()
        };
        
        this._cache.set(fullKey, data);
        this._scheduleWrite(fullKey);
        
        return true;
    }

    get(key, defaultValue = null) {
        const fullKey = this.getKey(key);
        const cached = this._cache.get(fullKey);
        
        if (cached !== undefined) {
            return cached.value !== undefined ? cached.value : defaultValue;
        }
        
        return defaultValue;
    }

    remove(key) {
        const fullKey = this.getKey(key);
        this._cache.delete(fullKey);
        this._dirty.delete(fullKey);
        
        if (this.isAvailable) {
            try {
                localStorage.removeItem(fullKey);
            } catch {}
        }
        
        return true;
    }

    has(key) {
        return this._cache.has(this.getKey(key));
    }

    clear() {
        if (!this.isAvailable) return false;
        
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(this.prefix + '-')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            this._cache.clear();
            this._dirty.clear();
            
            return true;
        } catch (e) {
            return false;
        }
    }

    // ========================================
    // PREFERENCES SYSTEM (Cached)
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
        const fullKey = this.getKey(key);
        const cached = this._cache.get(fullKey);
        
        if (cached) {
            if (Date.now() - cached.timestamp > maxAge) {
                this.remove(key);
                return null;
            }
            return cached.value;
        }
        
        return null;
    }

    update(key, updates) {
        const current = this.get(key, {});
        
        if (typeof current === 'object' && typeof updates === 'object') {
            return this.set(key, { ...current, ...updates });
        }
        
        return this.set(key, updates);
    }

    getSize() {
        if (!this.isAvailable) return 0;
        
        let total = 0;
        for (const [key, value] of this._cache) {
            total += key.length + JSON.stringify(value).length;
        }
        
        return total;
    }
}

export default StorageManager;
