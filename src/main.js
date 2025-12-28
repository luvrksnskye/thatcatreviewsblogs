/* =====================================================
   MAIN.JS - Application Entry Point (OPTIMIZED)
   Lazy loading, deferred initialization, priority phases
   ===================================================== */

// ========================================
// LAZY MODULE IMPORTS (Dynamic imports for non-critical modules)
// ========================================
import { StorageManager } from './StorageManager.js';
import { SoundManager } from './SoundManager.js';
import { Utils } from './Utils.js';

// ========================================
// APPLICATION CLASS
// ========================================
class KawaiiBlogApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.version = '2.0.0-optimized';
        this._initPromises = new Map();
    }

    async init() {
        console.log('✧ Initializing Kawaii Blog App (Optimized) ✧');
        const startTime = performance.now();
        
        try {
            // Phase 1: Critical - Storage & Sound (blocking, fast)
            await this._initCriticalModules();
            
            // Phase 2: UI - Update visible elements immediately
            this._updateDateDisplay();
            
            // Phase 3: Deferred - Non-blocking initialization
            // Use requestIdleCallback for non-critical modules
            this._scheduleNonCriticalModules();
            
            this.isInitialized = true;
            console.log(`✧ Core initialized in ${(performance.now() - startTime).toFixed(0)}ms ✧`);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async _initCriticalModules() {
        // Only the absolutely necessary modules for first paint
        this.modules.storage = new StorageManager();
        this.modules.sound = new SoundManager();
    }

    _scheduleNonCriticalModules() {
        // Use requestIdleCallback if available, otherwise setTimeout
        const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
        
        // Priority 1: Visible UI (after first paint)
        requestAnimationFrame(() => {
            this._initUIModules();
        });
        
        // Priority 2: Background effects (idle time)
        schedule(() => this._initBackgroundModules(), { timeout: 500 });
        
        // Priority 3: Interactive features (after user interaction or idle)
        schedule(() => this._initInteractiveModules(), { timeout: 1000 });
        
        // Priority 4: Welcome flow (after everything else)
        schedule(() => this._handleWelcomeFlow(), { timeout: 1500 });
        
        // Priority 5: Holiday system (lowest priority)
        schedule(() => this._initHolidaySystem(), { timeout: 2000 });
        
        // Setup global events immediately
        this._setupGlobalEvents();
    }

    async _initUIModules() {
        try {
            // Dynamic import for TabManager
            const { TabManager } = await import('./TabManager.js');
            this.modules.tabs = new TabManager(this.modules.sound);
            this.modules.tabs.init();
            
            // Dynamic import for Notification (might be needed for errors)
            const { NotificationManager } = await import('./NotificationManager.js');
            this.modules.notification = new NotificationManager(this.modules.sound);
        } catch (e) {
            console.error('UI modules failed:', e);
        }
    }

    async _initBackgroundModules() {
        try {
            // Only init starfall if not reduced motion
            if (!Utils.prefersReducedMotion()) {
                const { StarfallManager } = await import('./StarfallManager.js');
                this.modules.starfall = new StarfallManager();
                this.modules.starfall.init();
            }
            
            const { AnimationManager } = await import('./AnimationManager.js');
            this.modules.animation = new AnimationManager();
        } catch (e) {
            console.error('Background modules failed:', e);
        }
    }

    async _initInteractiveModules() {
        try {
            // Card Interactions
            const { CardInteractions } = await import('./CardInteractions.js');
            this.modules.cards = new CardInteractions(
                this.modules.animation,
                this.modules.sound
            );
            this.modules.cards.init();
            
            // Music Player (lazy, user-triggered)
            const { MusicPlayer } = await import('./MusicPlayer.js');
            this.modules.music = new MusicPlayer(
                this.modules.storage,
                this.modules.notification,
                this.modules.sound
            );
            this.modules.music.init();
            
            // Music State Manager
            const { MusicStateManager } = await import('./MusicStateManager.js');
            this.modules.musicState = new MusicStateManager(
                this.modules.storage,
                this.modules.music
            );
            await this.modules.musicState.init();
            
            // Gallery (lazy load on tab switch)
            const { GalleryManager } = await import('./GalleryManager.js');
            this.modules.gallery = new GalleryManager(this.modules.sound);
            this.modules.gallery.init();
            
            // Time of Day System
            const { TimeOfDayManager } = await import('./TimeOfDayManager.js');
            this.modules.timeOfDay = new TimeOfDayManager(
                this.modules.storage,
                this.modules.sound,
                this.modules.music
            );
            this.modules.timeOfDay.init();
            
            // Blog Status Manager
            const { BlogStatusManager } = await import('./BlogStatusManager.js');
            this.modules.blogStatus = new BlogStatusManager(this.modules.sound);
            await this.modules.blogStatus.init();
            
            // Site Pet (deferred further if not visible)
            const { SitePetManager } = await import('./SitePetManager.js');
            this.modules.sitePet = new SitePetManager(
                this.modules.storage,
                this.modules.timeOfDay,
                this.modules.sound
            );
            this.modules.sitePet.init();
            
        } catch (e) {
            console.error('Interactive modules failed:', e);
        }
    }

    async _handleWelcomeFlow() {
        try {
            const { WelcomeNoticeManager } = await import('./WelcomeNoticeManager.js');
            this.modules.welcomeNotice = new WelcomeNoticeManager(
                this.modules.storage,
                this.modules.sound
            );
            this.modules.welcomeNotice.init();
            
            // Connect TimeOfDay to WelcomeNotice
            if (this.modules.timeOfDay) {
                this.modules.timeOfDay.setWelcomeNotice(this.modules.welcomeNotice);
            }
            
            // Show welcome if new user
            if (this.modules.welcomeNotice.shouldShowNotice()) {
                await this.modules.welcomeNotice.show();
            }
            
            // Apply saved preferences
            this._applyPreferences();
        } catch (e) {
            console.error('Welcome flow failed:', e);
        }
    }

    _applyPreferences() {
        const prefs = this.modules.storage?.getPreferences() || {};
        
        if (prefs.musicAutoplay && this.modules.music) {
            // Delay autoplay to avoid blocking
            setTimeout(() => {
                this.modules.music.play?.();
            }, 2000);
        }
        
        if (!prefs.soundEnabled && this.modules.sound) {
            this.modules.sound.disable?.();
        }
    }

    async _initHolidaySystem() {
        try {
            const { HolidayManager } = await import('./HolidayManager.js');
            this.modules.holiday = new HolidayManager(
                this.modules.storage,
                this.modules.sound,
                this.modules.music,
                this.modules.sitePet,
                this.modules.welcomeNotice
            );
            this.modules.holiday.init();
        } catch (e) {
            console.error('Holiday system failed:', e);
        }
    }

    _setupGlobalEvents() {
        // Debounced keyboard handler
        const handleKeyboard = Utils.throttle((e) => this._handleKeyboard(e), 100);
        document.addEventListener('keydown', handleKeyboard);
        
        // Visibility change (pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.modules.animation?.pauseAll?.();
                this.modules.sitePet?.pause?.();
                this.modules.starfall?.pause?.();
            } else {
                this.modules.animation?.resumeAll?.();
                this.modules.sitePet?.resume?.();
                this.modules.starfall?.resume?.();
            }
        });
        
        // Debounced resize handler
        const handleResize = Utils.debounce(() => {
            this.modules.starfall?.recalculate?.();
        }, 250);
        window.addEventListener('resize', handleResize, { passive: true });
        
        // Save state on unload
        window.addEventListener('beforeunload', () => this._saveState());
    }

    _handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.modules.gallery?.closeLightbox?.();
        }
        
        if (e.code === 'Space' && !this._isTyping(e)) {
            e.preventDefault();
            this.modules.music?.togglePlay?.();
        }
        
        if (e.ctrlKey) {
            if (e.code === 'ArrowRight') this.modules.music?.nextTrack?.();
            if (e.code === 'ArrowLeft') this.modules.music?.prevTrack?.();
        }
    }

    _isTyping(e) {
        const target = e.target;
        return target.tagName === 'INPUT' || 
               target.tagName === 'TEXTAREA' || 
               target.isContentEditable;
    }

    _updateDateDisplay() {
        const dateElement = document.getElementById('topbar-date');
        if (!dateElement) return;
        
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const formatDate = (date) => {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                           'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        };
        
        dateElement.textContent = `WEEK OF ${formatDate(weekStart)} TO ${formatDate(weekEnd)}`;
    }

    _saveState() {
        this.modules.music?.saveState?.();
        this.modules.musicState?.forcePersist?.();
    }

    getModule(name) {
        return this.modules[name] || null;
    }

    destroy() {
        for (const module of Object.values(this.modules)) {
            module?.destroy?.();
        }
        this.modules = {};
        this.isInitialized = false;
    }
}

// ========================================
// INITIALIZE APPLICATION
// ========================================
const app = new KawaiiBlogApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.KawaiiBlogApp = app;

export default app;
