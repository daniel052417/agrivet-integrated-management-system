/**
 * Device Fingerprint Utility
 * Generates a unique device fingerprint for attendance terminal device verification
 * Uses stable UUID stored in localStorage for device identification
 */

const DEVICE_ID_KEY = 'attendance_terminal_device_id';
const DEVICE_FINGERPRINT_KEY = 'attendance_terminal_device_fingerprint';

/**
 * Get or create a stable device ID from localStorage
 * This UUID persists across browser sessions and is unique per browser
 */
export const getStableDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a new UUID using crypto.randomUUID() if available, otherwise use a fallback
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        // Fallback for browsers without crypto.randomUUID()
        deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('✅ New stable device ID generated:', deviceId);
    } else {
      console.log('✅ Using existing stable device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting stable device ID:', error);
    // Fallback: generate a temporary ID if localStorage is not available
    return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Generate device fingerprint from browser/device characteristics
 * This creates a fingerprint for metadata/logging purposes only
 * The actual device identification uses the stable UUID from localStorage
 */
export const generateDeviceFingerprint = (): string => {
  try {
    // Check if we have a cached fingerprint in localStorage
    const cachedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    if (cachedFingerprint) {
      return cachedFingerprint;
    }

    // Create canvas for canvas fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillText('Device fingerprint', 2, 2);
    }
    const canvasFingerprint = canvas.toDataURL();

    // Combine browser/device characteristics
    const fingerprintString = 
      navigator.userAgent +
      navigator.language +
      screen.width + screen.height +
      new Date().getTimezoneOffset() +
      canvasFingerprint;

    // Convert to base64 and take first 64 characters
    const fingerprint = btoa(fingerprintString).substring(0, 64);

    // Cache the fingerprint in localStorage for consistency
    try {
      localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
    } catch (e) {
      // Ignore localStorage errors
    }

    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback: use basic characteristics
    const fallbackFingerprint = btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + screen.height +
      new Date().getTimezoneOffset()
    ).substring(0, 64);
    
    // Cache the fallback fingerprint
    try {
      localStorage.setItem(DEVICE_FINGERPRINT_KEY, fallbackFingerprint);
    } catch (e) {
      // Ignore localStorage errors
    }
    
    return fallbackFingerprint;
  }
};

/**
 * Get device identifier (UUID) for device verification
 * This is the primary method for device identification
 */
export const getDeviceId = (): string => {
  return getStableDeviceId();
};

/**
 * Get device info for logging
 */
export const getDeviceInfo = (): {
  user_agent: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  platform: string;
} => {
  return {
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform
  };
};

