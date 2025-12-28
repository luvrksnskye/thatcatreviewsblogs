/* =====================================================
   NOTIFICATIONMANAGER.JS - Toast Notifications (OPTIMIZED)
   Efficient DOM updates, queuing
   ===================================================== */

import { Utils } from './Utils.js';

export class NotificationManager {
    constructor(soundManager = null) {
        this.container = null;
        this.notifications = [];
        this.maxVisible = 3;
        this.defaultDuration = 5000;
        this.soundManager = soundManager;
        
        this._init();
    }

    _init() {
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            icon = null
        } = options;

        const id = Utils.generateId('notif');
        const notification = this._createElement(id, type, title, message, icon, duration);

        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        this.soundManager?.play('notification');

        // Auto-remove
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }

        // Limit visible
        while (this.notifications.length > this.maxVisible) {
            this.remove(this.notifications[0].id);
        }

        return id;
    }

    _createElement(id, type, title, message, icon, duration) {
        const iconMap = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const el = document.createElement('div');
        el.className = `notification ${type}`;
        el.dataset.id = id;
        
        el.innerHTML = `
            <div class="notification-icon">
                <span class="material-icons">${icon || iconMap[type] || 'info'}</span>
            </div>
            <div class="notification-content">
                ${title ? `<h4 class="notification-title">${title}</h4>` : ''}
                ${message ? `<p class="notification-message">${message}</p>` : ''}
            </div>
            <button class="notification-close" aria-label="Close">
                <span class="material-icons">close</span>
            </button>
            <div class="notification-progress"></div>
        `;

        el.querySelector('.notification-close')
            .addEventListener('click', () => this.remove(id));

        return el;
    }

    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const { element } = this.notifications[index];
        element.classList.add('exiting');
        
        setTimeout(() => {
            element.remove();
            this.notifications.splice(index, 1);
        }, 300);
    }

    // Convenience methods
    success(title, message, duration) {
        return this.show({ type: 'success', title, message, duration });
    }

    error(title, message, duration) {
        return this.show({ type: 'error', title, message, duration });
    }

    warning(title, message, duration) {
        return this.show({ type: 'warning', title, message, duration });
    }

    info(title, message, duration) {
        return this.show({ type: 'info', title, message, duration });
    }

    destroy() {
        this.notifications.forEach(n => n.element.remove());
        this.notifications = [];
    }
}

export default NotificationManager;
