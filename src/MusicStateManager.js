/* =====================================================
   MUSICSTATEMANAGER.JS - State Machine for Music Player
   Handles persistence, auto-resume, and state management
   ===================================================== */

export class MusicStateManager {
    constructor(storage, musicPlayer) {
        this.storage = storage;
        this.musicPlayer = musicPlayer;
        
        // State Machine States
        this.State = {
            IDLE: 'idle',
            LOADING: 'loading',
            PLAYING: 'playing',
            PAUSED: 'paused',
            BUFFERING: 'buffering',
            ERROR: 'error',
            AUTO_RESUMING: 'auto_resuming'
        };
        
        this.state = this.State.IDLE;
        this.previousState = null;
        
        // Persisted Data
        this.persistedData = {
            playlist: [],
            currentIndex: 0,
            currentTime: 0,
            volume: 0.7,
            isShuffle: false,
            repeatMode: 'none',
            wasPlaying: false,
            timestamp: Date.now()
        };
        
        // Auto-resume & Auto-play
        this.interactionListener = null;
        this.autoResumeAttempted = false;
        this.autoPlayEnabled = true; // Configurable
        
        // Configuración de auto-play
        this.config = {
            autoPlayDelay: 300, // ms después de la interacción
            maxResumeTime: 30, // segundos máximos para reanudar
            requireUserInteraction: true // requiere interacción del usuario
        };
        
        console.log('✧ Music State Manager initialized');
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    async init() {
        // Load saved state
        await this.loadPersistedState();
        
        // Hook into music player events
        this.setupPlayerHooks();
        
        // Setup auto-play system
        this.setupAutoPlaySystem();
        
        console.log('✧ State Manager ready');
        return this;
    }
    
    // ========================================
    // AUTO-PLAY SYSTEM
    // ========================================
    
    setupAutoPlaySystem() {
        // Si no requiere interacción del usuario, intentar auto-play inmediato
        if (!this.config.requireUserInteraction) {
            setTimeout(() => {
                this.attemptAutoResume();
            }, 1000);
            return;
        }
        
        // Sistema de auto-play con interacción requerida
        this.setupInteractionBasedAutoPlay();
    }
    
    setupInteractionBasedAutoPlay() {
        // Solo necesitamos 3 eventos básicos (reducido de 6)
        const interactionEvents = [
            'click',
            'touchstart',
            'keydown'
        ];
        
        const handleFirstInteraction = () => {
            console.log('✧ First user interaction detected, attempting auto-play');
            
            // Remover todos los listeners de primera interacción
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handleFirstInteraction, { capture: true });
            });
            
            // Intentar auto-resume
            this.attemptAutoResume();
        };
        
        // Agregar listeners para cada tipo de interacción
        interactionEvents.forEach(event => {
            document.addEventListener(event, handleFirstInteraction, { 
                capture: true, 
                once: true, 
                passive: true 
            });
        });
        
        // Timeout de seguridad: si no hay interacción en 10 segundos, intentar igual
        setTimeout(() => {
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handleFirstInteraction, { capture: true });
            });
            
            if (!this.autoResumeAttempted) {
                console.log('✧ No interaction detected, attempting auto-play anyway');
                this.attemptAutoResume();
            }
        }, 10000);
    }
    
    // ========================================
    // AUTO-RESUME IMPLEMENTATION
    // ========================================
    
    attemptAutoResume() {
        if (this.autoResumeAttempted) return;
        this.autoResumeAttempted = true;
        
        // Verificar si el auto-play está habilitado
        if (!this.autoPlayEnabled) {
            console.log('✧ Auto-play disabled by configuration');
            return;
        }
        
        // Solo intentar si la música estaba sonando
        if (!this.persistedData.wasPlaying) {
            console.log('✧ Auto-resume: Music was not playing on last visit');
            this.restorePlayerState(false); // Solo restaurar estado, no reproducir
            return;
        }
        
        const playlist = this.musicPlayer.playlist || [];
        if (playlist.length === 0) {
            console.log('✧ Auto-resume: Playlist is empty');
            return;
        }
        
        // Validar índice guardado
        const savedIndex = Math.max(0, Math.min(
            this.persistedData.currentIndex,
            playlist.length - 1
        ));
        
        let savedTime = this.persistedData.currentTime || 0;
        
        // Si el tiempo es muy largo (más de X segundos), reiniciar la canción
        if (savedTime > this.config.maxResumeTime) {
            console.log(`✧ Resume time too long (${savedTime}s), restarting track`);
            savedTime = 0;
        }
        
        console.log(`✧ Attempting auto-resume: Track ${savedIndex + 1} at ${savedTime.toFixed(1)}s`);
        
        // Cambiar a estado de auto-resuming
        this.setState(this.State.AUTO_RESUMING);
        
        // Pequeño delay antes de reproducir (para mejor UX)
        setTimeout(() => {
            this.executeAutoResume(savedIndex, savedTime);
        }, this.config.autoPlayDelay);
    }
    
    executeAutoResume(index, time) {
        try {
            // Verificar que el player esté listo
            if (!this.musicPlayer || !this.musicPlayer.playTrack) {
                console.error('✧ Music player not ready for auto-resume');
                this.setState(this.State.IDLE);
                return;
            }
            
            // Establecer el índice actual
            this.musicPlayer.currentIndex = index;
            
            // Actualizar la UI con la canción actual
            const track = this.musicPlayer.playlist[index];
            if (track && this.musicPlayer.updateTrackInfo) {
                this.musicPlayer.updateTrackInfo(track);
            }
            
            // Actualizar playlist UI
            if (this.musicPlayer.renderPlaylist) {
                this.musicPlayer.renderPlaylist();
            }
            
            // Reproducir la canción
            if (track && track.src) {
                console.log(`✧ Auto-playing: "${track.title}" at ${time.toFixed(1)}s`);
                
                // Usar playTrack con el tiempo guardado
                this.musicPlayer.playTrack(index, time);
                
                // Actualizar estado
                this.setState(this.State.PLAYING);
                
            } else {
                console.log('✧ Auto-resume: Track has no source, entering demo mode');
                this.musicPlayer.isPlaying = true;
                if (this.musicPlayer.updatePlayState) {
                    this.musicPlayer.updatePlayState();
                }
                this.setState(this.State.PLAYING);
            }
            
        } catch (error) {
            console.error('✧ Auto-resume failed:', error);
            this.setState(this.State.ERROR);
            this.restorePlayerState(false); // Fallback: solo restaurar estado
        }
    }
    
    restorePlayerState(shouldPlay = false) {
        // Restaurar configuración del player desde datos persistidos
        try {
            // Restaurar volumen
            if (this.musicPlayer.setVolume && this.persistedData.volume !== undefined) {
                this.musicPlayer.setVolume(this.persistedData.volume);
            }
            
            // Restaurar shuffle
            if (this.persistedData.isShuffle !== undefined) {
                this.musicPlayer.isShuffle = this.persistedData.isShuffle;
                if (this.musicPlayer.elements?.btnShuffle) {
                    this.musicPlayer.elements.btnShuffle.classList.toggle('active', this.persistedData.isShuffle);
                }
            }
            
            // Restaurar repeat mode
            if (this.persistedData.repeatMode !== undefined) {
                this.musicPlayer.repeatMode = this.persistedData.repeatMode;
                if (this.musicPlayer.elements?.btnRepeat) {
                    const icon = this.musicPlayer.elements.btnRepeat.querySelector('.material-icons');
                    if (icon) {
                        icon.textContent = this.persistedData.repeatMode === 'one' ? 'repeat_one' : 'repeat';
                    }
                    this.musicPlayer.elements.btnRepeat.classList.toggle('active', this.persistedData.repeatMode !== 'none');
                }
            }
            
            // Restaurar índice actual
            const playlist = this.musicPlayer.playlist || [];
            if (playlist.length > 0) {
                const validIndex = Math.max(0, Math.min(
                    this.persistedData.currentIndex || 0,
                    playlist.length - 1
                ));
                
                this.musicPlayer.currentIndex = validIndex;
                
                // Actualizar UI de la canción actual
                const track = playlist[validIndex];
                if (track && this.musicPlayer.updateTrackInfo) {
                    this.musicPlayer.updateTrackInfo(track);
                }
                
                // Actualizar playlist UI
                if (this.musicPlayer.renderPlaylist) {
                    this.musicPlayer.renderPlaylist();
                }
                
                console.log(`✧ Player state restored: Track ${validIndex + 1}`);
            }
            
            // Si debería reproducir pero no se pudo con auto-resume, mostrar indicación
            if (shouldPlay && this.persistedData.wasPlaying) {
                this.musicPlayer.notification?.info(
                    'Resume Playback', 
                    'Click the play button to resume from where you left off'
                );
            }
            
        } catch (error) {
            console.error('✧ Error restoring player state:', error);
        }
    }
    
    // ========================================
    // STATE MACHINE
    // ========================================
    
    setState(newState) {
        if (this.state === newState) return;
        
        this.previousState = this.state;
        this.state = newState;
        
        console.log(`✧ Player State: ${this.previousState} → ${this.state}`);
        
        // Auto-save on important state changes
        if (newState === this.State.PLAYING || newState === this.State.PAUSED) {
            this.persistState();
        }
    }
    
    getState() {
        return this.state;
    }
    
    isPlaying() {
        return this.state === this.State.PLAYING;
    }
    
    // ========================================
    // PERSISTENCE
    // ========================================
    
    async loadPersistedState() {
        try {
            const saved = this.storage?.get('musicPlayerState');
            if (!saved) {
                console.log('✧ No saved player state found');
                return;
            }
            
            // Merge saved data
            this.persistedData = { ...this.persistedData, ...saved };
            
            // Check if state is stale (older than 8 hours)
            const now = Date.now();
            const hoursDiff = (now - (saved.timestamp || 0)) / (1000 * 60 * 60);
            
            if (hoursDiff > 8) {
                console.log('✧ State is stale (>8 hours), resetting playback position');
                this.persistedData.currentTime = 0;
                this.persistedData.wasPlaying = false;
            }
            
            console.log(`✧ Loaded state: Track ${this.persistedData.currentIndex + 1}, ` +
                       `Time ${this.persistedData.currentTime.toFixed(1)}s, ` +
                       `WasPlaying: ${this.persistedData.wasPlaying}`);
            
        } catch (error) {
            console.error('✧ Error loading persisted state:', error);
        }
    }
    
    persistState() {
        if (!this.storage || !this.musicPlayer) return;
        
        // Throttle: Only save every 1.5 seconds
        if (this._lastPersist && Date.now() - this._lastPersist < 1500) {
            return;
        }
        
        try {
            const playerState = this.musicPlayer.getCurrentState?.() || {
                currentIndex: this.musicPlayer.currentIndex || 0,
                currentTime: this.musicPlayer.audio?.currentTime || this.musicPlayer.savedCurrentTime || 0,
                isPlaying: this.musicPlayer.isPlaying || false,
                volume: this.musicPlayer.volume || 0.7,
                isShuffle: this.musicPlayer.isShuffle || false,
                repeatMode: this.musicPlayer.repeatMode || 'none'
            };
            
            const playlist = this.musicPlayer.playlist || [];
            
            const stateToSave = {
                playlist: playlist.map(track => ({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    src: track.src
                })),
                currentIndex: playerState.currentIndex,
                currentTime: playerState.currentTime,
                volume: playerState.volume,
                isShuffle: playerState.isShuffle,
                repeatMode: playerState.repeatMode,
                wasPlaying: playerState.isPlaying,
                timestamp: Date.now()
            };
            
            this.storage.set('musicPlayerState', stateToSave);
            this._lastPersist = Date.now();
            
            console.log(`✧ State persisted: ${playerState.isPlaying ? 'Playing' : 'Paused'}, ` +
                       `Track ${playerState.currentIndex + 1}`);
            
        } catch (error) {
            console.error('✧ Error persisting state:', error);
        }
    }
    
    // ========================================
    // PLAYER HOOKS
    // ========================================
    
    setupPlayerHooks() {
        if (!this.musicPlayer || !this.musicPlayer.audio) return;
        
        const audio = this.musicPlayer.audio;
        
        // Hook into audio events to track state
        const originalPlay = audio.play.bind(audio);
        const originalPause = audio.pause.bind(audio);
        
        // Override play method to track state
        audio.play = async () => {
            this.setState(this.State.LOADING);
            try {
                const result = await originalPlay();
                this.setState(this.State.PLAYING);
                return result;
            } catch (error) {
                this.setState(this.State.PAUSED);
                throw error;
            }
        };
        
        // Override pause method to track state
        audio.pause = () => {
            const result = originalPause();
            if (this.state !== this.State.BUFFERING && this.state !== this.State.ERROR) {
                this.setState(this.State.PAUSED);
            }
            return result;
        };
        
        // Event listeners
        audio.addEventListener('waiting', () => {
            if (this.state === this.State.PLAYING) {
                this.setState(this.State.BUFFERING);
            }
        });
        
        audio.addEventListener('playing', () => {
            if (this.state === this.State.BUFFERING) {
                this.setState(this.State.PLAYING);
            }
        });
        
        audio.addEventListener('error', () => {
            this.setState(this.State.ERROR);
        });
        
        // Track time for persistence
        audio.addEventListener('timeupdate', () => {
            this.persistedData.currentTime = audio.currentTime;
            
            // Throttled persistence
            if (!this._lastTimePersist || Date.now() - this._lastTimePersist > 1000) {
                this.persistState();
                this._lastTimePersist = Date.now();
            }
        });
        
        // Track volume changes
        audio.addEventListener('volumechange', () => {
            this.persistedData.volume = audio.volume;
            this.persistState();
        });
        
        // Hook into player's playTrack method
        if (this.musicPlayer.playTrack) {
            const originalPlayTrack = this.musicPlayer.playTrack.bind(this.musicPlayer);
            this.musicPlayer.playTrack = (index, time) => {
                this.persistedData.currentIndex = index;
                if (time !== undefined) {
                    this.persistedData.currentTime = time;
                }
                return originalPlayTrack(index, time);
            };
        }
    }
    
    // ========================================
    // CONFIGURATION
    // ========================================
    
    enableAutoPlay(enable = true) {
        this.autoPlayEnabled = enable;
        console.log(`✧ Auto-play ${enable ? 'enabled' : 'disabled'}`);
    }
    
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('✧ Config updated:', this.config);
    }
    
    // ========================================
    // PUBLIC API
    // ========================================
    
    getPersistedData() {
        return { ...this.persistedData };
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    resetState() {
        this.persistedData = {
            playlist: [],
            currentIndex: 0,
            currentTime: 0,
            volume: 0.7,
            isShuffle: false,
            repeatMode: 'none',
            wasPlaying: false,
            timestamp: Date.now()
        };
        
        this.state = this.State.IDLE;
        this.storage?.remove('musicPlayerState');
        
        console.log('✧ State reset');
    }
    
    forcePersist() {
        this.persistState();
    }
    
    // ========================================
    // CLEANUP
    // ========================================
    
    destroy() {
        // Save final state
        this.persistState();
        
        // Remove any interaction listeners
        if (this.interactionListener) {
            window.removeEventListener('pointerdown', this.interactionListener);
            window.removeEventListener('keydown', this.interactionListener);
            this.interactionListener = null;
        }
        
        console.log('✧ State Manager destroyed');
    }
}

export default MusicStateManager;