/* =====================================================
   WELCOMENOTICEMANAGER.JS - First Visit Notice (OPTIMIZED)
   Lazy creation, efficient animations
   ===================================================== */

export class WelcomeNoticeManager {
    constructor(storage, sound) {
        this.storage = storage;
        this.sound = sound;
        
        this.isShowing = false;
        this.currentStep = 'welcome';
        this.overlay = null;
        this.noticeElement = null;
        this._resolveShow = null;
        
        this.config = {
            imagePath: './src/assets/notice_system.png',
            animationDuration: 300
        };
    }

    init() {
        console.log('✧ Welcome Notice Manager initialized ✧');
    }

    shouldShowNotice() {
        return !this.storage.hasSeenNotice('welcome');
    }

    needsPreferencesSetup() {
        return !this.storage.hasSeenNotice('preferences');
    }

    show() {
        if (this.isShowing || !this.shouldShowNotice()) {
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this._resolveShow = resolve;
            this.isShowing = true;
            this.currentStep = 'welcome';
            
            this._createOverlay();
            this._createWelcomeNotice();
            
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.noticeElement);
            
            requestAnimationFrame(() => {
                this.overlay.classList.add('visible');
                this.noticeElement.style.opacity = '1';
                this.noticeElement.style.transform = 'translate(-50%, -50%) scale(1)';
            });
            
            this._setupWelcomeDismiss();
        });
    }

    showPreferencesPanel() {
        if (this.isShowing) return;
        
        this.isShowing = true;
        this.currentStep = 'preferences';
        
        this._createOverlay();
        document.body.appendChild(this.overlay);
        
        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
            this._showPreferencesPanel(false);
        });
    }

    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'prefs-overlay';
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this.currentStep === 'preferences') {
                this._dismissPreferences();
            }
        });
    }

    _createWelcomeNotice() {
        this.noticeElement = document.createElement('div');
        this.noticeElement.className = 'welcome-notice';
        
        const img = document.createElement('img');
        img.src = this.config.imagePath;
        img.alt = 'Welcome Notice';
        img.draggable = false;
        
        Object.assign(this.noticeElement.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            zIndex: '99999',
            opacity: '0',
            transition: `all ${this.config.animationDuration}ms ease-out`,
            pointerEvents: 'none',
            maxWidth: '90vw',
            maxHeight: '90vh'
        });
        
        Object.assign(img.style, {
            maxWidth: '100%',
            maxHeight: '100vh',
            objectFit: 'contain',
            borderRadius: '16px',
            display: 'block'
        });
        
        this.noticeElement.appendChild(img);
    }

    _setupWelcomeDismiss() {
        const dismiss = () => {
            this._dismissWelcome();
            document.removeEventListener('click', dismiss);
            document.removeEventListener('keydown', dismiss);
            document.removeEventListener('touchstart', dismiss);
        };
        
        setTimeout(() => {
            document.addEventListener('click', dismiss, { once: true });
            document.addEventListener('keydown', dismiss, { once: true });
            document.addEventListener('touchstart', dismiss, { once: true });
        }, 300);
    }

    _dismissWelcome() {
        if (this.currentStep !== 'welcome') return;
        
        this.noticeElement.style.opacity = '0';
        this.noticeElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        this.storage.markNoticeSeen('welcome');
        
        setTimeout(() => {
            this.noticeElement?.remove();
            
            if (this.needsPreferencesSetup()) {
                this._showPreferencesPanel(true);
            } else {
                this._finish();
            }
        }, this.config.animationDuration);
    }

    _showPreferencesPanel(fromWelcome = true) {
        this.currentStep = 'preferences';
        
        this.noticeElement = document.createElement('div');
        this.noticeElement.className = 'preferences-panel';
        
        const prefs = this.storage.getPreferences();
        
        this.noticeElement.innerHTML = `
            <div class="prefs-content">
                <button class="prefs-close-btn" id="prefs-close">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="prefs-header">
                    <div class="prefs-icon-container">
                        <span class="material-icons">${fromWelcome ? 'auto_awesome' : 'settings'}</span>
                    </div>
                    <h2>${fromWelcome ? 'Welcome!' : 'Settings'}</h2>
                    <p>${fromWelcome ? 'Set up your experience' : 'Customize your preferences'}</p>
                </div>
                
                <div class="prefs-options">
                    <div class="pref-option" data-pref="musicAutoplay">
                        <div class="pref-icon-wrap music">
                            <span class="material-icons">music_note</span>
                        </div>
                        <div class="pref-text">
                            <span class="pref-label">Music Autoplay</span>
                            <span class="pref-desc">Play music automatically</span>
                        </div>
                        <div class="toggle-switch ${prefs.musicAutoplay ? 'active' : ''}">
                            <div class="toggle-track"></div>
                            <div class="toggle-knob"></div>
                        </div>
                    </div>
                    
                    <div class="pref-option" data-pref="holidayEnabled">
                        <div class="pref-icon-wrap holiday">
                            <span class="material-icons">ac_unit</span>
                        </div>
                        <div class="pref-text">
                            <span class="pref-label">Holiday Mode</span>
                            <span class="pref-desc">Seasonal decorations</span>
                        </div>
                        <div class="toggle-switch ${prefs.holidayEnabled ? 'active' : ''}">
                            <div class="toggle-track"></div>
                            <div class="toggle-knob"></div>
                        </div>
                    </div>
                    
                    <div class="pref-option" data-pref="soundEnabled">
                        <div class="pref-icon-wrap sound">
                            <span class="material-icons">volume_up</span>
                        </div>
                        <div class="pref-text">
                            <span class="pref-label">Sound Effects</span>
                            <span class="pref-desc">UI sounds & feedback</span>
                        </div>
                        <div class="toggle-switch ${prefs.soundEnabled ? 'active' : ''}">
                            <div class="toggle-track"></div>
                            <div class="toggle-knob"></div>
                        </div>
                    </div>
                </div>
                
                <div class="prefs-footer">
                    <p class="prefs-note">You can change these anytime</p>
                    <button class="prefs-done-btn" id="prefs-done">
                        <span class="material-icons">${fromWelcome ? 'rocket_launch' : 'check_circle'}</span>
                        <span>${fromWelcome ? "Let's Go!" : 'Save'}</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.noticeElement);
        
        requestAnimationFrame(() => {
            this.noticeElement.classList.add('visible');
        });
        
        this._setupPreferenceToggles();
        
        this.noticeElement.querySelector('#prefs-done')
            ?.addEventListener('click', () => this._dismissPreferences());
        this.noticeElement.querySelector('#prefs-close')
            ?.addEventListener('click', () => this._dismissPreferences());
        
        // Escape key
        this._escapeHandler = (e) => {
            if (e.key === 'Escape') this._dismissPreferences();
        };
        document.addEventListener('keydown', this._escapeHandler);
    }

    _setupPreferenceToggles() {
        this.noticeElement.querySelectorAll('.pref-option').forEach(option => {
            option.addEventListener('click', () => {
                const prefKey = option.dataset.pref;
                const toggle = option.querySelector('.toggle-switch');
                const isActive = toggle.classList.toggle('active');
                
                this.storage.setPreference(prefKey, isActive);
                this.sound?.play('click');
                
                window.dispatchEvent(new CustomEvent('preferenceChanged', {
                    detail: { key: prefKey, value: isActive }
                }));
            });
        });
    }

    _dismissPreferences() {
        if (this.currentStep !== 'preferences') return;
        
        if (this._escapeHandler) {
            document.removeEventListener('keydown', this._escapeHandler);
        }
        
        this.storage.markNoticeSeen('preferences');
        
        this.noticeElement?.classList.remove('visible');
        this.overlay?.classList.remove('visible');
        
        setTimeout(() => this._finish(), this.config.animationDuration);
    }

    _finish() {
        this.overlay?.remove();
        this.noticeElement?.remove();
        this.overlay = null;
        this.noticeElement = null;
        this.isShowing = false;
        
        if (this._resolveShow) {
            this._resolveShow();
            this._resolveShow = null;
        }
    }

    isActive() {
        return this.isShowing;
    }

    destroy() {
        this.overlay?.remove();
        this.noticeElement?.remove();
        this.isShowing = false;
    }
}

export default WelcomeNoticeManager;
