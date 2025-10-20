import { supabase } from './supabase'
import { ProductImage } from '../types'

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
   * Upload a new product image
   */
  async uploadProductImage(
    productId: string,
    imageFile: File,
    imageType: ProductImage['image_type'] = 'gallery',
    altText?: string
  ): Promise<ProductImage> {
    try {
      // Upload to Supabase Storage
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${productId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // Save image metadata to database
      const imageData = {
        product_id: productId,
        image_url: publicUrl,
        image_name: imageFile.name,
        image_type: imageType,
        alt_text: altText,
        file_size: imageFile.size,
        sort_order: 0
      }

      const { data, error } = await supabase
        .from('product_images')
        .insert(imageData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error uploading product image:', error)
      throw error
    }
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
}

export const productImageService = new ProductImageService()
export default productImageService
