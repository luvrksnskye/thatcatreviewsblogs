/* =====================================================
   GALLERYMANAGER.JS - Gallery Controller (OPTIMIZED)
   Lazy loading, event delegation
   ===================================================== */

export class GalleryManager {
    constructor(soundManager = null) {
        this.sound = soundManager;
        this.items = [];
        this.filterButtons = [];
        this.currentFilter = 'all';
        this.lightbox = null;
        this.currentIndex = 0;
    }

    init() {
        this.items = Array.from(document.querySelectorAll('.gallery-item'));
        this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
        this.lightbox = document.getElementById('lightbox');
        
        this._setupFilters();
        this._setupLightbox();
        this._setupGalleryItems();
        
        console.log('✧ Gallery Manager initialized ✧');
    }

    _setupFilters() {
        // Event delegation for filter buttons
        const filterContainer = document.querySelector('.gallery-filters');
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                
                const filter = btn.dataset.filter;
                this.filterBy(filter);
                
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.sound?.play('click');
            });
        }
    }

    filterBy(category) {
        this.currentFilter = category;
        
        this.items.forEach(item => {
            const show = category === 'all' || item.dataset.category === category;
            item.classList.toggle('hide', !show);
            item.classList.toggle('show', show);
        });
    }

    _setupGalleryItems() {
        // Event delegation for gallery items
        const gallery = document.querySelector('.gallery-grid');
        if (gallery) {
            gallery.addEventListener('click', (e) => {
                const item = e.target.closest('.gallery-item');
                if (!item) return;
                
                const index = this.items.indexOf(item);
                if (index !== -1) {
                    this.openLightbox(index);
                    this.sound?.play('card');
                }
            });
        }
    }

    _setupLightbox() {
        if (!this.lightbox) return;
        
        // Single event listener for all lightbox controls
        this.lightbox.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.id === 'lightbox-close' || target === this.lightbox) {
                this.closeLightbox();
            } else if (target.id === 'lightbox-prev') {
                this.prevImage();
            } else if (target.id === 'lightbox-next') {
                this.nextImage();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox?.classList.contains('active')) return;
            
            if (e.key === 'Escape') this.closeLightbox();
            if (e.key === 'ArrowLeft') this.prevImage();
            if (e.key === 'ArrowRight') this.nextImage();
        });
    }

    openLightbox(index) {
        if (!this.lightbox) return;
        this.currentIndex = index;
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        this._updateLightboxContent();
    }

    closeLightbox() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
        this.sound?.play('click');
    }

    prevImage() {
        const visible = this._getVisibleItems();
        this.currentIndex = (this.currentIndex - 1 + visible.length) % visible.length;
        this._updateLightboxContent();
        this.sound?.play('click');
    }

    nextImage() {
        const visible = this._getVisibleItems();
        this.currentIndex = (this.currentIndex + 1) % visible.length;
        this._updateLightboxContent();
        this.sound?.play('click');
    }

    _getVisibleItems() {
        return this.items.filter(item => {
            return this.currentFilter === 'all' || item.dataset.category === this.currentFilter;
        });
    }

    _updateLightboxContent() {
        const container = document.getElementById('lightbox-image');
        if (!container) return;
        
        const visible = this._getVisibleItems();
        const item = visible[this.currentIndex];
        
        if (item) {
            const icon = item.querySelector('.material-icons')?.textContent || 'image';
            container.innerHTML = `<span class="material-icons" style="font-size:96px;color:var(--purple-medium)">${icon}</span>`;
        }
    }

    destroy() {
        this.items = [];
        this.filterButtons = [];
    }
}

export default GalleryManager;
