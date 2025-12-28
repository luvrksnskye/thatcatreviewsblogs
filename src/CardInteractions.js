/* =====================================================
   CARDINTERACTIONS.JS - Card Interactions (OPTIMIZED)
   Event delegation, reduced listeners
   ===================================================== */

export class CardInteractions {
    constructor(animationManager, soundManager) {
        this.animation = animationManager;
        this.sound = soundManager;
    }

    init() {
        this._setupCardEvents();
        this._setupToggleEvents();
        this._setupReactionButtons();
        
        console.log('✧ Card Interactions initialized ✧');
    }

    _setupCardEvents() {
        // Event delegation for all cards
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
            
            // Ignore clicks on interactive elements
            if (e.target.closest('.toggle-switch, button, a')) return;
            
            this.animation?.createRipple(e, card);
            this.sound?.play('card');
        }, { passive: true });
        
        // Hover sound - use mouseenter delegation
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList?.contains('card')) {
                this.sound?.play('hover');
            }
        }, { capture: true, passive: true });
    }

    _setupToggleEvents() {
        // Event delegation for toggles
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('.toggle-switch');
            if (!toggle) return;
            
            e.stopPropagation();
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-checked', toggle.classList.contains('active'));
            
            const knob = toggle.querySelector('.toggle-knob');
            if (knob) {
                this.animation?.bounce(knob, 0.8);
            }
            
            this.sound?.play('switch');
        });
        
        // Keyboard support for toggles
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            
            const toggle = e.target.closest('.toggle-switch');
            if (toggle) {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    _setupReactionButtons() {
        // Event delegation for reaction buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.reaction-btn');
            if (!btn) return;
            
            btn.classList.toggle('active');
            
            const countEl = btn.querySelector('.reaction-count');
            if (countEl) {
                let count = parseInt(countEl.textContent) || 0;
                count = btn.classList.contains('active') ? count + 1 : count - 1;
                countEl.textContent = count;
            }
            
            this.animation?.pulse(btn, 1.3);
            this.sound?.play('click');
        });
    }

    destroy() {
        // Event listeners are on document, will be GC'd with page
    }
}

export default CardInteractions;
