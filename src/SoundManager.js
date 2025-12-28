/* =====================================================
   SOUNDMANAGER.JS - Audio Handler (OPTIMIZED)
   Lazy loading, on-demand audio, memory efficient
   ===================================================== */

export class SoundManager {
    constructor() {
        this.context = null;
        this.isEnabled = true;
        this.isMuted = false;
        this.volume = 0.5;
        this.sounds = new Map();
        
        // Sound configs - NOT preloaded, loaded on first use
        this.soundConfigs = {
            click: { url: './src/sound/UI_Check.wav', volume: 0.9 },
            hover: { url: './src/sound/UI_AlbumSubmit_Out.wav', volume: 0.6 },
            tab: { url: './src/sound/UI_MessageWindow_Open.wav', volume: 0.7 },
            switch: { url: './src/sound/UI_AlbumSubmit_Finish.wav', volume: 0.7 },
            card: { url: './src/sound/System_Lumi_01.wav', volume: 0.7 },
            toggle: { url: './src/sound/UI_AppWipe_In.wav', volume: 0.7 },
            notification: { url: './src/sound/UI_Announce_New.wav', volume: 0.8 },
            success: { url: './src/sound/UI_AlbumSubmit_Finish.wav', volume: 0.8 },
            error: { url: './src/sound/UI_Cancel.wav', volume: 0.8 }
        };
        
        this.initialized = false;
        this._loadingPromises = new Map();
        
        // Defer initialization until user interaction
        this._initOnInteraction();
    }

    _initOnInteraction() {
        const initHandler = () => {
            if (!this.initialized) this.init();
        };
        
        // Use passive listeners for better scroll performance
        const options = { once: true, passive: true };
        document.addEventListener('click', initHandler, options);
        document.addEventListener('keydown', initHandler, options);
        document.addEventListener('touchstart', initHandler, options);
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // DON'T preload all sounds - load on demand
            // Only preload the most common sounds
            this._preloadPrioritySounds();
            
        } catch (e) {
            console.warn('AudioContext not available:', e);
            this.isEnabled = false;
        }
    }

    _preloadPrioritySounds() {
        // Only preload the 2-3 most commonly used sounds
        const prioritySounds = ['click', 'tab'];
        
        // Use requestIdleCallback for non-blocking preload
        const schedule = window.requestIdleCallback || setTimeout;
        
        prioritySounds.forEach((name, index) => {
            schedule(() => {
                this.loadSound(name).catch(() => {});
            }, { timeout: 1000 + index * 500 });
        });
    }

    async loadSound(name) {
        if (!this.context) return null;
        
        const config = this.soundConfigs[name];
        if (!config?.url) return null;
        
        // Return cached buffer
        if (config.buffer) return config.buffer;
        
        // Return existing loading promise to avoid duplicate requests
        if (this._loadingPromises.has(name)) {
            return this._loadingPromises.get(name);
        }
        
        // Create loading promise
        const loadPromise = (async () => {
            try {
                const response = await fetch(config.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                
                config.buffer = audioBuffer;
                this.sounds.set(name, audioBuffer);
                
                return audioBuffer;
            } catch (e) {
                console.warn(`Failed to load sound: ${name}`, e);
                return null;
            } finally {
                this._loadingPromises.delete(name);
            }
        })();
        
        this._loadingPromises.set(name, loadPromise);
        return loadPromise;
    }

    play(soundName) {
        if (!this.isEnabled || this.isMuted || !this.initialized) return;
        
        const config = this.soundConfigs[soundName];
        if (!config) return;
        
        // If buffer exists, play immediately
        if (config.buffer) {
            this._playBuffer(config);
            return;
        }
        
        // Otherwise, load and play (non-blocking)
        this.loadSound(soundName).then(() => {
            if (config.buffer) {
                this._playBuffer(config);
            }
        });
    }

    _playBuffer(config) {
        if (!config.buffer || !this.context) return;
        
        try {
            const source = this.context.createBufferSource();
            const gainNode = this.context.createGain();
            
            source.buffer = config.buffer;
            gainNode.gain.value = (config.volume ?? 1) * this.volume;
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            source.start(0);
        } catch (e) {
            // Silently fail - audio might not be allowed
        }
    }

    register(name, config) {
        this.soundConfigs[name] = config;
        // Don't preload - will load on first play
    }

    mute() {
        this.isMuted = true;
    }

    unmute() {
        this.isMuted = false;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    // Simplified element sounds setup
    setupElementSounds() {
        // Use event delegation instead of individual listeners
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-sound]');
            if (target) {
                this.play(target.dataset.sound);
            }
        }, { passive: true });
    }

    destroy() {
        if (this.context) {
            this.context.close();
            this.context = null;
        }
        this.sounds.clear();
        this._loadingPromises.clear();
        this.initialized = false;
    }
}

export default SoundManager;
