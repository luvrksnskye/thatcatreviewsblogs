export class DreamyCommentsManager {
    constructor(options = {}) {
        this.config = {
            maxComments: options.maxComments || 50,
            particles: options.particles !== false,
            textGlow: options.textGlow !== false,
            fillColor1: options.fillColor1 || '#C4B8E0',
            fillColor2: options.fillColor2 || '#E8E0F7',
            moonDark: options.moonDark || '#1E1A2E',
            moonImage: options.moonImage || '/thatcatreviewsblogs/src/blogs/images/moon.png',
            starImage: options.starImage || '/thatcatreviewsblogs/src/blogs/images/planets.gif',
            soundBasePath: options.soundBasePath || '/thatcatreviewsblogs/src/sound'
        };

        this.commentCount = 0;
        this.goalPercent = 0;
        this.isInitialized = false;
        this.isCelebrating = false;
        this.elements = {};
        this.audioContext = null;
        this.chimeBuffer = null;
        this.moonBuffer = null;
        
        this.chimePath = `${this.config.soundBasePath}/mystical-chime.mp3`;
        this.moonSoundPath = `${this.config.soundBasePath}/moon.mp3`;
    }

    async init() {
        if (this.isInitialized) return;

        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        this.elements.hcbContainer = document.getElementById('HCB_comment_box');
        
        if (!this.elements.hcbContainer) {
            await this.waitForHCB();
        }

        this.createOverlay();
        this.createMoon();
        this.setupAudio();
        this.setupObserver();
        this.setupSubmitButton();
        this.countExistingComments();
        this.updateMoon();
        this.setupHCBHooks();

        this.isInitialized = true;
        console.log('DreamyComments initialized!');
    }

    async waitForHCB(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.elements.hcbContainer = document.getElementById('HCB_comment_box');
            if (this.elements.hcbContainer) return;
        }
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'moon-celebration-overlay';
        overlay.id = 'moonOverlay';
        document.body.appendChild(overlay);
        this.elements.overlay = overlay;
    }

    createMoon() {
        const moon = document.createElement('div');
        moon.className = `moon-float ${this.config.particles ? 'particles-on' : ''}`;
        moon.id = 'moonFloat';
        
        const starPath = 'M124.62,103.48 192.43,113.52 124.62,123.56 114.58,207.41 104.54,123.56 36.73,113.52 104.54,103.48 114.58,19.64';
        
        moon.innerHTML = `
            <div class="container" id="container">
                <img class="front" src="${this.config.moonImage}">
                <img class="swingobject" src="${this.config.starImage}">
                
                <div class="sparkles-container">
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                    <div class="sparkle"></div>
                </div>
                
                <div class="liquid">
                    <div class="mask">
                        <svg width="350px" height="270px" viewBox="0 0 124.2956 157.41556" style="position: absolute; top: 50px;">
                            <clipPath id="movementmask">
                                <path transform="translate(14.500000,0.000000) scale(3)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1.21156;stroke-linecap:round;stroke-linejoin:round" 
                                      d="m 87.9292 1.2817 c -8.0802 0.0831 -14.2034 2.1662 -16.3613 3.0019 c -0.8674 0.318 -1.3535 0.5332 -1.3535 0.5332 h 0.0117 c -0.3587 0.1593 -17.1421 7.5335 -34.543 -0.004 h 0.0723 c -6.0535 -2.6336 -12.042 -3.4583 -17.2949 -3.4043 c -10.0282 0.1031 -17.375 3.4043 -17.375 3.4043 h 0.0371 V 164.102 H 140.2027 v -0.127 h 38.9629 V 6.4145 c -1.6596 -0.4729 -3.3327 -1.0268 -5.0176 -1.7598 h 0.1211 c -6.0249 -2.6048 -11.9824 -3.4209 -17.2109 -3.3672 c -10.0282 0.1031 -17.375 3.4023 -17.375 3.4023 h 0.0117 c -0.014 0.006 -0.21 0.0843 -0.2734 0.1113 h -0.1191 c -0.064 0.0285 -1.1612 0.5112 -3.0234 1.1016 c -5.8111 1.7869 -18.2776 4.3491 -31.127 -1.2168 h 0.0723 c -6.0535 -2.6336 -12.042 -3.4583 -17.2949 -3.4043 z"/>
                            </clipPath>
                        </svg>
                        <svg width="200" height="209" viewBox="0 0 643.2 378" style="position: absolute;">
                            <clipPath id="fillmask">
                                <path transform="translate(-2.1 0.000000) scale(0.80)" style="fill:#000000;fill-opacity:1;stroke:none;stroke-width:1.21156;stroke-linecap:round;stroke-linejoin:round"
                                      d="M156.18,131.13c-13.86,15.67-34.12,25.54-56.68,25.54c-41.8,0-75.67-33.89-75.67-75.67c0-41.51,33.42-75.22,74.83-75.67c-34.93,21.94-48.13,64.86-29.38,97.33C85.99,131.61,122.6,142.73,156.18,131.13z"/>
                            </clipPath>
                        </svg>
                        
                        <div class="fill" id="moonFill"></div>
                        <div class="fill2" id="moonFill2"></div>
                        
                        <div class="heartcont">
                            <div class="heart h1"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h2"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h3"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h4"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h5"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h6"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h7"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h8"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h9"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                            <div class="heart h10"><svg class="heart1" viewBox="0 0 217.4 217.4"><path d="${starPath}"/></svg></div>
                        </div>
                    </div>
                </div>
                
                <div class="back">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="266.66666" height="240" viewBox="0 0 266.66666 240">
                        <g>
                            <path transform="translate(-2 40.000000) scale(0.76)" style="fill:${this.config.moonDark};fill-opacity:1;stroke-width:8;stroke-linecap:round" 
                                  d="M164.63,106.48c-10.75,28.62-39.08,49.05-72.33,49.05c-42.49,0-76.94-33.36-76.94-74.53S49.81,6.47,92.3,6.47c11.85,0,23.07,2.59,33.09,7.23c-6.58,0.18-13.25,1.53-19.71,4.17C77.44,29.42,63.73,61.24,75.05,88.95c11.32,27.7,43.4,40.81,71.64,29.27C153.59,115.39,159.63,111.36,164.63,106.48z"/>
                        </g>
                    </svg>
                </div>
                
                <div class="bottomshadow" id="bottomShadow"></div>
            </div>
            
            <div class="textcontainer">
                <div class="textbottom ${this.config.textGlow ? 'textGlowing' : ''}">
                    <div class="title" id="moonTitle">Comments</div>
                    <p class="text1" id="moonText">0 / ${this.config.maxComments}</p>
                </div>
            </div>
            
            <div class="thank-you-text" id="thankYouText">
                <span class="thank-you-message">Thanks for commenting!</span>
            </div>
            
            <div class="light-particles" id="lightParticles">
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
                <div class="light-particle"></div>
            </div>
        `;

        document.body.appendChild(moon);

        this.elements.moon = moon;
        this.elements.fill = moon.querySelector('#moonFill');
        this.elements.fill2 = moon.querySelector('#moonFill2');
        this.elements.bottomShadow = moon.querySelector('#bottomShadow');
        this.elements.textEl = moon.querySelector('#moonText');
        this.elements.titleEl = moon.querySelector('#moonTitle');
        this.elements.thankYouText = moon.querySelector('#thankYouText');

        this.applyColors();
        
        moon.addEventListener('click', () => this.handleMoonClick());
    }

    applyColors() {
        document.documentElement.style.setProperty('--comment-fill-1', this.config.fillColor1);
        document.documentElement.style.setProperty('--comment-fill-2', this.config.fillColor2);
        document.documentElement.style.setProperty('--moon-dark', this.config.moonDark);

        if (this.elements.fill) {
            this.elements.fill.style.background = `linear-gradient(0deg, ${this.config.fillColor1} 0%, ${this.config.fillColor2} 100%)`;
        }
        if (this.elements.fill2) {
            this.elements.fill2.style.background = `linear-gradient(0deg, ${this.config.fillColor1} 0%, ${this.config.fillColor2} 100%)`;
        }
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initAudio();
        } catch (e) {
            console.log('Audio not available');
        }
    }

    async initAudio() {
        if (!this.audioContext) return;

        try {
            const chimeResponse = await fetch(this.chimePath);
            const chimeData = await chimeResponse.arrayBuffer();
            this.chimeBuffer = await this.audioContext.decodeAudioData(chimeData);
            console.log('Chime sound loaded');
        } catch (e) {
            console.log('Could not load chime sound:', this.chimePath);
        }

        try {
            const moonResponse = await fetch(this.moonSoundPath);
            const moonData = await moonResponse.arrayBuffer();
            this.moonBuffer = await this.audioContext.decodeAudioData(moonData);
            console.log('Moon sound loaded');
        } catch (e) {
            console.log('Could not load moon sound:', this.moonSoundPath);
        }
    }

    playChime() {
        if (!this.audioContext || !this.chimeBuffer) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.chimeBuffer;
        gainNode.gain.value = 0.5;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
    }

    playMoonSound() {
        if (!this.audioContext || !this.moonBuffer) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.moonBuffer;
        gainNode.gain.value = 0.6;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
    }

    setFillHeight(percent) {
        const clampedPercent = Math.max(0, Math.min(100, percent));
        const fillHeight = (clampedPercent / 100) * 140;
        
        if (this.elements.fill) {
            this.elements.fill.style.height = `${fillHeight}px`;
        }
        if (this.elements.fill2) {
            this.elements.fill2.style.height = `${fillHeight}px`;
        }
        
        if (this.elements.bottomShadow) {
            if (clampedPercent > 5) {
                this.elements.bottomShadow.classList.add('shadowon');
            } else {
                this.elements.bottomShadow.classList.remove('shadowon');
            }
        }
    }

    async animateFillTo(targetPercent, duration = 2000) {
        return new Promise(resolve => {
            const startPercent = this.goalPercent;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentPercent = startPercent + (targetPercent - startPercent) * easeProgress;
                
                this.setFillHeight(currentPercent);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.goalPercent = targetPercent;
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    handleMoonClick() {
        if (this.isCelebrating) return;
        
        console.log('Moon clicked!');
        
        this.playChime();
        
        this.elements.moon.classList.add('glowing');
        
        this.animateFillTo(100, 2500);
        
        setTimeout(() => {
            this.elements.moon.classList.remove('glowing');
            const realPercent = (this.commentCount / this.config.maxComments) * 100;
            this.animateFillTo(realPercent, 1500);
        }, 3500);
    }

    async startCelebration() {
        if (this.isCelebrating) return;
        this.isCelebrating = true;
        
        console.log('Starting celebration!');
        
        this.elements.overlay.classList.add('active');
        
        this.elements.moon.classList.add('celebrating');
        
        await this.delay(600);
        
        this.playMoonSound();
        this.elements.moon.classList.add('glowing');
        
        // Activar partículas de luz
        const lightParticles = this.elements.moon.querySelector('#lightParticles');
        if (lightParticles) {
            lightParticles.classList.add('active');
        }
        
        await this.animateFillTo(100, 3000);
        
        this.elements.thankYouText.classList.add('visible');
        
        await this.delay(2500);
        
        this.elements.thankYouText.classList.remove('visible');
        
        // Desactivar partículas
        if (lightParticles) {
            lightParticles.classList.remove('active');
        }
        
        await this.delay(500);
        
        this.elements.moon.classList.remove('glowing');
        this.elements.moon.classList.remove('celebrating');
        this.elements.overlay.classList.remove('active');
        
        await this.delay(600);
        const realPercent = (this.commentCount / this.config.maxComments) * 100;
        await this.animateFillTo(realPercent, 1500);
        
        this.isCelebrating = false;
        console.log('Celebration complete!');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupSubmitButton() {
        const checkForButton = setInterval(() => {
            const submitBtn = document.querySelector('#hcb_submit, #HCB_comment_box .btn, #HCB_comment_box button[type="submit"], #HCB_comment_box input[type="submit"]');
            
            if (submitBtn) {
                console.log('Submit button found:', submitBtn);
                clearInterval(checkForButton);
                
                submitBtn.addEventListener('click', () => {
                    console.log('Submit button clicked!');
                    setTimeout(() => this.startCelebration(), 500);
                });
            }
        }, 500);
        
        setTimeout(() => clearInterval(checkForButton), 10000);
    }

    setupHCBHooks() {
        if (typeof window.hcb_user !== 'undefined') {
            const orig = window.hcb_user.ON_COMMENT || function(){};
            window.hcb_user.ON_COMMENT = () => {
                orig();
                this.handleNewComment(true);
            };
        }
    }

    setupObserver() {
        if (!this.elements.hcbContainer) return;

        this.observer = new MutationObserver((mutations) => {
            let hasNew = false;
            mutations.forEach((m) => {
                if (m.type === 'childList') {
                    m.addedNodes.forEach((n) => {
                        if (n.nodeType === 1 && (n.classList?.contains('comment') || n.classList?.contains('hcb-comment') || n.querySelector?.('.comment, .hcb-comment'))) {
                            hasNew = true;
                        }
                    });
                }
            });
            if (hasNew) this.handleNewComment();
        });

        this.observer.observe(this.elements.hcbContainer, { childList: true, subtree: true });
    }

    countExistingComments() {
        if (!this.elements.hcbContainer) return;
        const comments = this.elements.hcbContainer.querySelectorAll('.comment, .hcb-comment');
        this.commentCount = comments.length;
        console.log('Comment count:', this.commentCount);
    }

    handleNewComment(isUserComment = false) {
        const prev = this.commentCount;
        this.countExistingComments();
        
        if (this.commentCount > prev && !this.isCelebrating) {
            console.log('New comment detected!');
            this.updateMoon();
            this.highlightNewComment();
        }
    }

    updateMoon() {
        const percent = (this.commentCount / this.config.maxComments) * 100;
        
        if (this.elements.textEl) {
            this.elements.textEl.textContent = `${this.commentCount} / ${this.config.maxComments}`;
        }

        if (!this.isCelebrating) {
            this.setFillHeight(percent);
            this.goalPercent = percent;
        }
    }

    highlightNewComment() {
        if (!this.elements.hcbContainer) return;
        const comments = this.elements.hcbContainer.querySelectorAll('.comment, .hcb-comment');
        const last = comments[comments.length - 1];
        if (last) {
            last.classList.add('new-comment');
            setTimeout(() => last.classList.remove('new-comment'), 1000);
        }
    }

    destroy() {
        if (this.observer) this.observer.disconnect();
        if (this.elements.moon) this.elements.moon.remove();
        if (this.elements.overlay) this.elements.overlay.remove();
        if (this.audioContext) this.audioContext.close();
    }
}

export default DreamyCommentsManager;
