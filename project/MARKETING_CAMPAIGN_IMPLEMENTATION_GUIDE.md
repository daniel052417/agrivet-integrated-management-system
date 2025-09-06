# Marketing Campaign Management - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the comprehensive marketing campaign management module in your Agrivet Integrated Management System.

## Prerequisites

- React 18+ with TypeScript
- Supabase project with PostgreSQL
- Tailwind CSS for styling
- Lucide React for icons

## Installation Steps

### 1. Database Setup

Run the migration to create the required tables:

```bash
# Apply the marketing campaigns schema migration
supabase db push
```

This will create:
- `campaign_templates` - Predefined campaign templates
- `marketing_campaigns` - Main campaigns table
- `campaign_analytics` - Event tracking
- `campaign_schedules` - Campaign scheduling

### 2. Supabase Storage Setup

Create a storage bucket for campaign images:

```sql
-- Create storage bucket for marketing assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketing-assets', 'marketing-assets', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'marketing-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own uploads" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'marketing-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. File Structure

Add the following files to your project:

```
src/
├── types/
│   └── marketing.ts                    # TypeScript interfaces
├── lib/
│   ├── campaignApi.ts                  # API functions
│   ├── imageUpload.ts                  # Image upload service
│   └── campaignValidation.ts           # Form validation
└── Admin/components/Marketing/
    ├── CampaignForm.tsx                # Create/Edit form
    ├── CampaignPreview.tsx             # Live preview
    ├── CampaignManagement.tsx          # Main dashboard
    └── MarketingDashboard.tsx          # Integrated dashboard
```

### 4. Environment Variables

Ensure your `.env` file includes:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Component Integration

### 1. Update Main Marketing Module

Replace your existing marketing component with the new integrated dashboard:

```tsx
// In your main marketing route
import MarketingDashboard from './components/Marketing/MarketingDashboard';

function MarketingPage() {
  return <MarketingDashboard />;
}
```

### 2. Add to Navigation

Update your admin navigation to include the marketing dashboard:

```tsx
// In your sidebar/navigation component
{
  name: 'Marketing',
  href: '/admin/marketing',
  icon: Megaphone,
  children: [
    { name: 'Dashboard', href: '/admin/marketing' },
    { name: 'Campaigns', href: '/admin/marketing/campaigns' },
    { name: 'Announcements', href: '/admin/marketing/announcements' },
    { name: 'Promotions', href: '/admin/marketing/promotions' },
    { name: 'Loyalty & Rewards', href: '/admin/marketing/loyalty' }
  ]
}
```

## Usage Guide

### 1. Creating a Campaign

1. Navigate to Marketing → Campaigns
2. Click "Create Campaign"
3. Select a template (Hero Banner, Promo Card, or Popup)
4. Fill in the campaign details:
   - Campaign name and title
   - Description and content
   - Upload an image (optional)
   - Customize colors
   - Set up call-to-action
   - Configure targeting
5. Preview the campaign
6. Save as draft or publish immediately

### 2. Managing Campaigns

- **View**: Click the eye icon to preview campaigns
- **Edit**: Click the edit icon to modify campaigns
- **Publish/Unpublish**: Toggle campaign visibility
- **Activate/Deactivate**: Control campaign status
- **Delete**: Remove campaigns permanently

### 3. Template Customization

Each template has specific characteristics:

#### Hero Banner
- Full-width display
- Large title and description
- Prominent CTA button
- Background image support
- Best for homepage/landing pages

#### Promo Card
- Compact 300x200px size
- Image + text layout
- Smaller CTA button
- Grid-friendly design
- Best for sidebars/product pages

#### Popup Modal
- Centered overlay
- Image + text + CTA
- Close button
- Mobile responsive
- Best for special offers

### 4. Analytics Tracking

The system automatically tracks:
- **Views**: When campaigns are displayed
- **Clicks**: When CTA buttons are clicked
- **Conversions**: When goals are completed
- **Impressions**: When campaigns are loaded

## API Reference

### Campaign Management

```typescript
// Get all campaigns
const campaigns = await getCampaigns(filters, page, limit);

// Create campaign
const newCampaign = await createCampaign(campaignData);

// Update campaign
const updatedCampaign = await updateCampaign(id, updates);

// Delete campaign
await deleteCampaign(id);

// Publish campaign
await publishCampaign(id);

// Unpublish campaign
await unpublishCampaign(id);
```

### Image Upload

```typescript
// Upload image
const result = await uploadImage(file, {
  folder: 'campaigns',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

// Delete image
await deleteImage(path);
```

### Analytics

```typescript
// Get campaign analytics
const analytics = await getCampaignAnalytics(campaignId);

// Track event
await trackCampaignEvent(campaignId, 'click', { button: 'cta' });
```

## Customization

### 1. Adding New Templates

1. Add template to database:
```sql
INSERT INTO campaign_templates (template_name, template_type, description, default_styles, required_fields)
VALUES ('Custom Template', 'custom_type', 'Description', '{"width": "100%"}', '["title"]');
```

2. Update TypeScript types:
```typescript
export type CampaignTemplateType = 'hero_banner' | 'promo_card' | 'popup' | 'custom_type';
```

3. Add template rendering in `CampaignPreview.tsx`

### 2. Custom Validation Rules

Extend the validation in `campaignValidation.ts`:

```typescript
// Add custom validation
static validateCustomField(value: any): string | null {
  // Your validation logic
  return null;
}
```

### 3. Styling Customization

Modify the Tailwind classes in components to match your design system:

```tsx
// Example: Change primary color
className="bg-blue-600 hover:bg-blue-700"
// To:
className="bg-green-600 hover:bg-green-700"
```

## Troubleshooting

### Common Issues

1. **Image Upload Fails**
   - Check Supabase storage bucket permissions
   - Verify file size and type restrictions
   - Ensure RLS policies are correctly set

2. **Campaigns Not Loading**
   - Check database connection
   - Verify RLS policies for marketing_campaigns table
   - Check user permissions

3. **Preview Not Working**
   - Ensure all required fields are filled
   - Check template type matches selected template
   - Verify image URLs are accessible

### Debug Mode

Enable debug logging:

```typescript
// In campaignApi.ts
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('Campaign API call:', { method, url, data });
}
```

## Performance Optimization

### 1. Image Optimization

- Images are automatically resized on upload
- Use WebP format for better compression
- Implement lazy loading for campaign lists

### 2. Database Optimization

- Indexes are created for common queries
- Use pagination for large campaign lists
- Implement caching for frequently accessed data

### 3. Component Optimization

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load campaign previews

## Security Considerations

### 1. Input Validation

- All inputs are validated on both client and server
- HTML content is sanitized
- File uploads are restricted by type and size

### 2. Access Control

- Role-based permissions (admin, marketing)
- Row-level security policies
- API rate limiting

### 3. Data Protection

- Sensitive data is encrypted
- Audit logs track all changes
- Regular security updates

## Monitoring and Maintenance

### 1. Performance Monitoring

- Track API response times
- Monitor database query performance
- Set up alerts for errors

### 2. User Analytics

- Track user engagement with campaigns
- Monitor conversion rates
- Analyze A/B test results

### 3. Regular Maintenance

- Clean up old analytics data
- Optimize database queries
- Update dependencies regularly

## Support and Updates

For technical support or feature requests:

1. Check the documentation first
2. Review the troubleshooting section
3. Check for known issues in the repository
4. Contact the development team

## Conclusion

This marketing campaign management module provides a comprehensive solution for creating, managing, and tracking promotional campaigns. The modular architecture ensures scalability and maintainability while the rich feature set meets the needs of modern marketing teams.

Follow this guide to successfully implement the module in your Agrivet Integrated Management System.

