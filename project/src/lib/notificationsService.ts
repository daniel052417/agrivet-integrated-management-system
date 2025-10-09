import { supabase } from './supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reward' | 'loyalty' | 'promotion' | 'welcome' | 'transaction' | 'system' | 'marketing';
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  target_type: 'all_customers' | 'loyal_customers' | 'new_customers' | 'vip_customers' | 'specific_customers' | 'segments';
  target_value?: string;
  scheduled_at?: string;
  sent_at?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  template_id?: string;
  campaign_id?: string;
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject?: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'welcome' | 'loyalty' | 'promotion' | 'transaction' | 'system' | 'marketing';
  status: 'active' | 'inactive' | 'draft';
  variables?: any;
  usage_count: number;
  last_used?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  customer_id: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

export interface NotificationOverview {
  total: number;
  sent: number;
  scheduled: number;
  failed: number;
  byType: { [key: string]: number };
  byChannel: { [key: string]: number };
  byPriority: { [key: string]: number };
  sentToday: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  channel?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class NotificationsService {
  /**
   * Get all notifications with filtering and pagination
   */
  static async getNotifications(filters: NotificationFilters = {}): Promise<{ data: Notification[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        channel,
        priority,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (channel) {
        query = query.eq('channel', channel);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: notifications, error, count } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return {
        data: notifications || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  }

  /**
   * Get a specific notification by ID
   */
  static async getNotification(id: string): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_templates(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching notification:', error);
        throw new Error(`Failed to fetch notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      console.error('Error in getNotification:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Update a notification
   */
  static async updateNotification(id: string, updateData: Partial<Notification>): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification:', error);
        throw new Error(`Failed to update notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      console.error('Error in updateNotification:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Send a notification
   */
  static async sendNotification(id: string): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error sending notification:', error);
        throw new Error(`Failed to send notification: ${error.message}`);
      }

      // Here you would implement the actual sending logic
      // For now, we'll just simulate it
      console.log(`Sending notification ${id} via ${notification.channel}`);

      return notification;
    } catch (error) {
      console.error('Error in sendNotification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(notificationId: string): Promise<NotificationStats> {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_notification_stats', { notification_uuid: notificationId });

      if (error) {
        console.error('Error fetching notification stats:', error);
        throw new Error(`Failed to fetch notification statistics: ${error.message}`);
      }

      return stats?.[0] || {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        open_rate: 0,
        click_rate: 0
      };
    } catch (error) {
      console.error('Error in getNotificationStats:', error);
      throw error;
    }
  }

  /**
   * Get notifications overview statistics
   */
  static async getNotificationOverview(): Promise<NotificationOverview> {
    try {
      const { data: stats, error } = await supabase
        .from('notifications')
        .select('status, type, channel, priority, sent_at');

      if (error) {
        console.error('Error fetching notification overview:', error);
        throw new Error(`Failed to fetch notification overview: ${error.message}`);
      }

      const overview = {
        total: stats?.length || 0,
        sent: stats?.filter(n => n.status === 'sent').length || 0,
        scheduled: stats?.filter(n => n.status === 'scheduled').length || 0,
        failed: stats?.filter(n => n.status === 'failed').length || 0,
        byType: stats?.reduce((acc, notification) => {
          acc[notification.type] = (acc[notification.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        byChannel: stats?.reduce((acc, notification) => {
          acc[notification.channel] = (acc[notification.channel] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        byPriority: stats?.reduce((acc, notification) => {
          acc[notification.priority] = (acc[notification.priority] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {},
        sentToday: stats?.filter(n => 
          n.sent_at && new Date(n.sent_at).toDateString() === new Date().toDateString()
        ).length || 0
      };

      return overview;
    } catch (error) {
      console.error('Error in getNotificationOverview:', error);
      throw error;
    }
  }

  /**
   * Get notification templates
   */
  static async getTemplates(filters: NotificationFilters = {}): Promise<{ data: NotificationTemplate[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        status,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let query = supabase
        .from('notification_templates')
        .select('*', { count: 'exact' });

      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: templates, error, count } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return {
        data: templates || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  }

  /**
   * Create a notification template
   */
  static async createTemplate(templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const { data: template, error } = await supabase
        .from('notification_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return template;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update a notification template
   */
  static async updateTemplate(id: string, updateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const { data: template, error } = await supabase
        .from('notification_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return template;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }

  /**
   * Delete a notification template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }

  /**
   * Track notification delivery
   */
  static async trackDelivery(deliveryData: Partial<NotificationDelivery>): Promise<NotificationDelivery> {
    try {
      const { data: delivery, error } = await supabase
        .from('notification_deliveries')
        .insert(deliveryData)
        .select()
        .single();

      if (error) {
        console.error('Error tracking delivery:', error);
        throw new Error(`Failed to track delivery: ${error.message}`);
      }

      return delivery;
    } catch (error) {
      console.error('Error in trackDelivery:', error);
      throw error;
    }
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(deliveryId: string, status: string, metadata?: any): Promise<NotificationDelivery> {
    try {
      const updateData: any = { status };
      
      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'opened') {
        updateData.opened_at = new Date().toISOString();
      } else if (status === 'clicked') {
        updateData.clicked_at = new Date().toISOString();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { data: delivery, error } = await supabase
        .from('notification_deliveries')
        .update(updateData)
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating delivery status:', error);
        throw new Error(`Failed to update delivery status: ${error.message}`);
      }

      return delivery;
    } catch (error) {
      console.error('Error in updateDeliveryStatus:', error);
      throw error;
    }
  }

  /**
   * Get delivery statistics for a notification
   */
  static async getDeliveryStats(notificationId: string): Promise<NotificationStats> {
    try {
      const { data: deliveries, error } = await supabase
        .from('notification_deliveries')
        .select('status')
        .eq('notification_id', notificationId);

      if (error) {
        console.error('Error fetching delivery stats:', error);
        throw new Error(`Failed to fetch delivery statistics: ${error.message}`);
      }

      const stats = {
        total_sent: deliveries?.length || 0,
        total_delivered: deliveries?.filter(d => d.status === 'delivered' || d.status === 'opened' || d.status === 'clicked').length || 0,
        total_opened: deliveries?.filter(d => d.status === 'opened' || d.status === 'clicked').length || 0,
        total_clicked: deliveries?.filter(d => d.status === 'clicked').length || 0,
        open_rate: 0,
        click_rate: 0
      };

      if (stats.total_delivered > 0) {
        stats.open_rate = parseFloat(((stats.total_opened / stats.total_delivered) * 100).toFixed(2));
        stats.click_rate = parseFloat(((stats.total_clicked / stats.total_delivered) * 100).toFixed(2));
      }

      return stats;
    } catch (error) {
      console.error('Error in getDeliveryStats:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification
   */
  static async scheduleNotification(id: string, scheduledAt: string): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          status: 'scheduled',
          scheduled_at: scheduledAt
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error scheduling notification:', error);
        throw new Error(`Failed to schedule notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      console.error('Error in scheduleNotification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(id: string): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          status: 'cancelled'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling notification:', error);
        throw new Error(`Failed to cancel notification: ${error.message}`);
      }

      return notification;
    } catch (error) {
      console.error('Error in cancelNotification:', error);
      throw error;
    }
  }
}

export default NotificationsService;
