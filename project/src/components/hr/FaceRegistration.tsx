// components/hr/FaceRegistration.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { faceRegistrationService, StaffFaceData } from '../../lib/faceRegistrationService';
import { customAuth } from '../../lib/customAuth';

interface FaceRegistrationProps {
  staffId?: string; // Required for edit mode, optional for add mode
  branchId?: string;
  staffName?: string;
  onFaceRegistered?: (faceData: StaffFaceData) => void;
  onCancel?: () => void;
  existingFaceData?: StaffFaceData | null;
}

const FaceRegistration: React.FC<FaceRegistrationProps> = ({
  staffId,
  branchId,
  staffName,
  onFaceRegistered,
  onCancel,
  existingFaceData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'idle' | 'capturing' | 'processing' | 'success'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    // Load models when component mounts
    loadModels();
    
    return () => {
      // Cleanup: stop video stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      setIsModelsLoading(true);
      await faceRegistrationService.loadModels();
    } catch (err: any) {
      setError(`Failed to load face recognition models: ${err.message}`);
    } finally {
      setIsModelsLoading(false);
    }
  };

  // Detect if device is mobile/tablet
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  };

  const startCamera = async () => {
    try {
      setError(null);
      setStep('capturing');
      
      // Check if we're on HTTPS or localhost (required for camera access on mobile)
      const isSecureContext = window.isSecureContext || 
                              location.protocol === 'https:' || 
                              location.hostname === 'localhost' || 
                              location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please access this page over HTTPS or use localhost.');
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices) {
        // Try legacy API for older browsers
        const getUserMedia = navigator.mediaDevices?.getUserMedia ||
                            (navigator as any).getUserMedia ||
                            (navigator as any).webkitGetUserMedia ||
                            (navigator as any).mozGetUserMedia;
        
        if (!getUserMedia) {
          throw new Error('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        }
      }
      
      // Check if getUserMedia method exists
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available. Please ensure you are using a modern browser and the page is served over HTTPS.');
      }

      // Optimize camera constraints based on device type
      const isMobile = isMobileDevice();
      const videoConstraints: MediaTrackConstraints = {
        // Prioritize front-facing camera (user-facing) for all devices
        facingMode: { ideal: 'user' },
        // Optimize resolution for different devices
        width: isMobile 
          ? { ideal: 640, max: 1280 }  // Lower resolution for mobile to improve performance
          : { ideal: 1280, max: 1920 }, // Higher resolution for laptops/desktops
        height: isMobile
          ? { ideal: 480, max: 720 }
          : { ideal: 720, max: 1080 },
        // Additional constraints for better face detection
        aspectRatio: { ideal: 4 / 3 }, // Standard aspect ratio for face recognition
      };

      console.log('📷 Requesting camera access with constraints:', videoConstraints);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false // No audio needed for face recognition
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        
        // Log camera info for debugging
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          console.log('✅ Camera activated:', {
            deviceId: settings.deviceId,
            facingMode: settings.facingMode,
            width: settings.width,
            height: settings.height,
            label: videoTrack.label
          });
        }
      }
    } catch (err: any) {
      console.error('❌ Error accessing webcam:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please ensure a camera is connected.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support the required settings. Trying with basic settings...';
        // Try with minimal constraints as fallback
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            streamRef.current = fallbackStream;
            await videoRef.current.play();
            return; // Success with fallback
          }
        } catch (fallbackErr) {
          errorMessage = 'Camera access failed. Please check your device settings.';
        }
      } else {
        errorMessage += err.message || 'Please check your camera permissions and try again.';
      }
      
      setError(errorMessage);
      setStep('idle');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStep('idle');
    setFaceDetected(false);
    setCapturedImage(null);
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Video or canvas not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStep('processing');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);

      // Create image element for face detection
      const img = new Image();
      img.src = imageDataUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Detect face
      const faceData = await faceRegistrationService.detectFace(img);
      
      if (!faceData) {
        setError('No face detected. Please ensure your face is clearly visible and well-lit.');
        setStep('capturing');
        setFaceDetected(false);
        setIsLoading(false);
        return;
      }

      setFaceDetected(true);
      
      // Calculate confidence
      const confidence = faceRegistrationService.calculateConfidence(faceData.detection);
      
      if (confidence < 0.5) {
        setError('Face detection confidence is too low. Please try again with better lighting.');
        setStep('capturing');
        setFaceDetected(false);
        setIsLoading(false);
        return;
      }

      // If staffId is provided (edit mode or after staff creation), save immediately
      if (staffId) {
        await saveFaceDescriptor(faceData, imageDataUrl, confidence);
      } else {
        // For add mode, just prepare the data and call callback
        const descriptorArray = faceRegistrationService.descriptorToArray(faceData.descriptor);
        const faceDataToSave: StaffFaceData = {
          staff_id: '', // Will be set when staff is created
          branch_id: branchId,
          face_descriptor: descriptorArray,
          face_image_url: imageDataUrl,
          confidence_score: confidence,
          is_active: true,
          is_primary: true
        };
        
        setStep('success');
        if (onFaceRegistered) {
          onFaceRegistered(faceDataToSave);
        }
      }
    } catch (err: any) {
      console.error('Error capturing face:', err);
      setError(err.message || 'Failed to capture and process face');
      setStep('capturing');
      setFaceDetected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFaceDescriptor = async (
    faceData: any, 
    imageDataUrl: string, 
    confidence: number
  ) => {
    if (!staffId) {
      setError('Staff ID is required to save face data');
      return;
    }

    try {
      setIsLoading(true);
      
      const currentUser = customAuth.getCurrentUser();
      const descriptorArray = faceRegistrationService.descriptorToArray(faceData.descriptor);
      
      const faceDataToSave: StaffFaceData = {
        staff_id: staffId,
        branch_id: branchId,
        face_descriptor: descriptorArray,
        face_image_url: imageDataUrl,
        registered_by: currentUser?.id,
        confidence_score: confidence,
        is_active: true,
        is_primary: true,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      };

      // If existing face data exists, update it; otherwise create new
      if (existingFaceData?.id) {
        await faceRegistrationService.updateFaceDescriptor(existingFaceData.id, faceDataToSave);
      } else {
        await faceRegistrationService.saveFaceDescriptor(faceDataToSave);
      }

      setStep('success');
      setSuccess(true);
      
      if (onFaceRegistered) {
        onFaceRegistered(faceDataToSave);
      }
    } catch (err: any) {
      console.error('Error saving face descriptor:', err);
      setError(err.message || 'Failed to save face data');
      setStep('capturing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSuccess(false);
    setFaceDetected(false);
    setCapturedImage(null);
    setStep('capturing');
  };

  return (
    <div className="face-registration bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Face Registration</h3>
            {staffName && (
              <p className="text-sm text-gray-500">Registering face for {staffName}</p>
            )}
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Face registered successfully!</p>
        </div>
      )}

      {/* Models Loading */}
      {isModelsLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-blue-700">Loading face recognition models...</p>
        </div>
      )}

      {/* Video Preview */}
      {step === 'capturing' && (
        <div className="mb-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: 'scaleX(-1)', // Mirror the video for better UX (like a selfie camera)
                WebkitTransform: 'scaleX(-1)', // Safari support
              }}
            />
            {faceDetected && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Face Detected
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedImage && step !== 'capturing' && (
        <div className="mb-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <img
              src={capturedImage}
              alt="Captured face"
              className="w-full h-full object-cover"
            />
            {faceDetected && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Face Detected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Ensure good lighting on your face</li>
          <li>Look directly at the camera</li>
          <li>Remove glasses or hat if possible</li>
          <li>Keep a neutral expression</li>
          <li>Stay still when capturing</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {step === 'idle' && (
          <button
            type="button"
            onClick={startCamera}
            disabled={isModelsLoading || isLoading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isModelsLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Models...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        )}

        {step === 'capturing' && (
          <>
            <button
              type="button"
              onClick={captureAndDetect}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Capture Face</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}

        {step === 'success' && (
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Register Another Face</span>
          </button>
        )}

        {step === 'processing' && (
          <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing face data...</span>
          </div>
        )}
      </div>

      {/* Existing Face Info */}
      {existingFaceData && !success && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            A face is already registered for this staff member. Registering a new face will replace the existing one.
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;



