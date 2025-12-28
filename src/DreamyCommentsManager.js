

export class DreamyCommentsManager {
    constructor(options = {}) {
        this.config = {
            maxComments: options.maxComments || 50,
            particles: options.particles !== false,
            textGlow: options.textGlow !== false,
            fillColor1: options.fillColor1 || '#C4B8E0',
            fillColor2: options.fillColor2 || '#E8E0F7',
            moonDark: options.moonDark || '#1E1A2E',
            moonImage: options.moonImage || '/src/blogs/images/moon.png',
            starImage: options.starImage || '/src/blogs/images/planets.gif',
            chimeSound: options.chimeSound || '/src/sound/mystical-chime.mp3'
        };

        this.commentCount = 0;
        this.goalPercent = 0;
        this.tempFillPercent = 0;
        this.isInitialized = false;
        this.elements = {};
        this.audioContext = null;
        this.chimeBuffer = null;
        this.lumiBuffers = [];
        this.fillTimeout = null;
        
        this.lumiPaths = [
            '/src/sound/System_Lumi_01.wav',
            '/src/sound/System_Lumi_02.wav',
            '/src/sound/System_Lumi_03.wav',
            '/src/sound/System_Lumi_04.wav'
        ];
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

        this.createMoon();
        this.setupAudio();
        this.setupObserver();
        this.setupSubmitButton();
        this.countExistingComments();
        this.updateMoon();
        this.setupHCBHooks();

        this.isInitialized = true;
        console.log('DreamyComments initialized!');
        
        // Test inicial - mostrar un poco de liquido para verificar que funciona
        setTimeout(() => {
            console.log('Testing fill...');
            this.setFillHeight(10);
        }, 1000);
    }

    async waitForHCB(maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.elements.hcbContainer = document.getElementById('HCB_comment_box');
            if (this.elements.hcbContainer) return;
        }
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
                
                <!-- Destellos flotantes -->
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
        `;

        document.body.appendChild(moon);

        this.elements.moon = moon;
        this.elements.fill = moon.querySelector('#moonFill');
        this.elements.fill2 = moon.querySelector('#moonFill2');
        this.elements.bottomShadow = moon.querySelector('#bottomShadow');
        this.elements.textEl = moon.querySelector('#moonText');

        this.applyColors();
        
        // Click en la luna
        moon.addEventListener('click', () => this.handleMoonClick());
        
        // Debug - verificar elementos
        console.log('Moon elements:', {
            fill: this.elements.fill,
            fill2: this.elements.fill2,
            bottomShadow: this.elements.bottomShadow
        });
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
        if (this.elements.bottomShadow) {
            this.elements.bottomShadow.style.background = `linear-gradient(90deg, ${this.config.fillColor1} 0%, ${this.config.fillColor2} 100%)`;
        }

        const hearts = document.querySelectorAll('.moon-float .heart svg');
        hearts.forEach(svg => {
            svg.style.fill = this.config.fillColor2;
        });
    }

    // Metodo directo para setear altura del fill
    setFillHeight(percent) {
        console.log('Setting fill height to:', percent + '%');
        
        if (this.elements.fill) {
            this.elements.fill.style.height = percent + '%';
            console.log('Fill height set:', this.elements.fill.style.height);
        }
        if (this.elements.fill2) {
            this.elements.fill2.style.height = Math.max(0, percent - 2) + '%';
        }
        if (percent > 0 && this.elements.bottomShadow) {
            this.elements.bottomShadow.classList.add('shadowon');
        }
    }

    setupAudio() {
        const initAudio = async () => {
            if (this.audioContext) return;
            
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Cargar mystical-chime.mp3
                try {
                    const chimeResponse = await fetch(this.config.chimeSound);
                    const chimeArrayBuffer = await chimeResponse.arrayBuffer();
                    this.chimeBuffer = await this.audioContext.decodeAudioData(chimeArrayBuffer);
                    console.log('Chime sound loaded!');
                } catch (e) {
                    console.log('Could not load chime sound:', e);
                }
                
                // Cargar Lumi sounds
                for (const path of this.lumiPaths) {
                    try {
                        const response = await fetch(path);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        this.lumiBuffers.push(audioBuffer);
                    } catch (e) {}
                }
            } catch (e) {
                console.log('Audio not available');
            }
            
            document.removeEventListener('click', initAudio);
        };
        
        document.addEventListener('click', initAudio, { once: true });
    }

    playChime() {
        if (!this.audioContext || !this.chimeBuffer) {
            console.log('Cannot play chime - no audio context or buffer');
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.chimeBuffer;
        gainNode.gain.value = 0.6;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
        console.log('Playing chime!');
    }

    playRandomLumi() {
        if (!this.audioContext || this.lumiBuffers.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.lumiBuffers.length);
        const buffer = this.lumiBuffers[randomIndex];
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = 0.5;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
    }

    handleMoonClick() {
        console.log('Moon clicked!');
        
        // Sonido mystical chime
        this.playChime();
        
        // Llenar casi completo (85-95%)
        this.tempFillPercent = 85 + Math.random() * 10;
        
        // Efecto de brillo
        this.elements.moon.classList.add('glowing');
        
        // Activar shadow y particulas
        if (this.elements.bottomShadow) {
            this.elements.bottomShadow.classList.add('shadowon');
        }
        
        // Setear altura directamente
        this.setFillHeight(this.tempFillPercent);
        
        // Quitar brillo despues de 1.5s
        setTimeout(() => {
            this.elements.moon.classList.remove('glowing');
        }, 1500);
        
        // El liquido baja gradualmente despues de 3s
        if (this.fillTimeout) clearTimeout(this.fillTimeout);
        this.fillTimeout = setTimeout(() => {
            this.tempFillPercent = 0;
            this.updateMoon();
        }, 3000);
    }

    // Escuchar click en el boton de submit
    setupSubmitButton() {
        // Esperar a que HCB cargue el boton
        const checkForButton = setInterval(() => {
            const submitBtn = document.querySelector('#hcb_submit, #HCB_comment_box .btn, #HCB_comment_box button[type="submit"], #HCB_comment_box input[type="submit"]');
            
            if (submitBtn) {
                console.log('Submit button found:', submitBtn);
                clearInterval(checkForButton);
                
                submitBtn.addEventListener('click', () => {
                    console.log('Submit button clicked!');
                    this.handleCommentSubmit();
                });
            }
        }, 500);
        
        // Dejar de buscar despues de 10 segundos
        setTimeout(() => clearInterval(checkForButton), 10000);
    }

    // Cuando el usuario hace click en Post Comment
    handleCommentSubmit() {
        console.log('Handling comment submit - filling moon to 100%!');
        
        // Sonido mystical chime
        this.playChime();
        
        // Llenar al 100%
        this.tempFillPercent = 100;
        
        // Efecto de brillo
        this.elements.moon.classList.add('glowing');
        
        // Activar shadow
        if (this.elements.bottomShadow) {
            this.elements.bottomShadow.classList.add('shadowon');
        }
        
        // Setear altura al 100%
        this.setFillHeight(100);
        
        // Quitar brillo despues de 2s
        setTimeout(() => {
            this.elements.moon.classList.remove('glowing');
        }, 2000);
        
        // Despues de 10 segundos, bajar al nivel real
        if (this.fillTimeout) clearTimeout(this.fillTimeout);
        this.fillTimeout = setTimeout(() => {
            console.log('10 seconds passed, returning to real level');
            this.tempFillPercent = 0;
            this.countExistingComments();
            this.updateMoon();
        }, 10000);
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
        
        if (this.commentCount > prev || isUserComment) {
            console.log('New comment detected!');
            
            // Sonido mystical-chime al comentar
            this.playChime();
            
            // Efecto de brillo
            this.elements.moon.classList.add('glowing');
            setTimeout(() => {
                this.elements.moon.classList.remove('glowing');
            }, 1500);
            
            this.updateMoon();
            this.highlightNewComment();
        }
    }

    updateMoon() {
        const basePercent = (this.commentCount / this.config.maxComments) * 100;
        const totalPercent = Math.max(basePercent, this.tempFillPercent);
        
        console.log('Updating moon - base:', basePercent, 'temp:', this.tempFillPercent, 'total:', totalPercent);

        if (this.elements.textEl) {
            this.elements.textEl.textContent = `${this.commentCount} / ${this.config.maxComments}`;
        }

        this.setFillHeight(totalPercent);
        this.goalPercent = totalPercent;
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
        if (this.audioContext) this.audioContext.close();
        if (this.fillTimeout) clearTimeout(this.fillTimeout);
    }
}

export default DreamyCommentsManager;
