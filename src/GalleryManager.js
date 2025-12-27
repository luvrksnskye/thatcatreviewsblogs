/* =====================================================
   GALLERYMANAGER.JS - Image Gallery Controller
   Handles gallery filtering and lightbox
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
        this.items = document.querySelectorAll('.gallery-item');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.lightbox = document.getElementById('lightbox');
        
        this.setupFilters();
        this.setupLightbox();
        this.setupGalleryItems();
        
        console.log('✧ Gallery Manager initialized ✧');
    }

    setupFilters() {
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterBy(filter);
                
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.sound?.play('click');
            });
        });
    }

    filterBy(category) {
        this.currentFilter = category;
        
        this.items.forEach(item => {
            const itemCategory = item.dataset.category;
            const shouldShow = category === 'all' || itemCategory === category;
            
            if (shouldShow) {
                item.classList.remove('hide');
                item.classList.add('show');
                item.style.display = '';
            } else {
                item.classList.add('hide');
                item.classList.remove('show');
                setTimeout(() => { item.style.display = 'none'; }, 300);
            }
        });
    }

    setupGalleryItems() {
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.openLightbox(index);
                this.sound?.play('card');
            });
        });
    }

    setupLightbox() {
        if (!this.lightbox) return;
        
        const closeBtn = document.getElementById('lightbox-close');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        
        closeBtn?.addEventListener('click', () => this.closeLightbox());
        prevBtn?.addEventListener('click', () => this.prevImage());
        nextBtn?.addEventListener('click', () => this.nextImage());
        
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) this.closeLightbox();
        });
        
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
        this.updateLightboxContent();
    }

    closeLightbox() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
        this.sound?.play('click');
    }

    prevImage() {
        const visibleItems = this.getVisibleItems();
        this.currentIndex = (this.currentIndex - 1 + visibleItems.length) % visibleItems.length;
        this.updateLightboxContent();
        this.sound?.play('click');
    }

    nextImage() {
        const visibleItems = this.getVisibleItems();
        this.currentIndex = (this.currentIndex + 1) % visibleItems.length;
        this.updateLightboxContent();
        this.sound?.play('click');
    }

    getVisibleItems() {
        return Array.from(this.items).filter(item => {
            return this.currentFilter === 'all' || item.dataset.category === this.currentFilter;
        });
    }

    updateLightboxContent() {
        const imageContainer = document.getElementById('lightbox-image');
        if (!imageContainer) return;
        
        const visibleItems = this.getVisibleItems();
        const currentItem = visibleItems[this.currentIndex];
        
        if (currentItem) {
            const icon = currentItem.querySelector('.material-icons')?.textContent || 'image';
            imageContainer.innerHTML = `<span class="material-icons" style="font-size:96px;color:var(--purple-medium)">${icon}</span>`;
        }
    }

    destroy() {
        this.items = [];
        this.filterButtons = [];
    }
}

export default GalleryManager;
