/* =====================================================
   NOTIFICATIONMANAGER.JS - Toast Notifications
   Manages notification display and queuing
   ===================================================== */

import { Utils } from './Utils.js';

export class NotificationManager {
    constructor(soundManager = null) {
        this.container = null;
        this.notifications = [];
        this.maxVisible = 3;
        this.defaultDuration = 5000;
        this.soundManager = soundManager;
        
        this.init();
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    init() {
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = Utils.createElement('div', {
                id: 'notification-container',
                class: 'notification-container'
            });
            document.body.appendChild(this.container);
        }
    }

    // ========================================
    // SHOW NOTIFICATION
    // ========================================
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            icon = null,
            actions = [],
            persistent = false
        } = options;

        const id = Utils.generateId('notif');
        const notification = this.createNotificationElement(id, {
            type, title, message, icon, actions, persistent, duration
        });

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Play sound
        if (this.soundManager) {
            this.soundManager.play('notification');
        }

        // Auto-remove after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }

        // Limit visible notifications
        this.enforceMaxVisible();

        return id;
    }

    // ========================================
    // CREATE NOTIFICATION ELEMENT
    // ========================================
    createNotificationElement(id, options) {
        const { type, title, message, icon, actions, persistent, duration } = options;

        const iconMap = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info',
            welcome: 'favorite'
        };

        const notifIcon = icon || iconMap[type] || 'info';

      const notification = Utils.createElement('div', {
    class: `notification ${type}`,
    dataset: {
        id: id
    }
});

        notification.innerHTML = `
            <div class="notification-icon">
                <span class="material-icons">${notifIcon}</span>
            </div>
            <div class="notification-content">
                ${title ? `<h4 class="notification-title">${title}</h4>` : ''}
                ${message ? `<p class="notification-message">${message}</p>` : ''}
                ${actions.length > 0 ? this.createActionsHTML(actions) : ''}
            </div>
            <button class="notification-close" aria-label="Close notification">
                <span class="material-icons">close</span>
            </button>
            ${!persistent ? '<div class="notification-progress"></div>' : ''}
        `;

        // Setup close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(id));

        // Setup action buttons
        actions.forEach((action, index) => {
            const btn = notification.querySelector(`[data-action-index="${index}"]`);
            if (btn && action.onClick) {
                btn.addEventListener('click', () => {
                    action.onClick();
                    if (action.closeOnClick !== false) {
                        this.remove(id);
                    }
                });
            }
        });

        // Pause progress on hover
        notification.addEventListener('mouseenter', () => {
            const progress = notification.querySelector('.notification-progress');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        });

        notification.addEventListener('mouseleave', () => {
            const progress = notification.querySelector('.notification-progress');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
        });

        return notification;
    }

    // ========================================
    // CREATE ACTIONS HTML
    // ========================================
    createActionsHTML(actions) {
        const buttons = actions.map((action, index) => `
            <button class="notification-action ${action.primary ? 'primary' : 'secondary'}" 
                    data-action-index="${index}">
                ${action.label}
            </button>
        `).join('');

        return `<div class="notification-actions">${buttons}</div>`;
    }

    // ========================================
    // REMOVE NOTIFICATION
    // ========================================
    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        
        if (index === -1) return;

        const { element } = this.notifications[index];
        
        // Add exit animation
        element.classList.add('exiting');
        
        setTimeout(() => {
            element.remove();
            this.notifications.splice(index, 1);
        }, 300);
    }

    // ========================================
    // REMOVE ALL NOTIFICATIONS
    // ========================================
    removeAll() {
        [...this.notifications].forEach(n => this.remove(n.id));
    }

    // ========================================
    // ENFORCE MAX VISIBLE
    // ========================================
    enforceMaxVisible() {
        while (this.notifications.length > this.maxVisible) {
            const oldest = this.notifications[0];
            this.remove(oldest.id);
        }
    }

    // ========================================
    // CONVENIENCE METHODS
    // ========================================
    
    success(title, message, duration = this.defaultDuration) {
        return this.show({ type: 'success', title, message, duration });
    }

    error(title, message, duration = this.defaultDuration) {
        return this.show({ type: 'error', title, message, duration });
    }

    warning(title, message, duration = this.defaultDuration) {
        return this.show({ type: 'warning', title, message, duration });
    }

    info(title, message, duration = this.defaultDuration) {
        return this.show({ type: 'info', title, message, duration });
    }

    // ========================================
    // SHOW WELCOME NOTIFICATION
    // ========================================
    showWelcome(options = {}) {
        const {
            title = 'Welcome!',
            message = 'Thanks for visiting!',
            duration = 8000
        } = options;

        return this.show({
            type: 'welcome',
            title,
            message,
            duration,
            icon: 'favorite',
            actions: [
                {
                    label: 'Explore',
                    primary: true,
                    onClick: () => {
                        // Could scroll to content or trigger tour
                        console.log('Explore clicked');
                    }
                }
            ]
        });
    }

    // ========================================
    // UPDATE NOTIFICATION BADGE
    // ========================================
    updateBadge(count) {
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.toggle('show', count > 0);
        }
    }

    // ========================================
    // DESTROY
    // ========================================
    destroy() {
        this.removeAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default NotificationManager;
