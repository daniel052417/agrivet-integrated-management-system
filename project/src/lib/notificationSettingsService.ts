// lib/notificationSettingsService.ts
import { settingsService } from './settingsService';

export type AlertType = 'lowStock' | 'newOrder' | 'system' | 'dailySummary' | 'attendance';

export interface NotificationRecipients {
  owner?: string[];
  manager?: string[];
  cashierLead?: string[];
}

class NotificationSettingsService {
  private static instance: NotificationSettingsService;
  private cachedSettings: any = null;
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): NotificationSettingsService {
    if (!NotificationSettingsService.instance) {
      NotificationSettingsService.instance = new NotificationSettingsService();
    }
    return NotificationSettingsService.instance;
  }

  /**
   * Get notification settings (with caching)
   */
  private async getNotificationSettings(): Promise<any> {
    const now = Date.now();
    if (this.cachedSettings && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedSettings;
    }

    try {
      const allSettings = await settingsService.getAllSettings();
      const notifications = allSettings?.notifications || allSettings || {};
      
      this.cachedSettings = {
        emailNotifications: notifications.emailNotifications ?? notifications.email_notifications ?? true,
        pushNotifications: notifications.pushNotifications ?? notifications.push_notifications ?? true,
        lowStockAlerts: notifications.lowStockAlerts ?? notifications.low_stock_alerts ?? true,
        newOrderAlerts: notifications.newOrderAlerts ?? notifications.new_order_alerts ?? true,
        systemAlerts: notifications.systemAlerts ?? notifications.system_alerts ?? true,
        dailySalesSummary: notifications.dailySalesSummary ?? notifications.daily_sales_summary ?? false,
        attendanceAlerts: notifications.attendanceAlerts ?? notifications.attendance_alerts ?? false,
        bccManager: notifications.bccManager ?? notifications.bcc_manager ?? true,
        managerEmail: notifications.managerEmail ?? notifications.manager_email ?? null,
        dailySummaryRecipients: notifications.dailySummaryRecipients ?? notifications.daily_summary_recipients ?? []
      };

      this.cacheTimestamp = now;
      return this.cachedSettings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // Return defaults on error
      return {
        emailNotifications: true,
        pushNotifications: true,
        lowStockAlerts: true,
        newOrderAlerts: true,
        systemAlerts: true,
        dailySalesSummary: false,
        attendanceAlerts: false,
        bccManager: true,
        managerEmail: null,
        dailySummaryRecipients: []
      };
    }
  }

  /**
   * Check if email notifications are enabled
   */
  async isEmailNotificationsEnabled(): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings.emailNotifications === true;
  }

  /**
   * Check if push notifications are enabled
   */
  async isPushNotificationsEnabled(): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings.pushNotifications === true;
  }

  /**
   * Check if a specific alert type is enabled
   */
  async isAlertEnabled(alertType: AlertType): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    
    switch (alertType) {
      case 'lowStock':
        return settings.lowStockAlerts === true;
      case 'newOrder':
        return settings.newOrderAlerts === true;
      case 'system':
        return settings.systemAlerts === true;
      case 'dailySummary':
        return settings.dailySalesSummary === true;
      case 'attendance':
        return settings.attendanceAlerts === true;
      default:
        return false;
    }
  }

  /**
   * Get manager email for BCC
   */
  async getManagerEmail(): Promise<string | null> {
    const settings = await this.getNotificationSettings();
    return settings.managerEmail || null;
  }

  /**
   * Check if BCC manager is enabled
   */
  async isBccManagerEnabled(): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings.bccManager === true;
  }

  /**
   * Get daily summary recipients list
   */
  async getDailySummaryRecipients(): Promise<string[]> {
    const settings = await this.getNotificationSettings();
    return settings.dailySummaryRecipients || [];
  }

  /**
   * Get all notification settings (for debugging/admin)
   */
  async getAllSettings(): Promise<any> {
    return await this.getNotificationSettings();
  }

  /**
   * Clear cache (call when settings are updated)
   */
  clearCache(): void {
    this.cachedSettings = null;
    this.cacheTimestamp = 0;
  }
}

export const notificationSettingsService = NotificationSettingsService.getInstance();
export default notificationSettingsService;






