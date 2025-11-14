import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { customAuth, CustomUser } from './lib/customAuth';
import { logger } from './utils/logger';

// Lazy load route components for code splitting
const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const AttendanceTerminal = lazy(() => import('./components/attendance/AttendanceTerminal'));
const AccountActivation = lazy(() => import('./components/auth/AccountActivation'));
const LoginPageWrapper = lazy(() => import('./components/auth/LoginPageWrapper'));
const DashboardWrapper = lazy(() => import('./components/dashboard/DashboardWrapper'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize activation page check
  const isActivationPage = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return location.pathname === '/activate' && urlParams.has('token');
  }, [location.pathname]);

  // Memoize public routes check
  const isPublicRoute = useMemo(() => {
    return location.pathname === '/' || location.pathname === '/attendance-terminal';
  }, [location.pathname]);

  // Memoize check auth status function
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already authenticated in memory
      const currentUser = customAuth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
        return;
      }

      // Check for stored session
      const userData = await customAuth.checkAuthStatus();
      if (userData) {
        setUser(userData);
        customAuth.setCurrentUser(userData);
      } else {
        // Not authenticated, redirect to landing page
        navigate('/');
      }
    } catch (err: any) {
      logger.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Check authentication status
  useEffect(() => {
    // Skip auth check if we're on activation page or public routes
    if (isActivationPage || isPublicRoute) {
      setIsLoading(false);
      return;
    }

    // For protected routes, check auth
    if (location.pathname !== '/login' && location.pathname !== '/activate') {
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, [location.pathname, isActivationPage, isPublicRoute, checkAuthStatus]);

  const handleLoginSuccess = useCallback((userData: CustomUser) => {
    setUser(userData);
    // Navigate to dashboard (will be handled by ProtectedRoute)
    navigate('/dashboard');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await customAuth.signOut();
      setUser(null);
      navigate('/');
    } catch (err: any) {
      logger.error('Logout error:', err);
    }
  }, [navigate]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/attendance-terminal" element={<AttendanceTerminal />} />
        <Route 
          path="/activate" 
          element={
            <AccountActivation 
              onNavigate={(path) => window.location.href = path} 
            />
          } 
        />
        
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPageWrapper onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <DashboardWrapper user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Redirect authenticated users from root to dashboard */}
        <Route 
          path="*" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Suspense>
  );
}

export default App;
