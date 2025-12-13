/* =====================================================
   MAIN.JS - Application Entry Point
   Initializes and coordinates all modules
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


// ========================================
// APPLICATION CLASS
// ========================================
class KawaiiBlogApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.version = '1.1.0';
    }

    // ----------------------------------------
    // INITIALIZATION
    // ----------------------------------------
    async init() {
        console.log('✧ Initializing Kawaii Blog App ✧');
        
        try {
            // Initialize core modules first
            await this.initCoreModules();
            
            // Initialize feature modules
            await this.initFeatureModules();
            
            // Initialize time of day system
            await this.initTimeOfDaySystem();
            
            // Initialize site pet
            await this.initSitePet();
            
            // Initialize holiday system
            await this.initHoliday();
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            // Check for first visit
            this.checkFirstVisit();
            
            // Update date display
            this.updateDateDisplay();
            
            this.isInitialized = true;
            console.log('✧ App initialized successfully! ✧');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    // ----------------------------------------
    // CORE MODULES INITIALIZATION
    // ----------------------------------------
    async initCoreModules() {
        // Storage Manager (must be first)
        this.modules.storage = new StorageManager();
        
        // Sound Manager
        this.modules.sound = new SoundManager();
        
        // Animation Manager
        this.modules.animation = new AnimationManager();

        
        // Notification Manager
        this.modules.notification = new NotificationManager(this.modules.sound);
    }

    // ----------------------------------------
    // FEATURE MODULES INITIALIZATION
    // ----------------------------------------
    async initFeatureModules() {
        // Starfall Background
        this.modules.starfall = new StarfallManager();
        this.modules.starfall.init();
        
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
    }

    // ----------------------------------------
    // TIME OF DAY SYSTEM INITIALIZATION
    // ----------------------------------------
    async initTimeOfDaySystem() {
        // Time of Day Manager (depends on storage, sound, and music)
        this.modules.timeOfDay = new TimeOfDayManager(
            this.modules.storage,
            this.modules.sound,
            this.modules.music
        );
        this.modules.timeOfDay.init();
        
        // Blog Status Manager (dynamic blog content in status tab)
        this.modules.blogStatus = new BlogStatusManager(this.modules.sound);
        await this.modules.blogStatus.init();
    }

    // ----------------------------------------
    // SITE PET INITIALIZATION
    // ----------------------------------------
    async initSitePet() {
        this.modules.sitePet = new SitePetManager(
            this.modules.storage,
            this.modules.timeOfDay,
            this.modules.sound  
        );
        this.modules.sitePet.init();
    }

    async initHoliday() {
    this.modules.holiday = new HolidayManager(
        this.modules.storage,
        this.modules.sound,
        this.modules.music,
        this.modules.sitePet
    );
    this.modules.holiday.init();
}

    // ----------------------------------------
    // GLOBAL EVENT LISTENERS
    // ----------------------------------------
    setupGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Visibility change (pause animations when hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.modules.animation.pauseAll();
                this.modules.sitePet?.pause();
            } else {
                this.modules.animation.resumeAll();
                this.modules.sitePet?.resume();
            }
        });
        
        // Resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Before unload - save state
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }

    // ----------------------------------------
    // KEYBOARD HANDLER
    // ----------------------------------------
    handleKeyboard(e) {
        // Escape key - close modals
        if (e.key === 'Escape') {
            this.modules.gallery.closeLightbox();
        }
        
        // Space key - toggle music (if not typing)
        if (e.code === 'Space' && !this.isTyping(e)) {
            e.preventDefault();
            this.modules.music.togglePlay();
        }
        
        // Arrow keys for music
        if (e.code === 'ArrowRight' && e.ctrlKey) {
            this.modules.music.nextTrack();
        }
        if (e.code === 'ArrowLeft' && e.ctrlKey) {
            this.modules.music.prevTrack();
        }
        
        // Theme toggle shortcut (Ctrl + Shift + D)
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
            this.modules.theme.toggle();
        }
        
        // Time of day shortcut (Ctrl + Shift + T)
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
            this.modules.timeOfDay.openModal();
        }
    }

    // ----------------------------------------
    // CHECK IF USER IS TYPING
    // ----------------------------------------
    isTyping(e) {
        const target = e.target;
        return target.tagName === 'INPUT' || 
               target.tagName === 'TEXTAREA' || 
               target.isContentEditable;
    }

    // ----------------------------------------
    // RESIZE HANDLER
    // ----------------------------------------
    handleResize() {
        // Recalculate star positions if needed
        this.modules.starfall.recalculate();
    }

    // ----------------------------------------
    // FIRST VISIT CHECK
    // ----------------------------------------
    checkFirstVisit() {
        const hasVisited = this.modules.storage.get('hasVisited');
        
        if (!hasVisited) {
            // Show welcome notification
            setTimeout(() => {
                this.modules.notification.showWelcome({
                    title: 'Welcome to Abby\'s Blog!',
                    message: 'Hey there! Thanks for stopping by. Feel free to explore around and enjoy your stay! Click the paw button to change the time of day!',
                    duration: 8000
                });
            }, 1500);
            
            // Mark as visited
            this.modules.storage.set('hasVisited', true);
        }
    }

    // ----------------------------------------
    // UPDATE DATE DISPLAY
    // ----------------------------------------
    updateDateDisplay() {
        const dateElement = document.getElementById('topbar-date');
        if (dateElement) {
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
    }

    // ----------------------------------------
    // SAVE STATE
    // ----------------------------------------
    saveState() {
        // Save any necessary state before page unload
        if (this.modules.music) {
            this.modules.music.saveState();
        }
    }

    // ----------------------------------------
    // GET MODULE
    // ----------------------------------------
    getModule(name) {
        return this.modules[name] || null;
    }

    // ----------------------------------------
    // DESTROY
    // ----------------------------------------
    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module.destroy) {
                module.destroy();
            }
        });
        this.modules = {};
        this.isInitialized = false;
    }
}

// ========================================
// INITIALIZE APPLICATION
// ========================================
const app = new KawaiiBlogApp();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for external access
window.KawaiiBlogApp = app;

export default app;
