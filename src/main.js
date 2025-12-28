/* =====================================================
   MAIN.JS - Application Entry Point
   Optimized initialization and coordination
   ===================================================== */

// ========================================
// MODULE IMPORTS
// ========================================
import { AnimationManager } from './AnimationManager.js';
import { StarfallManager } from './StarfallManager.js';
import { NotificationManager } from './NotificationManager.js';
import { MusicPlayer } from './MusicPlayer.js';
import { TabManager } from './TabManager.js';
import { CardInteractions } from './CardInteractions.js';
import { GalleryManager } from './GalleryManager.js';
import { SoundManager } from './SoundManager.js';
import { StorageManager } from './StorageManager.js';
import { TimeOfDayManager } from './TimeOfDayManager.js';
import { BlogStatusManager } from './BlogStatusManager.js';
import { SitePetManager } from './SitePetManager.js';
import { Utils } from './Utils.js';
import { MusicStateManager } from './MusicStateManager.js';
import { HolidayManager } from './HolidayManager.js';
import { WelcomeNoticeManager } from './WelcomeNoticeManager.js';

// ========================================
// APPLICATION CLASS
// ========================================
class KawaiiBlogApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.version = '1.2.0';
    }

    async init() {
        console.log('✧ Initializing Kawaii Blog App ✧');
        
        try {
            // Phase 1: Core modules (immediate)
            this._initCoreModules();
            
            // Phase 2: UI update (immediate)
            this._updateDateDisplay();
            
            // Phase 3: Background (deferred - doesn't block render)
            requestAnimationFrame(() => {
                this._initBackgroundModules();
            });
            
            // Phase 4: Interactive modules (deferred slightly)
            setTimeout(async () => {
                await this._initInteractiveModules();
                
                // Phase 5: Welcome flow
                await this._handleWelcomeFlow();
                
                // Phase 6: Holiday system
                this._initHolidaySystem();
            }, 50);
            
            // Phase 7: Global events (immediate)
            this._setupGlobalEvents();
            
            this.isInitialized = true;
            console.log('✧ App initialized successfully! ✧');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    _initCoreModules() {
        this.modules.storage = new StorageManager();
        this.modules.sound = new SoundManager();
        this.modules.notification = new NotificationManager(this.modules.sound);
        this.modules.animation = new AnimationManager();
    }

    _initBackgroundModules() {
        this.modules.starfall = new StarfallManager();
        this.modules.starfall.init();
    }

    async _initInteractiveModules() {
        // Tab Navigation
        this.modules.tabs = new TabManager(this.modules.sound);
        this.modules.tabs.init();
        
        // Card Interactions
        this.modules.cards = new CardInteractions(
            this.modules.animation,
            this.modules.sound
        );
        this.modules.cards.init();
        
        // Music Player
        this.modules.music = new MusicPlayer(
            this.modules.storage,
            this.modules.notification,
            this.modules.sound
        );
        this.modules.music.init();
        
        // Music State Manager
        this.modules.musicState = new MusicStateManager(
            this.modules.storage,
            this.modules.music
        );
        await this.modules.musicState.init();
        
        // Gallery
        this.modules.gallery = new GalleryManager(this.modules.sound);
        this.modules.gallery.init();
        
        // Time of Day System
        this.modules.timeOfDay = new TimeOfDayManager(
            this.modules.storage,
            this.modules.sound,
            this.modules.music
        );
        this.modules.timeOfDay.init();
        
        // Blog Status Manager
        this.modules.blogStatus = new BlogStatusManager(this.modules.sound);
        await this.modules.blogStatus.init();
        
        // Site Pet
        this.modules.sitePet = new SitePetManager(
            this.modules.storage,
            this.modules.timeOfDay,
            this.modules.sound
        );
        this.modules.sitePet.init();
    }

    async _handleWelcomeFlow() {
        // Initialize Welcome Notice Manager
        this.modules.welcomeNotice = new WelcomeNoticeManager(
            this.modules.storage,
            this.modules.sound
        );
        this.modules.welcomeNotice.init();
        
        // Connect TimeOfDay to WelcomeNotice for settings button
        this.modules.timeOfDay.setWelcomeNotice(this.modules.welcomeNotice);
        
        // Show welcome if new user
        if (this.modules.welcomeNotice.shouldShowNotice()) {
            console.log('✧ Showing welcome flow for new user ✧');
            await this.modules.welcomeNotice.show();
        }
        
        // Apply saved preferences
        this._applyPreferences();
    }

    _applyPreferences() {
        const prefs = this.modules.storage.getPreferences();
        
        if (prefs.musicAutoplay && this.modules.music) {
            setTimeout(() => {
                this.modules.music.play?.();
            }, 1000);
        }
        
        if (!prefs.soundEnabled && this.modules.sound) {
            this.modules.sound.setEnabled?.(false);
        }
    }

    _initHolidaySystem() {
        this.modules.holiday = new HolidayManager(
            this.modules.storage,
            this.modules.sound,
            this.modules.music,
            this.modules.sitePet,
            this.modules.welcomeNotice
        );
        this.modules.holiday.init();
    }

    _setupGlobalEvents() {
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.modules.animation?.pauseAll?.();
                this.modules.sitePet?.pause?.();
            } else {
                this.modules.animation?.resumeAll?.();
                this.modules.sitePet?.resume?.();
            }
        });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.modules.starfall?.recalculate?.();
            }, 200);
        });
        
        window.addEventListener('beforeunload', () => {
            this._saveState();
        });
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
            
            if (e.shiftKey && e.code === 'KeyT') {
                this.modules.timeOfDay?.openModal?.();
            }
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
