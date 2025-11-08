// components/attendance/AttendanceTerminal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Camera, LogOut, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { faceRegistrationService } from '../../lib/faceRegistrationService';
import { attendanceService, StaffInfo } from '../../lib/attendanceService';
import * as faceapi from 'face-api.js';

type ActionType = 'timein' | 'timeout' | null;
type Status = 'idle' | 'loading' | 'detecting' | 'matching' | 'recording' | 'success' | 'error';

interface DetectionResult {
  staffInfo: StaffInfo;
  confidence: number;
}

const AttendanceTerminal: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus('loading');
        setStatusMessage('Loading face recognition models...');
        await faceRegistrationService.loadModels();
        setModelsLoaded(true);
        setStatus('idle');
        setStatusMessage('Models loaded. Ready to detect faces.');
      } catch (err: any) {
        console.error('Error loading models:', err);
        setError('Failed to load face recognition models. Please refresh the page.');
        setStatus('error');
        setStatusMessage(err.message || 'Model loading failed');
      }
    };

    loadModels();

    return () => {
      // Cleanup: stop webcam and clear intervals
      stopWebcam();
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, []);

  // Detect if device is mobile/tablet
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  };

  // Check camera permission status
  const checkCameraPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return 'denied';
      }

      // Check permission status using Permissions API if available
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          return permissionStatus.state as 'granted' | 'denied' | 'prompt';
        } catch (permErr) {
          // Permissions API might not support camera on all browsers
          console.log('Permissions API not fully supported, will request directly');
        }
      }

      // If Permissions API is not available, we'll try to request directly
      return 'prompt';
    } catch (err) {
      console.error('Error checking camera permission:', err);
      return 'prompt';
    }
  };

  // Start webcam with optimized settings for mobile/laptop/tablet
  const startWebcam = async () => {
    try {
      // Check if we're on HTTPS or localhost (required for camera access on mobile)
      const isSecureContext = window.isSecureContext || 
                              location.protocol === 'https:' || 
                              location.hostname === 'localhost' || 
                              location.hostname === '127.0.0.1' ||
                              location.hostname.includes('.vercel.app') ||
                              location.hostname.includes('.netlify.app');
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please access this page over HTTPS or use localhost.');
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Try legacy API for older browsers
        const legacyGetUserMedia = (navigator as any).getUserMedia ||
                                  (navigator as any).webkitGetUserMedia ||
                                  (navigator as any).mozGetUserMedia;
        
        if (!legacyGetUserMedia) {
          throw new Error('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        }
        
        // Use legacy API as fallback
        return new Promise<void>((resolve, reject) => {
          legacyGetUserMedia.call(navigator, 
            { video: { facingMode: 'user' }, audio: false },
            (stream: MediaStream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsWebcamActive(true);
                setError(null);
                resolve();
              }
            },
            (err: any) => {
              console.error('❌ Legacy getUserMedia error:', err);
              reject(err);
            }
          );
        });
      }

      // Check permission status first
      const permissionStatus = await checkCameraPermission();
      
      if (permissionStatus === 'denied') {
        throw new Error('Camera access is blocked. Please enable camera permissions in your browser settings and refresh the page.');
      }

      // Optimize camera constraints based on device type
      const isMobile = isMobileDevice();
      
      // Try with preferred constraints first
      let videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: 'user' }, // Front-facing camera
        width: isMobile ? { ideal: 640 } : { ideal: 1280 },
        height: isMobile ? { ideal: 480 } : { ideal: 720 },
      };

      console.log('📷 Requesting camera access with constraints:', videoConstraints);

      let stream: MediaStream;
      
      try {
        // First attempt with preferred constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (constraintError: any) {
        // If constraints fail, try with minimal constraints
        if (constraintError.name === 'OverconstrainedError' || constraintError.name === 'ConstraintNotSatisfiedError') {
          console.log('⚠️ Preferred constraints failed, trying minimal constraints...');
          videoConstraints = {
            facingMode: 'user' // Minimal constraint
          };
          
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false
            });
          } catch (minimalError: any) {
            // If minimal constraints also fail, try with no constraints at all
            console.log('⚠️ Minimal constraints failed, trying with no constraints...');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true, // Most permissive
              audio: false
            });
          }
        } else {
          throw constraintError;
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            setIsWebcamActive(true);
            setError(null);
            resolve();
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          
          // Timeout fallback
          setTimeout(() => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              setIsWebcamActive(true);
              setError(null);
              resolve();
            } else {
              reject(new Error('Video failed to load'));
            }
          }, 5000);
        });
        
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
      
      // Provide more specific error messages with actionable guidance
      let errorMessage = '';
      let actionGuidance = '';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access was denied.';
        actionGuidance = isMobileDevice() 
          ? 'Please tap the camera icon in your browser\'s address bar and allow camera access, then try again.'
          : 'Please click the camera icon in your browser\'s address bar, allow camera access, then try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found.';
        actionGuidance = 'Please ensure a camera is connected and not being used by another application.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is not accessible.';
        actionGuidance = 'The camera may be in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera does not support the required settings.';
        actionGuidance = 'Please try again. The system will automatically adjust camera settings.';
      } else if (err.message?.includes('HTTPS')) {
        errorMessage = err.message;
        actionGuidance = '';
      } else {
        errorMessage = err.message || 'Unable to access camera.';
        actionGuidance = 'Please ensure your browser supports camera access and try again.';
      }
      
      setError(`${errorMessage} ${actionGuidance}`);
      setStatus('error');
      setStatusMessage(`${errorMessage} ${actionGuidance}`);
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
  };

  // Real-time face detection
  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    faceapi.matchDimensions(canvas, displaySize);

    const interval = setInterval(async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw detections
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      }
    }, 100); // Detect every 100ms

    setDetectionInterval(interval);
  };

  // Process attendance with face recognition
  const processAttendance = async (type: 'timein' | 'timeout') => {
    if (!modelsLoaded) {
      setError('Face recognition models are still loading. Please wait...');
      setStatus('error');
      return;
    }

    setIsProcessing(true);
    setActionType(type);
    setError(null);
    setDetectionResult(null);

    try {
      // Start webcam if not already active
      if (!isWebcamActive) {
        setStatus('loading');
        setStatusMessage('Requesting camera access... Please allow camera permission when prompted.');
        await startWebcam();
        
        // Wait for webcam to initialize and video to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isWebcamActive) {
          throw new Error('Camera failed to start. Please ensure camera permissions are granted.');
        }
      }

      // Start face detection
      startFaceDetection();

      setStatus('detecting');
      setStatusMessage('Detecting face... Please position yourself in front of the camera.');

      // Wait a moment for face detection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Detect face
      const faceDescriptor = await faceRegistrationService.detectFace(videoRef.current);

      if (!faceDescriptor) {
        throw new Error('No face detected. Please ensure your face is clearly visible in the camera.');
      }

      setStatus('matching');
      setStatusMessage('Matching face with registered staff...');

      // Find matching staff
      const matches = await faceRegistrationService.findMatchingStaff(
        faceDescriptor.descriptor,
        0.6 // threshold
      );

      if (matches.length === 0) {
        throw new Error('Face not recognized. Please ensure you are registered in the system.');
      }

      const bestMatch = matches[0];
      const staffInfo = await attendanceService.getStaffInfo(bestMatch.staff_id);

      if (!staffInfo) {
        throw new Error('Staff information not found.');
      }

      setDetectionResult({
        staffInfo,
        confidence: 1 - bestMatch.distance // Convert distance to confidence
      });

      setStatus('recording');
      setStatusMessage(`Recording ${type === 'timein' ? 'Time In' : 'Time Out'} for ${staffInfo.first_name} ${staffInfo.last_name}...`);

      // Record attendance
      let attendanceRecord;
      if (type === 'timein') {
        attendanceRecord = await attendanceService.recordTimeIn(bestMatch.staff_id);
      } else {
        attendanceRecord = await attendanceService.recordTimeOut(bestMatch.staff_id);
      }

      setStatus('success');
      setStatusMessage(
        `Successfully recorded ${type === 'timein' ? 'Time In' : 'Time Out'} for ${staffInfo.first_name} ${staffInfo.last_name}!`
      );

      // Auto-reset after 3 seconds
      setTimeout(() => {
        resetState();
      }, 3000);

    } catch (err: any) {
      console.error('Error processing attendance:', err);
      setError(err.message || 'Failed to process attendance. Please try again.');
      setStatus('error');
      setStatusMessage(err.message || 'Processing failed');
      
      // Auto-reset after 5 seconds on error
      setTimeout(() => {
        resetState();
      }, 5000);
    }
  };

  const resetState = () => {
    setIsProcessing(false);
    setActionType(null);
    setStatus('idle');
    setStatusMessage('Ready. Click Time In or Time Out to start.');
    setDetectionResult(null);
    setError(null);
    stopWebcam();
  };

  const handleTimeIn = () => {
    processAttendance('timein');
  };

  const handleTimeOut = () => {
    processAttendance('timeout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Attendance Terminal</h1>
          <p className="text-gray-400">Facial Recognition Attendance System</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Status Message */}
          {(statusMessage || error) && (
            <div className={`mb-6 p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle className="w-5 h-5" />}
                {status === 'error' && <XCircle className="w-5 h-5" />}
                {(status === 'detecting' || status === 'matching' || status === 'recording' || status === 'loading') && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
                <p className="font-medium">{error || statusMessage}</p>
              </div>
            </div>
          )}

          {/* Detection Result */}
          {detectionResult && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">
                    {detectionResult.staffInfo.first_name} {detectionResult.staffInfo.last_name}
                  </p>
                  <p className="text-sm text-emerald-700">
                    {detectionResult.staffInfo.employee_id} • {detectionResult.staffInfo.position}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Confidence: {(detectionResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Webcam Area */}
          <div className="mb-8">
            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video border-4 border-gray-300">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!isWebcamActive ? 'hidden' : ''}`}
                style={{
                  transform: 'scaleX(-1)', // Mirror the video for better UX (like a selfie camera)
                  WebkitTransform: 'scaleX(-1)', // Safari support
                }}
              />

              {/* Canvas for face detection overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{
                  transform: 'scaleX(-1)', // Mirror to match video
                  WebkitTransform: 'scaleX(-1)', // Safari support
                }}
              />

              {/* Placeholder/Status Overlay */}
              {(!isWebcamActive || status === 'idle') && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  {status === 'loading' ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 font-medium">Loading models...</p>
                    </div>
                  ) : status === 'error' ? (
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Error</p>
                      <p className="text-sm text-gray-500 mt-2">Please check your webcam permissions</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Webcam Preview</p>
                      <p className="text-sm text-gray-400 mt-2">Click "Time In" or "Time Out" to start</p>
                      <p className="text-xs text-gray-400 mt-1">Your browser will ask for camera permission</p>
                    </div>
                  )}
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && status !== 'idle' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
                    <p className="font-medium">{statusMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time In Button */}
            <button
              onClick={handleTimeIn}
              disabled={isProcessing || !modelsLoaded || status === 'loading'}
              className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-8 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Time In</h3>
                  <p className="text-emerald-100 text-sm">Start your work day</p>
                </div>
              </div>
            </button>

            {/* Time Out Button */}
            <button
              onClick={handleTimeOut}
              disabled={isProcessing || !modelsLoaded || status === 'loading'}
              className="group relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-8 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <LogOut className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Time Out</h3>
                  <p className="text-red-100 text-sm">End your work day</p>
                </div>
              </div>
            </button>
          </div>

          {/* Back to Landing Page */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                stopWebcam();
                window.location.href = '/';
              }}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTerminal;
