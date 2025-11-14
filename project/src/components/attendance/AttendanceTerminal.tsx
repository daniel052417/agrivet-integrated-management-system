// components/attendance/AttendanceTerminal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Camera, LogOut, CheckCircle, XCircle, AlertCircle, User, Loader2, Sun, Moon, Shield, MapPin, Lock } from 'lucide-react';
import { faceRegistrationService } from '../../lib/faceRegistrationService';
import { 
  attendanceService, 
  StaffInfo, 
  AttendanceSession, 
  SessionAction, 
  SessionInfo,
  AttendanceRecord
} from '../../lib/attendanceService';
import { branchManagementService, Branch, AttendanceSecuritySettings } from '../../lib/branchManagementService';
import { attendanceTerminalDeviceService } from '../../lib/attendanceTerminalDeviceService';
import { getStableDeviceId, generateDeviceFingerprint, getDeviceInfo } from '../../lib/utils/deviceFingerprint';
import { supabase } from '../../lib/supabase';
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
  const securityCheckExecuted = useRef(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  
  // Security state
  const [securityCheck, setSecurityCheck] = useState<{
    isLoading: boolean;
    isAuthorized: boolean;
    error: string | null;
    branch: Branch | null;
    securitySettings: AttendanceSecuritySettings | null;
    deviceId: string | null;
    requiresPin: boolean;
    pinVerified: boolean;
  }>({
    isLoading: true,
    isAuthorized: false,
    error: null,
    branch: null,
    securitySettings: null,
    deviceId: null,
    requiresPin: false,
    pinVerified: false
  });
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Check security on component mount
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        setSecurityCheck(prev => ({ ...prev, isLoading: true, error: null }));
        console.log('🔒 Starting security check...');

        // Get stable device UUID from localStorage (primary identifier)
        const deviceUuid = getStableDeviceId();
        console.log('🔍 Device UUID (stable):', deviceUuid);
        
        // Get all branches
        const branches = await branchManagementService.getAllBranches();
        if (!branches || branches.length === 0) {
          throw new Error('No branches found. Please configure a branch first.');
        }

        // Find which branch the device is registered in
        // Search across all branches to find the device registration
        let branch: Branch | null = null;
        let registeredDevice: any = null;
        
        // First, check if branch_id is provided in URL (from LandingPage navigation)
        const urlParams = new URLSearchParams(window.location.search);
        const urlBranchId = urlParams.get('branch_id');
        
        if (urlBranchId) {
          // If branch_id is in URL, check that branch first
          branch = branches.find(b => b.id === urlBranchId) || null;
          if (branch) {
            console.log('📍 Checking device in URL branch:', branch.name);
            try {
              registeredDevice = await attendanceTerminalDeviceService.getDeviceByUuid(
                branch.id,
                deviceUuid
              );
              if (registeredDevice && registeredDevice.is_active) {
                console.log('✅ Device found in URL branch:', branch.name);
              } else {
                registeredDevice = null;
                branch = null;
              }
            } catch (err) {
              console.log('ℹ️ Device not found in URL branch, searching all branches...');
              registeredDevice = null;
              branch = null;
            }
          }
        }
        
        // If device not found in URL branch, search all branches
        if (!registeredDevice) {
          console.log('🔍 Searching for device registration across all branches...');
          for (const b of branches) {
            if (!b.is_active) continue; // Skip inactive branches
            
            try {
              const device = await attendanceTerminalDeviceService.getDeviceByUuid(
                b.id,
                deviceUuid
              );
              
              if (device && device.is_active) {
                registeredDevice = device;
                branch = b;
                console.log('✅ Device found in branch:', {
                  branchId: b.id,
                  branchName: b.name,
                  deviceId: device.id,
                  deviceName: device.device_name
                });
                break; // Found device, stop searching
              }
            } catch (err) {
              // Device not found in this branch, continue searching
              continue;
            }
          }
        }
        
        // If still no branch found, use URL branch or default branch
        if (!branch) {
          if (urlBranchId) {
            branch = branches.find(b => b.id === urlBranchId) || null;
          }
          
          if (!branch) {
            // Use first active branch or main branch as fallback
            branch = branches.find(b => b.is_active && b.branch_type === 'main') || 
                     branches.find(b => b.is_active) || 
                     branches[0] || null;
          }
          
          if (!branch) {
            throw new Error('No branch found. Please configure a branch first.');
          }
          
          console.log('⚠️ Device not registered, using branch:', branch.name);
        }

        console.log('✅ Branch found:', {
          branchId: branch.id,
          branchName: branch.name,
          hasSecuritySettings: !!branch.attendance_security_settings,
          securitySettingsRaw: branch.attendance_security_settings
        });

        // Parse security settings from branch
        let securitySettings: AttendanceSecuritySettings;
        if (branch.attendance_security_settings && typeof branch.attendance_security_settings === 'object') {
          // Use settings from database (parse JSONB if needed)
          securitySettings = branch.attendance_security_settings as AttendanceSecuritySettings;
          console.log('✅ Security settings loaded from database:', {
            enableDeviceVerification: securitySettings.enableDeviceVerification,
            enableGeoLocationVerification: securitySettings.enableGeoLocationVerification,
            enablePinAccessControl: securitySettings.enablePinAccessControl,
            enableActivityLogging: securitySettings.enableActivityLogging,
            geoLocationToleranceMeters: securitySettings.geoLocationToleranceMeters,
            rawSettings: securitySettings
          });
          
          // Validate that settings are actually enabled
          if (securitySettings.enableDeviceVerification === undefined) {
            console.warn('⚠️ enableDeviceVerification is undefined, defaulting to false');
            securitySettings.enableDeviceVerification = false;
          }
        } else {
          // Default settings (all disabled for backward compatibility)
          securitySettings = {
            enableDeviceVerification: false,
            enableGeoLocationVerification: false,
            enablePinAccessControl: false,
            geoLocationToleranceMeters: 100,
            requirePinForEachSession: false,
            pinSessionDurationHours: 24,
            enableActivityLogging: true
          };
          console.warn('⚠️ No security settings found in database, using defaults (all disabled)');
          console.warn('⚠️ To enable device verification, configure security settings in Settings → Branch Management');
        }

        // Generate device fingerprint for metadata/logging
        const deviceFingerprint = generateDeviceFingerprint();
        console.log('🔍 Device fingerprint (metadata):', deviceFingerprint.substring(0, 20) + '...');

        // Always log access attempt (even if security is disabled)
        const logAccessAttempt = async (actionType: 'device_verified' | 'device_blocked' | 'access_denied', status: 'success' | 'blocked' | 'failed', reason: string, deviceId: string | null = null) => {
          if (securitySettings.enableActivityLogging) {
            try {
              console.log('📝 Logging access attempt:', { actionType, status, reason });
              await attendanceTerminalDeviceService.logActivity({
                branch_id: branch.id,
                device_id: deviceId,
                device_fingerprint: deviceFingerprint,
                action_type: actionType,
                status: status,
                status_reason: reason,
                user_agent: navigator.userAgent,
                session_data: {
                  fingerprint: deviceFingerprint.substring(0, 20) + '...',
                  securitySettings: {
                    deviceVerification: securitySettings.enableDeviceVerification,
                    geoLocation: securitySettings.enableGeoLocationVerification,
                    pinAccess: securitySettings.enablePinAccessControl
                  }
                }
              });
              console.log('✅ Access attempt logged successfully');
            } catch (logErr: any) {
              console.error('❌ Failed to log access attempt:', logErr);
              // Don't throw - logging failures shouldn't block access
            }
          } else {
            console.log('⚠️ Activity logging disabled, skipping log');
          }
        };

        // Check device verification
        let deviceId: string | null = null;
        if (securitySettings.enableDeviceVerification) {
          console.log('🔒 Device verification ENABLED, checking device...');
          
          // Use the device found during branch search
          let device = registeredDevice;
          
          // If device was found in a different branch, switch to that branch
          if (device && device.branch && device.branch.id !== branch.id) {
            console.log('⚠️ Device is registered in a different branch:', {
              deviceBranch: device.branch.name,
              deviceBranchId: device.branch.id,
              currentBranch: branch.name,
              currentBranchId: branch.id
            });
            console.log('📍 Switching to device branch:', device.branch.name);
            
            // Switch to the branch where device is registered
            const deviceBranch = branches.find(b => b.id === device.branch!.id);
            if (deviceBranch) {
              branch = deviceBranch;
              
              // Reload security settings for the correct branch
              if (branch.attendance_security_settings && typeof branch.attendance_security_settings === 'object') {
                securitySettings = branch.attendance_security_settings as AttendanceSecuritySettings;
                console.log('✅ Security settings reloaded for device branch:', {
                  branchName: branch.name,
                  enableDeviceVerification: securitySettings.enableDeviceVerification,
                  enableGeoLocationVerification: securitySettings.enableGeoLocationVerification,
                  enablePinAccessControl: securitySettings.enablePinAccessControl
                });
              }
            }
          }
          
          // If device not found yet, check in current branch (fallback)
          if (!device) {
            try {
              device = await attendanceTerminalDeviceService.getDeviceByUuid(
                branch.id,
                deviceUuid
              );
              
              // Fallback to fingerprint lookup for backward compatibility
              if (!device) {
                console.log('⚠️ Device not found by UUID, trying fingerprint lookup...');
                device = await attendanceTerminalDeviceService.getDeviceByFingerprint(
                  branch.id,
                  deviceFingerprint
                );
                
                // If found by fingerprint but no UUID, update it with the UUID
                if (device && !device.device_uuid) {
                  console.log('✅ Updating device with UUID for future lookups...');
                  try {
                    const { data: updatedDevice, error: updateError } = await supabase
                      .from('attendance_terminal_devices')
                      .update({ device_uuid: deviceUuid })
                      .eq('id', device.id)
                      .select()
                      .single();
                    
                    if (!updateError && updatedDevice) {
                      device = updatedDevice;
                      console.log('✅ Device updated with UUID');
                    }
                  } catch (updateErr: any) {
                    console.warn('⚠️ Failed to update device with UUID:', updateErr);
                  }
                }
              }
            } catch (deviceErr: any) {
              console.error('❌ Error checking device:', deviceErr);
              device = null;
            }
          }

          console.log('🔍 Device lookup result:', {
            deviceFound: !!device,
            deviceActive: device?.is_active || false,
            deviceId: device?.id || null,
            deviceName: device?.device_name || null,
            branchName: branch.name,
            branchId: branch.id
          });

          if (!device || !device.is_active) {
            // Log unauthorized device attempt
            await logAccessAttempt(
              'device_blocked',
              'blocked',
              'Device not registered or inactive',
              null
            );

            const errorMsg = 'Unauthorized device. Only authorized devices can access this page. Please contact your administrator to register this device.';
            console.error('❌ Device verification failed:', errorMsg);
            throw new Error(errorMsg);
          }

          deviceId = device.id;
          console.log('✅ Device verified successfully:', {
            deviceId: device.id,
            deviceName: device.device_name,
            deviceType: device.device_type,
            isActive: device.is_active,
            branchName: branch.name,
            branchId: branch.id
          });

          // Update device last used
          try {
            await attendanceTerminalDeviceService.updateDeviceLastUsed(device.id);
            console.log('✅ Device last used timestamp updated');
          } catch (updateErr: any) {
            console.warn('⚠️ Failed to update device last used:', updateErr);
            // Don't throw - this is not critical
          }

          // Log device verification success
          await logAccessAttempt(
            'device_verified',
            'success',
            'Device verified successfully',
            device.id
          );
        } else {
          console.log('⚠️ Device verification DISABLED - allowing all devices');
          // Even if device verification is disabled, try to find the device for logging purposes
          try {
            const device = await attendanceTerminalDeviceService.getDeviceByFingerprint(
              branch.id,
              deviceFingerprint
            );
            if (device && device.is_active) {
              deviceId = device.id;
              console.log('✅ Device found (verification disabled):', {
                deviceId: device.id,
                deviceName: device.device_name
              });
              // Update last used even if verification is disabled
              await attendanceTerminalDeviceService.updateDeviceLastUsed(device.id).catch(() => {});
            }
          } catch (err) {
            // Ignore - device not found is okay if verification is disabled
            console.log('ℹ️ Device not found (verification disabled, allowing access)');
          }

          // Log access attempt (device verification disabled, but still log)
          await logAccessAttempt(
            'device_verified',
            'success',
            'Device verification disabled - access allowed',
            deviceId
          );
        }

        // Check geo-location verification
        if (securitySettings.enableGeoLocationVerification) {
          console.log('📍 Geo-location verification enabled, checking location...');
          try {
            if (!branch.latitude || !branch.longitude) {
              console.warn('⚠️ Branch coordinates not set, skipping geo-location check');
            } else {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                });
              });

              const userLat = position.coords.latitude;
              const userLon = position.coords.longitude;
              const branchLat = branch.latitude!;
              const branchLon = branch.longitude!;

              // Calculate distance using Haversine formula
              const R = 6371000; // Earth radius in meters
              const φ1 = (branchLat * Math.PI) / 180;
              const φ2 = (userLat * Math.PI) / 180;
              const Δφ = ((userLat - branchLat) * Math.PI) / 180;
              const Δλ = ((userLon - branchLon) * Math.PI) / 180;

              const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;

              console.log('📍 Location check:', {
                userLocation: { lat: userLat, lon: userLon },
                branchLocation: { lat: branchLat, lon: branchLon },
                distance: distance.toFixed(2) + 'm',
                tolerance: securitySettings.geoLocationToleranceMeters + 'm'
              });

              if (distance > securitySettings.geoLocationToleranceMeters) {
                // Log location failure
                if (securitySettings.enableActivityLogging) {
                  await attendanceTerminalDeviceService.logActivity({
                    branch_id: branch.id,
                    device_id: deviceId,
                    device_fingerprint: deviceFingerprint,
                    action_type: 'location_failed',
                    status: 'failed',
                    status_reason: `Location is ${distance.toFixed(2)}m away from branch (tolerance: ${securitySettings.geoLocationToleranceMeters}m)`,
                    location_latitude: userLat,
                    location_longitude: userLon,
                    distance_from_branch_meters: distance,
                    user_agent: navigator.userAgent
                  });
                }

                throw new Error(`Location verification failed. You are ${distance.toFixed(0)} meters away from the branch. Maximum allowed distance: ${securitySettings.geoLocationToleranceMeters} meters. Please move closer to the branch location.`);
              }

              // Log location verification success
              if (securitySettings.enableActivityLogging) {
                await attendanceTerminalDeviceService.logActivity({
                  branch_id: branch.id,
                  device_id: deviceId,
                  device_fingerprint: deviceFingerprint,
                  action_type: 'location_verified',
                  status: 'success',
                  status_reason: `Location verified (${distance.toFixed(2)}m from branch)`,
                  location_latitude: userLat,
                  location_longitude: userLon,
                  distance_from_branch_meters: distance,
                  user_agent: navigator.userAgent
                });
              }

              console.log('✅ Location verified');
            }
          } catch (locationErr: any) {
            if (locationErr.code === 1) {
              // Permission denied
              throw new Error('Location access denied. Please allow location access to use the attendance terminal.');
            } else if (locationErr.code === 2) {
              // Position unavailable
              throw new Error('Unable to determine your location. Please check your device settings.');
            } else if (locationErr.message) {
              throw locationErr;
            } else {
              throw new Error('Location verification failed. Please try again.');
            }
          }
        } else {
          console.log('⚠️ Geo-location verification disabled');
        }

        // Check PIN access control
        const requiresPin = securitySettings.enablePinAccessControl && !!branch.attendance_pin;
        let pinVerified = false;

        if (requiresPin) {
          console.log('🔐 PIN access control enabled');
          // Check if PIN was verified in this session (stored in sessionStorage)
          const pinSessionKey = `attendance_terminal_pin_verified_${branch.id}`;
          const pinSessionData = sessionStorage.getItem(pinSessionKey);
          
          if (pinSessionData) {
            try {
              const sessionData = JSON.parse(pinSessionData);
              const sessionExpiry = new Date(sessionData.expiresAt);
              
              if (sessionExpiry > new Date()) {
                pinVerified = true;
                console.log('✅ PIN verified in this session');
              } else {
                console.log('⚠️ PIN session expired');
                sessionStorage.removeItem(pinSessionKey);
              }
            } catch (parseErr) {
              console.warn('⚠️ Error parsing PIN session data:', parseErr);
              sessionStorage.removeItem(pinSessionKey);
            }
          }

          if (!pinVerified) {
            // Show PIN modal
            setShowPinModal(true);
            setSecurityCheck(prev => ({
              ...prev,
              isLoading: false,
              isAuthorized: false,
              branch,
              securitySettings,
              deviceId,
              requiresPin: true,
              pinVerified: false
            }));
            return;
          }
        }

        // All security checks passed
        console.log('✅ All security checks passed');
        
        // Final access log (all checks passed)
        if (securitySettings.enableActivityLogging) {
          try {
            await attendanceTerminalDeviceService.logActivity({
              branch_id: branch.id,
              device_id: deviceId,
              device_fingerprint: deviceFingerprint,
              action_type: 'device_verified',
              status: 'success',
              status_reason: 'All security checks passed - access granted',
              user_agent: navigator.userAgent,
              session_data: {
                securitySettings: {
                  deviceVerification: securitySettings.enableDeviceVerification,
                  geoLocation: securitySettings.enableGeoLocationVerification,
                  pinAccess: securitySettings.enablePinAccessControl,
                  allChecksPassed: true
                }
              }
            });
            console.log('✅ Final access log recorded');
          } catch (logErr: any) {
            console.warn('⚠️ Failed to log final access:', logErr);
            // Don't throw - logging failures shouldn't block access
          }
        }

        setSecurityCheck(prev => ({
          ...prev,
          isLoading: false,
          isAuthorized: true,
          branch,
          securitySettings,
          deviceId,
          requiresPin,
          pinVerified: true
        }));

        // Load models after security check
        await loadModels();
      } catch (securityErr: any) {
        console.error('❌ Security check failed:', securityErr);
        console.error('❌ Security error details:', {
          message: securityErr.message,
          stack: securityErr.stack,
          name: securityErr.name
        });
        
        // Log access denied attempt
        const branch = await branchManagementService.getAllBranches().then(branches => {
          const urlParams = new URLSearchParams(window.location.search);
          const branchId = urlParams.get('branch_id');
          if (branchId) {
            return branches.find(b => b.id === branchId) || branches[0] || null;
          }
          return branches.find(b => b.is_active && b.branch_type === 'main') || 
                 branches.find(b => b.is_active) || 
                 branches[0] || null;
        }).catch(() => null);
        
        if (branch) {
          try {
            const deviceFingerprint = generateDeviceFingerprint();
            const securitySettings: AttendanceSecuritySettings = branch.attendance_security_settings || {
              enableActivityLogging: true
            };
            
            if (securitySettings.enableActivityLogging !== false) {
              await attendanceTerminalDeviceService.logActivity({
                branch_id: branch.id,
                device_fingerprint: deviceFingerprint,
                action_type: 'access_denied',
                status: 'blocked',
                status_reason: securityErr.message || 'Security check failed',
                user_agent: navigator.userAgent,
                session_data: {
                  error: securityErr.message,
                  fingerprint: deviceFingerprint.substring(0, 20) + '...'
                }
              }).catch(logErr => {
                console.error('❌ Failed to log access denied:', logErr);
              });
            }
          } catch (logErr) {
            console.error('❌ Error logging access denied:', logErr);
          }
        }
        
        setSecurityCheck(prev => ({
          ...prev,
          isLoading: false,
          isAuthorized: false,
          error: securityErr.message || 'Security check failed. Please contact your administrator.'
        }));
        setError(securityErr.message || 'Security check failed.');
        setStatus('error');
        setStatusMessage(securityErr.message || 'Security check failed. Please contact your administrator.');
      }
    };

    checkSecurity();
  }, []);

  // Load models after security check passes
  const loadModels = async () => {
    try {
      setStatus('loading');
      setStatusMessage('Loading face recognition models...');
      console.log('🔄 Loading face recognition models...');
      
      await faceRegistrationService.loadModels();
      await faceRegistrationService.testModels();
      
      setModelsLoaded(true);
      checkSession();
      console.log('✅ Face recognition models loaded successfully');
    } catch (err: any) {
      console.error('❌ Error loading models:', err);
      setError('Failed to load face recognition models. Please refresh the page.');
      setStatus('error');
      setStatusMessage(err.message || 'Model loading failed');
    }
  };

  // Handle PIN verification
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!securityCheck.branch || !securityCheck.branch.attendance_pin) {
      setError('PIN verification failed. Please contact your administrator.');
      return;
    }

    const enteredPin = pinInput.trim();
    const correctPin = securityCheck.branch.attendance_pin;

    if (enteredPin === correctPin) {
      // PIN is correct
      const pinSessionKey = `attendance_terminal_pin_verified_${securityCheck.branch!.id}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (securityCheck.securitySettings?.pinSessionDurationHours || 24));
      
      sessionStorage.setItem(pinSessionKey, JSON.stringify({
        expiresAt: expiresAt.toISOString(),
        verifiedAt: new Date().toISOString()
      }));

      // Log PIN verification
      if (securityCheck.securitySettings?.enableActivityLogging) {
        const deviceFingerprint = generateDeviceFingerprint();
        await attendanceTerminalDeviceService.logActivity({
          branch_id: securityCheck.branch!.id,
          device_id: securityCheck.deviceId,
          device_fingerprint: deviceFingerprint,
          action_type: 'pin_verified',
          status: 'success',
          status_reason: 'PIN verified successfully',
          user_agent: navigator.userAgent
        });
      }

      setShowPinModal(false);
      setPinInput('');
      setSecurityCheck(prev => ({
        ...prev,
        isAuthorized: true,
        pinVerified: true
      }));

      // Load models after PIN verification
      await loadModels();
    } else {
      // PIN is incorrect
      setError('Incorrect PIN. Please try again.');
      
      // Log PIN failure
      if (securityCheck.securitySettings?.enableActivityLogging) {
        const deviceFingerprint = generateDeviceFingerprint();
        await attendanceTerminalDeviceService.logActivity({
          branch_id: securityCheck.branch!.id,
          device_id: securityCheck.deviceId,
          device_fingerprint: deviceFingerprint,
          action_type: 'pin_failed',
          status: 'failed',
          status_reason: 'Incorrect PIN entered',
          user_agent: navigator.userAgent
        });
      }

      setPinInput('');
    }
  };

  // Check session every minute (only if authorized)
  useEffect(() => {
    if (!securityCheck.isAuthorized) {
      return;
    }

    const sessionCheckInterval = setInterval(() => {
      checkSession();
    }, 60000); // Check every minute

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [securityCheck.isAuthorized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up AttendanceTerminal...');
      stopWebcam();
      clearDetectionInterval();
      clearAutoResetTimeout();
    };
  }, []);

  // Check current session and update UI
  const checkSession = async () => {
    try {
      const session = attendanceService.getCurrentSession();
      setCurrentSession(session);

      if (session) {
        // If we have a detected staff, check their attendance
        // For now, we'll update the session info based on current time
        setStatus('idle');
        const sessionMsg = session === 'morning' 
          ? 'Morning Session (7:00 AM - 12:00 NN)\n\nReady. Click Time In or Time Out to start.'
          : 'Afternoon Session (1:00 PM - 7:00 PM)\n\nReady. Click Time In or Time Out to start.';
        setStatusMessage(sessionMsg);
      } else {
        const hour = attendanceService.getCurrentManilaHour();
        let message = '';
        if (hour < 7) {
          message = `Morning session starts at 7:00 AM.\n\nCurrent time: ${hour}:00\n\nPlease come back at 7:00 AM.`;
        } else if (hour >= 12 && hour < 13) {
          message = `Lunch break (12:00 NN - 1:00 PM).\n\nCurrent time: ${hour}:00\n\nAfternoon session starts at 1:00 PM.`;
        } else if (hour >= 19) {
          message = `All sessions ended for today.\n\nCurrent time: ${hour}:00\n\nSessions end at 7:00 PM.`;
        } else {
          message = 'Session not available at this time.';
        }
        setStatus('idle');
        setStatusMessage(message);
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };

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
  const processAttendance = async (session: AttendanceSession, action: SessionAction) => {
    if (!modelsLoaded) {
      setError('Face recognition models are still loading. Please wait...');
      setStatus('error');
      return;
    }

    if (!session) {
      setError('No active session at this time. Please check the session schedule.');
      setStatus('error');
      setStatusMessage('Session not available. Morning: 7:00 AM - 12:00 NN, Afternoon: 1:00 PM - 7:00 PM');
      return;
    }

    console.log(`🎬 Starting ${session} ${action} process...`);
    
    setIsProcessing(true);
    setActionType(action);
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

      // Check current attendance record
      const currentAttendance = await attendanceService.getTodayAttendance(bestMatch.staff_id);
      setAttendanceRecord(currentAttendance);

      // Validate session action
      const sessionActionInfo = attendanceService.getSessionAction(currentAttendance, session);
      setSessionInfo(sessionActionInfo);

      if (!sessionActionInfo.isValid) {
        throw new Error(sessionActionInfo.message || 'Invalid action for current session.');
      }

      // Update action if different from what was requested
      const actualAction = sessionActionInfo.action;
      const actualSession = sessionActionInfo.session;

      setDetectionResult({
        staffInfo,
        confidence: 1 - bestMatch.distance
      });

      // Record attendance
      const actionLabel = actualAction === 'timein' ? 'Time In' : 'Time Out';
      const sessionLabel = actualSession === 'morning' ? 'Morning' : 'Afternoon';
      setStatus('recording');
      setStatusMessage(`Recording ${sessionLabel} ${actionLabel}...\n\nFor: ${staffInfo.first_name} ${staffInfo.last_name}\n\nPlease wait...`);

      console.log(`📝 Recording ${actualSession} ${actualAction}...`);
      
      // Log attendance action (before recording)
      if (securityCheck.securitySettings?.enableActivityLogging && securityCheck.branch) {
        const deviceFingerprint = generateDeviceFingerprint();
        await attendanceTerminalDeviceService.logActivity({
          branch_id: securityCheck.branch.id,
          device_id: securityCheck.deviceId,
          staff_id: bestMatch.staff_id,
          device_fingerprint: deviceFingerprint,
          action_type: actualAction === 'timein' ? 'time_in' : 'time_out',
          status: 'success',
          status_reason: `${actualSession} session ${actualAction} - Face recognition successful`,
          user_agent: navigator.userAgent,
          session_data: {
            session: actualSession,
            action: actualAction,
            staff_id: bestMatch.staff_id,
            confidence: 1 - bestMatch.distance
          }
        }).catch(err => {
          console.warn('⚠️ Failed to log activity:', err);
          // Don't throw - activity logging is not critical
        });
      }
      
      console.log(`📝 Calling recordSessionAttendance:`, {
        staffId: bestMatch.staff_id,
        session: actualSession,
        action: actualAction
      });
      
      const attendanceRecord = await attendanceService.recordSessionAttendance(
        bestMatch.staff_id,
        actualSession,
        actualAction
      );

      console.log(`✅ Attendance record returned:`, {
        id: attendanceRecord.id,
        time_in: attendanceRecord.time_in,
        break_start: attendanceRecord.break_start,
        break_end: attendanceRecord.break_end,
        time_out: attendanceRecord.time_out,
        status: attendanceRecord.status
      });

      // Get recorded time based on session and action
      let recordedTime: string | undefined;
      if (actualSession === 'morning') {
        recordedTime = actualAction === 'timein' ? attendanceRecord.time_in : attendanceRecord.break_start;
      } else {
        recordedTime = actualAction === 'timein' ? attendanceRecord.break_end : attendanceRecord.time_out;
      }
      
      // Note: Morning time out is stored in break_start (lunch break start)
      // Afternoon time in is stored in break_end (lunch break end)
      // Afternoon time out is stored in time_out
      
      console.log(`⏰ Recorded time for ${actualSession} ${actualAction}:`, recordedTime);

      const formattedTime = recordedTime 
        ? new Date(recordedTime).toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        : new Date().toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
      
      const greeting = actualAction === 'timein'
        ? `${actualSession === 'morning' ? 'Good morning' : 'Good afternoon'}, ${staffInfo.first_name}! 👋`
        : `Great job ${actualSession === 'morning' ? 'this morning' : 'this afternoon'}, ${staffInfo.first_name}! 👏`;

      console.log('✅ Attendance recorded successfully');

      setStatus('success');
      setStatusMessage(
        `${greeting}\n\n${sessionLabel} ${actionLabel} recorded successfully!\n\nTime: ${formattedTime}\n\nEmployee: ${staffInfo.first_name} ${staffInfo.last_name}\nID: ${staffInfo.employee_id}`
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
    setDetectionResult(null);
    setError(null);
    setCurrentAttempt(0);
    setAttendanceRecord(null);
    setSessionInfo(null);
    stopWebcam();
    clearAutoResetTimeout();
    checkSession(); // Recheck session after reset
  };

  const handleMorningTimeIn = () => {
    if (currentSession === 'morning') {
      processAttendance('morning', 'timein');
    } else {
      setError('Morning session is not active. Morning session: 7:00 AM - 12:00 NN');
      setStatus('error');
    }
  };

  const handleMorningTimeOut = () => {
    if (currentSession === 'morning') {
      processAttendance('morning', 'timeout');
    } else {
      setError('Morning session is not active. Morning session: 7:00 AM - 12:00 NN');
      setStatus('error');
    }
  };

  const handleAfternoonTimeIn = () => {
    if (currentSession === 'afternoon') {
      processAttendance('afternoon', 'timein');
    } else {
      setError('Afternoon session is not active. Afternoon session: 1:00 PM - 7:00 PM');
      setStatus('error');
    }
  };

  const handleAfternoonTimeOut = () => {
    if (currentSession === 'afternoon') {
      processAttendance('afternoon', 'timeout');
    } else {
      setError('Afternoon session is not active. Afternoon session: 1:00 PM - 7:00 PM');
      setStatus('error');
    }
  };

  // Show security check loading
  if (securityCheck.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Security</h2>
            <p className="text-gray-600">Verifying device authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show unauthorized device error
  if (!securityCheck.isAuthorized && securityCheck.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-red-900 mb-2">Unauthorized Device</h2>
              <p className="text-red-700 text-lg mb-4 font-semibold">Only authorized devices can access this page</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm whitespace-pre-line">{securityCheck.error}</p>
              </div>
              <div className="text-gray-600 text-sm space-y-2">
                <p>If you believe this is an error, please contact your administrator.</p>
                <p className="text-xs text-gray-500 mt-4">
                  To register this device, go to Settings → Branch Management → Attendance Terminal Security
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show PIN modal
  if (showPinModal && securityCheck.requiresPin && !securityCheck.pinVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PIN Required</h2>
              <p className="text-gray-600">Enter the branch PIN to access the attendance terminal</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch PIN
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                  placeholder="Enter PIN"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Verify PIN
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Don't show main terminal if not authorized
  if (!securityCheck.isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Attendance Terminal</h1>
          <p className="text-gray-400">Facial Recognition Attendance System</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {modelsLoaded && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">System Ready</span>
              </div>
            )}
            {currentSession && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                currentSession === 'morning' 
                  ? 'bg-yellow-900/30 border-yellow-700' 
                  : 'bg-blue-900/30 border-blue-700'
              }`}>
                {currentSession === 'morning' ? (
                  <Sun className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
                <span className={`text-sm ${
                  currentSession === 'morning' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {currentSession === 'morning' ? 'Morning Session' : 'Afternoon Session'}
                </span>
              </div>
            )}
          </div>
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

          {/* Session Schedule Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-semibold text-gray-800">Morning Session</p>
                  <p className="text-gray-600">7:00 AM - 12:00 NN</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-semibold text-gray-800">Afternoon Session</p>
                  <p className="text-gray-600">1:00 PM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Morning Session */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                Morning Session (7:00 AM - 12:00 NN)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Morning Time In */}
                <button
                  onClick={handleMorningTimeIn}
                  disabled={isProcessing || !modelsLoaded || status === 'loading' || currentSession !== 'morning'}
                  className="group relative bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-1">Time In</h4>
                      <p className="text-yellow-100 text-xs">Morning</p>
                    </div>
                  </div>
                  {isProcessing && actionType === 'timein' && currentSession === 'morning' && (
                    <div className="absolute inset-0 bg-yellow-700/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </button>

                {/* Morning Time Out */}
                <button
                  onClick={handleMorningTimeOut}
                  disabled={isProcessing || !modelsLoaded || status === 'loading' || currentSession !== 'morning'}
                  className="group relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-1">Time Out</h4>
                      <p className="text-orange-100 text-xs">Morning</p>
                    </div>
                  </div>
                  {isProcessing && actionType === 'timeout' && currentSession === 'morning' && (
                    <div className="absolute inset-0 bg-orange-700/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Afternoon Session */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Moon className="w-5 h-5 text-blue-500" />
                Afternoon Session (1:00 PM - 7:00 PM)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Afternoon Time In */}
                <button
                  onClick={handleAfternoonTimeIn}
                  disabled={isProcessing || !modelsLoaded || status === 'loading' || currentSession !== 'afternoon'}
                  className="group relative bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-1">Time In</h4>
                      <p className="text-blue-100 text-xs">Afternoon</p>
                    </div>
                  </div>
                  {isProcessing && actionType === 'timein' && currentSession === 'afternoon' && (
                    <div className="absolute inset-0 bg-blue-700/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </button>

                {/* Afternoon Time Out */}
                <button
                  onClick={handleAfternoonTimeOut}
                  disabled={isProcessing || !modelsLoaded || status === 'loading' || currentSession !== 'afternoon'}
                  className="group relative bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <LogOut className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold mb-1">Time Out</h4>
                      <p className="text-red-100 text-xs">Afternoon</p>
                    </div>
                  </div>
                  {isProcessing && actionType === 'timeout' && currentSession === 'afternoon' && (
                    <div className="absolute inset-0 bg-red-700/50 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </button>
              </div>
            </div>
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