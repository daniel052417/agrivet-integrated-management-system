// components/attendance/AttendanceTerminal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Camera, LogOut, CheckCircle, XCircle, AlertCircle, User, Loader2 } from 'lucide-react';
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
  const MAX_DETECTION_ATTEMPTS = 12;
  const DETECTION_DELAY_MS = 400;
  const SUCCESS_DISPLAY_DURATION_MS = 3000;
  const ERROR_DISPLAY_DURATION_MS = 5000;
  
  const NO_FACE_TIPS = [
    'Ensure your entire face is inside the frame and look directly at the camera.',
    'Improve lighting so your face is clearly visible.',
    'Remove sunglasses, mask, or hat if possible.',
    'Move a little closer to the camera.'
  ];
  
  const NO_MATCH_TIPS = [
    'Make sure you have registered your face in the system.',
    'Hold still for a second so the camera can capture you.',
    'If you just registered, refresh this page to load the latest data.',
    'Contact an administrator if the issue persists.'
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus('loading');
        setStatusMessage('Loading face recognition models...');
        console.log('🔄 Loading face recognition models...');
        
        await faceRegistrationService.loadModels();
        await faceRegistrationService.testModels();
        
        setModelsLoaded(true);
        setStatus('idle');
        setStatusMessage('Ready. Click Time In or Time Out to start.');
        console.log('✅ Face recognition models loaded successfully');
      } catch (err: any) {
        console.error('❌ Error loading models:', err);
        setError('Failed to load face recognition models. Please refresh the page.');
        setStatus('error');
        setStatusMessage(err.message || 'Model loading failed');
      }
    };

    loadModels();

    return () => {
      // Cleanup: stop webcam and clear intervals/timeouts
      console.log('🧹 Cleaning up AttendanceTerminal...');
      stopWebcam();
      clearDetectionInterval();
      clearAutoResetTimeout();
    };
  }, []);

  // Clear detection interval helper
  const clearDetectionInterval = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Clear auto-reset timeout helper
  const clearAutoResetTimeout = () => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  };

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
          console.log('⚠️ Permissions API not fully supported, will request directly');
        }
      }

      return 'prompt';
    } catch (err) {
      console.error('❌ Error checking camera permission:', err);
      return 'prompt';
    }
  };

  // Start webcam with optimized settings
  const startWebcam = async () => {
    try {
      console.log('📷 Starting webcam...');
      
      // Check if we're on HTTPS or localhost
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
          throw new Error('Camera access is not supported in this browser. Please use Chrome, Firefox, or Safari.');
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
                console.log('✅ Webcam started (legacy API)');
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

      // Check permission status
      const permissionStatus = await checkCameraPermission();
      
      if (permissionStatus === 'denied') {
        console.warn('⚠️ Camera permission denied, attempting to request...');
      }

      // Optimize constraints based on device type
      const isMobile = isMobileDevice();
      
      let videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: 'user' },
        width: isMobile ? { ideal: 640 } : { ideal: 1280 },
        height: isMobile ? { ideal: 480 } : { ideal: 720 },
      };

      console.log('📷 Camera constraints:', videoConstraints);

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      } catch (constraintError: any) {
        if (constraintError.name === 'OverconstrainedError' || constraintError.name === 'ConstraintNotSatisfiedError') {
          console.log('⚠️ Preferred constraints failed, trying minimal...');
          videoConstraints = { facingMode: 'user' };
          
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false
            });
          } catch (minimalError: any) {
            console.log('⚠️ Minimal constraints failed, trying no constraints...');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        } else {
          throw constraintError;
        }
      }

      if (stream) {
        streamRef.current = stream;
        setIsWebcamActive(true);
        setError(null);

        // Wait for next frame
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        if (!videoRef.current) {
          throw new Error('Video element not available');
        }

        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready - improved error handling
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          let resolved = false;
          
          const onLoadedMetadata = () => {
            if (!resolved) {
              resolved = true;
              video.play()
                .then(() => {
                  console.log('✅ Video playing (metadata event)');
                  // Give video time to fully initialize
                  setTimeout(() => resolve(), 500);
                })
                .catch(reject);
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
            }
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          
          // Timeout fallback
          setTimeout(() => {
            if (!resolved && video.readyState >= 2) {
              resolved = true;
              video.play()
                .then(() => {
                  console.log('✅ Video playing (timeout fallback)');
                  setTimeout(() => resolve(), 500);
                })
                .catch(reject);
            } else if (!resolved) {
              reject(new Error('Video failed to load within timeout'));
            }
          }, 5000);
        });
        
        // Log camera info
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
        actionGuidance = 'The camera may be in use by another application. Please close other apps and try again.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera does not support the required settings.';
        actionGuidance = 'Please try again.';
      } else if (err.message?.includes('HTTPS')) {
        errorMessage = err.message;
        actionGuidance = '';
      } else {
        errorMessage = err.message || 'Unable to access camera.';
        actionGuidance = 'Please ensure your browser supports camera access and try again.';
      }
      
      const fullError = `${errorMessage} ${actionGuidance}`.trim();
      setError(fullError);
      setStatus('error');
      setStatusMessage(fullError);
      throw new Error(fullError);
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    console.log('🛑 Stopping webcam...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.label);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsWebcamActive(false);
    clearDetectionInterval();
  };

  // Real-time face detection overlay
  const startFaceDetection = () => {
    console.log('👁️ Starting real-time face detection overlay...');
    
    clearDetectionInterval();

    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      console.warn('⚠️ Cannot start face detection: missing video, canvas, or models');
      return;
    }

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
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      }
    }, 100);

    detectionIntervalRef.current = interval;
  };

  // Process attendance with face recognition
  const processAttendance = async (type: 'timein' | 'timeout') => {
    if (!modelsLoaded) {
      setError('Face recognition models are still loading. Please wait...');
      setStatus('error');
      return;
    }

    console.log(`🎬 Starting ${type} process...`);
    
    setIsProcessing(true);
    setActionType(type);
    setError(null);
    setDetectionResult(null);
    setCurrentAttempt(0);
    clearAutoResetTimeout();

    try {
      // Start webcam if not active
      if (!streamRef.current || !videoRef.current?.srcObject) {
        setStatus('loading');
        setStatusMessage('Requesting camera access...\n\nPlease allow camera permission when prompted.');
        await startWebcam();
        
        // Wait for webcam to stabilize
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verify camera is actually working
        if (!streamRef.current || !videoRef.current?.srcObject) {
          throw new Error('Camera failed to start. Please ensure camera permissions are granted.');
        }
        
        console.log('✅ Camera ready for face detection');
      }

      // Start visual detection overlay
      startFaceDetection();

      let bestMatch: { staff_id: string; distance: number } | null = null;
      let faceDescriptor: Awaited<ReturnType<typeof faceRegistrationService.detectFace>> | null = null;
      let lastFailureReason: 'no-face' | 'no-match' | null = null;

      // Detection loop
      for (let attempt = 1; attempt <= MAX_DETECTION_ATTEMPTS; attempt++) {
        if (!videoRef.current) break;

        setCurrentAttempt(attempt);
        setStatus('detecting');
        setStatusMessage(`Detecting face...\n\nAttempt ${attempt} of ${MAX_DETECTION_ATTEMPTS}\n\nPlease look at the camera and hold still.`);

        try {
          console.log(`🔍 Detection attempt ${attempt}/${MAX_DETECTION_ATTEMPTS}`);
          faceDescriptor = await faceRegistrationService.detectFace(videoRef.current);
          
          if (faceDescriptor && faceDescriptor.descriptor) {
            console.log('✅ Face detected successfully');
          }
        } catch (detectError: any) {
          console.error('❌ Face detection error:', detectError);
          faceDescriptor = null;
          lastFailureReason = 'no-face';
        }

        if (!faceDescriptor || !faceDescriptor.descriptor) {
          lastFailureReason = 'no-face';
          console.log(`⚠️ No face detected, retrying...`);
          await new Promise(resolve => setTimeout(resolve, DETECTION_DELAY_MS));
          continue;
        }

        // Face detected, now try to match
        setStatus('matching');
        setStatusMessage(`Face detected!\n\nMatching with registered staff...\n\nPlease wait...`);

        console.log('🔍 Matching face against database...');
        const matches = await faceRegistrationService.findMatchingStaff(
          faceDescriptor.descriptor,
          0.6 // threshold
        );

        if (matches.length > 0) {
          bestMatch = matches[0];
          console.log('✅ Match found:', {
            staff_id: bestMatch.staff_id,
            distance: bestMatch.distance,
            confidence: (1 - bestMatch.distance) * 100
          });
          break;
        }

        lastFailureReason = 'no-match';
        console.log('⚠️ No match found, retrying...');
        await new Promise(resolve => setTimeout(resolve, DETECTION_DELAY_MS));
      }

      // Check if we found a match
      if (!bestMatch || !faceDescriptor || !faceDescriptor.descriptor) {
        const message =
          lastFailureReason === 'no-match'
            ? `Face not recognized after ${MAX_DETECTION_ATTEMPTS} attempts.\n\nPlease try again.\n\nTips:\n${NO_MATCH_TIPS.map(tip => `• ${tip}`).join('\n')}`
            : `No face detected after ${MAX_DETECTION_ATTEMPTS} attempts.\n\nPlease try again.\n\nTips:\n${NO_FACE_TIPS.map(tip => `• ${tip}`).join('\n')}`;
        
        console.error('❌ Detection failed:', lastFailureReason);
        throw new Error(message);
      }

      // Get staff info
      console.log('📋 Fetching staff info...');
      const staffInfo = await attendanceService.getStaffInfo(bestMatch.staff_id);

      if (!staffInfo) {
        throw new Error('Staff information not found in database.');
      }

      console.log('✅ Staff info retrieved:', staffInfo);

      setDetectionResult({
        staffInfo,
        confidence: 1 - bestMatch.distance
      });

      // Record attendance
      setStatus('recording');
      setStatusMessage(`Recording ${type === 'timein' ? 'Time In' : 'Time Out'}...\n\nFor: ${staffInfo.first_name} ${staffInfo.last_name}\n\nPlease wait...`);

      console.log(`📝 Recording ${type}...`);
      let attendanceRecord;
      if (type === 'timein') {
        attendanceRecord = await attendanceService.recordTimeIn(bestMatch.staff_id);
      } else {
        attendanceRecord = await attendanceService.recordTimeOut(bestMatch.staff_id);
      }

      const recordedTime = type === 'timein' ? attendanceRecord.time_in : attendanceRecord.time_out;
      const formattedTime = recordedTime 
        ? new Date(recordedTime).toLocaleTimeString()
        : new Date().toLocaleTimeString();
      
      const greeting = type === 'timein'
        ? `Welcome, ${staffInfo.first_name}! 👋`
        : `Great job today, ${staffInfo.first_name}! 👏`;

      console.log('✅ Attendance recorded successfully');

      setStatus('success');
      setStatusMessage(
        `${greeting}\n\n${type === 'timein' ? 'Time In' : 'Time Out'} recorded successfully!\n\nTime: ${formattedTime}\n\nEmployee: ${staffInfo.first_name} ${staffInfo.last_name}\nID: ${staffInfo.employee_id}`
      );

      // Auto-reset after success
      autoResetTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-resetting after success...');
        resetState();
      }, SUCCESS_DISPLAY_DURATION_MS);

    } catch (err: any) {
      console.error('❌ Error processing attendance:', err);
      setError(err.message || 'Failed to process attendance. Please try again.');
      setStatus('error');
      setStatusMessage(err.message || 'Processing failed. Please try again.');
      
      // Auto-reset after error
      autoResetTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-resetting after error...');
        resetState();
      }, ERROR_DISPLAY_DURATION_MS);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    console.log('🔄 Resetting terminal state...');
    
    setIsProcessing(false);
    setActionType(null);
    setStatus('idle');
    setStatusMessage('Ready. Click Time In or Time Out to start.');
    setDetectionResult(null);
    setError(null);
    setCurrentAttempt(0);
    stopWebcam();
    clearAutoResetTimeout();
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
          {modelsLoaded && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-900/30 border border-green-700 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">System Ready</span>
            </div>
          )}
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
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {status === 'success' && <CheckCircle className="w-5 h-5" />}
                  {status === 'error' && <XCircle className="w-5 h-5" />}
                  {(status === 'detecting' || status === 'matching' || status === 'recording' || status === 'loading') && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </div>
                <p className="font-medium whitespace-pre-line flex-1">{error || statusMessage}</p>
              </div>
            </div>
          )}

          {/* Detection Result */}
          {detectionResult && status === 'success' && (
            <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xl text-emerald-900">
                    {detectionResult.staffInfo.first_name} {detectionResult.staffInfo.last_name}
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {detectionResult.staffInfo.employee_id} • {detectionResult.staffInfo.position}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Match Confidence: {(detectionResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Webcam Area */}
          <div className="mb-8">
            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video border-4 border-gray-300 shadow-inner">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!isWebcamActive ? 'hidden' : ''}`}
                style={{
                  transform: 'scaleX(-1)',
                  WebkitTransform: 'scaleX(-1)',
                }}
              />

              {/* Canvas for face detection overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{
                  transform: 'scaleX(-1)',
                  WebkitTransform: 'scaleX(-1)',
                }}
              />

              {/* Placeholder/Status Overlay */}
              {(!isWebcamActive || status === 'idle') && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  {status === 'loading' ? (
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-700 font-semibold">Loading models...</p>
                      <p className="text-gray-500 text-sm mt-2">Please wait</p>
                    </div>
                  ) : status === 'error' && !isProcessing ? (
                    <div className="text-center px-4">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-semibold">Camera Error</p>
                      <p className="text-sm text-gray-500 mt-2">Please check your webcam permissions</p>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <Camera className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-semibold text-lg">Camera Preview</p>
                      <p className="text-sm text-gray-500 mt-2">Click "Time In" or "Time Out" to start</p>
                      <p className="text-xs text-gray-400 mt-2">Your browser will ask for camera permission</p>
                    </div>
                  )}
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && isWebcamActive && (status === 'detecting' || status === 'matching' || status === 'recording') && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white p-6 bg-gray-900/50 rounded-xl border border-white/20">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
                    <p className="font-semibold text-lg mb-2">
                      {status === 'detecting' && 'Detecting Face...'}
                      {status === 'matching' && 'Matching Face...'}
                      {status === 'recording' && 'Recording Attendance...'}
                    </p>
                    {currentAttempt > 0 && status === 'detecting' && (
                      <p className="text-sm text-gray-300">
                        Attempt {currentAttempt} of {MAX_DETECTION_ATTEMPTS}
                      </p>
                    )}
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
              className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-8 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
              {isProcessing && actionType === 'timein' && (
                <div className="absolute inset-0 bg-emerald-700/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>

            {/* Time Out Button */}
            <button
              onClick={handleTimeOut}
              disabled={isProcessing || !modelsLoaded || status === 'loading'}
              className="group relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-8 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
              {isProcessing && actionType === 'timeout' && (
                <div className="absolute inset-0 bg-red-700/50 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </button>
          </div>

          {/* System Status Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600">
                  {modelsLoaded ? 'Models Loaded' : 'Loading Models...'}
                </span>
              </div>
              <button
                onClick={() => {
                  stopWebcam();
                  window.location.href = '/';
                }}
                className="text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTerminal;