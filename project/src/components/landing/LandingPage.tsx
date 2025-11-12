// components/landing/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Clock, Building2, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { settingsService } from '../../lib/settingsService';
import { branchManagementService, Branch, AttendanceSecuritySettings } from '../../lib/branchManagementService';
import { attendanceTerminalDeviceService } from '../../lib/attendanceTerminalDeviceService';
import { generateDeviceFingerprint } from '../../lib/utils/deviceFingerprint';
import { customAuth } from '../../lib/customAuth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Tiongson');
  const [tagline, setTagline] = useState('AGRIVET');
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [showDeviceError, setShowDeviceError] = useState(false);

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
      
      // Generate device fingerprint
      const deviceFingerprint = generateDeviceFingerprint();
      console.log('🔍 Device fingerprint generated:', deviceFingerprint.substring(0, 20) + '...');
      
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
      
      console.log('🔍 Checking device registration for branch:', mainBranch.name);
      
      // Check if device is registered in the main branch (or any active branch)
      let deviceFound = false;
      let registeredDevice: any = null;
      let deviceBranch: Branch | null = null;
      
      // First, check main branch
      try {
        const device = await attendanceTerminalDeviceService.getDeviceByFingerprint(
          mainBranch.id,
          deviceFingerprint
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
      
      // If not found in main branch, check other active branches
      if (!deviceFound) {
        for (const branch of activeBranches) {
          if (branch.id === mainBranch.id) continue; // Already checked
          
          try {
            const device = await attendanceTerminalDeviceService.getDeviceByFingerprint(
              branch.id,
              deviceFingerprint
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
      
      // If device is not registered in any branch, show error
      if (!deviceFound || !registeredDevice || !deviceBranch) {
        console.error('❌ Device not registered in any branch');
        
        // Log unauthorized access attempt (use main branch for logging)
        try {
          const securitySettings: AttendanceSecuritySettings = mainBranch.attendance_security_settings || {
            enableActivityLogging: true
          };
          
          if (securitySettings.enableActivityLogging !== false) {
            await attendanceTerminalDeviceService.logActivity({
              branch_id: mainBranch.id,
              device_fingerprint: deviceFingerprint,
              action_type: 'device_blocked',
              status: 'blocked',
              status_reason: 'Unauthorized device - not registered in attendance_terminal_devices table',
              user_agent: navigator.userAgent,
              session_data: {
                fingerprint: deviceFingerprint.substring(0, 20) + '...',
                attemptedAccess: true,
                blockedAt: new Date().toISOString(),
                checkedBranches: activeBranches.map(b => ({ id: b.id, name: b.name }))
              }
            });
            console.log('✅ Unauthorized access attempt logged');
          }
        } catch (logErr: any) {
          console.error('❌ Failed to log unauthorized access:', logErr);
        }
        
        // Show error message
        const errorMessage = 'Unauthorized Device\n\nThis device is not registered in the attendance terminal devices database.\n\nOnly authorized devices can access the attendance terminal.\n\nPlease contact your administrator to register this device.';
        setDeviceError(errorMessage);
        setShowDeviceError(true);
        setIsCheckingDevice(false);
        return;
      }
      
      // Device is registered and active
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
        const securitySettings: AttendanceSecuritySettings = deviceBranch.attendance_security_settings || {
          enableActivityLogging: true
        };
        
        if (securitySettings.enableActivityLogging !== false) {
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
      
      // Navigate to attendance terminal
      console.log('✅ Device authorized, navigating to attendance terminal');
      navigate('/attendance-terminal');
      
    } catch (error: any) {
      console.error('❌ Error in handleAttendanceClick:', error);
      const errorMessage = 'Device Verification Error\n\nAn error occurred while checking device authorization.\n\nError: ' + (error.message || 'Unknown error') + '\n\nPlease contact your administrator.';
      setDeviceError(errorMessage);
      setShowDeviceError(true);
    } finally {
      setIsCheckingDevice(false);
    }
  };

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
              <h2 className="text-2xl font-bold text-red-900 mb-4">Unauthorized Device</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm whitespace-pre-line">{deviceError}</p>
              </div>
              <div className="text-gray-600 text-sm space-y-2 mb-6">
                <p>If you believe this is an error, please contact your administrator.</p>
                <p className="text-xs text-gray-500 mt-4">
                  To register this device, go to Settings → Branch Management → Attendance Terminal Security
                </p>
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
    </div>
  );
};

export default LandingPage;

