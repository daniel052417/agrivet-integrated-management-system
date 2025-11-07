/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images and lazy loading
 */

export interface ImageOptimizationOptions {
  quality?: number; // 0-100, default 80
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  width?: number;
  height?: number;
  lazy?: boolean;
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Check if browser supports AVIF format
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Get optimal image format for browser
 */
export async function getOptimalFormat(): Promise<'webp' | 'avif' | 'jpg'> {
  // AVIF has better compression but less support
  if (await supportsAVIF()) {
    return 'avif';
  }
  
  // WebP has good support and compression
  if (supportsWebP()) {
    return 'webp';
  }
  
  // Fallback to JPG
  return 'jpg';
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  basePath: string,
  widths: number[] = [320, 640, 1024, 1920]
): string {
  return widths
    .map((width) => `${basePath}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  options: { threshold?: number } = {}
): () => void {
  const { threshold = 0.1 } = options;
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            imgElement.src = src;
            imgElement.classList.remove('lazy');
            observer.unobserve(imgElement);
          }
        });
      },
      { threshold }
    );
    
    observer.observe(imgElement);
    
    return () => observer.disconnect();
  } else {
    // Fallback for browsers without IntersectionObserver
    imgElement.src = src;
    return () => {};
  }
}

/**
 * Preload image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * React hook factory for lazy loading images
 * Usage in component:
 * import React from 'react';
 * import { createLazyImageHook } from './utils/imageOptimizer';
 * const useLazyImage = createLazyImageHook(React);
 */
export function createLazyImageHook(React: any) {
  return function useLazyImage(src: string, options: { threshold?: number } = {}) {
    const [imageSrc, setImageSrc] = React.useState<string>('');
    const [isLoaded, setIsLoaded] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);
    
    React.useEffect(() => {
      if (!imgRef.current || !('IntersectionObserver' in window)) {
        setImageSrc(src);
        return;
      }
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              setIsLoaded(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: options.threshold || 0.1 }
      );
      
      observer.observe(imgRef.current);
      
      return () => observer.disconnect();
    }, [src, options.threshold]);
    
    return { imgRef, imageSrc, isLoaded, setIsLoaded };
  };
}

