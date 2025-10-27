import { supabase } from './supabase'
import { ProductImage } from '../types'

// ✅ Image optimization utilities (inline for now, can be extracted)
const optimizeImage = async (file: File): Promise<File> => {
  try {
    // Dynamically import to avoid loading unless needed
    const imageCompression = (await import('browser-image-compression')).default
    
    console.log('🖼️  Optimizing image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    
    const options = {
      maxSizeMB: 0.5,           // Compress to max 500KB
      maxWidthOrHeight: 1920,   // Max dimension for product images
      useWebWorker: true,       // Use web worker for better performance
      fileType: 'image/webp'    // Convert to WebP for better compression
    }
    
    const compressedFile = await imageCompression(file, options)
    
    console.log('✅ Image optimized:', compressedFile.name, 'New size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')
    
    return compressedFile
  } catch (error) {
    console.error('⚠️  Image optimization failed, using original:', error)
    return file // Return original if optimization fails
  }
}

class ProductImageService {
  /**
   * Get all images for a specific product
   */
  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // First try with is_active filter
      let { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      // If is_active column doesn't exist, try without it
      if (error && error.code === '42703') {
        console.warn('is_active column not found, fetching without filter')
        const retryResult = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
        
        data = retryResult.data
        error = retryResult.error
      }

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching product images:', error)
      throw error
    }
  }

  /**
   * Get main image for a product (first image with type 'main' or first image)
   */
  async getMainProductImage(productId: string): Promise<ProductImage | null> {
    try {
      // First try with is_active filter
      let { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      // If is_active column doesn't exist, try without it
      if (error && error.code === '42703') {
        console.warn('is_active column not found, fetching without filter')
        const retryResult = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        
        data = retryResult.data
        error = retryResult.error
      }

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching main product image:', error)
      return null
    }
  }

  /**
   * Get gallery images for a product (all images except main)
   */
  async getGalleryImages(productId: string): Promise<ProductImage[]> {
    try {
      // First try with is_active filter
      let { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .neq('image_type', 'main')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      // If is_active column doesn't exist, try without it
      if (error && error.code === '42703') {
        console.warn('is_active column not found, fetching without filter')
        const retryResult = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .neq('image_type', 'main')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
        
        data = retryResult.data
        error = retryResult.error
      }

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching gallery images:', error)
      throw error
    }
  }

  /**
   * Get all images for multiple products (batch fetch)
   */
  async getMultipleProductImages(productIds: string[]): Promise<Record<string, ProductImage[]>> {
    try {
      // First try with is_active filter
      let { data, error } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('product_id')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      // If is_active column doesn't exist, try without it
      if (error && error.code === '42703') {
        console.warn('is_active column not found, fetching without filter')
        const retryResult = await supabase
          .from('product_images')
          .select('*')
          .in('product_id', productIds)
          .order('product_id')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
        
        data = retryResult.data
        error = retryResult.error
      }

      if (error) throw error

      // Group images by product_id
      const imagesByProduct: Record<string, ProductImage[]> = {}
      data?.forEach(image => {
        if (!imagesByProduct[image.product_id]) {
          imagesByProduct[image.product_id] = []
        }
        imagesByProduct[image.product_id].push(image)
      })

      return imagesByProduct
    } catch (error) {
      console.error('Error fetching multiple product images:', error)
      throw error
    }
  }

  /**
   * ✅ OPTIMIZED: Upload a new product image with automatic compression
   */
  async uploadProductImage(
    productId: string,
    imageFile: File,
    imageType: ProductImage['image_type'] = 'gallery',
    altText?: string
  ): Promise<ProductImage> {
    try {
      console.log('📤 Starting image upload for product:', productId)
      
      // ✅ OPTIMIZATION: Compress image before upload
      const optimizedFile = await optimizeImage(imageFile)
      
      // Upload to Supabase Storage
      const fileExt = optimizedFile.name.split('.').pop()
      const fileName = `${productId}/${Date.now()}.${fileExt}`
      
      console.log('☁️  Uploading to Supabase Storage:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, optimizedFile, {
          cacheControl: '31536000', // ✅ Cache for 1 year
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      console.log('✅ Image uploaded successfully:', publicUrl)

      // Save image metadata to database
      const imageData = {
        product_id: productId,
        image_url: publicUrl,
        image_name: optimizedFile.name,
        image_type: imageType,
        alt_text: altText,
        file_size: optimizedFile.size, // ✅ Store optimized file size
        sort_order: 0
      }

      const { data, error } = await supabase
        .from('product_images')
        .insert(imageData)
        .select()
        .single()

      if (error) throw error
      
      console.log('✅ Image metadata saved to database')
      
      return data
    } catch (error) {
      console.error('❌ Error uploading product image:', error)
      throw error
    }
  }

  /**
   * ✅ NEW: Upload multiple images with progress tracking
   */
  async uploadMultipleProductImages(
    productId: string,
    imageFiles: File[],
    imageType: ProductImage['image_type'] = 'gallery',
    onProgress?: (current: number, total: number) => void
  ): Promise<ProductImage[]> {
    const uploadedImages: ProductImage[] = []
    
    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const image = await this.uploadProductImage(productId, imageFiles[i], imageType)
        uploadedImages.push(image)
        
        // Report progress
        onProgress?.(i + 1, imageFiles.length)
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error)
        // Continue with other images even if one fails
      }
    }
    
    return uploadedImages
  }

  /**
   * Delete a product image
   */
  async deleteProductImage(imageId: string): Promise<void> {
    try {
      // Get image data first to get the file path
      const { data: imageData, error: fetchError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('id', imageId)
        .single()

      if (fetchError) throw fetchError

      // Extract file path from URL
      const url = new URL(imageData.image_url)
      const filePath = url.pathname.split('/').slice(3).join('/') // Remove /storage/v1/object/product-images/

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([filePath])

      if (storageError) {
        console.warn('Error deleting from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)

      if (dbError) throw dbError
      
      console.log('✅ Image deleted successfully:', imageId)
    } catch (error) {
      console.error('Error deleting product image:', error)
      throw error
    }
  }

  /**
   * Update image metadata
   */
  async updateProductImage(
    imageId: string,
    updates: Partial<Pick<ProductImage, 'alt_text' | 'sort_order' | 'image_type'>>
  ): Promise<ProductImage> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', imageId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating product image:', error)
      throw error
    }
  }

  /**
   * ✅ NEW: Get optimized image URL with transformations
   * Useful for thumbnails and different sizes
   */
  getOptimizedImageUrl(
    imageUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'jpg'
    } = {}
  ): string {
    if (!imageUrl) return ''
    
    // Check if it's a Supabase Storage URL
    if (!imageUrl.includes('supabase.co/storage')) {
      return imageUrl // Return as-is if not from Supabase
    }
    
    // Build transformation parameters
    const params = new URLSearchParams()
    
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    if (options.format) params.append('format', options.format)
    
    // Add transformations to URL if any
    if (params.toString()) {
      const separator = imageUrl.includes('?') ? '&' : '?'
      return `${imageUrl}${separator}${params.toString()}`
    }
    
    return imageUrl
  }

  /**
   * ✅ NEW: Preload images for better perceived performance
   */
  async preloadImages(imageUrls: string[]): Promise<void> {
    const preloadPromises = imageUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
        img.src = url
      })
    })

    try {
      await Promise.all(preloadPromises)
      console.log('✅ All images preloaded successfully')
    } catch (error) {
      console.warn('⚠️  Some images failed to preload:', error)
    }
  }
}

export const productImageService = new ProductImageService()
export default productImageService
