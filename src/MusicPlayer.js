/* =====================================================
   MUSICPLAYER.JS - Audio Player with Playlist
   Full-featured music player component
   ===================================================== */

import { Utils } from './Utils.js';

export class MusicPlayer {
    constructor(storage, notificationManager, soundManager) {
        this.storage = storage;
        this.notification = notificationManager;
        this.sound = soundManager;
        
        this.audio = new Audio();
        this.isPlaying = false;
        this.isMinimized = false;
        this.isShuffle = false;
        this.repeatMode = 'none';
        this.currentIndex = 0;
        this.volume = 0.7;
        this.previousVolume = 0.7;
        this.playlist = [];
        this.elements = {};
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Mobile state
        this.isMobile = false;
        this.mobileState = 'visible'; // 'visible', 'hidden', 'expanded'
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.touchStartTime = 0;
        this.isDraggingMobile = false;
        this.pullTab = null;
        
        // Track whether playlist was changed externally
        this.isExternalPlaylistChange = false;
    }

    init() {
        this.cacheElements();
        this.checkMobile();
        this.setupAudioEvents();
        this.setupControls();
        this.setupDesktopDragging();
        this.setupMobileInteractions();
        this.setupPlaylist();
        this.loadState();
        this.setupDefaultPlaylist();
        this.setupResizeListener();
        console.log('✧ Music Player initialized ✧');
    }

    cacheElements() {
        this.elements = {
            player: document.getElementById('music-player'),
            header: document.getElementById('player-header'),
            body: document.getElementById('player-body'),
            minimized: document.getElementById('player-minimized'),
            songTitle: document.getElementById('song-title'),
            songArtist: document.getElementById('song-artist'),
            miniTitle: document.getElementById('mini-title'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            progressHandle: document.getElementById('progress-handle'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),
            btnPlay: document.getElementById('btn-play'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            btnMinimize: document.getElementById('player-minimize'),
            miniPlay: document.getElementById('mini-play'),
            volumeIcon: document.getElementById('volume-icon'),
            volumeSlider: document.getElementById('volume-slider'),
            volumeFill: document.getElementById('volume-fill'),
            volumeHandle: document.getElementById('volume-handle'),
            playlistToggle: document.getElementById('playlist-toggle'),
            playlistContainer: document.getElementById('playlist-container'),
            playlistList: document.getElementById('playlist'),
            addSongBtn: document.getElementById('add-song-btn')
        };
    }

    checkMobile() {
        this.isMobile = window.innerWidth <= 480;
        if (this.isMobile) {
            this.createPullTab();
        }
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.checkMobile();
                
                // Handle transition between mobile and desktop
                if (wasMobile && !this.isMobile) {
                    this.resetToDesktop();
                } else if (!wasMobile && this.isMobile) {
                    this.resetToMobile();
                }
            }, 100);
        });
    }

    resetToDesktop() {
        const player = this.elements.player;
        if (!player) return;
        
        // Remove mobile classes and styles
        player.classList.remove('mobile-hidden', 'mobile-expanded', 'mobile-peek', 'dragging');
        player.style.transform = '';
        player.style.bottom = '';
        
        // Hide pull tab
        if (this.pullTab) {
            this.pullTab.classList.remove('visible');
        }
        
        this.mobileState = 'visible';
    }

    resetToMobile() {
        const player = this.elements.player;
        if (!player) return;
        
        // Reset to mobile visible state
        player.classList.remove('mobile-hidden', 'mobile-expanded', 'mobile-peek');
        this.mobileState = 'visible';
        
        // Ensure pull tab exists
        if (!this.pullTab) {
            this.createPullTab();
        }
    }

    createPullTab() {
        // Remove existing pull tab if any
        if (this.pullTab) {
            this.pullTab.remove();
        }
        
        // Create pull tab element
        this.pullTab = document.createElement('div');
        this.pullTab.className = 'mobile-pull-tab';
        this.pullTab.setAttribute('aria-label', 'Show music player');
        document.body.appendChild(this.pullTab);
        
        // Pull tab click handler
        this.pullTab.addEventListener('click', () => {
            this.showMobilePlayer();
        });
        
        // Pull tab swipe up handler
        this.pullTab.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.pullTab.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = this.touchStartY - touchEndY;
            
            if (deltaY > 30) {
                this.showMobilePlayer();
            }
        }, { passive: true });
    }

    setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.handleError(e));
    }

    setupControls() {
        this.elements.btnPlay?.addEventListener('click', () => this.togglePlay());
        this.elements.miniPlay?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });
        this.elements.btnPrev?.addEventListener('click', () => this.prevTrack());
        this.elements.btnNext?.addEventListener('click', () => this.nextTrack());
        this.elements.btnShuffle?.addEventListener('click', () => this.toggleShuffle());
        this.elements.btnRepeat?.addEventListener('click', () => this.toggleRepeat());
        this.elements.btnMinimize?.addEventListener('click', () => this.toggleMinimize());
        this.elements.minimized?.addEventListener('click', (e) => {
            if (e.target !== this.elements.miniPlay && !this.elements.miniPlay?.contains(e.target)) {
                this.toggleMinimize();
            }
        });
        this.elements.progressBar?.addEventListener('click', (e) => this.seekTo(e));
        this.elements.volumeSlider?.addEventListener('click', (e) => this.setVolumeFromClick(e));
        this.elements.volumeIcon?.addEventListener('click', () => this.toggleMute());
        this.elements.playlistToggle?.addEventListener('click', () => this.togglePlaylist());
    }

    setupDesktopDragging() {
        const header = this.elements.header;
        const player = this.elements.player;
        if (!header || !player) return;

        header.addEventListener('mousedown', (e) => {
            if (this.isMobile) return;
            if (e.target.closest('.player-minimize') || e.target.closest('.mini-btn')) return;
            
            this.isDragging = true;
            player.classList.add('dragging');
            const rect = player.getBoundingClientRect();
            this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.isMobile) return;
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            const maxX = window.innerWidth - player.offsetWidth;
            const maxY = window.innerHeight - player.offsetHeight;
            player.style.left = `${Utils.clamp(x, 0, maxX)}px`;
            player.style.top = `${Utils.clamp(y, 0, maxY)}px`;
            player.style.bottom = 'auto';
            player.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (this.isMobile) return;
            this.isDragging = false;
            player.classList.remove('dragging');
        });
    }

    setupMobileInteractions() {
        const header = this.elements.header;
        const player = this.elements.player;
        if (!header || !player) return;

        // Touch start
        header.addEventListener('touchstart', (e) => {
            if (!this.isMobile) return;
            
            this.isDraggingMobile = true;
            this.touchStartY = e.touches[0].clientY;
            this.touchCurrentY = this.touchStartY;
            this.touchStartTime = Date.now();
            
            player.classList.add('dragging');
        }, { passive: true });

        // Touch move
        header.addEventListener('touchmove', (e) => {
            if (!this.isDraggingMobile || !this.isMobile) return;
            
            this.touchCurrentY = e.touches[0].clientY;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // Apply drag transform based on current state
            if (this.mobileState === 'visible' || this.mobileState === 'expanded') {
                // Only allow downward swipe
                if (deltaY > 0) {
                    player.style.transform = `translateY(${deltaY}px)`;
                    if (this.mobileState === 'expanded') {
                        player.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
                    }
                }
            } else if (this.mobileState === 'hidden') {
                // Allow upward swipe to show
                if (deltaY < 0) {
                    const currentOffset = player.offsetHeight + 40;
                    const newOffset = Math.max(0, currentOffset + deltaY);
                    player.style.transform = `translateY(calc(100% + 40px + ${deltaY}px))`;
                }
            }
        }, { passive: true });

        // Touch end
        header.addEventListener('touchend', (e) => {
            if (!this.isDraggingMobile || !this.isMobile) return;
            
            const deltaY = this.touchCurrentY - this.touchStartY;
            const touchDuration = Date.now() - this.touchStartTime;
            const velocity = Math.abs(deltaY) / touchDuration;
            const threshold = 50;
            const velocityThreshold = 0.5;
            
            player.classList.remove('dragging');
            player.style.transform = '';
            
            // Determine action based on swipe direction and magnitude
            const isQuickSwipe = velocity > velocityThreshold;
            const isSignificantSwipe = Math.abs(deltaY) > threshold;
            
            if (this.mobileState === 'visible') {
                if ((deltaY > threshold || isQuickSwipe) && deltaY > 0) {
                    this.hideMobilePlayer();
                }
            } else if (this.mobileState === 'expanded') {
                if ((deltaY > threshold || isQuickSwipe) && deltaY > 0) {
                    this.collapseMobilePlayer();
                }
            } else if (this.mobileState === 'hidden') {
                if ((deltaY < -threshold || isQuickSwipe) && deltaY < 0) {
                    this.showMobilePlayer();
                }
            }
            
            this.isDraggingMobile = false;
        }, { passive: true });

        // Tap to expand (on header, not on controls)
        header.addEventListener('click', (e) => {
            if (!this.isMobile) return;
            if (this.isDraggingMobile) return;
            
            // Don't expand if clicking on buttons
            if (e.target.closest('.mini-btn') || e.target.closest('button')) return;
            
            // Check for quick tap (not a drag)
            const touchDuration = Date.now() - this.touchStartTime;
            if (touchDuration < 200 && Math.abs(this.touchCurrentY - this.touchStartY) < 10) {
                this.toggleMobileExpand();
            }
        });

        // Close expanded view when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.isMobile || this.mobileState !== 'expanded') return;
            
            if (!player.contains(e.target)) {
                this.collapseMobilePlayer();
            }
        });
    }

    // Mobile state management
    showMobilePlayer() {
        const player = this.elements.player;
        if (!player) return;
        
        player.classList.remove('mobile-hidden', 'mobile-peek');
        this.mobileState = 'visible';
        
        if (this.pullTab) {
            this.pullTab.classList.remove('visible');
        }
        
        this.sound?.play('whoosh');
    }

    hideMobilePlayer() {
        const player = this.elements.player;
        if (!player) return;
        
        player.classList.add('mobile-hidden');
        player.classList.remove('mobile-expanded', 'mobile-peek');
        this.mobileState = 'hidden';
        
        // Show pull tab after transition
        setTimeout(() => {
            if (this.pullTab && this.mobileState === 'hidden') {
                this.pullTab.classList.add('visible');
            }
        }, 300);
        
        this.sound?.play('whoosh');
    }

    toggleMobileExpand() {
        if (this.mobileState === 'expanded') {
            this.collapseMobilePlayer();
        } else {
            this.expandMobilePlayer();
        }
    }

    expandMobilePlayer() {
        const player = this.elements.player;
        if (!player) return;
        
        player.classList.add('mobile-expanded');
        player.classList.remove('mobile-hidden', 'mobile-peek');
        this.mobileState = 'expanded';
        
        this.sound?.play('pop');
    }

    collapseMobilePlayer() {
        const player = this.elements.player;
        if (!player) return;
        
        player.classList.remove('mobile-expanded');
        this.mobileState = 'visible';
        
        // Close playlist if open
        this.elements.playlistContainer?.classList.remove('show');
        
        this.sound?.play('click');
    }

    setupPlaylist() {
        this.elements.addSongBtn?.addEventListener('click', () => {
            this.notification?.info('Add Songs', 'Drag and drop audio files or add URLs');
        });
    }

    setupDefaultPlaylist() {
        // Only set default if no external playlist has been set
        if (this.playlist.length === 0 && !this.isExternalPlaylistChange) {
            this.playlist = [
                { id: '1', title: 'Dreamy', artist: 'Lo-Fi Beats', duration: '3:00', src: './src/bgm/Dreamy.mp3' },
                { id: '2', title: 'Peace and Tranquility', artist: 'A Hat in Time', duration: '15:00', src: './src/bgm/Peace_and_Tranquility.mp3' },
                { id: '3', title: 'Null', artist: '???', duration: '0:00', src: '' }
            ];
            this.renderPlaylist();
        }
    }

    renderPlaylist() {
        if (!this.elements.playlistList) return;
        this.elements.playlistList.innerHTML = this.playlist.map((song, index) => `
            <li class="playlist-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="playlist-item-art"><span class="material-icons">music_note</span></div>
                <div class="playlist-item-info">
                    <span class="playlist-item-title">${song.title}</span>
                    <span class="playlist-item-artist">${song.artist}</span>
                </div>
                <span class="playlist-item-duration">${song.duration}</span>
                <button class="playlist-item-play"><span class="material-icons">play_arrow</span></button>
            </li>
        `).join('');
        
        this.elements.playlistList.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => this.playTrack(parseInt(item.dataset.index)));
        });
    }

    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[index];
        this.updateTrackInfo(track);
        
        if (track.src) {
            this.audio.src = track.src;
            this.audio.play().catch(error => {
                console.warn('Auto-play prevented:', error);
                this.notification?.info('Click Play', 'Click the play button to start the music');
            });
        } else {
            this.notification?.info('Demo Mode', `Playing: ${track.title}`);
            this.isPlaying = true;
            this.updatePlayState();
        }
        
        this.renderPlaylist();
        this.sound?.play('pop');
    }

    updateTrackInfo(track) {
        if (this.elements.songTitle) this.elements.songTitle.textContent = track.title;
        if (this.elements.songArtist) this.elements.songArtist.textContent = track.artist;
        if (this.elements.miniTitle) this.elements.miniTitle.textContent = track.title;
    }

    togglePlay() {
        if (this.playlist.length === 0) {
            this.notification?.warning('No Songs', 'Add some songs to your playlist first!');
            return;
        }
        if (this.isPlaying) { 
            this.pause(); 
        } else { 
            this.play(); 
        }
        this.sound?.play('toggle');
    }

    play() {
        if (this.audio.src) { 
            this.audio.play().catch(error => {
                console.warn('Play prevented:', error);
            }); 
        } else if (this.playlist.length > 0) { 
            this.playTrack(this.currentIndex); 
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayState();
    }

    onPlay() { 
        this.isPlaying = true; 
        this.updatePlayState(); 
    }
    
    onPause() { 
        this.isPlaying = false; 
        this.updatePlayState(); 
    }
    
    updatePlayState() { 
        this.elements.player?.classList.toggle('playing', this.isPlaying); 
    }

    nextTrack() {
        let nextIndex = this.isShuffle 
            ? Math.floor(Math.random() * this.playlist.length) 
            : (this.currentIndex + 1) % this.playlist.length;
        this.playTrack(nextIndex);
    }

    prevTrack() {
        if (this.audio.currentTime > 3) { 
            this.audio.currentTime = 0; 
            return; 
        }
        let prevIndex = this.isShuffle 
            ? Math.floor(Math.random() * this.playlist.length) 
            : this.currentIndex - 1;
        if (prevIndex < 0) prevIndex = this.playlist.length - 1;
        this.playTrack(prevIndex);
    }

    handleSongEnd() {
        switch (this.repeatMode) {
            case 'one': 
                this.audio.currentTime = 0; 
                this.audio.play(); 
                break;
            case 'all': 
                this.nextTrack(); 
                break;
            default: 
                if (this.currentIndex < this.playlist.length - 1) { 
                    this.nextTrack(); 
                } else { 
                    this.pause(); 
                }
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.elements.btnShuffle?.classList.toggle('active', this.isShuffle);
        this.sound?.play('switch');
        this.saveState();
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const idx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(idx + 1) % modes.length];
        this.elements.btnRepeat?.classList.toggle('active', this.repeatMode !== 'none');
        const icon = this.elements.btnRepeat?.querySelector('.material-icons');
        if (icon) icon.textContent = this.repeatMode === 'one' ? 'repeat_one' : 'repeat';
        this.sound?.play('switch');
        this.saveState();
    }

    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (duration) {
            const percent = (currentTime / duration) * 100;
            if (this.elements.progressFill) this.elements.progressFill.style.width = `${percent}%`;
            if (this.elements.progressHandle) this.elements.progressHandle.style.left = `${percent}%`;
        }
        if (this.elements.currentTime) this.elements.currentTime.textContent = Utils.formatTime(currentTime);
    }

    updateDuration() {
        if (this.elements.totalTime) this.elements.totalTime.textContent = Utils.formatTime(this.audio.duration);
    }

    seekTo(e) {
        if (!this.audio.duration) return;
        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    setVolumeFromClick(e) {
        const rect = this.elements.volumeSlider.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.setVolume(percent);
    }

    setVolume(value) {
        this.volume = Utils.clamp(value, 0, 1);
        this.audio.volume = this.volume;
        if (this.elements.volumeFill) this.elements.volumeFill.style.width = `${this.volume * 100}%`;
        if (this.elements.volumeHandle) this.elements.volumeHandle.style.left = `${this.volume * 100}%`;
        this.updateVolumeIcon();
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

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.elements.player?.classList.toggle('minimized', this.isMinimized);
        this.sound?.play('switch');
    }

    togglePlaylist() {
        this.elements.playlistContainer?.classList.toggle('show');
        this.sound?.play('click');
    }

    handleError(e) {
        console.error('Audio error:', e);
        this.notification?.error('Playback Error', 'Could not play the audio file');
    }

    addToPlaylist(track) {
        this.playlist.push({ id: Utils.generateId('track'), ...track });
        this.renderPlaylist();
        this.notification?.success('Added', `"${track.title}" added to playlist`);
    }

    removeFromPlaylist(index) {
        if (index < 0 || index >= this.playlist.length) return;
        const removed = this.playlist.splice(index, 1)[0];
        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex) { 
            this.pause(); 
            if (this.playlist.length > 0) {
                this.currentIndex = Math.min(this.currentIndex, this.playlist.length - 1); 
            }
        }
        this.renderPlaylist();
        this.notification?.info('Removed', `"${removed.title}" removed from playlist`);
    }

    // ========================================
    // PUBLIC API for TimeOfDayManager
    // ========================================
    
    /**
     * Set playlist from external source (TimeOfDayManager)
     * This is the preferred method for external playlist changes
     * @param {Array} newPlaylist - Array of track objects
     * @param {boolean} autoPlay - Whether to start playing automatically
     */
    setPlaylist(newPlaylist, autoPlay = false) {
        if (!newPlaylist || !Array.isArray(newPlaylist)) return;
        
        this.isExternalPlaylistChange = true;
        const wasPlaying = this.isPlaying;
        
        // Pause current track
        this.pause();
        
        // Update playlist
        this.playlist = [...newPlaylist];
        this.currentIndex = 0;
        
        // Render new playlist
        this.renderPlaylist();
        
        // Update track info for first song
        if (this.playlist.length > 0) {
            this.updateTrackInfo(this.playlist[0]);
            
            // If was playing or autoPlay requested, start new track
            if (wasPlaying || autoPlay) {
                // Small delay to let UI update
                setTimeout(() => {
                    this.playTrack(0);
                }, 100);
            }
        }
        
        console.log('✧ Playlist updated:', this.playlist.length, 'tracks');
    }
    
    /**
     * Update playlist without interrupting playback if possible
     * Used by TimeOfDayManager for seamless transitions
     * @param {Array} newPlaylist - Array of track objects  
     */
    updatePlaylistSeamless(newPlaylist) {
        if (!newPlaylist || !Array.isArray(newPlaylist)) return;
        
        this.isExternalPlaylistChange = true;
        
        // Just update the playlist data and re-render
        this.playlist = [...newPlaylist];
        
        // Clamp currentIndex to valid range
        if (this.currentIndex >= this.playlist.length) {
            this.currentIndex = 0;
        }
        
        // Render new playlist
        this.renderPlaylist();
        
        // Update track info
        if (this.playlist.length > 0 && this.playlist[this.currentIndex]) {
            this.updateTrackInfo(this.playlist[this.currentIndex]);
        }
        
        console.log('✧ Playlist updated seamlessly:', this.playlist.length, 'tracks');
    }
    
    /**
     * Get current playlist
     * @returns {Array} Current playlist
     */
    getPlaylist() {
        return [...this.playlist];
    }
    
    /**
     * Check if player is currently playing
     * @returns {boolean} Playing state
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    saveState() {
        this.storage?.set('musicPlayer', { 
            volume: this.volume, 
            isShuffle: this.isShuffle, 
            repeatMode: this.repeatMode, 
            currentIndex: this.currentIndex 
        });
    }

    loadState() {
        const state = this.storage?.get('musicPlayer');
        if (state) {
            this.setVolume(state.volume ?? 0.7);
            this.isShuffle = state.isShuffle ?? false;
            this.repeatMode = state.repeatMode ?? 'none';
            this.currentIndex = state.currentIndex ?? 0;
            this.elements.btnShuffle?.classList.toggle('active', this.isShuffle);
            this.elements.btnRepeat?.classList.toggle('active', this.repeatMode !== 'none');
            
            const icon = this.elements.btnRepeat?.querySelector('.material-icons');
            if (icon) icon.textContent = this.repeatMode === 'one' ? 'repeat_one' : 'repeat';
        }
    }

    destroy() { 
        this.pause(); 
        this.saveState(); 
        this.audio.src = ''; 
        
        // Remove pull tab
        if (this.pullTab) {
            this.pullTab.remove();
            this.pullTab = null;
        }
    }
}

export default MusicPlayer;
