// lib/alerts/attendanceAlertService.ts
import { supabase } from '../supabase';
import { notificationSettingsService } from '../notificationSettingsService';
import UserNotificationsService from '../userNotificationsService';

interface AttendanceAlertData {
  employeeId: string;
  employeeName: string;
  alertType: 'late' | 'absent' | 'early_departure';
  date: string;
  expectedTime?: string;
  actualTime?: string;
  reason?: string;
}

class AttendanceAlertService {
  /**
   * Send attendance alert (late, absent, etc.)
   */
  static async sendAttendanceAlert(data: AttendanceAlertData): Promise<void> {
    try {
      // 1. Check if attendance alerts are enabled
      const isEnabled = await notificationSettingsService.isAlertEnabled('attendance');
      if (!isEnabled) {
        console.log('📧 Attendance alerts are disabled in settings');
        return;
      }

      // 2. Get recipients (HR, manager)
      const recipients = await this.getNotificationRecipients();

      if (recipients.length === 0) {
        console.warn('No recipients found for attendance alert');
        return;
      }

      // 3. Create notification message based on alert type
      const { title, message } = this.getAlertMessage(data);

      // 4. Create in-app notifications
      const notificationData = {
        title,
        message,
        type: 'attendance' as const,
        priority: data.alertType === 'absent' ? 'high' as const : 'medium' as const,
        action_url: `/hr/attendance/${data.date}`,
        metadata: {
          employee_id: data.employeeId,
          employee_name: data.employeeName,
          alert_type: data.alertType,
          date: data.date,
          expected_time: data.expectedTime,
          actual_time: data.actualTime
        }
      };

      await UserNotificationsService.createNotificationsForUsers(recipients, notificationData);

      // 5. Send email notifications if enabled
      const emailEnabled = await notificationSettingsService.isEmailNotificationsEnabled();
      if (emailEnabled) {
        await this.sendAttendanceEmail(data, recipients);
      }

      console.log(`✅ Attendance alert sent for ${data.employeeName} to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error('Error in sendAttendanceAlert:', error);
    }
  }

  /**
   * Get alert message based on type
   */
  private static getAlertMessage(data: AttendanceAlertData): { title: string; message: string } {
    switch (data.alertType) {
      case 'late':
        return {
          title: `Late Arrival: ${data.employeeName}`,
          message: `${data.employeeName} arrived late on ${new Date(data.date).toLocaleDateString()}. Expected: ${data.expectedTime}, Actual: ${data.actualTime}`
        };
      case 'absent':
        return {
          title: `Absence Alert: ${data.employeeName}`,
          message: `${data.employeeName} was absent on ${new Date(data.date).toLocaleDateString()}. ${data.reason ? `Reason: ${data.reason}` : 'No reason provided.'}`
        };
      case 'early_departure':
        return {
          title: `Early Departure: ${data.employeeName}`,
          message: `${data.employeeName} left early on ${new Date(data.date).toLocaleDateString()}. Expected: ${data.expectedTime}, Actual: ${data.actualTime}`
        };
      default:
        return {
          title: `Attendance Alert: ${data.employeeName}`,
          message: `Attendance issue for ${data.employeeName} on ${new Date(data.date).toLocaleDateString()}`
        };
    }
  }

  /**
   * Get user IDs who should receive attendance notifications
   */
  private static async getNotificationRecipients(): Promise<string[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('is_active', true)
        .in('role', ['super-admin', 'admin', 'manager', 'hr_manager']);

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
   * Send attendance email notification
   */
  private static async sendAttendanceEmail(
    data: AttendanceAlertData,
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

      const { title, message } = this.getAlertMessage(data);
      const dateStr = new Date(data.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const alertColor = data.alertType === 'absent' ? '#dc2626' : '#ea580c';
      const alertIcon = data.alertType === 'absent' ? '❌' : '⚠️';

      for (const user of users) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${alertColor};">
                ${alertIcon} ${title}
              </h2>
              <p>Hello ${user.first_name || 'there'},</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Employee:</strong> ${data.employeeName}</p>
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Alert Type:</strong> ${data.alertType.toUpperCase()}</p>
                ${data.expectedTime ? `<p><strong>Expected Time:</strong> ${data.expectedTime}</p>` : ''}
                ${data.actualTime ? `<p><strong>Actual Time:</strong> ${data.actualTime}</p>` : ''}
                ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              </div>
              <p>
                <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/hr/attendance/${data.date}" 
                   style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  View Attendance Details
                </a>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                This is an automated notification from your HR management system.
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
              subject: `${alertIcon} ${title}`,
              html: emailHtml,
              type: 'attendance_alert',
              bcc: bccEnabled && managerEmail ? [managerEmail] : undefined
            })
          });

          if (!response.ok) {
            console.warn(`Failed to send email to ${user.email}:`, response.statusText);
          } else {
            console.log(`✅ Attendance email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in sendAttendanceEmail:', error);
    }
  }
}

export default AttendanceAlertService;




