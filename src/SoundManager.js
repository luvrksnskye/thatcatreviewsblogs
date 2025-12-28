export class SoundManager {
    constructor() {
        this.context = null;
        this.isEnabled = true;
        this.isMuted = false;
        this.volume = 0.5;
        this.sounds = new Map();
        
        this.soundConfigs = {
            click: { url: './src/sound/UI_Check.wav', volume: 0.9 },
            hover: { url: './src/sound/UI_AlbumSubmit_Out.wav', volume: 0.6 },
            tab: { url: './src/sound/UI_MessageWindow_Open.wav', volume: 0.7 },
            switch: { url: './src/sound/UI_AlbumSubmit_Finish.wav', volume: 0.7 },
            card: { url: './src/sound/System_Lumi_01.wav', volume: 0.7 },
            toggle: { url: './src/sound/UI_AppWipe_In.wav', volume: 0.7 },
            notification: { url: './src/sound/UI_Announce_New.wav', volume: 0.8 },
            success: { url: './src/sound/UI_AlbumSubmit_Finish.wav', volume: 0.8 },
            error: { url: './src/sound/UI_Cancel.wav', volume: 0.8 },
            moon: { url: './src/sound/moon.mp3', volume: 0.8 },
            chime: { url: './src/sound/mystical-chime.mp3', volume: 0.7 }
        };
        
        this.initialized = false;
        this.setupInitListener();
    }

    setupInitListener() {
        const initHandler = () => {
            if (!this.initialized) this.init();
        };
        document.addEventListener('click', initHandler, { once: true });
        document.addEventListener('keydown', initHandler, { once: true });
        document.addEventListener('touchstart', initHandler, { once: true });
    }

    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.preloadAllFileSounds();
        } catch (e) {
            this.isEnabled = false;
        }
    }

    async preloadAllFileSounds() {
        // Only preload the most used sounds to reduce initial load time
        const prioritySounds = ['click', 'tab', 'chime'];
        for (const name of prioritySounds) {
            const config = this.soundConfigs[name];
            if (config?.url) {
                try {
                    await this.loadSound(name);
                } catch {}
            }
        }
        // Load rest in background when idle
        const otherSounds = Object.keys(this.soundConfigs).filter(n => !prioritySounds.includes(n));
        setTimeout(() => {
            otherSounds.forEach(name => {
                const config = this.soundConfigs[name];
                if (config?.url) this.loadSound(name).catch(() => {});
            });
        }, 2000);
    }

    async loadSound(name) {
        if (!this.context) return null;
        const config = this.soundConfigs[name];
        if (!config || !config.url) return null;
        if (config.buffer) return config.buffer;

        const response = await fetch(config.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        config.buffer = audioBuffer;
        this.sounds.set(name, audioBuffer);
        return audioBuffer;
    }

    play(soundName) {
        if (!this.isEnabled || this.isMuted || !this.initialized) return;
        const config = this.soundConfigs[soundName];
        if (!config) return;
        if (config.url) {
            this.playFromFile(soundName, config);
        }
    }

    async playFromFile(name, config) {
        if (!config.buffer) {
            try {
                await this.loadSound(name);
            } catch {
                return;
            }
        }
        if (!config.buffer) return;

        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();

        source.buffer = config.buffer;
        gainNode.gain.value = (config.volume ?? 1) * this.volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        source.start();
    }

    register(name, config) {
        this.soundConfigs[name] = config;
        if (this.initialized && config.url) {
            this.loadSound(name).catch(() => {});
        }
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

    setupElementSounds() {
        document.querySelectorAll('[data-sound]').forEach(element => {
            const soundName = element.dataset.sound;
            element.addEventListener('click', () => {
                this.play(soundName);
            });
        });
    }

    playAmbient() {
        if (!this.isEnabled || this.isMuted || !this.initialized) return;
    }

    destroy() {
        if (this.context) this.context.close();
        this.sounds.clear();
    }
}

export default SoundManager;
