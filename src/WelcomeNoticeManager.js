/* =====================================================
   WELCOMENOTICEMANAGER.JS - First Visit Notice
   Shows a smooth pop-out notice for new visitors
   Blocks HolidayManager until dismissed
   ===================================================== */

export class WelcomeNoticeManager {
    constructor(storage, sound) {
        this.storage = storage;
        this.sound = sound;
        
        // State
        this.isShowing = false;
        this.overlay = null;
        this.noticeElement = null;
        
        // Callbacks for external coordination
        this.onDismiss = null;
        
        // Config
        this.config = {
            imagePath: './src/assets/notice_system.png',
            soundPath: './src/sound/System_Lumi_01.wav',
            storageKey: 'hasSeenWelcomeNotice',
            animationDuration: 400
        };
        
        // Sound
        this.noticeSound = null;
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        // Preload sound
        this.preloadSound();
        
        console.log('✧ Welcome Notice Manager initialized ✧');
    }

    // ========================================
    // PRELOAD SOUND
    // ========================================
    preloadSound() {
        this.noticeSound = new Audio(this.config.soundPath);
        this.noticeSound.preload = 'auto';
        this.noticeSound.volume = 0.5;
    }

    // ========================================
    // CHECK IF SHOULD SHOW NOTICE
    // ========================================
    shouldShowNotice() {
        return !this.storage.get(this.config.storageKey, false);
    }

    // ========================================
    // SHOW NOTICE
    // ========================================
    show() {
        if (this.isShowing) return Promise.resolve();
        if (!this.shouldShowNotice()) return Promise.resolve();
        
        return new Promise((resolve) => {
            this.isShowing = true;
            
            // Create overlay
            this.createOverlay();
            
            // Create notice element
            this.createNotice();
            
            // Add to DOM
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.noticeElement);
            
            // Force reflow for animation
            void this.noticeElement.offsetHeight;
            void this.overlay.offsetHeight;
            
            // Play sound
            this.playSound();
            
            // Trigger entrance animation after a tiny delay
            setTimeout(() => {
                // Animate overlay background
                this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                
                // Animate notice element
                this.noticeElement.style.opacity = '1';
                this.noticeElement.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 20);
            
            // Setup dismiss handlers
            this.setupDismissHandlers(resolve);
        });
    }

    // ========================================
    // CREATE OVERLAY
    // ========================================
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'welcome-notice-overlay';
        
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            zIndex: '99998',
            backdropFilter: 'blur(4px)',
            transition: `background-color ${this.config.animationDuration}ms ease`,
            cursor: 'pointer'
        });
    }

    // ========================================
    // CREATE NOTICE ELEMENT
    // ========================================
    createNotice() {
        this.noticeElement = document.createElement('div');
        this.noticeElement.className = 'welcome-notice';
        
        // Create image
        const img = document.createElement('img');
        img.src = this.config.imagePath;
        img.alt = 'Welcome Notice';
        img.draggable = false;
        
        // Style the notice container - starts hidden and scaled down
        Object.assign(this.noticeElement.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            zIndex: '99999',
            opacity: '0',
            transition: `opacity ${this.config.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1), transform ${this.config.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            pointerEvents: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh'
        });
        
        // Style the image
        Object.assign(img.style, {
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '12px',
            display: 'block'
        });
        
        this.noticeElement.appendChild(img);
    }

    // ========================================
    // PLAY SOUND
    // ========================================
    playSound() {
        if (this.noticeSound) {
            this.noticeSound.currentTime = 0;
            this.noticeSound.play().catch(() => {
                console.debug('Welcome notice sound blocked by autoplay policy');
            });
        }
    }

    // ========================================
    // SETUP DISMISS HANDLERS
    // ========================================
    setupDismissHandlers(resolvePromise) {
        const dismiss = (e) => {
            this.dismiss(resolvePromise);
            
            // Remove listeners
            document.removeEventListener('click', dismiss);
            document.removeEventListener('keydown', dismissOnKey);
            document.removeEventListener('touchstart', dismiss);
        };
        
        const dismissOnKey = (e) => {
            dismiss(e);
        };
        
        // Small delay to prevent accidental immediate dismissal
        setTimeout(() => {
            document.addEventListener('click', dismiss);
            document.addEventListener('keydown', dismissOnKey);
            document.addEventListener('touchstart', dismiss);
        }, 300);
    }

    // ========================================
    // DISMISS NOTICE
    // ========================================
    dismiss(resolvePromise) {
        if (!this.isShowing) return;
        
        // Prevent multiple dismiss calls
        this.isShowing = false;
        
        // Start exit animation
        this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.noticeElement.style.opacity = '0';
        this.noticeElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // Mark as seen
        this.storage.set(this.config.storageKey, true);
        
        // Remove elements after animation
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            if (this.noticeElement && this.noticeElement.parentNode) {
                this.noticeElement.parentNode.removeChild(this.noticeElement);
            }
            
            this.overlay = null;
            this.noticeElement = null;
            
            // Callback
            if (this.onDismiss) {
                this.onDismiss();
            }
            
            // Resolve promise
            if (resolvePromise) {
                resolvePromise();
            }
            
            console.log('✧ Welcome notice dismissed ✧');
        }, this.config.animationDuration);
    }

    // ========================================
    // CHECK IF NOTICE IS ACTIVE
    // ========================================
    isActive() {
        return this.isShowing;
    }

    // ========================================
    // FORCE SHOW (for testing)
    // ========================================
    forceShow() {
        this.storage.remove(this.config.storageKey);
        return this.show();
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        if (this.noticeElement && this.noticeElement.parentNode) {
            this.noticeElement.parentNode.removeChild(this.noticeElement);
        }
        
        this.isShowing = false;
        this.noticeSound = null;
    }
}

export default WelcomeNoticeManager;
