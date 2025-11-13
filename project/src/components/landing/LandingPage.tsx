// components/landing/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Clock, Building2, AlertCircle, Shield, Loader2, CheckCircle, X, Key } from 'lucide-react';
import { settingsService } from '../../lib/settingsService';
import { branchManagementService, Branch, AttendanceSecuritySettings } from '../../lib/branchManagementService';
import { attendanceTerminalDeviceService } from '../../lib/attendanceTerminalDeviceService';
import { attendanceTerminalOTPService } from '../../lib/attendanceTerminalOTPService';
import { getStableDeviceId, generateDeviceFingerprint, getDeviceInfo, getDeviceId } from '../../lib/utils/deviceFingerprint';
import { customAuth } from '../../lib/customAuth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Tiongson');
  const [tagline, setTagline] = useState('AGRIVET');
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [showDeviceError, setShowDeviceError] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [waitingForRegistration, setWaitingForRegistration] = useState(false);
  const [registrationCheckInterval, setRegistrationCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        setCompanyLogo(general.companyLogo || settings.company_logo || null);
        
        // Extract company name
        const fullCompanyName = general.companyName || settings.company_name || 'Tiongson';
        setCompanyName(fullCompanyName.split(' ')[0]);
        setTagline(fullCompanyName.includes(' ') ? fullCompanyName.split(' ').slice(1).join(' ') : 'AGRIVET');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleLoginClick = () => {
    // Check if user is already authenticated
    const currentUser = customAuth.getCurrentUser();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleAttendanceClick = async () => {
    try {
      setIsCheckingDevice(true);
      setDeviceError(null);
      setShowDeviceError(false);
      
      console.log('🔒 Checking device authorization before accessing attendance terminal...');
      
      // Get all branches
      const branches = await branchManagementService.getAllBranches();
      if (!branches || branches.length === 0) {
        console.warn('⚠️ No branches found');
        const errorMessage = 'Configuration Error\n\nNo branches found in the system. Please contact your administrator.';
        setDeviceError(errorMessage);
        setShowDeviceError(true);
        setIsCheckingDevice(false);
        return;
      }
      
      // Get active branches (prioritize main branch)
      const activeBranches = branches.filter(b => b.is_active);
      const mainBranch = activeBranches.find(b => b.branch_type === 'main') || activeBranches[0] || null;
      
      if (!mainBranch) {
        console.warn('⚠️ No active branches found');
        const errorMessage = 'Configuration Error\n\nNo active branches found. Please contact your administrator.';
        setDeviceError(errorMessage);
        setShowDeviceError(true);
        setIsCheckingDevice(false);
        return;
      }
      
      setCurrentBranch(mainBranch);
      
      // Try to get user location (only if geo-location verification is enabled)
      // This prevents unnecessary location permission requests
      let location: { latitude: number; longitude: number } | null = null;
      const securitySettings = mainBranch.attendance_security_settings;
      const needsLocation = securitySettings && 
                           typeof securitySettings === 'object' && 
                           (securitySettings as AttendanceSecuritySettings).enableGeoLocationVerification === true;
      
      if (needsLocation) {
        try {
          if (navigator.geolocation) {
            console.log('📍 Geo-location verification enabled, requesting location permission...');
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000
              });
            });
            location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setUserLocation(location);
            console.log('✅ Location obtained:', location);
          }
        } catch (geoError) {
          console.warn('⚠️ Failed to get user location:', geoError);
          // Don't block - location is optional, but log the error
          // If geo-location is required, the AttendanceTerminal component will handle the error
        }
      } else {
        console.log('ℹ️ Geo-location verification not enabled, skipping location request');
      }
      
      // Get stable device UUID from localStorage (primary identifier)
      const deviceUuid = getStableDeviceId();
      console.log('🔍 Device UUID (stable):', deviceUuid);
      
      // Generate device fingerprint for metadata/logging
      const deviceFingerprint = generateDeviceFingerprint();
      console.log('🔍 Device fingerprint (metadata):', deviceFingerprint.substring(0, 20) + '...');
      
      console.log('🔍 Checking device registration for branch:', mainBranch.name);
      
      // Check if device is registered in the main branch (or any active branch)
      // Use device_uuid for lookup (primary method)
      let deviceFound = false;
      let registeredDevice: any = null;
      let deviceBranch: Branch | null = null;
      
      // First, check main branch by UUID
      try {
        const device = await attendanceTerminalDeviceService.getDeviceByUuid(
          mainBranch.id,
          deviceUuid
        );
        
        if (device && device.is_active) {
          deviceFound = true;
          registeredDevice = device;
          deviceBranch = mainBranch;
          console.log('✅ Device found in main branch:', {
            deviceId: device.id,
            deviceName: device.device_name,
            branchName: mainBranch.name
          });
        }
      } catch (err: any) {
        console.log('ℹ️ Device not found in main branch, checking other branches...');
      }
      
      // If not found in main branch, check other active branches by UUID
      if (!deviceFound) {
        for (const branch of activeBranches) {
          if (branch.id === mainBranch.id) continue; // Already checked
          
          try {
            const device = await attendanceTerminalDeviceService.getDeviceByUuid(
              branch.id,
              deviceUuid
            );
            
            if (device && device.is_active) {
              deviceFound = true;
              registeredDevice = device;
              deviceBranch = branch;
              console.log('✅ Device found in branch:', {
                deviceId: device.id,
                deviceName: device.device_name,
                branchName: branch.name
              });
              break;
            }
          } catch (err: any) {
            // Continue checking other branches
            continue;
          }
        }
      }
      
      // If device is registered, navigate directly to attendance terminal
      if (deviceFound && registeredDevice && deviceBranch) {
        console.log('✅ Device verified successfully:', {
          deviceId: registeredDevice.id,
          deviceName: registeredDevice.device_name,
          branchName: deviceBranch.name
        });
        
        // Update device last used
        try {
          await attendanceTerminalDeviceService.updateDeviceLastUsed(registeredDevice.id);
          console.log('✅ Device last used timestamp updated');
        } catch (updateErr: any) {
          console.warn('⚠️ Failed to update device last used:', updateErr);
          // Don't block - this is not critical
        }
        
        // Log successful device verification
        try {
          const securitySettings = deviceBranch.attendance_security_settings;
          
          if (securitySettings?.enableActivityLogging !== false) {
            await attendanceTerminalDeviceService.logActivity({
              branch_id: deviceBranch.id,
              device_id: registeredDevice.id,
              device_fingerprint: deviceFingerprint,
              action_type: 'device_verified',
              status: 'success',
              status_reason: 'Device verified successfully - access granted from landing page',
              user_agent: navigator.userAgent,
              session_data: {
                deviceName: registeredDevice.device_name,
                deviceType: registeredDevice.device_type,
                verifiedAt: new Date().toISOString(),
                source: 'landing_page'
              }
            });
            console.log('✅ Device verification logged');
          }
        } catch (logErr: any) {
          console.warn('⚠️ Failed to log device verification:', logErr);
          // Don't block - logging is not critical
        }
        
        // Navigate to attendance terminal with branch_id parameter
        // This ensures AttendanceTerminal uses the same branch where the device is registered
        console.log('✅ Device authorized, navigating to attendance terminal');
        console.log('📍 Using branch:', { branchId: deviceBranch.id, branchName: deviceBranch.name });
        setIsCheckingDevice(false);
        navigate(`/attendance-terminal?branch_id=${deviceBranch.id}`);
        return;
      }
      
      // Device is not registered - check if general branch settings allow device registration
      console.log('⚠️ Device not registered, checking if device registration is enabled...');
      
      // Get general branch settings
      const branchSettings = await branchManagementService.getBranchSettings();
      const allowDeviceRegistration = branchSettings.allow_device_registration === true;
      
      if (!allowDeviceRegistration) {
        // Device registration is disabled - show unauthorized access message
        console.log('❌ Device registration is currently disabled');
        const errorMessage = 'Unauthorized Access\n\nThis device is not registered and device registration is currently disabled.\n\nPlease contact your administrator to register this device.';
        setDeviceError(errorMessage);
        setShowDeviceError(true);
        setIsCheckingDevice(false);
        return;
      }
      
      // Device registration is enabled - request OTP
      console.log('✅ Device registration is enabled, requesting OTP...');
      
      // Get device info and include UUID and fingerprint
      const deviceInfo = getDeviceInfo();
      const browserInfo = {
        ...deviceInfo,
        device_uuid: deviceUuid, // Stable UUID (primary identifier)
        fingerprint: deviceFingerprint // Metadata fingerprint
      };
      
      // Request OTP (device_uuid and fingerprint will be stored in OTP log)
      setRequestingOTP(true);
      const otpResult = await attendanceTerminalOTPService.requestOTP({
        branch_id: mainBranch.id,
        device_uuid: deviceUuid, // Pass stable UUID
        device_name: `${navigator.platform} - ${navigator.userAgent.substring(0, 50)}`,
        device_type: 'kiosk',
        location_latitude: location?.latitude || null,
        location_longitude: location?.longitude || null,
        ip_address: null, // Would need backend to get real IP
        user_agent: navigator.userAgent,
        browser_info: browserInfo
      });
      
      setRequestingOTP(false);
      
      if (!otpResult.success) {
        throw new Error(otpResult.error || 'Failed to request OTP');
      }
      
      // Show OTP modal
      setOtpRequested(true);
      setShowOTPModal(true);
      setIsCheckingDevice(false);
      
    } catch (error: any) {
      console.error('❌ Error in handleAttendanceClick:', error);
      const errorMessage = 'Device Verification Error\n\nAn error occurred while checking device authorization.\n\nError: ' + (error.message || 'Unknown error') + '\n\nPlease contact your administrator.';
      setDeviceError(errorMessage);
      setShowDeviceError(true);
      setIsCheckingDevice(false);
      setRequestingOTP(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6 || !currentBranch) {
      setDeviceError('Please enter a valid 6-digit OTP code.');
      setShowDeviceError(true);
      return;
    }
    
    try {
      setVerifyingOTP(true);
      setDeviceError(null);
      
      // Verify OTP code ONLY - no device UUID check or validation
      // The OTP verification only checks if the code is valid and not expired
      // Device UUID is not required or checked during OTP verification
      const verifyResult = await attendanceTerminalOTPService.verifyOTP({
        otp_code: otpCode,
        branch_id: currentBranch.id
      });
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Invalid OTP code');
      }
      
      // OTP verified successfully - proceed directly to waiting state
      // OTP verification ONLY checks the OTP code - no device UUID is checked or required
      // Device UUID is completely excluded from OTP verification process
      
      // Set states for loading/waiting screen
      setOtpVerified(true);
      setVerifyingOTP(false);
      setWaitingForRegistration(true);
      
      console.log('✅ OTP code verified successfully');
      console.log('⏳ Waiting for administrator to register device...');
      console.log('ℹ️ Note: Device UUID is NOT checked during OTP verification - only OTP code is verified');
      
      // Get device UUID from localStorage for polling (NOT from verification result)
      // Device UUID is only used AFTER OTP verification for polling - not during verification
      const deviceUuid = getStableDeviceId();
      
      if (!deviceUuid) {
        console.error('⚠️ Device UUID not found in localStorage - this should not happen');
        // Continue anyway - polling will handle this
      }
      
      // Store device UUID and fingerprint for polling (optional metadata)
      const deviceFingerprint = verifyResult.device_fingerprint || generateDeviceFingerprint();
      setDeviceFingerprint(deviceFingerprint);
      
      // Start polling for device registration
      // Polling uses device UUID from localStorage (not from OTP verification)
      // Device registration check happens during polling - NOT during OTP verification
      startRegistrationPolling(deviceUuid, currentBranch.id);
      
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      setDeviceError(error.message || 'Invalid OTP code. Please try again.');
      setShowDeviceError(true);
      setVerifyingOTP(false);
    }
  };
  
  const handleCloseOTPModal = () => {
    // Stop polling if active
    if (registrationCheckInterval) {
      clearInterval(registrationCheckInterval);
      setRegistrationCheckInterval(null);
    }
    
    setShowOTPModal(false);
    setOtpCode('');
    setOtpRequested(false);
    setOtpVerified(false);
    setDeviceFingerprint(null);
    setDeviceError(null);
    setCurrentBranch(null);
    setUserLocation(null);
    setWaitingForRegistration(false);
  };

  const startRegistrationPolling = (deviceUuid: string, branchId: string) => {
    // Clear any existing interval
    if (registrationCheckInterval) {
      clearInterval(registrationCheckInterval);
      setRegistrationCheckInterval(null);
    }

    let pollCount = 0;
    const maxPolls = 100; // 100 polls * 3 seconds = 5 minutes max
    let timeoutId: NodeJS.Timeout | null = null;
    let isStopped = false;

    const stopPolling = () => {
      if (isStopped) return;
      isStopped = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Set up polling every 3 seconds
    const interval = setInterval(() => {
      if (isStopped) {
        clearInterval(interval);
        return;
      }
      
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        setRegistrationCheckInterval(null);
        stopPolling();
        setDeviceError('Device registration timeout. Please contact the administrator.');
        setShowDeviceError(true);
        setWaitingForRegistration(false);
        return;
      }
      checkDeviceRegistration(deviceUuid, branchId, () => {
        clearInterval(interval);
        setRegistrationCheckInterval(null);
        stopPolling();
      });
    }, 3000);

    setRegistrationCheckInterval(interval);

    // Check immediately
    checkDeviceRegistration(deviceUuid, branchId, () => {
      clearInterval(interval);
      setRegistrationCheckInterval(null);
      stopPolling();
    });

    // Clear interval after 5 minutes (max wait time) as backup
    timeoutId = setTimeout(() => {
      if (!isStopped && interval) {
        clearInterval(interval);
        setRegistrationCheckInterval(null);
        isStopped = true;
        setDeviceError('Device registration timeout. Please contact the administrator.');
        setShowDeviceError(true);
        setWaitingForRegistration(false);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const checkDeviceRegistration = async (
    deviceUuid: string, 
    branchId: string,
    onRegistered?: () => void
  ) => {
    try {
      // Use device_uuid for lookup (primary method)
      const device = await attendanceTerminalDeviceService.getDeviceByUuid(branchId, deviceUuid);
      
      if (device && device.is_active) {
        console.log('✅ Device registered! Redirecting to attendance terminal...');
        
        // Stop polling
        if (onRegistered) {
          onRegistered();
        }
        
        // Update device last used
        await attendanceTerminalDeviceService.updateDeviceLastUsed(device.id);
        
        // Log device access
        try {
          const securitySettings = currentBranch?.attendance_security_settings;
          
          if (securitySettings?.enableActivityLogging !== false) {
            await attendanceTerminalDeviceService.logActivity({
              branch_id: branchId,
              device_fingerprint: device.device_fingerprint, // Metadata only
              action_type: 'device_verified',
              status: 'success',
              status_reason: 'Device registered and access granted',
              location_latitude: userLocation?.latitude || null,
              location_longitude: userLocation?.longitude || null,
              user_agent: navigator.userAgent,
              session_data: {
                device_uuid: deviceUuid,
                fingerprint: device.device_fingerprint?.substring(0, 20) + '...',
                registered: true,
                accessedAt: new Date().toISOString(),
                source: 'landing_page_otp'
              }
            });
          }
        } catch (logErr: any) {
          console.warn('⚠️ Failed to log device access:', logErr);
        }
        
        // Close modal and redirect with branch_id parameter
        // Use the branch where the device was registered
        setWaitingForRegistration(false);
        setShowOTPModal(false);
        if (currentBranch) {
          console.log('📍 Navigating to attendance terminal with branch:', { branchId: currentBranch.id, branchName: currentBranch.name });
          navigate(`/attendance-terminal?branch_id=${currentBranch.id}`);
        } else {
          navigate('/attendance-terminal');
        }
      }
    } catch (error: any) {
      // Device not registered yet, continue polling
      // Only log if it's not a "not found" error (which is expected)
      if (error.message && !error.message.includes('not found') && !error.message.includes('PGRST116')) {
        console.log('⏳ Device not registered yet, waiting...', error);
      }
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (registrationCheckInterval) {
        clearInterval(registrationCheckInterval);
      }
    };
  }, [registrationCheckInterval]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Header with Logo and Company Name */}
        <div className="text-center mb-12">
          {companyLogo ? (
            <div className="flex justify-center mb-6">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-24 w-24 object-contain"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{companyName}</h1>
          <p className="text-xl text-gray-600">{tagline}</p>
          <p className="text-sm text-gray-500 mt-2">Management System</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Login to System Card */}
          <button
            onClick={handleLoginClick}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-emerald-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <LogIn className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Login to System</h2>
              <p className="text-gray-600 text-center mb-4">
                Access the admin dashboard, POS system, and management features
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>For Admins & Cashiers</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>

          {/* Attendance Terminal Card */}
          <button
            onClick={handleAttendanceClick}
            disabled={isCheckingDevice}
            className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-emerald-500 overflow-hidden ${
              isCheckingDevice ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {isCheckingDevice ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Clock className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Attendance Terminal</h2>
              <p className="text-gray-600 text-center mb-4">
                {isCheckingDevice ? 'Checking device authorization...' : 'Quick time-in and time-out using facial recognition'}
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>Kiosk Mode</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Select an option above to continue
          </p>
        </div>
      </div>

      {/* Device Authorization Error Modal */}
      {showDeviceError && deviceError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-red-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-4">Error</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm whitespace-pre-line">{deviceError}</p>
              </div>
              <button
                onClick={() => {
                  setShowDeviceError(false);
                  setDeviceError(null);
                }}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-blue-200">
            {!otpVerified ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Registration Required</h2>
                <p className="text-gray-600 mb-6">
                  An OTP code has been sent to the administrator. Please enter the code below to register this device.
                </p>
                
                {otpRequested && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      ✅ OTP code sent to administrator. Please check your email or contact the administrator for the code.
                    </p>
                    {currentBranch && (
                      <p className="text-blue-600 text-xs mt-2">
                        Branch: {currentBranch.name} ({currentBranch.code})
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                      setOtpCode(value);
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={6}
                    disabled={verifyingOTP || requestingOTP}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-digit code sent to the administrator
                  </p>
                </div>

                {deviceError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{deviceError}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseOTPModal}
                    disabled={verifyingOTP || requestingOTP}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={verifyingOTP || requestingOTP || otpCode.length !== 6}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {verifyingOTP ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                {waitingForRegistration ? (
                  <>
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Device Registration</h2>
                    <p className="text-gray-600 mb-6">
                      Your OTP has been verified successfully. Please wait while the administrator registers your device.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        ⏳ <strong>Status:</strong> Waiting for administrator to register your device...
                      </p>
                      <p className="text-blue-600 text-xs mt-2">
                        This page will automatically redirect to the attendance terminal once your device is registered.
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking registration status...</span>
                    </div>
                    <button
                      onClick={handleCloseOTPModal}
                      className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">OTP Verified Successfully</h2>
                    <p className="text-gray-600 mb-6">
                      Your device has been verified. Waiting for administrator to register your device.
                    </p>
                    <button
                      onClick={handleCloseOTPModal}
                      className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

