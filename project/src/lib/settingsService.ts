// lib/settingsService.ts
import { supabaseService } from './supabase';
import { simplifiedAuth } from './simplifiedAuth';

interface HRSettings {
  enable_deduction_for_absences: boolean;
  enable_overtime_tracking: boolean;
  auto_mark_late_employees: boolean;
  late_threshold_minutes: number;
  include_allowance_in_pay: boolean;
  enable_tax_computation: boolean;
  include_sss_deductions: boolean;
  include_philhealth_deductions: boolean;
  include_pagibig_deductions: boolean;
  payroll_period: string;
  enable_leave_management: boolean;
  max_leave_days_per_month: number;
  require_leave_approval: boolean;
  enable_hr_reports_dashboard: boolean;
  include_attendance_summary: boolean;
  enable_performance_reviews: boolean;
  enable_employee_self_service: boolean;
}

class SettingsService {
  private static instance: SettingsService;
  private cachedSettings: any = null;
  private cacheTimestamp: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async getSettings(): Promise<any> {
    // Check if cache is still valid
    const now = Date.now();
    if (this.cachedSettings && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached settings');
      return this.cachedSettings;
    }

    // Fetch from database (system_settings table)
    try {
      console.log('🔄 Fetching fresh settings from database (system_settings)...');
      const { data, error } = await supabaseService
        .from('system_settings')
        .select('value')
        .eq('key', 'app_settings')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return this.getDefaultSettings();
      }

      if (data && data.value) {
        this.cachedSettings = data.value;
        this.cacheTimestamp = now;
        console.log('✅ Settings loaded and cached');
        return data.value;
      }

      // Return defaults if nothing found
      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Determine a valid user ID to use for updated_by
  private async getUpdaterUserId(): Promise<string> {
    // 1) Try in-memory authenticated user
    const current = simplifiedAuth.getCurrentUser();
    if (current?.id) return current.id;

    // 2) Try env-provided default user id
    const fallbackEnv = (import.meta as any)?.env?.VITE_DEFAULT_UPDATED_BY as string | undefined;
    if (fallbackEnv) return fallbackEnv;

    // 3) Query a privileged user from users table
    // Try super-admin/admin roles first
    const rolesToTry = ['super-admin', 'admin'];
    for (const role of rolesToTry) {
      const { data, error } = await supabaseService
        .from('users')
        .select('id')
        .eq('is_active', true as any)
        .eq('role', role)
        .order('last_login', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) return data.id as string;
    }

    // 4) Fallback: any active user
    {
      const { data, error } = await supabaseService
        .from('users')
        .select('id')
        .eq('is_active', true as any)
        .order('last_login', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) return data.id as string;
    }

    // 5) Final fallback: any user
    {
      const { data, error } = await supabaseService
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) return data.id as string;
    }

    throw new Error('No authenticated user found for updated_by (public.users)');
  }

  // Alias for getSettings to match component expectations
  async getAllSettings(): Promise<any> {
    return this.getSettings();
  }

  async updateSettings(newSettings: Partial<any>): Promise<boolean> {
    try {
      console.log('🔄 Updating settings in database (system_settings)...');

      // Get current settings first
      const currentSettings = await this.getSettings();

      // Merge with new settings (shallow merge)
      const mergedSettings = { ...currentSettings, ...newSettings };

      // Determine updater user id using multiple strategies
      const updatedBy = await this.getUpdaterUserId();

      // Upsert into system_settings with conflict on key
      const { error } = await supabaseService
        .from('system_settings')
        .upsert(
          [{
            key: 'app_settings',
            value: mergedSettings,
            description: 'Main application settings',
            is_public: false,
            updated_by: updatedBy,
          }],
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }

      // Clear cache to force fresh fetch on next request
      this.clearCache();
      console.log('✅ Settings updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }


  async getHRSettings(): Promise<HRSettings> {
    const allSettings = await this.getSettings();
    
    return {
      enable_deduction_for_absences: allSettings?.enable_deduction_for_absences ?? true,
      enable_overtime_tracking: allSettings?.enable_overtime_tracking ?? true,
      auto_mark_late_employees: allSettings?.auto_mark_late_employees ?? true,
      late_threshold_minutes: allSettings?.late_threshold_minutes ?? 15,
      include_allowance_in_pay: allSettings?.include_allowance_in_pay ?? true,
      enable_tax_computation: allSettings?.enable_tax_computation ?? true,
      include_sss_deductions: allSettings?.include_sss_deductions ?? true,
      include_philhealth_deductions: allSettings?.include_philhealth_deductions ?? true,
      include_pagibig_deductions: allSettings?.include_pagibig_deductions ?? true,
      payroll_period: allSettings?.payroll_period ?? 'semi-monthly',
      enable_leave_management: allSettings?.enable_leave_management ?? true,
      max_leave_days_per_month: allSettings?.max_leave_days_per_month ?? 2,
      require_leave_approval: allSettings?.require_leave_approval ?? true,
      enable_hr_reports_dashboard: allSettings?.enable_hr_reports_dashboard ?? true,
      include_attendance_summary: allSettings?.include_attendance_summary ?? true,
      enable_performance_reviews: allSettings?.enable_performance_reviews ?? false,
      enable_employee_self_service: allSettings?.enable_employee_self_service ?? true,
    };
  }

  // Clear cache when settings are updated
  clearCache() {
    console.log('🗑️ Settings cache cleared');
    this.cachedSettings = null;
    this.cacheTimestamp = 0;
  }

  private getDefaultSettings() {
    console.log('⚠️ Using default settings');
    return {
      // HR Settings Defaults
      enable_deduction_for_absences: true,
      enable_overtime_tracking: true,
      auto_mark_late_employees: true,
      late_threshold_minutes: 15,
      include_allowance_in_pay: true,
      enable_tax_computation: true,
      include_sss_deductions: true,
      include_philhealth_deductions: true,
      include_pagibig_deductions: true,
      payroll_period: 'semi-monthly',
      enable_leave_management: true,
      max_leave_days_per_month: 2,
      require_leave_approval: true,
      enable_hr_reports_dashboard: true,
      include_attendance_summary: true,
      enable_performance_reviews: false,
      enable_employee_self_service: true,
      
      // General Settings Defaults
      app_name: 'AGRIVET Admin Dashboard',
      company_name: 'AGRIVET Supply Co.',
      contact_email: 'admin@agrivet.com',
      support_phone: '+63 2 8123 4567',
      company_address: '123 Business St, Manila, Philippines',
      brand_color: '#3B82F6',
      currency: 'PHP',
      auto_save: true,
      show_tooltips: true,
      compact_view: false,
      items_per_page: 25,
      date_format: 'YYYY-MM-DD',
      receipt_header: 'Thank you for your business!',
      receipt_footer: 'Visit us again soon!',
      default_branch: 'main',
      selected_timezone: 'Asia/Manila',
      selected_theme: 'light',
      selected_language: 'en',
      
      // Security Settings Defaults
      session_timeout: 30,
      require_2fa: false,
      password_min_length: 8,
      password_require_special: true,
      password_expiration: 90,
      login_attempts: 5,
      lockout_duration: 15,
      ip_whitelist: [],
      ip_banlist: [],
      audit_log_visibility: true,
      
      // Notification Settings Defaults
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      low_stock_alerts: true,
      sales_alerts: true,
      system_alerts: true,
      new_order_alerts: true,
      staff_activity_alerts: true,
      bcc_manager: true,
      manager_email: 'manager@agrivet.com',
      
      // Data Settings Defaults
      backup_frequency: 'daily',
      retention_period: 365,
      data_encryption: true,
      audit_logging: true,
      export_format: 'csv',
      auto_backup: true,
      backup_location: 'cloud',
      
      // PWA Settings Defaults
      pwa_name: 'Agrivet Kiosk',
      pwa_theme: 'dark-green',
      pwa_logo: null,
      online_ordering_enabled: true,
      default_branch_for_orders: 'main',
      delivery_enabled: true,
      pickup_enabled: true,
      maintenance_mode: false,
      push_notifications_enabled: true,
      pwa_version: '1.0.5',
    };
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export default settingsService;