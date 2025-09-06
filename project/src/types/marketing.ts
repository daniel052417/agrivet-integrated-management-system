// Marketing Campaign Management Type Definitions

export type CampaignTemplateType = 'hero_banner' | 'promo_card' | 'popup';
export type CampaignStatus = 'draft' | 'scheduled' | 'published' | 'unpublished' | 'archived';
export type EventType = 'view' | 'click' | 'conversion' | 'impression';
export type ScheduleType = 'immediate' | 'scheduled' | 'recurring';

export interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: CampaignTemplateType;
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  campaign_name: string;
  template_id: string;
  template_type: CampaignTemplateType;
  
  // Content Fields
  title: string;
  description?: string;
  content?: string; // Rich text content
  
  // Visual Customization
  background_color?: string; // Hex color
  text_color?: string; // Hex color
  image_url?: string;
  image_alt_text?: string;
  
  // Call to Action
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  
  // Campaign Settings
  is_active: boolean;
  is_published: boolean;
  publish_date?: string;
  unpublish_date?: string;
  
  // Targeting
  target_audience?: string[];
  target_channels?: string[];
  
  // Analytics
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  
  // Metadata
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  event_type: EventType;
  event_data?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  created_at: string;
}

export interface CampaignSchedule {
  id: string;
  campaign_id: string;
  schedule_type: ScheduleType;
  start_date?: string;
  end_date?: string;
  recurrence_pattern?: Record<string, any>;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form interfaces
export interface CampaignFormData {
  campaign_name: string;
  template_type: CampaignTemplateType;
  title: string;
  description?: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_file?: File;
  image_alt_text?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  target_audience?: string[];
  target_channels?: string[];
  is_active: boolean;
  publish_date?: string;
  unpublish_date?: string;
}

export interface CampaignPreviewProps {
  campaign: MarketingCampaign;
  template: CampaignTemplate;
  isPreview?: boolean;
}

// API response interfaces
export interface CampaignAPIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CampaignListResponse {
  campaigns: MarketingCampaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignAnalyticsResponse {
  campaign_id: string;
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  daily_stats: Array<{
    date: string;
    views: number;
    clicks: number;
    conversions: number;
  }>;
}

// Component props interfaces
export interface CampaignFormProps {
  campaign?: MarketingCampaign;
  templates: CampaignTemplate[];
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CampaignListProps {
  campaigns: MarketingCampaign[];
  templates: CampaignTemplate[];
  onEdit: (campaign: MarketingCampaign) => void;
  onDelete: (campaignId: string) => void;
  onToggleStatus: (campaignId: string, isActive: boolean) => void;
  onViewAnalytics: (campaignId: string) => void;
  isLoading?: boolean;
}

export interface CampaignPreviewProps {
  campaign: MarketingCampaign;
  template: CampaignTemplate;
  isPreview?: boolean;
  onEdit?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
}

// Template-specific interfaces
export interface HeroBannerTemplate {
  width: string;
  height: string;
  background: string;
  textAlign: string;
  padding: string;
  borderRadius?: string;
  boxShadow?: string;
}

export interface PromoCardTemplate {
  width: string;
  height: string;
  background: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
  margin?: string;
}

export interface PopupTemplate {
  width: string;
  height: string;
  background: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
  position: string;
  top: string;
  left: string;
  transform: string;
  zIndex?: number;
}

// Validation interfaces
export interface CampaignValidationErrors {
  campaign_name?: string;
  title?: string;
  description?: string;
  cta_text?: string;
  cta_url?: string;
  background_color?: string;
  text_color?: string;
  image_file?: string;
  publish_date?: string;
  unpublish_date?: string;
  target_audience?: string;
  target_channels?: string;
}

// Filter and search interfaces
export interface CampaignFilters {
  template_type?: CampaignTemplateType;
  status?: CampaignStatus;
  is_active?: boolean;
  is_published?: boolean;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface CampaignSortOptions {
  field: 'created_at' | 'updated_at' | 'campaign_name' | 'views_count' | 'clicks_count';
  direction: 'asc' | 'desc';
}

// Image upload interfaces
export interface ImageUploadResponse {
  url: string;
  path: string;
  public_id?: string;
}

export interface ImageUploadOptions {
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number;
  width?: number;
  height?: number;
}

// Analytics interfaces
export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  template_type: CampaignTemplateType;
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  engagement_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignPerformanceData {
  campaign_id: string;
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue?: number;
}

// Export/Import interfaces
export interface CampaignExportData {
  campaigns: MarketingCampaign[];
  templates: CampaignTemplate[];
  export_date: string;
  version: string;
}

export interface CampaignImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

