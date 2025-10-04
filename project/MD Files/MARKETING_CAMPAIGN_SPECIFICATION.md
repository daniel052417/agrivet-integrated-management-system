# Marketing Campaign Management Module - Technical Specification

## Overview

This document outlines the comprehensive marketing campaign management module for the Agrivet Integrated Management System. The module allows admin users to create, customize, and manage promotional campaigns with multiple template options, content customization, and analytics tracking.

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **State Management**: React Hooks + Context API
- **Image Processing**: Client-side resizing + Supabase Storage
- **Validation**: Custom validation utilities + TypeScript types

### Database Schema

#### Core Tables

1. **campaign_templates**
   - Stores predefined campaign templates
   - Template types: hero_banner, promo_card, popup
   - Includes default styles and required fields

2. **marketing_campaigns**
   - Main campaigns table with all customizable elements
   - Content fields: title, description, content
   - Visual customization: colors, images
   - CTA configuration: text, URL, button styling
   - Targeting: audience segments, channels
   - Analytics: views, clicks, conversions

3. **campaign_analytics**
   - Event tracking for campaigns
   - Event types: view, click, conversion, impression
   - Includes user agent, IP, referrer data

4. **campaign_schedules**
   - Campaign scheduling and automation
   - Support for immediate, scheduled, and recurring campaigns

### API Endpoints

#### Campaign Templates
- `GET /campaign_templates` - Fetch all active templates
- `GET /campaign_templates/:id` - Get specific template

#### Campaigns CRUD
- `GET /campaigns` - List campaigns with filters and pagination
- `GET /campaigns/:id` - Get specific campaign
- `POST /campaigns` - Create new campaign
- `PUT /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign

#### Campaign Management
- `POST /campaigns/:id/publish` - Publish campaign
- `POST /campaigns/:id/unpublish` - Unpublish campaign
- `POST /campaigns/:id/toggle-status` - Toggle active status

#### Analytics
- `GET /campaigns/:id/analytics` - Get campaign analytics
- `POST /campaigns/:id/track` - Track campaign event

#### Image Upload
- `POST /upload/campaign-image` - Upload campaign image
- `DELETE /upload/campaign-image/:path` - Delete campaign image

## Component Structure

### Core Components

1. **CampaignManagement** (Main Dashboard)
   - Campaign list with filtering and search
   - CRUD operations interface
   - Performance metrics overview

2. **CampaignForm** (Create/Edit)
   - Template selection dropdown
   - Content customization interface
   - Image upload with preview
   - Color pickers for styling
   - CTA configuration
   - Targeting options
   - Form validation

3. **CampaignPreview** (Live Preview)
   - Template-specific rendering
   - Real-time preview updates
   - Status management controls

4. **CampaignAnalytics** (Performance Tracking)
   - Metrics visualization
   - Click-through rates
   - Conversion tracking
   - Time-based analytics

### Template System

#### Hero Banner Template
- Full-width banner for homepage/landing pages
- Large title and description
- Prominent CTA button
- Background image support
- Responsive design

#### Promo Card Template
- Compact card for sidebars/product pages
- Image + text layout
- Smaller CTA button
- Grid-friendly sizing

#### Popup Modal Template
- Modal overlay for special offers
- Centered content with close button
- Image + text + CTA
- Mobile-responsive

## Features

### Template Selection
- Dropdown with three template options
- Each template has distinct styling characteristics
- Template-specific validation rules
- Preview of template structure

### Content Customization
- **Title**: Single-line input with character validation
- **Description**: Multi-line textarea with rich text support
- **Image Upload**: Supabase Storage integration with:
  - File type validation (JPEG, PNG, WebP, GIF)
  - Size limits (5MB max)
  - Client-side resizing
  - Alt text support
- **Color Customization**: Dual color pickers for:
  - Background color (hex/RGB)
  - Text color (hex/RGB)
  - CTA button color
  - CTA text color
- **Call-to-Action**: Button text and URL with validation

### Data Management
- **Campaigns Table**: Comprehensive schema with all customizable elements
- **Save Functionality**: Real-time validation and error handling
- **Audit Tracking**: created_at, updated_at, user_id fields
- **Version Control**: Track changes and updates

### Campaign Control
- **Publish/Unpublish**: Boolean toggle with immediate visibility
- **Status Management**: Draft, Active, Published states
- **Scheduling**: Future publish/unpublish dates
- **Targeting**: Audience segments and channel selection

### Technical Requirements

#### Form Validation
- Real-time field validation
- Template-specific requirements
- Color contrast validation
- URL format validation
- File type and size validation
- Character limits and required fields

#### Error Handling
- Comprehensive error messages
- Field-specific validation feedback
- API error handling with user-friendly messages
- Network error recovery

#### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface elements
- Responsive image handling

#### Authentication & Authorization
- Role-based access control
- Admin and marketing role permissions
- Row-level security (RLS) policies
- Audit logging for all operations

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [x] Database schema design and migration
- [x] TypeScript interfaces and types
- [x] API functions and error handling
- [x] Image upload service

### Phase 2: Form Components (Week 2)
- [x] Campaign form with template selection
- [x] Content customization interface
- [x] Image upload with preview
- [x] Color pickers and validation

### Phase 3: Management Interface (Week 3)
- [x] Campaign dashboard with list view
- [x] CRUD operations interface
- [x] Filtering and search functionality
- [x] Status management controls

### Phase 4: Preview System (Week 4)
- [x] Template-specific preview rendering
- [x] Real-time preview updates
- [x] Mobile responsiveness
- [x] Preview mode controls

### Phase 5: Analytics & Optimization (Week 5)
- [ ] Analytics dashboard
- [ ] Performance metrics
- [ ] A/B testing framework
- [ ] Export functionality

## Scalability Considerations

### Performance
- Lazy loading for campaign lists
- Image optimization and CDN
- Database indexing for queries
- Caching for frequently accessed data

### Maintainability
- Modular component architecture
- TypeScript for type safety
- Comprehensive error handling
- Unit test coverage

### Extensibility
- Plugin architecture for new templates
- Custom field support
- Integration hooks for external services
- API versioning strategy

## Security

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF tokens

### Access Control
- Role-based permissions
- Row-level security
- API rate limiting
- Audit logging

### File Upload Security
- File type validation
- Size limits
- Virus scanning (future)
- Secure storage

## Monitoring & Analytics

### Campaign Metrics
- View counts and click-through rates
- Conversion tracking
- Geographic and demographic data
- Performance over time

### System Monitoring
- API response times
- Error rates and types
- User engagement metrics
- Storage usage

## Future Enhancements

### Advanced Features
- A/B testing framework
- Automated campaign scheduling
- Email integration
- Social media posting
- Advanced analytics dashboard

### Integrations
- Email marketing platforms
- Social media APIs
- Analytics services
- CRM systems

### AI/ML Features
- Content optimization suggestions
- Audience targeting recommendations
- Performance prediction
- Automated A/B testing

## Conclusion

This marketing campaign management module provides a comprehensive solution for creating, managing, and tracking promotional campaigns. The modular architecture ensures scalability and maintainability while the rich feature set meets the needs of modern marketing teams.

The implementation follows best practices for security, performance, and user experience, making it suitable for production use in the Agrivet Integrated Management System.

