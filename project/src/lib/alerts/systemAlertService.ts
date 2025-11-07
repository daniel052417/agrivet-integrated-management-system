// lib/alerts/systemAlertService.ts
import { supabase } from '../supabase';
import { notificationSettingsService } from '../notificationSettingsService';
import UserNotificationsService from '../userNotificationsService';

interface SystemAlertData {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'error' | 'warning' | 'info' | 'security';
  actionUrl?: string;
  metadata?: any;
}

class SystemAlertService {
  /**
   * Send system alert for critical issues
   */
  static async sendSystemAlert(data: SystemAlertData): Promise<void> {
    try {
      // 1. Check if system alerts are enabled
      const isEnabled = await notificationSettingsService.isAlertEnabled('system');
      if (!isEnabled) {
        console.log('📧 System alerts are disabled in settings');
        return;
      }

      // Only send alerts for high/critical severity
      if (data.severity !== 'high' && data.severity !== 'critical') {
        console.log(`System alert severity "${data.severity}" is below threshold, skipping`);
        return;
      }

      // 2. Get recipients (super-admin, admin)
      const recipients = await this.getNotificationRecipients();

      if (recipients.length === 0) {
        console.warn('No recipients found for system alert');
        return;
      }

      // 3. Create in-app notifications
      const notificationData = {
        title: data.title,
        message: data.message,
        type: 'system' as const,
        priority: data.severity === 'critical' ? 'critical' as const : 'high' as const,
        action_url: data.actionUrl || null,
        metadata: {
          severity: data.severity,
          category: data.category,
          ...data.metadata
        }
      };

      await UserNotificationsService.createNotificationsForUsers(recipients, notificationData);

      // 4. Send email notifications if enabled (only for critical)
      const emailEnabled = await notificationSettingsService.isEmailNotificationsEnabled();
      if (emailEnabled && data.severity === 'critical') {
        await this.sendSystemEmail(data, recipients);
      }

      console.log(`✅ System alert sent: ${data.title} to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error('Error in sendSystemAlert:', error);
    }
  }

  /**
   * Get user IDs who should receive system alerts
   */
  private static async getNotificationRecipients(): Promise<string[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('is_active', true)
        .in('role', ['super-admin', 'admin']);

      if (error) {
        console.error('Error fetching notification recipients:', error);
        return [];
      }

      return users?.map(u => u.id) || [];
    } catch (error) {
      console.error('Error in getNotificationRecipients:', error);
      return [];
    }
  }

  /**
   * Send system alert email (only for critical alerts)
   */
  private static async sendSystemEmail(
    data: SystemAlertData,
    recipientUserIds: string[]
  ): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', recipientUserIds)
        .eq('is_active', true);

      if (error || !users || users.length === 0) {
        console.error('Error fetching user emails:', error);
        return;
      }

      const managerEmail = await notificationSettingsService.getManagerEmail();
      const bccEnabled = await notificationSettingsService.isBccManagerEnabled();

      const severityColor = data.severity === 'critical' ? '#dc2626' : '#ea580c';
      const severityIcon = data.severity === 'critical' ? '🚨' : '⚠️';

      for (const user of users) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${severityColor};">
                ${severityIcon} ${data.title}
              </h2>
              <p>Hello ${user.first_name || 'there'},</p>
              <div style="background: ${data.severity === 'critical' ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${severityColor}; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; color: ${data.severity === 'critical' ? '#991b1b' : '#92400e'};">
                  ${data.message}
                </p>
              </div>
              ${data.actionUrl ? `
                <p>
                  <a href="${typeof window !== 'undefined' ? window.location.origin : ''}${data.actionUrl}" 
                     style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                    View Details
                  </a>
                </p>
              ` : ''}
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                <strong>Severity:</strong> ${data.severity.toUpperCase()} | <strong>Category:</strong> ${data.category.toUpperCase()}
              </p>
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated critical system alert. Please investigate immediately.
              </p>
            </div>
          `;

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              to: user.email,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
              subject: `${severityIcon} CRITICAL: ${data.title}`,
              html: emailHtml,
              type: 'system_alert',
              bcc: bccEnabled && managerEmail ? [managerEmail] : undefined
            })
          });

          if (!response.ok) {
            console.warn(`Failed to send email to ${user.email}:`, response.statusText);
          } else {
            console.log(`✅ System alert email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in sendSystemEmail:', error);
    }
  }
}

export default SystemAlertService;




