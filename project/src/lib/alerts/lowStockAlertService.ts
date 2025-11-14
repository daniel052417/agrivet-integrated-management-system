// lib/alerts/lowStockAlertService.ts
import { supabase } from '../supabase';
import { notificationSettingsService } from '../notificationSettingsService';
import UserNotificationsService from '../userNotificationsService';

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  sku?: string;
}

class LowStockAlertService {
  /**
   * Check and send low stock alert for a product
   */
  static async checkAndSendLowStockAlert(productId: string): Promise<void> {
    try {
      // 1. Check if low stock alerts are enabled
      const isEnabled = await notificationSettingsService.isAlertEnabled('lowStock');
      if (!isEnabled) {
        console.log('📧 Low stock alerts are disabled in settings');
        return;
      }

      // 2. Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold, sku')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Error fetching product:', productError);
        return;
      }

      // 3. Check if stock is actually below threshold
      const threshold = product.low_stock_threshold || 10; // Default threshold
      if (product.stock_quantity > threshold) {
        console.log(`Product ${product.name} stock (${product.stock_quantity}) is above threshold (${threshold})`);
        return;
      }

      // 4. Get users who should receive notifications (owner, manager)
      const recipients = await this.getNotificationRecipients();

      if (recipients.length === 0) {
        console.warn('No recipients found for low stock alert');
        return;
      }

      // 5. Create in-app notifications for all recipients
      const notificationData = {
        title: `Low Stock Alert: ${product.name}`,
        message: `${product.name} (SKU: ${product.sku || 'N/A'}) is running low. Current stock: ${product.stock_quantity}, Threshold: ${threshold}`,
        type: 'low_stock' as const,
        priority: product.stock_quantity === 0 ? 'critical' as const : 'high' as const,
        action_url: `/inventory/products/${productId}`,
        metadata: {
          product_id: productId,
          product_name: product.name,
          current_stock: product.stock_quantity,
          threshold: threshold,
          sku: product.sku
        }
      };

      await UserNotificationsService.createNotificationsForUsers(recipients, notificationData);

      // 6. Send email notifications if enabled
      const emailEnabled = await notificationSettingsService.isEmailNotificationsEnabled();
      if (emailEnabled) {
        await this.sendLowStockEmail(product, recipients);
      }

      console.log(`✅ Low stock alert sent for ${product.name} to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error('Error in checkAndSendLowStockAlert:', error);
    }
  }

  /**
   * Get user IDs who should receive low stock notifications
   */
  private static async getNotificationRecipients(): Promise<string[]> {
    try {
      // Get owner and manager users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('is_active', true)
        .in('role', ['super-admin', 'admin', 'manager', 'owner']);

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
   * Send low stock email notification
   */
  private static async sendLowStockEmail(
    product: LowStockProduct,
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

      const threshold = product.low_stock_threshold || 10;
      const isCritical = product.stock_quantity === 0;

      // Get manager email for BCC if enabled
      const managerEmail = await notificationSettingsService.getManagerEmail();
      const bccEnabled = await notificationSettingsService.isBccManagerEnabled();

      // Send email to each recipient using Edge Function
      for (const user of users) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${isCritical ? '#dc2626' : '#ea580c'};">
                ${isCritical ? '🚨 Critical Stock Alert' : '⚠️ Low Stock Alert'}
              </h2>
              <p>Hello ${user.first_name || 'there'},</p>
              <p>The following product is running low on stock:</p>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                <p><strong>Current Stock:</strong> <span style="color: ${isCritical ? '#dc2626' : '#ea580c'}; font-weight: bold;">${product.stock_quantity}</span></p>
                <p><strong>Threshold:</strong> ${threshold}</p>
              </div>
              ${isCritical 
                ? '<p style="color: #dc2626; font-weight: bold;">⚠️ This product is OUT OF STOCK and needs immediate attention!</p>'
                : '<p>Please consider restocking this item soon.</p>'
              }
              <p>
                <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/inventory/products/${product.id}" 
                   style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                  View Product Details
                </a>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                This is an automated notification from your inventory management system.
              </p>
            </div>
          `;

          // Use Supabase Edge Function to send email
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              to: user.email,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
              subject: isCritical 
                ? `🚨 CRITICAL: ${product.name} is out of stock!` 
                : `⚠️ Low Stock Alert: ${product.name}`,
              html: emailHtml,
              type: 'low_stock_alert',
              bcc: bccEnabled && managerEmail ? [managerEmail] : undefined
            })
          });

          if (!response.ok) {
            console.warn(`Failed to send email to ${user.email}:`, response.statusText);
          } else {
            console.log(`✅ Low stock email sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in sendLowStockEmail:', error);
    }
  }

  /**
   * Batch check multiple products for low stock
   */
  static async checkMultipleProducts(productIds: string[]): Promise<void> {
    for (const productId of productIds) {
      await this.checkAndSendLowStockAlert(productId);
    }
  }
}

export default LowStockAlertService;

