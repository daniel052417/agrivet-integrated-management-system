import { supabase } from './supabase';
import { ImageUploadResponse, ImageUploadOptions } from '../types/marketing';

// ============================================================================
// FILE UPLOAD & IMAGE PROCESSING SERVICE
// ============================================================================

export class FileUploadService {
  private static instance: FileUploadService;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  private constructor() {}

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  // ============================================================================
  // IMAGE UPLOAD METHODS
  // ============================================================================

  public async uploadImage(
    file: File, 
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    try {
      // Validate file
      this.validateImageFile(file, options);

      // Generate unique filename
      const filename = this.generateFilename(file.name, options.folder);
      
      // Process image if needed
      const processedFile = await this.processImage(file, options);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('marketing-assets')
        .upload(filename, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filename);

      return {
        url: urlData.publicUrl,
        path: filename,
        public_id: filename
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  public async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('marketing-assets')
        .remove([path]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  public async getImageUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from('marketing-assets')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // ============================================================================
  // IMAGE PROCESSING METHODS
  // ============================================================================

  private async processImage(file: File, options: ImageUploadOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            options.width, 
            options.height
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and resize image
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(processedFile);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            file.type,
            options.quality || 0.8
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth?: number, 
    maxHeight?: number
  ): { width: number; height: number } {
    if (!maxWidth && !maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    if (maxWidth && maxHeight) {
      // Fit within both constraints
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else if (maxWidth) {
      // Scale to max width
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    } else if (maxHeight) {
      // Scale to max height
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  private validateImageFile(file: File, options: ImageUploadOptions): void {
    // Check file size
    const maxSize = options.maxSize || this.maxFileSize;
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${this.formatFileSize(maxSize)}`);
    }

    // Check file type
    const allowedTypes = options.allowedTypes || this.allowedImageTypes;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const fileExtension = this.getFileExtension(file.name);
    const allowedExtensions = options.allowedTypes 
      ? this.getExtensionsFromTypes(options.allowedTypes)
      : this.allowedImageExtensions;
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`File extension must be one of: ${allowedExtensions.join(', ')}`);
    }
  }

  private getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  private getExtensionsFromTypes(types: string[]): string[] {
    return types.map(type => {
      switch (type) {
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/webp': return '.webp';
        case 'image/gif': return '.gif';
        default: return '';
      }
    }).filter(ext => ext);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateFilename(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);
    const baseName = originalName.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    const filename = `${baseName}_${timestamp}_${randomString}${extension}`;
    
    return folder ? `${folder}/${filename}` : filename;
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  public async uploadMultipleImages(
    files: File[], 
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    
    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  public async deleteMultipleImages(paths: string[]): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('marketing-assets')
        .remove(paths);

      if (error) {
        throw new Error(`Bulk delete failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      return false;
    }
  }

  // ============================================================================
  // STORAGE MANAGEMENT
  // ============================================================================

  public async listImages(folder?: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('marketing-assets')
        .list(folder || '', {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data.map(item => item.name);
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  public async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      // This would require a custom function in Supabase
      // For now, return a placeholder
      return {
        used: 0,
        available: 100 * 1024 * 1024 // 100MB placeholder
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, available: 0 };
    }
  }

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================

  public async optimizeImage(
    file: File, 
    targetSizeKB: number = 200
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Start with original dimensions
          let { width, height } = { width: img.width, height: img.height };
          let quality = 0.9;

          // Calculate initial file size
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }

            const currentSizeKB = blob.size / 1024;

            if (currentSizeKB <= targetSizeKB) {
              // Already small enough
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(optimizedFile);
              return;
            }

            // Need to reduce size
            const scaleFactor = Math.sqrt(targetSizeKB / currentSizeKB);
            width = Math.round(width * scaleFactor);
            height = Math.round(height * scaleFactor);

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (optimizedBlob) => {
                if (optimizedBlob) {
                  const optimizedFile = new File([optimizedBlob], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                  });
                  resolve(optimizedFile);
                } else {
                  reject(new Error('Failed to optimize image'));
                }
              },
              file.type,
              quality
            );
          }, file.type, quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const fileUploadService = FileUploadService.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const uploadImage = (file: File, options?: ImageUploadOptions) => 
  fileUploadService.uploadImage(file, options);

export const deleteImage = (path: string) => 
  fileUploadService.deleteImage(path);

export const getImageUrl = (path: string) => 
  fileUploadService.getImageUrl(path);

export const uploadMultipleImages = (files: File[], options?: ImageUploadOptions) => 
  fileUploadService.uploadMultipleImages(files, options);

export const deleteMultipleImages = (paths: string[]) => 
  fileUploadService.deleteMultipleImages(paths);

export const optimizeImage = (file: File, targetSizeKB?: number) => 
  fileUploadService.optimizeImage(file, targetSizeKB);
