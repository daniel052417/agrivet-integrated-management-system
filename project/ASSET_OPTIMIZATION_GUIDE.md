# 📸 Asset Optimization Guide

This guide covers best practices for optimizing images and other assets in the Agrivet Management System.

## Image Optimization

### Current Image Inventory

#### Main App Images
- `src/assets/logo.png` - Company logo
- Various images in `src/pwa/src/assets/` and `src/landing-page/src/assets/`

#### Face API Models
- `public/models/` - Face recognition model files (~7MB total)
  - These are binary files that cannot be compressed further
  - Already optimized with CDN caching in Vercel

### Image Optimization Recommendations

#### 1. Convert Images to Modern Formats

**WebP Format** (Recommended)
- 25-35% smaller than JPEG/PNG
- Supported by all modern browsers
- Use for photos and complex images

**AVIF Format** (Best compression)
- 50% smaller than JPEG
- Better quality at lower file sizes
- Limited browser support (Chrome 85+, Firefox 93+)

**Implementation:**
```typescript
import { getOptimalFormat, supportsWebP } from './utils/imageOptimizer';

// Use optimal format
const format = await getOptimalFormat();
const imageSrc = `/images/logo.${format}`;
```

#### 2. Image Compression

**Before Upload:**
- Use tools like:
  - [Squoosh](https://squoosh.app/) - Online image compression
  - [ImageOptim](https://imageoptim.com/) - Desktop app (Mac)
  - [TinyPNG](https://tinypng.com/) - Online compression

**Target Sizes:**
- Logos: < 50KB
- Product images: < 200KB
- Hero images: < 300KB
- Thumbnails: < 50KB

#### 3. Responsive Images

Use `srcset` for responsive images:
```tsx
<img
  src="/images/hero.jpg"
  srcSet="/images/hero-320w.jpg 320w, /images/hero-640w.jpg 640w, /images/hero-1024w.jpg 1024w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Hero image"
/>
```

#### 4. Lazy Loading

Use native lazy loading or Intersection Observer:

```tsx
// Native lazy loading (supported in modern browsers)
<img src="/images/product.jpg" loading="lazy" alt="Product" />

// Or use the utility hook
import { useLazyImage } from './utils/imageOptimizer';

const { imgRef, imageSrc } = useLazyImage('/images/product.jpg');
<img ref={imgRef} src={imageSrc} alt="Product" />
```

#### 5. Image Preloading

Preload critical images:
```tsx
import { preloadImage } from './utils/imageOptimizer';

// Preload hero image
useEffect(() => {
  preloadImage('/images/hero.webp');
}, []);
```

## Face API Models Optimization

### Current Setup
- Models are stored in `public/models/`
- Total size: ~7MB
- Already configured with CDN caching in Vercel

### Optimization Strategies

#### 1. Lazy Loading (Already Implemented)
- Models only load when face recognition is needed
- Not loaded on initial page load

#### 2. CDN Caching
- Vercel automatically caches models with 1-year cache headers
- Models are served from edge locations globally

#### 3. Progressive Loading
- Models load sequentially (already implemented)
- Users see progress feedback

#### 4. Fallback to CDN
- If local models fail, fallback to jsDelivr CDN
- Ensures reliability

### Model Files
- `tiny_face_detector_model-shard1`: ~190 KB
- `face_landmark_68_model-shard1`: ~1.2 MB
- `face_recognition_model-shard1`: ~5.4 MB

**Note:** These are binary files that cannot be compressed further. They are already optimized.

## Font Optimization

### Current Setup
- Using system fonts and Tailwind CSS defaults
- No custom font files detected

### Recommendations

#### 1. Use System Fonts (Current)
- Fastest loading
- No external requests
- Already implemented

#### 2. If Adding Custom Fonts
- Use `font-display: swap` for faster rendering
- Preload critical fonts
- Subset fonts to only needed characters
- Use WOFF2 format (best compression)

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback font immediately */
  font-weight: 400;
  font-style: normal;
}
```

## CSS Optimization

### Current Setup
- Tailwind CSS (already optimized)
- PostCSS for processing

### Recommendations

#### 1. Purge Unused CSS (Already in Tailwind)
- Tailwind automatically purges unused classes
- No action needed

#### 2. Critical CSS
- Inline critical CSS for above-the-fold content
- Defer non-critical CSS

#### 3. CSS Minification
- Already handled by Vite in production builds

## JavaScript Optimization

### Current Setup
- Code splitting implemented
- Lazy loading for routes
- Vendor chunks separated

### Recommendations

#### 1. Tree Shaking
- Already enabled in Vite
- Import only what you need

#### 2. Dynamic Imports
- Use for large dependencies
- Already implemented for routes

## Vercel Optimization

### Automatic Optimizations
- ✅ Image optimization via Vercel Image Optimization API
- ✅ Automatic compression (Gzip/Brotli)
- ✅ CDN caching for static assets
- ✅ Edge network for global delivery

### Usage
```tsx
// Use Vercel Image Optimization
<img
  src="/images/hero.jpg"
  // Vercel automatically optimizes images served from /images/
  alt="Hero"
/>
```

## Asset Loading Strategy

### Priority Order
1. **Critical**: Logo, above-the-fold images
2. **High**: Navigation images, hero images
3. **Medium**: Product images, gallery images
4. **Low**: Background images, decorative images

### Implementation
```tsx
// Critical - Preload
<link rel="preload" as="image" href="/images/logo.webp" />

// High - Eager load
<img src="/images/hero.webp" loading="eager" alt="Hero" />

// Medium - Lazy load
<img src="/images/product.webp" loading="lazy" alt="Product" />

// Low - Lazy load with intersection observer
<img src="/images/bg.webp" loading="lazy" decoding="async" alt="Background" />
```

## Performance Targets

### Image Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Total image weight**: < 1MB per page
- **Individual images**: < 300KB

### Asset Loading
- **Critical assets**: Load immediately
- **Non-critical assets**: Load after page interactive
- **Below-fold images**: Load when visible

## Tools and Resources

### Image Optimization Tools
- [Squoosh](https://squoosh.app/) - Online image compression
- [ImageOptim](https://imageoptim.com/) - Desktop app
- [TinyPNG](https://tinypng.com/) - Online compression
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js image processing

### Analysis Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance analysis
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer) - Bundle size analysis

## Checklist

### Before Deployment
- [ ] Compress all images
- [ ] Convert to WebP/AVIF where possible
- [ ] Add lazy loading to below-fold images
- [ ] Preload critical images
- [ ] Verify image sizes are within targets
- [ ] Test on slow connections
- [ ] Run Lighthouse audit

### Ongoing
- [ ] Monitor Core Web Vitals
- [ ] Optimize images before uploading
- [ ] Use responsive images
- [ ] Implement lazy loading for new images

## Quick Wins

1. **Compress existing images** - 30-50% size reduction
2. **Convert to WebP** - 25-35% additional reduction
3. **Add lazy loading** - Faster initial load
4. **Use responsive images** - Better mobile experience
5. **Preload critical images** - Faster FCP

---

**Last Updated**: Phase 2 Optimization



