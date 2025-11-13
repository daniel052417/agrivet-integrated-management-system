/**
 * Device Fingerprint Utility
 * Generates a unique device fingerprint for attendance terminal device verification
 */

/**
 * Generate device fingerprint from browser/device characteristics
 * This creates a consistent fingerprint that can be used to identify the device
 */
export const generateDeviceFingerprint = (): string => {
  try {
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
    return fallbackFingerprint;
  }
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

