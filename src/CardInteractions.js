/* =====================================================
   CARDINTERACTIONS.JS - Card Component Interactions
   Handles all card-related interactions and animations
   ===================================================== */

export class CardInteractions {
    constructor(animationManager, soundManager) {
        this.animation = animationManager;
        this.sound = soundManager;
        this.cards = [];
        this.toggles = [];
    }

    init() {
        this.cards = document.querySelectorAll('.card');
        this.toggles = document.querySelectorAll('.toggle-switch');
        
        this.setupCardEvents();
        this.setupToggleEvents();
        this.setupReactionButtons();
        
        console.log('✧ Card Interactions initialized ✧');
    }

    setupCardEvents() {
        this.cards.forEach(card => {
            // Click ripple effect
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.toggle-switch') && !e.target.closest('button')) {
                    this.animation?.createRipple(e, card);
                    this.sound?.play('card');
                }
            });
            
            // Hover sound
            card.addEventListener('mouseenter', () => {
                this.sound?.play('hover');
            });
        });
    }

    setupToggleEvents() {
        this.toggles.forEach(toggle => {
            toggle.setAttribute('tabindex', '0');
            toggle.setAttribute('role', 'switch');
            toggle.setAttribute('aria-checked', toggle.classList.contains('active'));
            
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle.classList.toggle('active');
                toggle.setAttribute('aria-checked', toggle.classList.contains('active'));
                
                const knob = toggle.querySelector('.toggle-knob');
                if (knob) {
                    this.animation?.bounce(knob, 0.8);
                }
                
                this.sound?.play('switch');
            });
            
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });
    }

    setupReactionButtons() {
        document.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                
                const countEl = btn.querySelector('.reaction-count');
                if (countEl) {
                    let count = parseInt(countEl.textContent) || 0;
                    count = btn.classList.contains('active') ? count + 1 : count - 1;
                    countEl.textContent = count;
                }
                
                this.animation?.pulse(btn, 1.3);
                this.sound?.play('pop');
            });
        });
    }

    destroy() {
        this.cards = [];
        this.toggles = [];
    }
}

export default CardInteractions;
