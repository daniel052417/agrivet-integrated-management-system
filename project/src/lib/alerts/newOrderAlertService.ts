// lib/alerts/newOrderAlertService.ts
import { supabase } from '../supabase';
import { notificationSettingsService } from '../notificationSettingsService';
import UserNotificationsService from '../userNotificationsService';

interface OrderData {
  id: string;
  order_number: string;
  total_amount: number;
  customer_name?: string;
  customer_email?: string;
  order_type: string;
  branch_id: string;
  status: string;
}

class NewOrderAlertService {
  /**
   * Send new order alert when an order is created or confirmed
   */
  static async sendNewOrderAlert(orderId: string): Promise<void> {
    try {
      // 1. Check if new order alerts are enabled
      const isEnabled = await notificationSettingsService.isAlertEnabled('newOrder');
      if (!isEnabled) {
        console.log('📧 New order alerts are disabled in settings');
        return;
      }

      // 2. Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_name, customer_email, order_type, branch_id, status, created_at')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order:', orderError);
        return;
      }

      // 3. Get users who should receive notifications (owner, manager, cashier lead)
      const recipients = await this.getNotificationRecipients(order.branch_id);

      if (recipients.length === 0) {
        console.warn('No recipients found for new order alert');
        return;
      }

      // 4. Get order items for more details
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price, line_total')
        .eq('order_id', orderId)
        .limit(5);

      const itemsSummary = orderItems?.map(item => 
        `${item.product_name} (${item.quantity}x)`
      ).join(', ') || 'No items';

      // 5. Create in-app notifications
      const notificationData = {
        title: `New Order: ${order.order_number}`,
        message: `New ${order.order_type} order received from ${order.customer_name || 'Guest'}. Total: ₱${order.total_amount.toFixed(2)}`,
        type: 'new_order' as const,
        priority: 'high' as const,
        action_url: `/orders/${orderId}`,
        metadata: {
          order_id: orderId,
          order_number: order.order_number,
          total_amount: order.total_amount,
          customer_name: order.customer_name,
          order_type: order.order_type,
          branch_id: order.branch_id
        }
      };

      await UserNotificationsService.createNotificationsForUsers(recipients, notificationData);

      // 6. Send email notifications if enabled
      const emailEnabled = await notificationSettingsService.isEmailNotificationsEnabled();
      if (emailEnabled) {
        await this.sendNewOrderEmail(order, itemsSummary, recipients);
      }

      console.log(`✅ New order alert sent for ${order.order_number} to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error('Error in sendNewOrderAlert:', error);
    }
  }

  /**
   * Get user IDs who should receive new order notifications
   */
  private static async getNotificationRecipients(branchId?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('users')
        .select('id, role')
        .eq('is_active', true)
        .in('role', ['super-admin', 'admin', 'manager', 'owner', 'cashier_lead']);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: users, error } = await query;

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
   * Send new order email notification
   */
  private static async sendNewOrderEmail(
    order: OrderData,
    itemsSummary: string,
    recipientUserIds: string[]
  ): Promise<void> {
    try {
      // Get email addresses for recipients
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', recipientUserIds)
        .eq('is_active', true);

      if (error || !users || users.length === 0) {
        console.error('Error fetching user emails:', error);
        return;
      }

      // Get manager email for BCC if enabled
      const managerEmail = await notificationSettingsService.getManagerEmail();
      const bccEnabled = await notificationSettingsService.isBccManagerEnabled();

      const orderDate = new Date(order.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      // Send email to each recipient
      for (const user of users) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">🛒 New Order Received</h2>
              <p>Hello ${user.first_name || 'there'},</p>
              <p>A new order has been received and requires your attention:</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Order Number:</strong> ${order.order_number}</p>
                <p><strong>Customer:</strong> ${order.customer_name || 'Guest'}</p>
                <p><strong>Order Type:</strong> ${order.order_type}</p>
                <p><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">₱${order.total_amount.toFixed(2)}</span></p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Items:</strong> ${itemsSummary}</p>
              </div>
              <p>
                <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${order.id}" 
                   style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  View Order Details
                </a>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                This is an automated notification from your order management system.
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
              subject: `🛒 New Order: ${order.order_number} - ₱${order.total_amount.toFixed(2)}`,
              html: emailHtml,
              type: 'new_order_alert',
              bcc: bccEnabled && managerEmail ? [managerEmail] : undefined
            })
          });

          if (!response.ok) {
            console.warn(`Failed to send email to ${user.email}:`, response.statusText);
          } else {
            console.log(`✅ New order email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in sendNewOrderEmail:', error);
    }
  }
}

export default NewOrderAlertService;






