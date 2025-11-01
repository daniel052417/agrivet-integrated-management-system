import { useEffect } from 'react';
import { customAuth } from '../lib/customAuth';

/**
 * Hook to automatically update session activity
 * Updates session last_activity timestamp when:
 * - Component mounts
 * - Every 5 minutes (to track active sessions)
 * 
 * For route-based updates, call customAuth.updateSessionActivity() 
 * manually in your route change handlers or use the version with react-router.
 */
export const useSessionActivity = () => {
  useEffect(() => {
    // Update activity immediately on mount
    const updateActivity = async () => {
      try {
        await customAuth.updateSessionActivity();
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    };

    updateActivity();

    // Set up interval to update every 5 minutes
    const interval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []); // Only run on mount/unmount
};

/**
 * Hook version with react-router support (optional)
 * Uncomment and use this if you're using react-router-dom
 */
/*
import { useLocation } from 'react-router-dom';

export const useSessionActivityWithRouter = () => {
  const location = useLocation();

  useEffect(() => {
    const updateActivity = async () => {
      try {
        await customAuth.updateSessionActivity();
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    };

    // Update immediately on route change
    updateActivity();

    // Set up interval to update every 5 minutes
    const interval = setInterval(() => {
      updateActivity();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [location.pathname]);
};
*/

export default useSessionActivity;

