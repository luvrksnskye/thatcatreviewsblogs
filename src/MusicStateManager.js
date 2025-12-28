/* =====================================================
   MUSICSTATEMANAGER.JS - State Machine (OPTIMIZED)
   Simplified auto-resume, reduced listeners
   ===================================================== */

export class MusicStateManager {
    constructor(storage, musicPlayer) {
        this.storage = storage;
        this.musicPlayer = musicPlayer;
        
        // State
        this.state = 'idle';
        this.autoResumeAttempted = false;
        
        // Persisted data
        this.persistedData = {
            currentIndex: 0,
            currentTime: 0,
            wasPlaying: false,
            timestamp: Date.now()
        };
        
        // Config
        this.config = {
            autoPlayDelay: 300,
            maxResumeTime: 30,
            staleHours: 8
        };
        
        this._lastPersist = 0;
    }

    async init() {
        await this.loadPersistedState();
        this.setupPlayerHooks();
        this.setupAutoPlay();
        
        console.log('✧ Music State Manager ready (optimized) ✧');
        return this;
    }

    setupAutoPlay() {
        // Single unified interaction handler
        const handleInteraction = () => {
            if (this.autoResumeAttempted) return;
            this.attemptAutoResume();
        };
        
        // Use capture phase for earliest detection
        const options = { capture: true, once: true, passive: true };
        
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, handleInteraction, options);
        });
        
        // Fallback timeout
        setTimeout(() => {
            if (!this.autoResumeAttempted) {
                this.attemptAutoResume();
            }
        }, 10000);
    }

    attemptAutoResume() {
        if (this.autoResumeAttempted) return;
        this.autoResumeAttempted = true;
        
        // Only resume if was playing
        if (!this.persistedData.wasPlaying) {
            console.log('✧ Auto-resume: Was not playing');
            return;
        }
        
        const playlist = this.musicPlayer?.playlist || [];
        if (playlist.length === 0) {
            console.log('✧ Auto-resume: Empty playlist');
            return;
        }
        
        const index = Math.min(this.persistedData.currentIndex, playlist.length - 1);
        let time = this.persistedData.currentTime || 0;
        
        // Reset if time is too long
        if (time > this.config.maxResumeTime) {
            time = 0;
        }
        
        console.log(`✧ Auto-resuming track ${index + 1} at ${time.toFixed(1)}s`);
        
        setTimeout(() => {
            try {
                this.musicPlayer.playTrack(index, time);
            } catch (e) {
                console.warn('Auto-resume failed:', e);
            }
        }, this.config.autoPlayDelay);
    }

    async loadPersistedState() {
        try {
            const saved = this.storage?.get('musicPlayerState');
            if (!saved) return;
            
            // Check staleness
            const hoursDiff = (Date.now() - (saved.timestamp || 0)) / 3600000;
            
            if (hoursDiff > this.config.staleHours) {
                console.log('✧ State is stale, resetting');
                this.persistedData.currentTime = 0;
                this.persistedData.wasPlaying = false;
            } else {
                this.persistedData = { ...this.persistedData, ...saved };
            }
            
        } catch (e) {
            console.error('Load state error:', e);
        }
    }

    persistState() {
        if (!this.storage || !this.musicPlayer) return;
        
        // Throttle: 2 seconds minimum between saves
        const now = Date.now();
        if (now - this._lastPersist < 2000) return;
        this._lastPersist = now;
        
        try {
            const state = {
                currentIndex: this.musicPlayer.currentIndex || 0,
                currentTime: this.musicPlayer.audio?.currentTime || 0,
                wasPlaying: this.musicPlayer.isPlaying || false,
                volume: this.musicPlayer.volume || 0.7,
                timestamp: now
            };
            
            this.storage.set('musicPlayerState', state);
            
        } catch (e) {
            console.warn('Persist state error:', e);
        }
    }

    setupPlayerHooks() {
        if (!this.musicPlayer?.audio) return;
        
        const audio = this.musicPlayer.audio;
        
        // Single throttled timeupdate handler
        audio.addEventListener('timeupdate', () => {
            this.persistedData.currentTime = audio.currentTime;
            this.persistState();
        });
        
        // State change events
        audio.addEventListener('play', () => {
            this.state = 'playing';
            this.persistedData.wasPlaying = true;
        });
        
        audio.addEventListener('pause', () => {
            this.state = 'paused';
            this.persistedData.wasPlaying = false;
            this.persistState();
        });
    }

    forcePersist() {
        this._lastPersist = 0;
        this.persistState();
    }

    resetState() {
        this.persistedData = {
            currentIndex: 0,
            currentTime: 0,
            wasPlaying: false,
            timestamp: Date.now()
        };
        this.storage?.remove('musicPlayerState');
    }

    destroy() {
        this.persistState();
    }
}

export default MusicStateManager;
