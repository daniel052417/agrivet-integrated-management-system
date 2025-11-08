// lib/alerts/dailySalesSummaryService.ts
import { supabase } from '../supabase';
import { notificationSettingsService } from '../notificationSettingsService';
import UserNotificationsService from '../userNotificationsService';

interface SalesSummary {
  date: string;
  totalSales: number;
  totalOrders: number;
  totalTransactions: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStockItems: number;
  branchId?: string;
}

class DailySalesSummaryService {
  /**
   * Generate and send daily sales summary
   */
  static async sendDailySummary(date?: Date, branchId?: string): Promise<void> {
    try {
      // 1. Check if daily sales summary is enabled
      const isEnabled = await notificationSettingsService.isAlertEnabled('dailySummary');
      if (!isEnabled) {
        console.log('📧 Daily sales summary is disabled in settings');
        return;
      }

      // 2. Get summary date (default to yesterday if not provided)
      const summaryDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const startOfDay = new Date(summaryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(summaryDate);
      endOfDay.setHours(23, 59, 59, 999);

      // 3. Generate sales summary
      const summary = await this.generateSalesSummary(startOfDay, endOfDay, branchId);

      // 4. Get recipients from settings
      const recipientTypes = await notificationSettingsService.getDailySummaryRecipients();
      if (recipientTypes.length === 0) {
        console.warn('No recipients configured for daily sales summary');
        return;
      }

      // 5. Get user IDs for recipients
      const recipients = await this.getRecipientUserIds(recipientTypes, branchId);

      if (recipients.length === 0) {
        console.warn('No recipient users found for daily sales summary');
        return;
      }

      // 6. Create in-app notifications
      const notificationData = {
        title: `Daily Sales Summary - ${summaryDate.toLocaleDateString()}`,
        message: `Total Sales: ₱${summary.totalSales.toFixed(2)} | Orders: ${summary.totalOrders} | Transactions: ${summary.totalTransactions}`,
        type: 'daily_summary' as const,
        priority: 'medium' as const,
        action_url: '/dashboard/reports',
        metadata: {
          date: summaryDate.toISOString(),
          totalSales: summary.totalSales,
          totalOrders: summary.totalOrders,
          branch_id: branchId
        }
      };

      await UserNotificationsService.createNotificationsForUsers(recipients, notificationData);

      // 7. Send email notifications if enabled
      const emailEnabled = await notificationSettingsService.isEmailNotificationsEnabled();
      if (emailEnabled) {
        await this.sendDailySummaryEmail(summary, summaryDate, recipients);
      }

      console.log(`✅ Daily sales summary sent for ${summaryDate.toLocaleDateString()} to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error('Error in sendDailySummary:', error);
    }
  }

  /**
   * Generate sales summary data
   */
  private static async generateSalesSummary(
    startDate: Date,
    endDate: Date,
    branchId?: string
  ): Promise<SalesSummary> {
    try {
      // Get transactions/orders for the day
      let query = supabase
        .from('pos_transactions')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: transactions, error: transactionsError } = await query;

      // Get online orders for the day
      let ordersQuery = supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['confirmed', 'preparing', 'ready', 'completed']);

      if (branchId) {
        ordersQuery = ordersQuery.eq('branch_id', branchId);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      const totalTransactions = transactions?.length || 0;
      const totalSales = (transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0) +
                        (orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0);
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get top products (simplified - you may want to enhance this)
      const topProducts: Array<{ name: string; quantity: number; revenue: number }> = [];

      // Get low stock items count
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock_quantity', supabase.raw('low_stock_threshold'));

      return {
        date: startDate.toISOString(),
        totalSales,
        totalOrders,
        totalTransactions,
        averageOrderValue,
        topProducts,
        lowStockItems: lowStockCount || 0,
        branchId
      };
    } catch (error) {
      console.error('Error generating sales summary:', error);
      throw error;
    }
  }

  /**
   * Get user IDs for recipient types
   */
  private static async getRecipientUserIds(
    recipientTypes: string[],
    branchId?: string
  ): Promise<string[]> {
    try {
      const userIds: string[] = [];

      for (const type of recipientTypes) {
        let query = supabase
          .from('users')
          .select('id')
          .eq('is_active', true);

        if (type === 'owner') {
          query = query.in('role', ['super-admin', 'owner']);
        } else if (type === 'manager') {
          query = query.in('role', ['manager', 'admin']);
        } else if (type === 'cashier_lead') {
          query = query.eq('role', 'cashier_lead');
        }

        if (branchId) {
          query = query.eq('branch_id', branchId);
        }

        const { data: users, error } = await query;
        if (!error && users) {
          userIds.push(...users.map(u => u.id));
        }
      }

      // Remove duplicates
      return [...new Set(userIds)];
    } catch (error) {
      console.error('Error in getRecipientUserIds:', error);
      return [];
    }
  }

  /**
   * Send daily summary email
   */
  private static async sendDailySummaryEmail(
    summary: SalesSummary,
    date: Date,
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

      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      for (const user of users) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">📊 Daily Sales Summary</h2>
              <p>Hello ${user.first_name || 'there'},</p>
              <p>Here's your daily sales summary for <strong>${dateStr}</strong>:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <div style="background: white; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Total Sales</p>
                    <p style="margin: 4px 0 0 0; color: #059669; font-size: 24px; font-weight: bold;">₱${summary.totalSales.toFixed(2)}</p>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Total Orders</p>
                    <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 24px; font-weight: bold;">${summary.totalOrders}</p>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Transactions</p>
                    <p style="margin: 4px 0 0 0; color: #7c3aed; font-size: 24px; font-weight: bold;">${summary.totalTransactions}</p>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 6px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Avg Order Value</p>
                    <p style="margin: 4px 0 0 0; color: #dc2626; font-size: 24px; font-weight: bold;">₱${summary.averageOrderValue.toFixed(2)}</p>
                  </div>
                </div>
                ${summary.lowStockItems > 0 ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-top: 16px;">
                    <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ ${summary.lowStockItems} item(s) are running low on stock</p>
                  </div>
                ` : ''}
              </div>
              <p>
                <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/reports" 
                   style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  View Detailed Reports
                </a>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                This is an automated daily summary from your sales management system.
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
              subject: `📊 Daily Sales Summary - ${dateStr}`,
              html: emailHtml,
              type: 'daily_sales_summary',
              bcc: bccEnabled && managerEmail ? [managerEmail] : undefined
            })
          });

          if (!response.ok) {
            console.warn(`Failed to send email to ${user.email}:`, response.statusText);
          } else {
            console.log(`✅ Daily summary email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in sendDailySummaryEmail:', error);
    }
  }
}

export default DailySalesSummaryService;






