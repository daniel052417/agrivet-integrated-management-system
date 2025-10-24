import imageCompression from 'browser-image-compression'

export interface ImageOptimizationOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: string
}

export const optimizeImage = async (
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 0.5,           // Compress to max 500KB
    maxWidthOrHeight: 1920,   // Max dimension
    useWebWorker: true,       // Use web worker for better performance
    fileType: 'image/webp',   // Convert to WebP for better compression
    ...options
  }

  try {
    console.log('🖼️ Optimizing image:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    
    const compressedFile = await imageCompression(file, defaultOptions)
    
    console.log('✅ Image optimized:', compressedFile.name, 'Size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')
    
    return compressedFile
  } catch (error) {
    console.error('❌ Image optimization failed:', error)
    return file // Return original if optimization fails
  }
}

// Preload images for better performance
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

// Lazy load images with Intersection Observer
export const lazyLoadImage = (img: HTMLImageElement) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyImg = entry.target as HTMLImageElement
        if (lazyImg.dataset.src) {
          lazyImg.src = lazyImg.dataset.src
          lazyImg.classList.add('loaded')
          observer.unobserve(lazyImg)
        }
      }
    })
  }, {
    rootMargin: '50px' // Start loading 50px before image enters viewport
  })

  observer.observe(img)
}
