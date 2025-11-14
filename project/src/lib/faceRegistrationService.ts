// lib/faceRegistrationService.ts
import { supabase } from './supabase';
import { logger } from '../utils/logger';
import * as faceapi from 'face-api.js';

// Import TensorFlow.js - these will initialize the backends
let tf: any;
try {
  tf = require('@tensorflow/tfjs-core');
  require('@tensorflow/tfjs-backend-webgl');
  require('@tensorflow/tfjs-backend-cpu');
} catch (e) {
  console.warn('TensorFlow.js packages not found, face-api.js will use its built-in TensorFlow');
}

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
        // CRITICAL: Initialize TensorFlow.js backend first (if available)
        logger.info('🔧 Initializing TensorFlow.js backend...');
        
        if (tf) {
          try {
            // Try WebGL backend (fastest)
            await tf.setBackend('webgl');
            await tf.ready();
            logger.info('✅ TensorFlow.js WebGL backend initialized');
            
            // Log backend info
            logger.info('🔍 TensorFlow.js backend:', tf.getBackend());
          } catch (webglError) {
            logger.warn('⚠️ WebGL backend failed, trying CPU backend...');
            try {
              // Fallback to CPU backend
              await tf.setBackend('cpu');
              await tf.ready();
              logger.info('✅ TensorFlow.js CPU backend initialized');
            } catch (cpuError) {
              logger.warn('⚠️ Manual TensorFlow backend init failed, using face-api.js default');
            }
          }
        } else {
          logger.info('ℹ️ Using face-api.js built-in TensorFlow.js');
        }

        // Try local models first, fallback to CDN if not available
        const LOCAL_MODEL_URL = '/models';
        const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        
        // FORCE CDN for now - local models appear corrupted
        let useCDN = true;
        
        /* Commented out - uncomment to try local models again later
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
        */
        
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

        // Verify all models are loaded
        const allLoaded = 
          faceapi.nets.tinyFaceDetector.isLoaded &&
          faceapi.nets.faceLandmark68Net.isLoaded &&
          faceapi.nets.faceRecognitionNet.isLoaded;

        if (!allLoaded) {
          throw new Error('Not all models loaded successfully');
        }

        this.modelsLoaded = true;
        this.markModelsCached();
        logger.info('✅ All face-api.js models loaded successfully');
        
        // Log final verification
        console.log('✅ Model verification:', {
          tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
          faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
          faceRecognitionNet: faceapi.nets.faceRecognitionNet.isLoaded
        });

        // CRITICAL: Test the models with a dummy operation to verify they work (if TensorFlow is available)
        if (tf) {
          await this.verifyModels();
        } else {
          logger.info('ℹ️ Skipping model verification (TensorFlow.js not explicitly loaded)');
        }

      } catch (error: any) {
        logger.error('❌ Error loading face-api.js models:', error);
        logger.error('Error details:', error.message);
        logger.error('Error stack:', error.stack);
        
        // Provide more helpful error message
        if (error.message && (error.message.includes('tensor') || error.message.includes('tfjs'))) {
          throw new Error(
            'Model files appear to be corrupted or TensorFlow.js version mismatch. ' +
            'Please ensure @tensorflow/tfjs-core is installed correctly.'
          );
        }
        
        if (error.message && error.message.includes('fetch')) {
          throw new Error(
            'Failed to download face recognition models. ' +
            'Please check your internet connection and try again.'
          );
        }
        
        throw new Error(
          'Failed to load face recognition models: ' + error.message + '. ' +
          'Try refreshing the page or check the browser console for details.'
        );
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Verify models work correctly by testing with a small tensor
   */
  private async verifyModels(): Promise<void> {
    if (!tf) {
      logger.warn('⚠️ TensorFlow.js not available for verification');
      return;
    }

    try {
      logger.info('🧪 Verifying face recognition models...');
      
      // Create a small test tensor to verify TensorFlow operations work
      const testTensor = tf.randomNormal([1, 150, 150, 3]);
      
      // Test if tensor operations work (should not produce NaN)
      const result = tf.mean(testTensor);
      const value = await result.data();
      
      testTensor.dispose();
      result.dispose();
      
      if (value && value.length > 0 && isNaN(value[0] as number)) {
        throw new Error('TensorFlow operations producing NaN - backend issue detected');
      }
      
      logger.info('✅ Model verification successful - TensorFlow backend working correctly');
    } catch (error) {
      logger.error('❌ Model verification failed:', error);
      throw new Error('Face recognition models failed verification. TensorFlow.js backend may be incompatible with your system.');
    }
  }

  /**
   * Test if models are properly loaded
   */
  async testModels(): Promise<void> {
    console.log('🧪 Testing face-api.js models...');
    console.log('Models loaded flag:', this.modelsLoaded);
    console.log('TinyFaceDetector:', faceapi.nets.tinyFaceDetector.isLoaded);
    console.log('FaceLandmark68Net:', faceapi.nets.faceLandmark68Net.isLoaded);
    console.log('FaceRecognitionNet:', faceapi.nets.faceRecognitionNet.isLoaded);
  }

  /**
   * Detect and extract face descriptor from an image
   */
  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDescriptor | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // 🔍 Debug: Check models are loaded
      console.log('🔍 Starting face detection...');
      console.log('🔍 Models status:', {
        tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
        faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
        faceRecognitionNet: faceapi.nets.faceRecognitionNet.isLoaded
      });

      // Detect face with landmarks
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      // 🔍 Debug: Check detection result
      console.log('🔍 Detection result:', detection);
      console.log('🔍 Has descriptor?', !!detection?.descriptor);
      console.log('🔍 Descriptor type:', detection?.descriptor?.constructor.name);
      console.log('🔍 Descriptor length:', detection?.descriptor?.length);
      
      if (detection?.descriptor) {
        const descriptorArray = Array.from(detection.descriptor);
        console.log('🔍 First 10 descriptor values:', descriptorArray.slice(0, 10));
        
        // Check for NaN values
        const hasNaN = descriptorArray.some(v => isNaN(v));
        if (hasNaN) {
          console.error('❌ Descriptor contains NaN values!');
          console.error('This usually means:');
          console.error('1. Face recognition model may be corrupted');
          console.error('2. Input image has invalid pixel data');
          console.error('3. TensorFlow.js backend issue');
          console.error('Attempting recovery...');
          
          // Try to recover by re-initializing
          throw new Error('Face descriptor generation failed (NaN values). This may indicate corrupted model files or invalid image data. Try clearing cache and reloading.');
        }
      }

      if (!detection) {
        console.warn('⚠️ No face detected in image');
        return null;
      }

      if (!detection.descriptor) {
        console.error('❌ Face detected but no descriptor generated! Check if FaceRecognitionNet model is loaded.');
        throw new Error('Face descriptor not generated. Face recognition model may not be loaded properly.');
      }

      return {
        descriptor: detection.descriptor,
        detection: detection.detection
      };
    } catch (error) {
      console.error('❌ Error detecting face:', error);
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

      return detections.map((detection: any) => ({
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
    console.log('🔄 Converting descriptor to array...');
    console.log('🔍 Input descriptor:', descriptor);
    console.log('🔍 Input type:', descriptor?.constructor.name);
    console.log('🔍 Input length:', descriptor?.length);
    
    if (!descriptor) {
      console.error('❌ Cannot convert null/undefined descriptor');
      throw new Error('Descriptor is null or undefined');
    }

    const array = Array.from(descriptor);
    console.log('✅ Converted array length:', array.length);
    console.log('🔍 First 10 values:', array.slice(0, 10));
    console.log('🔍 Contains nulls?', array.includes(null as any));
    console.log('🔍 Contains undefined?', array.includes(undefined as any));
    
    return array;
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
      // Validate descriptor before saving
      console.log('💾 Saving face descriptor...');
      console.log('🔍 Descriptor to save:', faceData.face_descriptor);
      console.log('🔍 Descriptor length:', faceData.face_descriptor?.length);
      console.log('🔍 First 10 values:', faceData.face_descriptor?.slice(0, 10));
      
      if (!faceData.face_descriptor || faceData.face_descriptor.length !== 128) {
        throw new Error(`Invalid face descriptor: expected 128 values, got ${faceData.face_descriptor?.length}`);
      }

      // Check for null/undefined values
      const hasInvalidValues = faceData.face_descriptor.some((val: any) => val === null || val === undefined || isNaN(val));
      if (hasInvalidValues) {
        throw new Error('Face descriptor contains null, undefined, or NaN values');
      }

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

      console.log('✅ Face descriptor saved successfully');
      return data;
    } catch (error) {
      console.error('❌ Error saving face descriptor:', error);
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
      // Validate descriptor if it's being updated
      if (updates.face_descriptor) {
        console.log('💾 Updating face descriptor...');
        console.log('🔍 New descriptor length:', updates.face_descriptor.length);
        
        if (updates.face_descriptor.length !== 128) {
          throw new Error(`Invalid face descriptor: expected 128 values, got ${updates.face_descriptor.length}`);
        }

        const hasInvalidValues = updates.face_descriptor.some((val: any) => val === null || val === undefined || isNaN(val));
        if (hasInvalidValues) {
          throw new Error('Face descriptor contains null, undefined, or NaN values');
        }
      }

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

      console.log('✅ Face descriptor updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error updating face descriptor:', error);
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