import { supabase } from './supabase';
import { customAuth } from './customAuth';

/**
 * Activity Logger Service
 * 
 * Provides a centralized way to log user activities throughout the application.
 * All activities are recorded in the `user_activity` table for monitoring and auditing.
 * 
 * Features:
 * - Automatic user and session detection
 * - IP address and user agent capture
 * - Module and action type tracking
 * - Metadata storage for additional context
 * - Non-blocking error handling (won't break the app if logging fails)
 */

export interface LogActivityParams {
  /**
   * Type of activity being logged
   * Examples: 'login_success', 'login_failed', 'create', 'update', 'delete', 'view', 'export'
   */
  activityType: string;
  
  /**
   * Human-readable description of the activity
   * Example: 'Created product: Widget A'
   */
  description?: string;
  
  /**
   * Module where the activity occurred
   * Must be one of: 'Dashboard', 'Inventory', 'Sales', 'Reports', 'Staff', 'Marketing', 'Settings'
   */
  module?: 'Dashboard' | 'Inventory' | 'Sales' | 'Reports' | 'Staff' | 'Marketing' | 'Settings';
  
  /**
   * Additional metadata to store with the activity
   * Can include entity_id, entity_type, old_values, new_values, etc.
   */
  metadata?: Record<string, any>;
  
  /**
   * Page URL where the activity occurred
   * Defaults to window.location.pathname if not provided
   */
  pageUrl?: string;
  
  /**
   * Entity ID affected by this activity (e.g., product ID, order ID)
   */
  entityId?: string;
  
  /**
   * Type of entity affected (e.g., 'product', 'order', 'customer')
   */
  entityType?: string;
  
  /**
   * Previous state (for update/delete operations)
   */
  oldValues?: Record<string, any>;
  
  /**
   * New state (for create/update operations)
   */
  newValues?: Record<string, any>;
}

/**
 * Get client IP address
 * Uses a free IP detection service as fallback
 */
async function getClientIP(): Promise<string | null> {
  try {
    // Try to get IP from a free service
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
  } catch (error) {
    // Silently fail - IP detection is optional
    console.debug('Could not fetch IP address:', error);
  }
  
  return null;
}

/**
 * Activity Logger Class
 */
class ActivityLoggerService {
  /**
   * Log a user activity
   * 
   * This method is non-blocking and will not throw errors.
   * If logging fails, it will be logged to console but won't break the application.
   * 
   * @param params - Activity parameters
   * @returns Promise that resolves when logging is complete (or failed silently)
   */
  async logActivity(params: LogActivityParams): Promise<void> {
    try {
      // Get current user
      const user = customAuth.getCurrentUser();
      if (!user) {
        console.debug('ActivityLogger: No user found, skipping activity log');
        return;
      }

      // Get current session
      const session = customAuth.getCurrentSession();
      const sessionId = session?.id || null;

      // Get IP address (non-blocking)
      const ipAddress = await getClientIP().catch(() => null);

      // Get user agent
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      // Get page URL
      const pageUrl = params.pageUrl || (typeof window !== 'undefined' ? window.location.pathname : null);

      // Build metadata object
      const metadata: Record<string, any> = {
        ...(params.metadata || {}),
        ...(params.module && { module: params.module }),
        ...(params.entityId && { entity_id: params.entityId }),
        ...(params.entityType && { entity_type: params.entityType }),
        ...(params.oldValues && { old_values: params.oldValues }),
        ...(params.newValues && { new_values: params.newValues }),
      };

      // Insert activity record
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: params.activityType,
          description: params.description || null,
          page_url: pageUrl,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        });

      if (error) {
        // Log error but don't throw - activity logging should not break the app
        console.error('ActivityLogger: Failed to log activity:', error);
        return;
      }

      console.debug('ActivityLogger: Activity logged successfully', {
        activityType: params.activityType,
        module: params.module,
        userId: user.id
      });
    } catch (error) {
      // Catch any unexpected errors and log them without breaking the app
      console.error('ActivityLogger: Unexpected error logging activity:', error);
    }
  }

  /**
   * Log a login success activity
   * 
   * @param loginMethod - Method used for login ('password', 'mfa', 'sso')
   * @param mfaUsed - Whether MFA was used
   */
  async logLoginSuccess(loginMethod: 'password' | 'mfa' | 'sso' = 'password', mfaUsed: boolean = false): Promise<void> {
    await this.logActivity({
      activityType: 'login_success',
      description: `User logged in successfully using ${loginMethod}${mfaUsed ? ' with MFA' : ''}`,
      module: 'Dashboard',
      metadata: {
        login_method: loginMethod,
        mfa_used: mfaUsed
      }
    });
  }

  /**
   * Log a login failure activity
   * 
   * @param email - Email address that attempted to login
   * @param reason - Reason for failure (optional)
   */
  async logLoginFailure(email: string, reason?: string): Promise<void> {
    await this.logActivity({
      activityType: 'login_failed',
      description: `Failed login attempt for ${email}${reason ? `: ${reason}` : ''}`,
      module: 'Dashboard',
      metadata: {
        attempted_email: email,
        failure_reason: reason || 'Invalid credentials'
      }
    });
  }

  /**
   * Log a create activity
   * 
   * @param entityType - Type of entity created (e.g., 'product', 'order')
   * @param entityId - ID of the created entity
   * @param description - Description of what was created
   * @param module - Module where creation occurred
   * @param newValues - Values of the created entity
   */
  async logCreate(
    entityType: string,
    entityId: string,
    description: string,
    module: LogActivityParams['module'],
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      activityType: 'create',
      description,
      module,
      entityId,
      entityType,
      newValues
    });
  }

  /**
   * Log an update activity
   * 
   * @param entityType - Type of entity updated (e.g., 'product', 'order')
   * @param entityId - ID of the updated entity
   * @param description - Description of what was updated
   * @param module - Module where update occurred
   * @param oldValues - Previous values
   * @param newValues - New values
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    description: string,
    module: LogActivityParams['module'],
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      activityType: 'update',
      description,
      module,
      entityId,
      entityType,
      oldValues,
      newValues
    });
  }

  /**
   * Log a delete activity
   * 
   * @param entityType - Type of entity deleted (e.g., 'product', 'order')
   * @param entityId - ID of the deleted entity
   * @param description - Description of what was deleted
   * @param module - Module where deletion occurred
   * @param oldValues - Values of the deleted entity
   */
  async logDelete(
    entityType: string,
    entityId: string,
    description: string,
    module: LogActivityParams['module'],
    oldValues?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      activityType: 'delete',
      description,
      module,
      entityId,
      entityType,
      oldValues
    });
  }

  /**
   * Log a view activity
   * 
   * @param entityType - Type of entity viewed (e.g., 'product', 'report')
   * @param entityId - ID of the viewed entity (optional)
   * @param description - Description of what was viewed
   * @param module - Module where view occurred
   */
  async logView(
    entityType: string,
    description: string,
    module: LogActivityParams['module'],
    entityId?: string
  ): Promise<void> {
    await this.logActivity({
      activityType: 'view',
      description,
      module,
      entityId,
      entityType
    });
  }

  /**
   * Log an export activity
   * 
   * @param exportType - Type of export (e.g., 'report', 'data')
   * @param description - Description of what was exported
   * @param module - Module where export occurred
   * @param metadata - Additional export metadata (format, filters, etc.)
   */
  async logExport(
    exportType: string,
    description: string,
    module: LogActivityParams['module'],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      activityType: 'export',
      description,
      module,
      metadata: {
        export_type: exportType,
        ...metadata
      }
    });
  }
}

// Export singleton instance
export const activityLogger = new ActivityLoggerService();

// Export default for convenience
export default activityLogger;




