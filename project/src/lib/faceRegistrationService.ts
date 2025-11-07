// lib/faceRegistrationService.ts
import { supabase } from './supabase';
import { logger } from '../utils/logger';
import * as faceapi from 'face-api.js';

export interface FaceDescriptor {
  descriptor: Float32Array;
  detection: faceapi.FaceDetection;
}

export interface StaffFaceData {
  id?: string;
  staff_id: string;
  branch_id?: string;
  face_descriptor: number[];
  face_image_url?: string;
  registered_by?: string;
  is_active?: boolean;
  is_primary?: boolean;
  confidence_score?: number;
  device_info?: Record<string, any>;
}

class FaceRegistrationService {
  private modelsLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private modelCacheKey = 'face-api-models-loaded';
  
  /**
   * Mark models as cached in sessionStorage
   */
  private markModelsCached(): void {
    try {
      sessionStorage.setItem(this.modelCacheKey, 'true');
    } catch {
      // SessionStorage might not be available, ignore
    }
  }

  /**
   * Load face-api.js models
   * Call this once before using face detection
   */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) {
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        // Try local models first, fallback to CDN if not available
        const LOCAL_MODEL_URL = '/models';
        const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        
        // Check if local models exist by trying to load one
        let useCDN = false;
        try {
          // Quick check: try to fetch the manifest file
          const response = await fetch(`${LOCAL_MODEL_URL}/tiny_face_detector_model-weights_manifest.json`);
          if (!response.ok) {
            useCDN = true;
          }
        } catch {
          useCDN = true;
        }
        
        const MODEL_URL = useCDN ? CDN_MODEL_URL : LOCAL_MODEL_URL;
        
        if (useCDN) {
          logger.warn('⚠️ Local models not found, using CDN (slower but reliable)');
        } else {
          logger.info('🔄 Loading face-api.js models from local:', MODEL_URL);
        }
        
        // Load models sequentially to better identify which one fails
        logger.info('📦 Loading TinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        logger.info('✓ TinyFaceDetector loaded');
        
        logger.info('📦 Loading FaceLandmark68Net...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        logger.info('✓ FaceLandmark68Net loaded');
        
        logger.info('📦 Loading FaceRecognitionNet...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        logger.info('✓ FaceRecognitionNet loaded');

        this.modelsLoaded = true;
        this.markModelsCached();
        logger.info('✅ All face-api.js models loaded successfully');
      } catch (error: any) {
        logger.error('❌ Error loading face-api.js models:', error);
        
        // Provide more helpful error message
        if (error.message && error.message.includes('tensor')) {
          throw new Error(
            'Model files appear to be corrupted or incomplete. ' +
            'The app will try to use CDN models. If this persists, please check your internet connection. ' +
            'See FACE_REGISTRATION_SETUP.md for manual download instructions.'
          );
        }
        
        throw new Error(
          'Failed to load face recognition models. ' +
          'Tried both local and CDN sources. Please check your internet connection or ' +
          'manually download models to /public/models. ' +
          'See FACE_REGISTRATION_SETUP.md for download instructions.'
        );
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Detect and extract face descriptor from an image
   */
  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDescriptor | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // Detect face with landmarks
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return {
        descriptor: detection.descriptor,
        detection: detection.detection
      };
    } catch (error) {
      console.error('Error detecting face:', error);
      throw error;
    }
  }

  /**
   * Detect multiple faces from an image
   */
  async detectFaces(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDescriptor[]> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections.map(detection => ({
        descriptor: detection.descriptor,
        detection: detection.detection
      }));
    } catch (error) {
      console.error('Error detecting faces:', error);
      throw error;
    }
  }

  /**
   * Convert Float32Array descriptor to number array for JSON storage
   */
  descriptorToArray(descriptor: Float32Array): number[] {
    return Array.from(descriptor);
  }

  /**
   * Convert number array back to Float32Array
   */
  arrayToDescriptor(array: number[]): Float32Array {
    return new Float32Array(array);
  }

  /**
   * Calculate confidence score from detection
   */
  calculateConfidence(detection: faceapi.FaceDetection): number {
    return detection.score;
  }

  /**
   * Save face descriptor to Supabase
   */
  async saveFaceDescriptor(faceData: StaffFaceData): Promise<StaffFaceData> {
    try {
      // If this is set as primary, deactivate other primary faces for this staff
      if (faceData.is_primary) {
        await supabase
          .from('staff_faces')
          .update({ is_primary: false })
          .eq('staff_id', faceData.staff_id)
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('staff_faces')
        .insert({
          staff_id: faceData.staff_id,
          branch_id: faceData.branch_id,
          face_descriptor: faceData.face_descriptor,
          face_image_url: faceData.face_image_url,
          registered_by: faceData.registered_by,
          is_active: faceData.is_active ?? true,
          is_primary: faceData.is_primary ?? true,
          confidence_score: faceData.confidence_score,
          device_info: faceData.device_info
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving face descriptor:', error);
      throw error;
    }
  }

  /**
   * Get face descriptor for a staff member
   */
  async getStaffFace(staffId: string, primaryOnly: boolean = true): Promise<StaffFaceData | null> {
    try {
      let query = supabase
        .from('staff_faces')
        .select('*')
        .eq('staff_id', staffId)
        .eq('is_active', true);

      if (primaryOnly) {
        query = query.eq('is_primary', true);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting staff face:', error);
      throw error;
    }
  }

  /**
   * Update face descriptor
   */
  async updateFaceDescriptor(faceId: string, updates: Partial<StaffFaceData>): Promise<StaffFaceData> {
    try {
      // If setting as primary, deactivate other primary faces
      if (updates.is_primary) {
        const { data: existingFace } = await supabase
          .from('staff_faces')
          .select('staff_id')
          .eq('id', faceId)
          .single();

        if (existingFace) {
          await supabase
            .from('staff_faces')
            .update({ is_primary: false })
            .eq('staff_id', existingFace.staff_id)
            .eq('is_active', true)
            .neq('id', faceId);
        }
      }

      const { data, error } = await supabase
        .from('staff_faces')
        .update(updates)
        .eq('id', faceId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating face descriptor:', error);
      throw error;
    }
  }

  /**
   * Delete face descriptor
   */
  async deleteFaceDescriptor(faceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_faces')
        .delete()
        .eq('id', faceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting face descriptor:', error);
      throw error;
    }
  }

  /**
   * Deactivate face descriptor (soft delete)
   */
  async deactivateFaceDescriptor(faceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('staff_faces')
        .update({ is_active: false })
        .eq('id', faceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating face descriptor:', error);
      throw error;
    }
  }

  /**
   * Compare two face descriptors and return similarity score
   */
  compareDescriptors(descriptor1: Float32Array, descriptor2: Float32Array): number {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
  }

  /**
   * Find matching staff by face descriptor
   */
  async findMatchingStaff(descriptor: Float32Array, threshold: number = 0.6): Promise<Array<{ staff_id: string; distance: number }>> {
    try {
      // Get all active primary face descriptors
      const { data: allFaces, error } = await supabase
        .from('staff_faces')
        .select('id, staff_id, face_descriptor')
        .eq('is_active', true)
        .eq('is_primary', true);

      if (error) throw error;

      if (!allFaces || allFaces.length === 0) {
        return [];
      }

      // Compare with all stored descriptors
      const matches: Array<{ staff_id: string; distance: number }> = [];

      for (const face of allFaces) {
        const storedDescriptor = this.arrayToDescriptor(face.face_descriptor as number[]);
        const distance = this.compareDescriptors(descriptor, storedDescriptor);

        if (distance <= threshold) {
          matches.push({
            staff_id: face.staff_id,
            distance
          });
        }
      }

      // Sort by distance (lower is better)
      matches.sort((a, b) => a.distance - b.distance);

      return matches;
    } catch (error) {
      console.error('Error finding matching staff:', error);
      throw error;
    }
  }
}

export const faceRegistrationService = new FaceRegistrationService();

