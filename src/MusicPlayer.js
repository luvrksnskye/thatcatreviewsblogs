/* =====================================================
   MUSICPLAYER.JS - Audio Player (OPTIMIZED)
   Reduced event listeners, throttled updates, lazy loading
   ===================================================== */

import { Utils } from './Utils.js';

export class MusicPlayer {
    constructor(storage, notificationManager, soundManager) {
        this.storage = storage;
        this.notification = notificationManager;
        this.sound = soundManager;

        this.audio = new Audio();
        this.audio.preload = 'metadata'; // Don't preload full audio
        
        this.isPlaying = false;
        this.isMinimized = false;
        this.isShuffle = false;
        this.repeatMode = 'none';
        this.currentIndex = 0;
        this.volume = 0.7;
        this.previousVolume = 0.7;
        this.playlist = [];
        this.elements = {};
        
        // Mobile state
        this.isMobile = false;
        this.mobileState = 'visible';
        this.pullTab = null;

        // Throttling
        this._lastProgressUpdate = 0;
        this._lastSave = 0;
        this._pendingResume = null;
        this.savedCurrentTime = 0;
    }

    init() {
        this.cacheElements();
        this.checkMobile();
        this.setupAudioEvents();
        this.setupControls();
        this.setupDefaultPlaylist();
        this.loadState();
        this.renderPlaylist();
        
        if (this.playlist.length > 0) {
            this.currentIndex = Utils.clamp(this.currentIndex, 0, this.playlist.length - 1);
            this.updateTrackInfo(this.playlist[this.currentIndex]);
        }

        // Deferred mobile setup
        if (this.isMobile) {
            requestAnimationFrame(() => this.setupMobileInteractions());
        }

        console.log('✧ Music Player initialized (optimized) ✧');
        return this;
    }

    cacheElements() {
        // Cache all elements once
        const ids = [
            'music-player', 'player-header', 'player-body', 'player-minimized',
            'song-title', 'song-artist', 'mini-title',
            'progress-bar', 'progress-fill', 'progress-handle',
            'current-time', 'total-time',
            'btn-play', 'btn-prev', 'btn-next', 'btn-shuffle', 'btn-repeat',
            'player-minimize', 'mini-play',
            'volume-icon', 'volume-slider', 'volume-fill', 'volume-handle',
            'playlist-toggle', 'playlist-container', 'playlist'
        ];
        
        ids.forEach(id => {
            const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            this.elements[key] = document.getElementById(id);
        });
        
        // Alias for consistency
        this.elements.player = this.elements.musicPlayer;
        this.elements.playlistList = this.elements.playlist;
    }

    checkMobile() {
        this.isMobile = window.innerWidth <= 480;
    }

    setupAudioEvents() {
        // Throttled progress update
        this.audio.addEventListener('timeupdate', () => {
            const now = Date.now();
            if (now - this._lastProgressUpdate > 250) { // Update 4x/sec max
                this._lastProgressUpdate = now;
                this.updateProgress();
                this.savedCurrentTime = this.audio.currentTime || 0;
            }
            
            // Throttled save
            if (now - this._lastSave > 2000) {
                this._lastSave = now;
                this.saveState();
            }
        });
        
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.handleError(e));
    }

    setupControls() {
        // Use event delegation for buttons
        const player = this.elements.player;
        if (!player) return;
        
        player.addEventListener('click', (e) => {
            const target = e.target.closest('button, .toggle-btn');
            if (!target) return;
            
            const id = target.id;
            
            switch (id) {
                case 'btn-play':
                case 'mini-play':
                    e.stopPropagation();
                    this.togglePlay();
                    break;
                case 'btn-prev':
                    this.prevTrack();
                    break;
                case 'btn-next':
                    this.nextTrack();
                    break;
                case 'btn-shuffle':
                    this.toggleShuffle();
                    break;
                case 'btn-repeat':
                    this.toggleRepeat();
                    break;
                case 'player-minimize':
                    this.toggleMinimize();
                    break;
                case 'playlist-toggle':
                    this.togglePlaylist();
                    break;
                case 'volume-icon':
                    this.toggleMute();
                    break;
            }
        });
        
        // Minimized click
        this.elements.playerMinimized?.addEventListener('click', (e) => {
            if (!e.target.closest('#mini-play')) {
                this.toggleMinimize();
            }
        });
        
        // Progress bar
        this.elements.progressBar?.addEventListener('click', (e) => this.seekTo(e));
        
        // Volume slider
        this.elements.volumeSlider?.addEventListener('click', (e) => this.setVolumeFromClick(e));
    }

    setupMobileInteractions() {
        if (this.pullTab) return;
        
        this.pullTab = document.createElement('div');
        this.pullTab.className = 'mobile-pull-tab';
        this.pullTab.setAttribute('aria-label', 'Show music player');
        document.body.appendChild(this.pullTab);
        
        this.pullTab.addEventListener('click', () => this.showMobilePlayer());
    }

    setupDefaultPlaylist() {
        // Default playlist - can be overridden by TimeOfDayManager
        this.playlist = [
            { id: 'default-1', title: 'Peace and Tranquility', artist: 'A Hat in Time', duration: '15:00', src: './src/bgm/Peace_and_Tranquility.mp3' }
        ];
    }

    // ========================================
    // PLAYBACK CONTROLS
    // ========================================

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.playlist.length === 0) return;
        
        const track = this.playlist[this.currentIndex];
        if (!track) return;
        
        // Load source if needed
        if (this.audio.src !== track.src) {
            this.audio.src = track.src;
        }
        
        this.audio.play().catch(e => {
            console.warn('Playback failed:', e);
        });
    }

    pause() {
        this.audio.pause();
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayState();
        this.sound?.play('click');
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayState();
    }

    updatePlayState() {
        const icon = this.isPlaying ? 'pause' : 'play_arrow';
        
        const playIcon = this.elements.btnPlay?.querySelector('.material-icons');
        if (playIcon) playIcon.textContent = icon;
        
        const miniIcon = this.elements.miniPlay?.querySelector('.material-icons');
        if (miniIcon) miniIcon.textContent = icon;
        
        this.elements.player?.classList.toggle('playing', this.isPlaying);
    }

    playTrack(index, startTime = 0) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = track.src;
        this.audio.currentTime = startTime;
        
        this.updateTrackInfo(track);
        this.renderPlaylist();
        
        this.audio.play().catch(e => {
            console.warn('Playback failed:', e);
        });
    }

    prevTrack() {
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) newIndex = this.playlist.length - 1;
        
        this.playTrack(newIndex);
        this.sound?.play('click');
    }

    nextTrack() {
        let newIndex;
        
        if (this.isShuffle) {
            do {
                newIndex = Math.floor(Math.random() * this.playlist.length);
            } while (newIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            newIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        
        this.playTrack(newIndex);
        this.sound?.play('click');
    }

    handleSongEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.repeatMode === 'all' || this.currentIndex < this.playlist.length - 1) {
            this.nextTrack();
        } else {
            this.isPlaying = false;
            this.updatePlayState();
        }
    }

    // ========================================
    // UI UPDATES
    // ========================================

    updateTrackInfo(track) {
        if (!track) return;
        
        if (this.elements.songTitle) {
            this.elements.songTitle.textContent = track.title || 'Unknown';
        }
        if (this.elements.songArtist) {
            this.elements.songArtist.textContent = track.artist || 'Unknown Artist';
        }
        if (this.elements.miniTitle) {
            this.elements.miniTitle.textContent = track.title || 'Unknown';
        }
    }

    updateProgress() {
        const current = this.audio.currentTime || 0;
        const duration = this.audio.duration || 0;
        const percent = duration > 0 ? (current / duration) * 100 : 0;
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.progressHandle) {
            this.elements.progressHandle.style.left = `${percent}%`;
        }
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = Utils.formatTime(current);
        }
    }

    updateDuration() {
        if (this.elements.totalTime) {
            this.elements.totalTime.textContent = Utils.formatTime(this.audio.duration);
        }
    }

    seekTo(e) {
        const bar = this.elements.progressBar;
        if (!bar) return;
        
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * (this.audio.duration || 0);
    }

    // ========================================
    // SHUFFLE & REPEAT
    // ========================================

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.elements.btnShuffle?.classList.toggle('active', this.isShuffle);
        this.sound?.play('toggle');
        this.saveState();
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIdx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIdx + 1) % modes.length];
        
        this.elements.btnRepeat?.classList.toggle('active', this.repeatMode !== 'none');
        
        const icon = this.elements.btnRepeat?.querySelector('.material-icons');
        if (icon) {
            icon.textContent = this.repeatMode === 'one' ? 'repeat_one' : 'repeat';
        }
        
        this.sound?.play('toggle');
        this.saveState();
    }

    // ========================================
    // VOLUME
    // ========================================

    setVolume(value) {
        this.volume = Utils.clamp(value, 0, 1);
        this.audio.volume = this.volume;
        
        if (this.elements.volumeFill) {
            this.elements.volumeFill.style.width = `${this.volume * 100}%`;
        }
        if (this.elements.volumeHandle) {
            this.elements.volumeHandle.style.left = `${this.volume * 100}%`;
        }
        
        this.updateVolumeIcon();
    }

    setVolumeFromClick(e) {
        const slider = this.elements.volumeSlider;
        if (!slider) return;
        
        const rect = slider.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.setVolume(percent);
        this.saveState();
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.7);
        }
    }

    updateVolumeIcon() {
        if (!this.elements.volumeIcon) return;
        
        let icon = 'volume_up';
        if (this.volume === 0) icon = 'volume_off';
        else if (this.volume < 0.5) icon = 'volume_down';
        
        this.elements.volumeIcon.textContent = icon;
    }

    // ========================================
    // MINIMIZE & PLAYLIST
    // ========================================

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.elements.player?.classList.toggle('minimized', this.isMinimized);
        this.sound?.play('switch');
    }

    togglePlaylist() {
        this.elements.playlistContainer?.classList.toggle('show');
        this.sound?.play('click');
    }

    showMobilePlayer() {
        this.elements.player?.classList.remove('mobile-hidden');
        this.mobileState = 'visible';
    }

    // ========================================
    // PLAYLIST MANAGEMENT
    // ========================================

    renderPlaylist() {
        const list = this.elements.playlistList;
        if (!list) return;
        
        // Use DocumentFragment for batch DOM update
        const fragment = document.createDocumentFragment();
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('li');
            item.className = `playlist-item${index === this.currentIndex ? ' active' : ''}`;
            item.dataset.index = index;
            
            item.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <div class="track-info">
                    <span class="track-title">${track.title}</span>
                    <span class="track-artist">${track.artist}</span>
                </div>
                <span class="track-duration">${track.duration || ''}</span>
            `;
            
            item.addEventListener('click', () => this.playTrack(index));
            fragment.appendChild(item);
        });
        
        list.innerHTML = '';
        list.appendChild(fragment);
    }

    setPlaylist(newPlaylist, autoPlay = false) {
        if (!Array.isArray(newPlaylist)) return;
        
        const wasPlaying = this.isPlaying;
        this.pause();
        
        this.playlist = [...newPlaylist];
        this.currentIndex = 0;
        this.savedCurrentTime = 0;
        
        this.renderPlaylist();
        
        if (this.playlist.length > 0) {
            this.updateTrackInfo(this.playlist[0]);
            
            if (wasPlaying || autoPlay) {
                setTimeout(() => this.playTrack(0), 100);
            }
        }
        
        this.saveState();
    }

    getPlaylist() {
        return [...this.playlist];
    }

    // ========================================
    // STATE PERSISTENCE
    // ========================================

    saveState() {
        this.storage?.set('musicPlayer', {
            volume: this.volume,
            isShuffle: this.isShuffle,
            repeatMode: this.repeatMode,
            currentIndex: this.currentIndex,
            wasPlaying: this.isPlaying,
            currentTime: this.savedCurrentTime
        });
    }

    loadState() {
        const state = this.storage?.get('musicPlayer');
        if (!state) return;
        
        this.setVolume(state.volume ?? 0.7);
        this.isShuffle = state.isShuffle ?? false;
        this.repeatMode = state.repeatMode ?? 'none';
        this.currentIndex = state.currentIndex ?? 0;
        this.savedCurrentTime = state.currentTime ?? 0;
        
        this.elements.btnShuffle?.classList.toggle('active', this.isShuffle);
        this.elements.btnRepeat?.classList.toggle('active', this.repeatMode !== 'none');
        
        const icon = this.elements.btnRepeat?.querySelector('.material-icons');
        if (icon) icon.textContent = this.repeatMode === 'one' ? 'repeat_one' : 'repeat';
    }

    getCurrentState() {
        return {
            isPlaying: this.isPlaying,
            currentIndex: this.currentIndex,
            currentTime: this.audio.currentTime || this.savedCurrentTime,
            volume: this.volume,
            isShuffle: this.isShuffle,
            repeatMode: this.repeatMode,
            track: this.playlist[this.currentIndex] || null
        };
    }

    handleError(e) {
        console.error('Audio error:', e);
        this.notification?.error('Playback Error', 'Could not play the audio file');
    }

    destroy() {
        this.pause();
        this.saveState();
        this.audio.src = '';
        this.pullTab?.remove();
    }
}

export default MusicPlayer;
