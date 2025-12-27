/* =====================================================
   TABMANAGER.JS - Navigation Tab Controller
   Handles tab switching and content visibility
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
        this.tabs = document.querySelectorAll('.nav-tab');
        this.contents = document.querySelectorAll('.tab-content');
        this.setupEventListeners();
        console.log('✧ Tab Manager initialized ✧');
    }

    setupEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTo(tabName);
            });
        });
    }

    switchTo(tabName) {
        if (this.activeTab === tabName) return;
        
        // Update tabs
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update content
        this.contents.forEach(content => {
            const isActive = content.id === `tab-${tabName}`;
            content.classList.toggle('active', isActive);
        });
        
        this.activeTab = tabName;
        this.sound?.play('tab');
        
        if (this.onTabChange) {
            this.onTabChange(tabName);
        }
        
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
