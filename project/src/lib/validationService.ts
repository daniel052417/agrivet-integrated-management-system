import { CampaignFormData, CampaignValidationErrors, ClientNotification } from '../types/marketing';

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // ============================================================================
  // CAMPAIGN VALIDATION
  // ============================================================================

  public validateCampaignForm(data: CampaignFormData): CampaignValidationErrors {
    const errors: CampaignValidationErrors = {};

    // Required fields
    if (!this.isValidString(data.campaign_name)) {
      errors.campaign_name = 'Campaign name is required';
    } else if (data.campaign_name.length > 255) {
      errors.campaign_name = 'Campaign name must be less than 255 characters';
    }

    if (!this.isValidString(data.title)) {
      errors.title = 'Title is required';
    } else if (data.title.length > 500) {
      errors.title = 'Title must be less than 500 characters';
    }

    // Template validation
    if (!data.template_type) {
      errors.template_type = 'Template type is required';
    } else if (!['hero_banner', 'promo_card', 'popup'].includes(data.template_type)) {
      errors.template_type = 'Invalid template type';
    }

    // Description validation
    if (data.description && data.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    // Content validation
    if (data.content && data.content.length > 10000) {
      errors.content = 'Content must be less than 10000 characters';
    }

    // Color validation
    if (data.background_color && !this.isValidHexColor(data.background_color)) {
      errors.background_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.text_color && !this.isValidHexColor(data.text_color)) {
      errors.text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.cta_button_color && !this.isValidHexColor(data.cta_button_color)) {
      errors.cta_button_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.cta_text_color && !this.isValidHexColor(data.cta_text_color)) {
      errors.cta_text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    // CTA validation
    if (data.cta_text && !this.isValidString(data.cta_text)) {
      errors.cta_text = 'CTA text cannot be empty';
    } else if (data.cta_text && data.cta_text.length > 100) {
      errors.cta_text = 'CTA text must be less than 100 characters';
    }

    if (data.cta_url && !this.isValidUrl(data.cta_url)) {
      errors.cta_url = 'Please enter a valid URL';
    }

    if (data.cta_text && !data.cta_url) {
      errors.cta_url = 'CTA URL is required when CTA text is provided';
    }

    if (data.cta_url && !data.cta_text) {
      errors.cta_text = 'CTA text is required when CTA URL is provided';
    }

    // Image validation
    if (data.image_alt_text && data.image_alt_text.length > 255) {
      errors.image_alt_text = 'Image alt text must be less than 255 characters';
    }

    // Date validation
    if (data.publish_date && !this.isValidDate(data.publish_date)) {
      errors.publish_date = 'Please enter a valid publish date';
    }

    if (data.unpublish_date && !this.isValidDate(data.unpublish_date)) {
      errors.unpublish_date = 'Please enter a valid unpublish date';
    }

    if (data.publish_date && data.unpublish_date) {
      const publishDate = new Date(data.publish_date);
      const unpublishDate = new Date(data.unpublish_date);
      
      if (publishDate >= unpublishDate) {
        errors.unpublish_date = 'Unpublish date must be after publish date';
      }
    }

    // Target audience validation
    if (data.target_audience && !Array.isArray(data.target_audience)) {
      errors.target_audience = 'Target audience must be an array';
    }

    if (data.target_channels && !Array.isArray(data.target_channels)) {
      errors.target_channels = 'Target channels must be an array';
    }

    return errors;
  }

  public validateCampaignUpdate(data: Partial<CampaignFormData>): CampaignValidationErrors {
    const errors: CampaignValidationErrors = {};

    // Only validate fields that are being updated
    if (data.campaign_name !== undefined) {
      if (!this.isValidString(data.campaign_name)) {
        errors.campaign_name = 'Campaign name is required';
      } else if (data.campaign_name.length > 255) {
        errors.campaign_name = 'Campaign name must be less than 255 characters';
      }
    }

    if (data.title !== undefined) {
      if (!this.isValidString(data.title)) {
        errors.title = 'Title is required';
      } else if (data.title.length > 500) {
        errors.title = 'Title must be less than 500 characters';
      }
    }

    if (data.description !== undefined && data.description && data.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    if (data.content !== undefined && data.content && data.content.length > 10000) {
      errors.content = 'Content must be less than 10000 characters';
    }

    if (data.background_color !== undefined && data.background_color && !this.isValidHexColor(data.background_color)) {
      errors.background_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.text_color !== undefined && data.text_color && !this.isValidHexColor(data.text_color)) {
      errors.text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.cta_button_color !== undefined && data.cta_button_color && !this.isValidHexColor(data.cta_button_color)) {
      errors.cta_button_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.cta_text_color !== undefined && data.cta_text_color && !this.isValidHexColor(data.cta_text_color)) {
      errors.cta_text_color = 'Please enter a valid hex color (e.g., #FF0000)';
    }

    if (data.cta_text !== undefined && data.cta_text && data.cta_text.length > 100) {
      errors.cta_text = 'CTA text must be less than 100 characters';
    }

    if (data.cta_url !== undefined && data.cta_url && !this.isValidUrl(data.cta_url)) {
      errors.cta_url = 'Please enter a valid URL';
    }

    if (data.image_alt_text !== undefined && data.image_alt_text && data.image_alt_text.length > 255) {
      errors.image_alt_text = 'Image alt text must be less than 255 characters';
    }

    if (data.publish_date !== undefined && data.publish_date && !this.isValidDate(data.publish_date)) {
      errors.publish_date = 'Please enter a valid publish date';
    }

    if (data.unpublish_date !== undefined && data.unpublish_date && !this.isValidDate(data.unpublish_date)) {
      errors.unpublish_date = 'Please enter a valid unpublish date';
    }

    return errors;
  }

  // ============================================================================
  // NOTIFICATION VALIDATION
  // ============================================================================

  public validateNotification(data: Partial<ClientNotification>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (data.title !== undefined) {
      if (!this.isValidString(data.title)) {
        errors.title = 'Title is required';
      } else if (data.title.length > 255) {
        errors.title = 'Title must be less than 255 characters';
      }
    }

    if (data.message !== undefined) {
      if (!this.isValidString(data.message)) {
        errors.message = 'Message is required';
      } else if (data.message.length > 2000) {
        errors.message = 'Message must be less than 2000 characters';
      }
    }

    if (data.notification_type !== undefined) {
      if (!['email', 'push', 'in_app'].includes(data.notification_type)) {
        errors.notification_type = 'Invalid notification type';
      }
    }

    if (data.priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
        errors.priority = 'Invalid priority level';
      }
    }

    if (data.scheduled_at !== undefined && data.scheduled_at) {
      if (!this.isValidDate(data.scheduled_at)) {
        errors.scheduled_at = 'Please enter a valid scheduled date';
      } else {
        const scheduledDate = new Date(data.scheduled_at);
        const now = new Date();
        
        if (scheduledDate <= now) {
          errors.scheduled_at = 'Scheduled date must be in the future';
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // TEMPLATE VALIDATION
  // ============================================================================

  public validateTemplate(data: any): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!this.isValidString(data.template_name)) {
      errors.template_name = 'Template name is required';
    } else if (data.template_name.length > 255) {
      errors.template_name = 'Template name must be less than 255 characters';
    }

    if (!data.template_type) {
      errors.template_type = 'Template type is required';
    } else if (!['hero_banner', 'promo_card', 'popup'].includes(data.template_type)) {
      errors.template_type = 'Invalid template type';
    }

    if (data.description && data.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    if (!data.default_styles || typeof data.default_styles !== 'object') {
      errors.default_styles = 'Default styles are required';
    }

    if (!Array.isArray(data.required_fields)) {
      errors.required_fields = 'Required fields must be an array';
    }

    return errors;
  }

  // ============================================================================
  // UTILITY VALIDATION METHODS
  // ============================================================================

  private isValidString(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ============================================================================
  // SANITIZATION METHODS
  // ============================================================================

  public sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  public sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production, use a proper HTML sanitizer
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: protocol
  }

  public sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  public hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0;
  }

  public getFirstError(errors: Record<string, string>): string | null {
    const firstKey = Object.keys(errors)[0];
    return firstKey ? errors[firstKey] : null;
  }

  public getAllErrors(errors: Record<string, string>): string[] {
    return Object.values(errors);
  }

  public clearErrors(): Record<string, string> {
    return {};
  }

  // ============================================================================
  // BUSINESS RULE VALIDATIONS
  // ============================================================================

  public validateCampaignPublishability(data: CampaignFormData): string[] {
    const errors: string[] = [];

    if (!data.campaign_name?.trim()) {
      errors.push('Campaign name is required');
    }

    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.template_type) {
      errors.push('Template type is required');
    }

    if (data.cta_text && !data.cta_url) {
      errors.push('CTA URL is required when CTA text is provided');
    }

    if (data.cta_url && !data.cta_text) {
      errors.push('CTA text is required when CTA URL is provided');
    }

    if (data.publish_date && data.unpublish_date) {
      const publishDate = new Date(data.publish_date);
      const unpublishDate = new Date(data.unpublish_date);
      
      if (publishDate >= unpublishDate) {
        errors.push('Unpublish date must be after publish date');
      }
    }

    return errors;
  }

  public validateNotificationSendability(data: Partial<ClientNotification>): string[] {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.message?.trim()) {
      errors.push('Message is required');
    }

    if (!data.notification_type) {
      errors.push('Notification type is required');
    }

    if (data.scheduled_at) {
      const scheduledDate = new Date(data.scheduled_at);
      const now = new Date();
      
      if (scheduledDate <= now) {
        errors.push('Scheduled date must be in the future');
      }
    }

    return errors;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const validationService = ValidationService.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const validateCampaignForm = (data: CampaignFormData) => 
  validationService.validateCampaignForm(data);

export const validateCampaignUpdate = (data: Partial<CampaignFormData>) => 
  validationService.validateCampaignUpdate(data);

export const validateNotification = (data: Partial<ClientNotification>) => 
  validationService.validateNotification(data);

export const validateTemplate = (data: any) => 
  validationService.validateTemplate(data);

export const sanitizeString = (value: string) => 
  validationService.sanitizeString(value);

export const sanitizeHtml = (html: string) => 
  validationService.sanitizeHtml(html);

export const sanitizeUrl = (url: string) => 
  validationService.sanitizeUrl(url);

export const hasErrors = (errors: Record<string, string>) => 
  validationService.hasErrors(errors);

export const getFirstError = (errors: Record<string, string>) => 
  validationService.getFirstError(errors);

export const getAllErrors = (errors: Record<string, string>) => 
  validationService.getAllErrors(errors);
