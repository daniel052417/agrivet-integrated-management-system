// lib/pushNotificationService.ts
import { notificationSettingsService } from './notificationSettingsService';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushNotificationService {
  private static permission: NotificationPermission = 'default';
  private static isSupported: boolean = false;

  /**
   * Initialize push notification service
   */
  static async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    this.isSupported = 'Notification' in window;

    if (!this.isSupported) {
      console.warn('Browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;

    // Request permission if not already granted/denied
    if (this.permission === 'default') {
      // Don't auto-request, wait for user action
      console.log('Notification permission not yet requested');
    }
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled and permission is granted
   */
  static async canSendNotification(): Promise<boolean> {
    // Check if push notifications are enabled in settings
    const pushEnabled = await notificationSettingsService.isPushNotificationsEnabled();
    if (!pushEnabled) {
      return false;
    }

    // Check browser support
    if (!this.isSupported) {
      return false;
    }

    // Check permission
    if (this.permission !== 'granted') {
      return false;
    }

    return true;
  }

  /**
   * Send a push notification
   */
  static async sendNotification(options: PushNotificationOptions): Promise<void> {
    try {
      const canSend = await this.canSendNotification();
      if (!canSend) {
        console.log('Push notifications not available or disabled');
        return;
      }

      // Create notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // Auto-close after 5 seconds (unless requireInteraction is true)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to action URL if provided
        if (options.data?.actionUrl) {
          window.location.href = options.data.actionUrl;
        }
        
        notification.close();
      };

      console.log('✅ Push notification sent:', options.title);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send notification from user notification data
   */
  static async sendNotificationFromUserNotification(notification: {
    title: string;
    message: string;
    type: string;
    priority: string;
    action_url?: string | null;
  }): Promise<void> {
    const iconMap: Record<string, string> = {
      low_stock: '📦',
      new_order: '🛒',
      system: '⚠️',
      daily_summary: '📊',
      attendance: '👤'
    };

    const priorityMap: Record<string, { requireInteraction: boolean; silent: boolean }> = {
      critical: { requireInteraction: true, silent: false },
      high: { requireInteraction: false, silent: false },
      medium: { requireInteraction: false, silent: false },
      low: { requireInteraction: false, silent: true }
    };

    const priorityOptions = priorityMap[notification.priority] || priorityMap.medium;

    await this.sendNotification({
      title: notification.title,
      body: notification.message,
      icon: iconMap[notification.type] || '🔔',
      tag: `${notification.type}_${Date.now()}`,
      data: {
        type: notification.type,
        actionUrl: notification.action_url || undefined
      },
      requireInteraction: priorityOptions.requireInteraction,
      silent: priorityOptions.silent
    });
  }

  /**
   * Get current permission status
   */
  static getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  /**
   * Check if browser supports notifications
   */
  static isBrowserSupported(): boolean {
    return this.isSupported;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  PushNotificationService.initialize();
}

export default PushNotificationService;






