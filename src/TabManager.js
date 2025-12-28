/* =====================================================
   TABMANAGER.JS - Tab Controller (OPTIMIZED)
   Event delegation, cached elements
   ===================================================== */

export class TabManager {
    constructor(soundManager = null) {
        this.sound = soundManager;
        this.tabs = [];
        this.contents = [];
        this.activeTab = 'schedule';
        this.onTabChange = null;
    }

    init() {
        this.tabs = Array.from(document.querySelectorAll('.nav-tab'));
        this.contents = Array.from(document.querySelectorAll('.tab-content'));
        
        // Use event delegation on parent
        const tabContainer = document.querySelector('.nav-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-tab');
                if (tab) {
                    this.switchTo(tab.dataset.tab);
                }
            });
        }
        
        console.log('✧ Tab Manager initialized ✧');
    }

    switchTo(tabName) {
        if (this.activeTab === tabName) return;
        
        // Batch DOM updates
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        this.contents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        this.activeTab = tabName;
        this.sound?.play('tab');
        this.onTabChange?.(tabName);
        
        window.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: tabName } }));
    }

    getActiveTab() {
        return this.activeTab;
    }

    destroy() {
        this.tabs = [];
        this.contents = [];
    }
}

export default TabManager;
