# Marketing Module API Documentation

## Overview
This document describes the complete backend API for the Marketing Module, designed for small-scale usage (1-2 users, 1 campaign per month).

## Technology Stack
- **Backend**: Node.js + TypeScript + Supabase
- **Database**: PostgreSQL (via Supabase)
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth with JWT tokens
- **Image Processing**: Client-side with Canvas API

## Database Schema

### Core Tables
- `campaign_templates` - Pre-built and custom campaign templates
- `marketing_campaigns` - Marketing campaigns with full CRUD support
- `campaign_analytics` - Event tracking and analytics data
- `campaign_schedules` - Campaign scheduling and automation
- `client_notifications` - Email, push, and in-app notifications
- `notification_templates` - Reusable notification templates
- `marketing_user_roles` - Role-based access control
- `marketing_audit_logs` - Complete audit trail

## API Endpoints

### Campaign Management

#### Get Campaigns
```typescript
GET /api/marketing/campaigns
Query Parameters:
- filters: CampaignFilters (optional)
- page: number (default: 1)
- limit: number (default: 10)

Response: CampaignAPIResponse<CampaignListResponse>
```

#### Get Campaign by ID
```typescript
GET /api/marketing/campaigns/:id
Response: CampaignAPIResponse<MarketingCampaign>
```

#### Create Campaign
```typescript
POST /api/marketing/campaigns
Body: CampaignFormData
Response: CampaignAPIResponse<MarketingCampaign>
```

#### Update Campaign
```typescript
PUT /api/marketing/campaigns/:id
Body: Partial<CampaignFormData>
Response: CampaignAPIResponse<MarketingCampaign>
```

#### Delete Campaign
```typescript
DELETE /api/marketing/campaigns/:id
Response: CampaignAPIResponse<boolean>
```

#### Duplicate Campaign
```typescript
POST /api/marketing/campaigns/:id/duplicate
Response: CampaignAPIResponse<MarketingCampaign>
```

### Campaign Publishing

#### Publish Campaign
```typescript
POST /api/marketing/campaigns/:id/publish
Response: CampaignAPIResponse<MarketingCampaign>
```

#### Unpublish Campaign
```typescript
POST /api/marketing/campaigns/:id/unpublish
Response: CampaignAPIResponse<MarketingCampaign>
```

#### Toggle Campaign Status
```typescript
POST /api/marketing/campaigns/:id/toggle
Body: { isActive: boolean }
Response: CampaignAPIResponse<MarketingCampaign>
```

### Template Management

#### Get Templates
```typescript
GET /api/marketing/templates
Response: CampaignAPIResponse<CampaignTemplate[]>
```

#### Create Template
```typescript
POST /api/marketing/templates
Body: Partial<CampaignTemplate>
Response: CampaignAPIResponse<CampaignTemplate>
```

#### Update Template
```typescript
PUT /api/marketing/templates/:id
Body: Partial<CampaignTemplate>
Response: CampaignAPIResponse<CampaignTemplate>
```

#### Delete Template
```typescript
DELETE /api/marketing/templates/:id
Response: CampaignAPIResponse<boolean>
```

### Analytics & Tracking

#### Track Event
```typescript
POST /api/marketing/analytics/track
Body: {
  campaignId: string,
  eventType: 'view' | 'click' | 'conversion' | 'impression',
  eventData?: any
}
Response: CampaignAPIResponse<boolean>
```

#### Get Campaign Analytics
```typescript
GET /api/marketing/analytics/:campaignId
Query Parameters:
- dateRange: string (default: '7d')

Response: CampaignAPIResponse<CampaignAnalyticsResponse>
```

#### Get Dashboard Metrics
```typescript
GET /api/marketing/analytics/overview
Response: CampaignAPIResponse<DashboardMetrics>
```

### Notification System

#### Get Notifications
```typescript
GET /api/marketing/notifications
Response: CampaignAPIResponse<ClientNotification[]>
```

#### Create Notification
```typescript
POST /api/marketing/notifications
Body: Partial<ClientNotification>
Response: CampaignAPIResponse<ClientNotification>
```

#### Send Notification
```typescript
POST /api/marketing/notifications/:id/send
Response: CampaignAPIResponse<boolean>
```

### File Upload

#### Upload Image
```typescript
POST /api/marketing/upload/image
Body: FormData with file
Query Parameters:
- folder?: string
- maxSize?: number
- quality?: number
- width?: number
- height?: number

Response: ImageUploadResponse
```

#### Delete Image
```typescript
DELETE /api/marketing/upload/image/:path
Response: boolean
```

## Authentication & Authorization

### User Roles
- **Admin**: Full access to all features
- **Marketing Manager**: Full marketing access
- **Viewer**: Read-only access

### Permissions
- `campaign:create` - Create campaigns
- `campaign:read` - View campaigns
- `campaign:update` - Edit campaigns
- `campaign:delete` - Delete campaigns
- `campaign:publish` - Publish campaigns
- `campaign:unpublish` - Unpublish campaigns
- `template:create` - Create templates
- `template:read` - View templates
- `template:update` - Edit templates
- `template:delete` - Delete templates
- `analytics:read` - View analytics
- `analytics:export` - Export analytics data
- `notification:create` - Create notifications
- `notification:read` - View notifications
- `notification:update` - Edit notifications
- `notification:delete` - Delete notifications
- `notification:send` - Send notifications
- `user:manage` - Manage users
- `settings:manage` - Manage settings
- `audit:read` - View audit logs

## Data Models

### MarketingCampaign
```typescript
interface MarketingCampaign {
  id: string;
  campaign_name: string;
  template_id: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  title: string;
  description?: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  image_alt_text?: string;
  cta_text?: string;
  cta_url?: string;
  cta_button_color?: string;
  cta_text_color?: string;
  is_active: boolean;
  is_published: boolean;
  publish_date?: string;
  unpublish_date?: string;
  target_audience?: string[];
  target_channels?: string[];
  target_devices?: string[];
  target_times?: any;
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}
```

### CampaignTemplate
```typescript
interface CampaignTemplate {
  id: string;
  template_name: string;
  template_type: 'hero_banner' | 'promo_card' | 'popup';
  description: string;
  default_styles: Record<string, any>;
  required_fields: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### ClientNotification
```typescript
interface ClientNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'email' | 'push' | 'in_app';
  channel: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  target_audience?: string[];
  target_devices?: string[];
  html_content?: string;
  attachments?: any[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### Validation Errors
```typescript
interface ValidationErrors {
  field_name: string;
  message: string;
}
```

## Rate Limiting
- **Default**: 100 requests per minute per user
- **File Upload**: 10 requests per minute per user
- **Analytics**: 50 requests per minute per user

## Security Features
- JWT token authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Audit logging for all actions
- File upload validation
- Image processing security

## Performance Optimizations
- Database indexing on frequently queried fields
- Pagination for large datasets
- Image optimization and compression
- Caching for frequently accessed data
- Lazy loading for analytics data

## Monitoring & Logging
- All API calls are logged
- User actions are audited
- Error tracking and reporting
- Performance metrics collection
- Database query monitoring

## Usage Examples

### Creating a Campaign
```typescript
import { createCampaign } from './lib/marketingApi';

const campaignData = {
  campaign_name: 'Summer Sale 2024',
  template_type: 'hero_banner',
  title: '50% Off All Products!',
  description: 'Limited time offer',
  background_color: '#FF6B6B',
  text_color: '#FFFFFF',
  cta_text: 'Shop Now',
  cta_url: 'https://example.com/sale',
  is_active: true
};

const result = await createCampaign(campaignData);
if (result.success) {
  console.log('Campaign created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Tracking Analytics
```typescript
import { trackEvent } from './lib/marketingApi';

// Track a view event
await trackEvent('campaign-id', 'view', {
  page: 'homepage',
  referrer: 'google.com'
});

// Track a click event
await trackEvent('campaign-id', 'click', {
  element: 'cta_button',
  position: 'top'
});
```

### Uploading Images
```typescript
import { uploadImage } from './lib/fileUploadService';

const file = document.getElementById('fileInput').files[0];
const result = await uploadImage(file, {
  folder: 'campaigns',
  maxSize: 2 * 1024 * 1024, // 2MB
  quality: 0.8,
  width: 800,
  height: 600
});

console.log('Image uploaded:', result.url);
```

## Migration Guide

### From Old API
The new API is backward compatible. Simply update your imports:

```typescript
// Old
import { getCampaigns } from './lib/campaignApi';

// New (same functionality, enhanced features)
import { getCampaigns } from './lib/marketingApi';
```

### Database Migration
Run the migration script to set up the new schema:

```sql
-- Run this in your Supabase SQL editor
\i supabase/migrations/20250123000003_enhanced_marketing_schema.sql
```

## Support
For questions or issues with the Marketing Module API, please refer to the implementation files or contact the development team.
