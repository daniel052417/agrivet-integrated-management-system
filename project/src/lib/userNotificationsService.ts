// lib/userNotificationsService.ts
import { supabase } from './supabase';
import PushNotificationService from './pushNotificationService';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'new_order' | 'system' | 'daily_summary' | 'attendance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: any;
  created_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'new_order' | 'system' | 'daily_summary' | 'attendance';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  action_url?: string | null;
  metadata?: any;
}

class UserNotificationsService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(data: CreateNotificationData): Promise<UserNotification> {
    try {
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          action_url: data.action_url || null,
          metadata: data.metadata || null,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      // Send push notification if enabled
      try {
        await PushNotificationService.sendNotificationFromUserNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          action_url: notification.action_url
        });
      } catch (pushError) {
        // Don't fail notification creation if push fails
        console.warn('Failed to send push notification:', pushError);
      }

      return notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createNotificationsForUsers(
    userIds: string[],
    notificationData: Omit<CreateNotificationData, 'user_id'>
  ): Promise<UserNotification[]> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || 'medium',
        action_url: notificationData.action_url || null,
        metadata: notificationData.metadata || null,
        is_read: false
      }));

      const { data, error } = await supabase
        .from('user_notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error creating notifications:', error);
        throw new Error(`Failed to create notifications: ${error.message}`);
      }

      // Send push notifications for each notification
      if (data && data.length > 0) {
        for (const notification of data) {
          try {
            await PushNotificationService.sendNotificationFromUserNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
              action_url: notification.action_url
            });
          } catch (pushError) {
            // Don't fail notification creation if push fails
            console.warn('Failed to send push notification:', pushError);
          }
        }
      }

      return data || [];
    } catch (error) {
      console.error('Error in createNotificationsForUsers:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user
   */
  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
      priority?: string;
    } = {}
  ): Promise<UserNotification[]> {
    try {
      const { limit = 50, unreadOnly = false, type, priority } = options;

      let query = supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

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
   * Delete all read notifications for a user
   */
  static async deleteAllRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) {
        console.error('Error deleting read notifications:', error);
        throw new Error(`Failed to delete read notifications: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteAllRead:', error);
      throw error;
    }
  }
}

export default UserNotificationsService;

