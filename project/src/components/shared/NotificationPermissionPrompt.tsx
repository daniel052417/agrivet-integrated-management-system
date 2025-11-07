// components/shared/NotificationPermissionPrompt.tsx
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';
import PushNotificationService from '../../lib/pushNotificationService';

interface NotificationPermissionPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const status = PushNotificationService.getPermissionStatus();
    setPermissionStatus(status);

    // Show prompt if permission hasn't been requested yet
    // Only show once per session (check localStorage)
    const hasShownPrompt = localStorage.getItem('notification_prompt_shown');
    if (status === 'default' && !hasShownPrompt) {
      // Delay showing prompt by 3 seconds to not interrupt user
      const timer = setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('notification_prompt_shown', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await PushNotificationService.requestPermission();
      setPermissionStatus(PushNotificationService.getPermissionStatus());

      if (granted) {
        setShowPrompt(false);
        onPermissionGranted?.();
        
        // Send a test notification
        await PushNotificationService.sendNotification({
          title: 'Notifications Enabled! 🔔',
          body: 'You will now receive push notifications for important updates.',
          icon: '🔔',
          tag: 'permission_granted'
        });
      } else {
        setShowPrompt(false);
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_shown', 'true');
  };

  // Don't show if permission is already granted or denied
  if (permissionStatus !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 animate-slide-up">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Enable Notifications
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant alerts for new orders, low stock, and important updates.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;




