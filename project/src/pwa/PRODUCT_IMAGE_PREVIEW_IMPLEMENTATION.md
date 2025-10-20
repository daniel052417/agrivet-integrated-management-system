# Product Image Preview Implementation

## Overview

This document describes the implementation of a product image preview feature similar to Google Maps store photo view. The feature allows users to view all product images in a modal gallery with smooth animations and navigation.

## Features

- **Main Image Display**: Each product card shows the main image from `products.image_url`
- **Preview Button**: Hover overlay and standalone button to trigger image preview
- **Modal Gallery**: Full-screen modal with all product images
- **Carousel Navigation**: Left/right navigation with keyboard support
- **Thumbnail Navigation**: Click thumbnails to jump to specific images
- **Smooth Animations**: Framer Motion for fade-in/out transitions
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Keyboard navigation (ESC, arrow keys) and ARIA labels

## Database Schema

### Product Images Table

```sql
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_type VARCHAR(50) DEFAULT 'gallery' NOT NULL, -- 'main', 'gallery', 'thumbnail', 'other'
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  file_size INTEGER, -- in bytes
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Details

### 1. TypeScript Types

```typescript
export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  image_name: string
  image_type: 'main' | 'gallery' | 'thumbnail' | 'other'
  alt_text?: string
  sort_order: number
  is_active: boolean
  file_size?: number
  width?: number
  height?: number
  created_at: string
  updated_at: string
}
```

### 2. Product Image Service

The `ProductImageService` handles fetching product images from Supabase:

- `getProductImages(productId: string)`: Fetches all active images for a product
- `getMainProductImage(productId: string)`: Gets the main image or first available image

### 3. Image Preview Modal Component

The `ImagePreviewModal` component provides:

- **Carousel Navigation**: Previous/next buttons with keyboard support
- **Thumbnail Strip**: Click thumbnails to navigate
- **Smooth Transitions**: Framer Motion animations
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Full keyboard navigation and ARIA labels

### 4. Preview Button Component

The `PreviewButton` component offers:

- **Multiple Variants**: Primary, secondary, ghost styles
- **Multiple Sizes**: Small, medium, large
- **Loading States**: Shows spinner while fetching images
- **Error Handling**: Displays error messages if image loading fails
- **Fallback Support**: Uses main image URL if no database images exist

### 5. Product Card Integration

The `ProductCard` component includes:

- **Hover Overlay**: Preview button appears on image hover
- **Standalone Button**: Always visible preview button in product info
- **Seamless Integration**: Works with existing product data structure

## Usage Examples

### Basic Preview Button

```tsx
<PreviewButton
  productId="product-123"
  productName="Sample Product"
  mainImageUrl="https://example.com/image.jpg"
  size="md"
  variant="primary"
/>
```

### Image Preview Modal

```tsx
<ImagePreviewModal
  isOpen={isModalOpen}
  onClose={handleClose}
  images={productImages}
  productName="Sample Product"
  initialImageIndex={0}
/>
```

### Product Card with Preview

```tsx
<ProductCard
  product={productWithUnits}
  viewMode="grid"
  onAddToCart={handleAddToCart}
/>
```

## Styling

The implementation uses Tailwind CSS classes:

- **Modal**: `fixed inset-0 z-50` for full-screen overlay
- **Animations**: `transition-all duration-200` for smooth transitions
- **Responsive**: `max-w-4xl w-full max-h-[90vh]` for responsive sizing
- **Hover Effects**: `group-hover:opacity-100` for button visibility

## Animation Details

### Framer Motion Animations

1. **Modal Entrance**: Scale and fade-in effect
2. **Image Transitions**: Fade and scale between images
3. **Button Hover**: Scale effect on hover
4. **Thumbnail Selection**: Border color transition

### CSS Transitions

1. **Hover Overlay**: Opacity transition on image hover
2. **Button States**: Color and opacity changes
3. **Thumbnail Selection**: Border color changes

## Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors**: Graceful fallback to main image URL
2. **Empty Results**: Shows appropriate empty state
3. **Loading States**: Visual feedback during image fetching
4. **Invalid URLs**: Fallback to placeholder image

## Performance Considerations

1. **Lazy Loading**: Images are only fetched when preview is requested
2. **Caching**: Service layer can be extended with caching
3. **Image Optimization**: Consider using Supabase image transformations
4. **Memory Management**: Modal cleanup on close

## Testing

### Demo Component

The `ImagePreviewDemo` component provides:

- **Test Interface**: Easy testing of image preview functionality
- **Mock Data**: Uses test product IDs for demonstration
- **Error Simulation**: Shows error handling in action
- **Multiple Products**: Tests with different product scenarios

### Test Routes

- `/demo/image-preview`: Full demo interface
- Integration with existing product catalog

## Future Enhancements

1. **Image Zoom**: Pinch-to-zoom functionality
2. **Fullscreen Mode**: True fullscreen viewing
3. **Image Sharing**: Share individual images
4. **Image Download**: Download images to device
5. **Image Upload**: Admin interface for image management
6. **Image Optimization**: Automatic resizing and compression
7. **Lazy Loading**: Progressive image loading
8. **Image Analytics**: Track which images are viewed most

## Browser Support

- **Modern Browsers**: Full support for all features
- **Mobile Devices**: Touch-friendly navigation
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and semantic HTML

## Security Considerations

1. **Image URLs**: Validate and sanitize image URLs
2. **CORS**: Ensure proper CORS headers for image loading
3. **Authentication**: Consider authentication for sensitive images
4. **Rate Limiting**: Implement rate limiting for image requests

## Dependencies

- **React**: Component framework
- **TypeScript**: Type safety
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling
- **Supabase**: Database and storage
- **Lucide React**: Icons

## File Structure

```
src/
├── components/catalog/
│   ├── ImagePreviewModal.tsx
│   ├── PreviewButton.tsx
│   ├── ImagePreviewDemo.tsx
│   └── ProductCard.tsx (updated)
├── services/
│   └── productImageService.ts
├── types/
│   └── index.ts (updated)
└── sql/migrations/
    └── create_product_images_table.sql
```

## Conclusion

The product image preview feature provides a modern, user-friendly way to view product images with smooth animations and intuitive navigation. The implementation is modular, reusable, and follows React best practices while maintaining excellent performance and accessibility.
