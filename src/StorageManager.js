/* =====================================================
   STORAGEMANAGER.JS - Local Storage Handler
   Manages persistent data storage
   ===================================================== */

export class StorageManager {
    constructor(prefix = 'kawaii-blog') {
        this.prefix = prefix;
        this.isAvailable = this.checkAvailability();
    }

    // ========================================
    // CHECK STORAGE AVAILABILITY
    // ========================================
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

    // ========================================
    // GET KEY WITH PREFIX
    // ========================================
    getKey(key) {
        return `${this.prefix}-${key}`;
    }

    // ========================================
    // SET VALUE
    // ========================================
    set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            const serialized = JSON.stringify({
                value,
                timestamp: Date.now()
            });
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    // ========================================
    // GET VALUE
    // ========================================
    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            return parsed.value !== undefined ? parsed.value : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    // ========================================
    // REMOVE VALUE
    // ========================================
    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    // ========================================
    // CHECK IF KEY EXISTS
    // ========================================
    has(key) {
        if (!this.isAvailable) return false;
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    // ========================================
    // CLEAR ALL WITH PREFIX
    // ========================================
    clear() {
        if (!this.isAvailable) return false;
        
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    // ========================================
    // GET ALL STORED DATA
    // ========================================
    getAll() {
        if (!this.isAvailable) return {};
        
        const data = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const shortKey = key.replace(`${this.prefix}-`, '');
                    data[shortKey] = this.get(shortKey);
                } catch (e) {
                    console.error('Error reading key:', key, e);
                }
            }
        });
        
        return data;
    }

    // ========================================
    // GET WITH EXPIRY
    // ========================================
    getWithExpiry(key, maxAge = 86400000) { // Default 24 hours
        if (!this.isAvailable) return null;
        
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            const now = Date.now();
            
            if (now - parsed.timestamp > maxAge) {
                this.remove(key);
                return null;
            }
            
            return parsed.value;
        } catch (e) {
            console.error('Storage getWithExpiry error:', e);
            return null;
        }
    }

    // ========================================
    // UPDATE VALUE (MERGE OBJECTS)
    // ========================================
    update(key, updates) {
        const current = this.get(key, {});
        
        if (typeof current === 'object' && typeof updates === 'object') {
            return this.set(key, { ...current, ...updates });
        }
        
        return this.set(key, updates);
    }

    // ========================================
    // INCREMENT VALUE
    // ========================================
    increment(key, amount = 1) {
        const current = this.get(key, 0);
        return this.set(key, current + amount);
    }

    // ========================================
    // PUSH TO ARRAY
    // ========================================
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

    // ========================================
    // GET STORAGE SIZE
    // ========================================
    getSize() {
        if (!this.isAvailable) return 0;
        
        let total = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        });
        
        return total;
    }
}

export default StorageManager;
