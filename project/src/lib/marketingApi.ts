import { supabase } from './supabase';
import { 
  MarketingCampaign, 
  CampaignTemplate, 
  CampaignFormData, 
  CampaignAPIResponse, 
  CampaignListResponse,
  CampaignFilters,
  CampaignAnalytics,
  CampaignSchedule,
  CampaignAnalyticsResponse,
  ImageUploadResponse,
  ImageUploadOptions,
  ClientNotification,
  NotificationTemplate,
  CampaignValidationErrors
} from '../types/marketing';

// ============================================================================
// CAMPAIGN MANAGEMENT API
// ============================================================================

export const getCampaigns = async (
  filters: CampaignFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<CampaignAPIResponse<CampaignListResponse>> => {
  try {
    let query = supabase
      .from('marketing_campaigns')
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles),
        users!marketing_campaigns_created_by_fkey(first_name, last_name, email)
      `);

    // Apply filters
    if (filters.template_type) {
      query = query.eq('template_type', filters.template_type);
    }
    if (filters.status) {
      query = query.eq('is_active', filters.status === 'active');
    }
    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`campaign_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        campaigns: data || [],
        total: count || 0,
        page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns'
    };
  }
};

export const getCampaignById = async (id: string): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles, required_fields),
        users!marketing_campaigns_created_by_fkey(first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaign'
    };
  }
};

export const createCampaign = async (campaignData: CampaignFormData): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const campaign = {
      campaign_name: campaignData.campaign_name,
      template_id: campaignData.template_id,
      template_type: campaignData.template_type,
      title: campaignData.title,
      description: campaignData.description,
      content: campaignData.content,
      background_color: campaignData.background_color,
      text_color: campaignData.text_color,
      image_url: campaignData.image_url,
      image_alt_text: campaignData.image_alt_text,
      cta_text: campaignData.cta_text,
      cta_url: campaignData.cta_url,
      cta_button_color: campaignData.cta_button_color,
      cta_text_color: campaignData.cta_text_color,
      target_audience: campaignData.target_audience || [],
      target_channels: campaignData.target_channels || [],
      is_active: campaignData.is_active,
      publish_date: campaignData.publish_date,
      unpublish_date: campaignData.unpublish_date,
      created_by: user.id,
      updated_by: user.id
    };

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert([campaign])
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('create', 'marketing_campaigns', data.id, null, campaign);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign'
    };
  }
};

export const updateCampaign = async (id: string, campaignData: Partial<CampaignFormData>): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get old values for audit log
    const { data: oldData } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    const updateData = {
      ...campaignData,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('update', 'marketing_campaigns', id, oldData, updateData);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign'
    };
  }
};

export const deleteCampaign = async (id: string): Promise<CampaignAPIResponse<boolean>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get old values for audit log
    const { data: oldData } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the action
    await logAuditAction('delete', 'marketing_campaigns', id, oldData, null);

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign'
    };
  }
};

export const duplicateCampaign = async (id: string): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the original campaign
    const { data: originalCampaign, error: fetchError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Create a duplicate with modified name
    const duplicateData = {
      ...originalCampaign,
      id: undefined, // Let database generate new ID
      campaign_name: `${originalCampaign.campaign_name} (Copy)`,
      is_published: false,
      publish_date: null,
      unpublish_date: null,
      views_count: 0,
      clicks_count: 0,
      conversions_count: 0,
      created_by: user.id,
      updated_by: user.id,
      created_at: undefined,
      updated_at: undefined
    };

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert([duplicateData])
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('duplicate', 'marketing_campaigns', data.id, originalCampaign, duplicateData);

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error duplicating campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate campaign'
    };
  }
};

// ============================================================================
// CAMPAIGN PUBLISHING & STATUS MANAGEMENT
// ============================================================================

export const publishCampaign = async (id: string): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_published: true,
        publish_date: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('publish', 'marketing_campaigns', id, null, { is_published: true, publish_date: data.publish_date });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error publishing campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish campaign'
    };
  }
};

export const unpublishCampaign = async (id: string): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_published: false,
        unpublish_date: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('unpublish', 'marketing_campaigns', id, null, { is_published: false, unpublish_date: data.unpublish_date });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error unpublishing campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unpublish campaign'
    };
  }
};

export const toggleCampaignStatus = async (id: string, isActive: boolean): Promise<CampaignAPIResponse<MarketingCampaign>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        is_active: isActive,
        updated_by: user.id
      })
      .eq('id', id)
      .select(`
        *,
        campaign_templates!inner(template_name, template_type, default_styles)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await logAuditAction('toggle_status', 'marketing_campaigns', id, null, { is_active: isActive });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error toggling campaign status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle campaign status'
    };
  }
};

// ============================================================================
// TEMPLATE MANAGEMENT API
// ============================================================================

export const getCampaignTemplates = async (): Promise<CampaignAPIResponse<CampaignTemplate[]>> => {
  try {
    const { data, error } = await supabase
      .from('campaign_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching campaign templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch templates'
    };
  }
};

export const createTemplate = async (templateData: Partial<CampaignTemplate>): Promise<CampaignAPIResponse<CampaignTemplate>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const template = {
      ...templateData,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('campaign_templates')
      .insert([template])
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error creating template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template'
    };
  }
};

export const updateTemplate = async (id: string, templateData: Partial<CampaignTemplate>): Promise<CampaignAPIResponse<CampaignTemplate>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('campaign_templates')
      .update(templateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error updating template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template'
    };
  }
};

export const deleteTemplate = async (id: string): Promise<CampaignAPIResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('campaign_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template'
    };
  }
};

// ============================================================================
// ANALYTICS & TRACKING API
// ============================================================================

export const trackEvent = async (campaignId: string, eventType: string, eventData: any = {}): Promise<CampaignAPIResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('campaign_analytics')
      .insert([{
        campaign_id: campaignId,
        event_type: eventType,
        event_data: eventData,
        user_agent: navigator.userAgent,
        device_type: getDeviceType()
      }]);

    if (error) throw error;

    // Update campaign metrics
    await updateCampaignMetrics(campaignId, eventType);

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error tracking event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track event'
    };
  }
};

export const getCampaignAnalytics = async (campaignId: string, dateRange: string = '7d'): Promise<CampaignAPIResponse<CampaignAnalyticsResponse>> => {
  try {
    const { data, error } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const analytics = calculateAnalytics(data || []);
    const dailyStats = calculateDailyStats(data || [], dateRange);

    return {
      success: true,
      data: {
        campaign_id: campaignId,
        total_views: analytics.views,
        total_clicks: analytics.clicks,
        total_conversions: analytics.conversions,
        click_through_rate: analytics.ctr,
        conversion_rate: analytics.conversionRate,
        daily_stats: dailyStats
      }
    };
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    };
  }
};

export const getDashboardMetrics = async (): Promise<CampaignAPIResponse<any>> => {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('marketing_campaigns')
      .select('id, campaign_name, template_type, is_active, is_published, views_count, clicks_count, conversions_count, created_at');

    if (campaignsError) throw campaignsError;

    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('event_type, created_at');

    if (analyticsError) throw analyticsError;

    const metrics = calculateDashboardMetrics(campaigns || [], analytics || []);

    return {
      success: true,
      data: metrics
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics'
    };
  }
};

// ============================================================================
// NOTIFICATION SYSTEM API
// ============================================================================

export const getNotifications = async (): Promise<CampaignAPIResponse<ClientNotification[]>> => {
  try {
    const { data, error } = await supabase
      .from('client_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications'
    };
  }
};

export const createNotification = async (notificationData: Partial<ClientNotification>): Promise<CampaignAPIResponse<ClientNotification>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const notification = {
      ...notificationData,
      created_by: user.id
    };

    const { data, error } = await supabase
      .from('client_notifications')
      .insert([notification])
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification'
    };
  }
};

export const sendNotification = async (id: string): Promise<CampaignAPIResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('client_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Here you would integrate with actual email/push notification services
    // For now, we'll just update the status

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    };
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
};

const updateCampaignMetrics = async (campaignId: string, eventType: string): Promise<void> => {
  try {
    const { data: campaign } = await supabase
      .from('marketing_campaigns')
      .select('views_count, clicks_count, conversions_count')
      .eq('id', campaignId)
      .single();

    if (!campaign) return;

    const updates: any = {};
    switch (eventType) {
      case 'view':
        updates.views_count = (campaign.views_count || 0) + 1;
        break;
      case 'click':
        updates.clicks_count = (campaign.clicks_count || 0) + 1;
        break;
      case 'conversion':
        updates.conversions_count = (campaign.conversions_count || 0) + 1;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('marketing_campaigns')
        .update(updates)
        .eq('id', campaignId);
    }
  } catch (error) {
    console.error('Error updating campaign metrics:', error);
  }
};

const calculateAnalytics = (data: any[]): any => {
  const views = data.filter(d => d.event_type === 'view').length;
  const clicks = data.filter(d => d.event_type === 'click').length;
  const conversions = data.filter(d => d.event_type === 'conversion').length;
  
  return {
    views,
    clicks,
    conversions,
    ctr: views > 0 ? (clicks / views) * 100 : 0,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0
  };
};

const calculateDailyStats = (data: any[], dateRange: string): any[] => {
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 1;
  const stats = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = data.filter(d => d.created_at.startsWith(dateStr));
    const views = dayData.filter(d => d.event_type === 'view').length;
    const clicks = dayData.filter(d => d.event_type === 'click').length;
    const conversions = dayData.filter(d => d.event_type === 'conversion').length;
    
    stats.push({
      date: dateStr,
      views,
      clicks,
      conversions
    });
  }
  
  return stats;
};

const calculateDashboardMetrics = (campaigns: any[], analytics: any[]): any => {
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.is_active).length;
  const publishedCampaigns = campaigns.filter(c => c.is_published).length;
  
  const totalViews = campaigns.reduce((sum, c) => sum + (c.views_count || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks_count || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions_count || 0), 0);
  
  return {
    total_campaigns: totalCampaigns,
    active_campaigns: activeCampaigns,
    published_campaigns: publishedCampaigns,
    total_views: totalViews,
    total_clicks: totalClicks,
    total_conversions: totalConversions,
    click_through_rate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
    conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  };
};

const logAuditAction = async (action: string, entityType: string, entityId: string, oldValues: any, newValues: any): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('marketing_audit_logs')
      .insert([{
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: null, // Would need to be passed from frontend
        user_agent: navigator.userAgent
      }]);
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateCampaignForm = (data: CampaignFormData): CampaignValidationErrors => {
  const errors: CampaignValidationErrors = {};

  if (!data.campaign_name?.trim()) {
    errors.campaign_name = 'Campaign name is required';
  }

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (data.cta_text && !data.cta_url) {
    errors.cta_url = 'CTA URL is required when CTA text is provided';
  }

  if (data.cta_url && !isValidUrl(data.cta_url)) {
    errors.cta_url = 'Please enter a valid URL';
  }

  if (data.background_color && !isValidHexColor(data.background_color)) {
    errors.background_color = 'Please enter a valid hex color';
  }

  if (data.text_color && !isValidHexColor(data.text_color)) {
    errors.text_color = 'Please enter a valid hex color';
  }

  return errors;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};
