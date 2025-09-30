# Promotional Components

This directory contains UI components for displaying promotional content in the AgriVet PWA. These components are designed to be easily integrated with backend promotional campaigns.

## Components

### 1. PromoBanner
A banner component that displays at the top of pages to show promotional offers.

**Features:**
- Animated gradient backgrounds based on discount type
- Dismissible with X button
- Action button for user engagement
- Responsive design for mobile and desktop
- Expiring soon indicator

**Usage:**
```tsx
<PromoBanner
  promotion={promotion}
  onDismiss={() => handleDismiss(promotion.id)}
  onAction={() => handleAction(promotion)}
/>
```

### 2. PromoModal
A modal component that appears once per session to showcase special offers.

**Features:**
- Session-based display logic (only shows once per session)
- Escape key to close
- Click outside to close
- Action buttons for engagement
- Terms and conditions display
- Validity period information

**Usage:**
```tsx
<PromoModal
  promotion={promotion}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onAction={() => handleAction(promotion)}
/>
```

### 3. PushNotificationSimulator
A testing component for push notifications with sample promotional data.

**Features:**
- Floating action button for easy access
- Sample promotional data for testing
- Permission handling
- Real browser notification testing
- Success/error feedback

**Usage:**
```tsx
<PushNotificationSimulator
  onSendNotification={handleSendNotification}
/>
```

### 4. PromoDemo
A comprehensive demo page showcasing all promotional components.

**Features:**
- Live component testing
- Status indicators
- Reset functionality
- Usage instructions
- Available at `/demo/promotions`

## Services

### PromotionService
Manages promotional data and business logic.

**Key Methods:**
- `getActivePromotions()` - Get all active promotions
- `getBannerPromotions()` - Get promotions configured for banners
- `getModalPromotions()` - Get promotions configured for modals
- `shouldShowModal()` - Check if modal should be shown this session
- `markModalAsShown()` - Mark modal as shown for this session
- `sendNotification()` - Send browser notification
- `createNotificationFromPromotion()` - Convert promotion to notification data

## Types

### Promotion
Main promotional data structure with comprehensive configuration options:

```typescript
interface Promotion {
  id: string
  title: string
  description: string
  imageUrl?: string
  discountType: 'percentage' | 'fixed' | 'bogo' | 'free_shipping'
  discountValue: number
  validFrom: string
  validUntil: string
  isActive: boolean
  targetAudience: 'all' | 'new_customers' | 'returning_customers' | 'specific_branch'
  targetBranchIds?: string[]
  conditions?: {
    minOrderAmount?: number
    applicableProducts?: string[]
    maxUses?: number
  }
  displaySettings: {
    showAsBanner: boolean
    showAsModal: boolean
    showAsNotification: boolean
    bannerPosition: 'top' | 'bottom'
    modalTrigger: 'immediate' | 'delay' | 'scroll' | 'exit_intent'
    notificationTrigger: 'immediate' | 'delay' | 'user_action'
  }
  createdAt: string
  updatedAt: string
}
```

## Integration

### With ProductCatalog
The promotional components are already integrated into the ProductCatalog page:

1. **Banners** appear at the top of the page
2. **Modals** show once per session when configured
3. **Notification simulator** is available as a floating button

### With Backend
To connect with real promotional data:

1. Replace `promotionService` sample data with API calls
2. Update the service methods to fetch from your backend
3. Implement real-time updates using WebSockets or polling
4. Add user targeting and personalization logic

### Sample Data
The service includes comprehensive sample data for testing:

- **10% Off All Feeds** - Percentage discount with conditions
- **Free Shipping Weekend** - Free shipping promotion
- **Buy 1 Get 1 on Seeds** - BOGO promotion
- **₱100 Off Orders Over ₱1000** - Fixed discount with minimum order

## Styling

All components use Tailwind CSS with the AgriVet design system:

- **Primary Color:** `#10b981` (agrivet-green)
- **Gradients:** Dynamic based on discount type
- **Animations:** Smooth transitions and hover effects
- **Responsive:** Mobile-first design approach

## Testing

### Manual Testing
1. Navigate to `/demo/promotions` to test all components
2. Use the notification simulator to test browser notifications
3. Test banner dismissal and modal display logic
4. Verify responsive behavior on different screen sizes

### Browser Notifications
1. Ensure notification permission is granted
2. Test different promotional scenarios
3. Verify notification click behavior
4. Test permission denial handling

## Future Enhancements

- **A/B Testing:** Component variations for testing effectiveness
- **Analytics:** Track user interactions and conversion rates
- **Personalization:** User-specific promotional content
- **Real-time Updates:** Live promotional data synchronization
- **Advanced Targeting:** Customer segment-based promotions
- **Scheduling:** Time-based promotional display
- **Geolocation:** Location-based promotional content

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Browser Notification API
- Session Storage API

## Browser Support

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (iOS 16.4+)
- **Mobile Browsers:** Full support with PWA capabilities
