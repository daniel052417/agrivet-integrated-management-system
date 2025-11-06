import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import AttendanceTerminal from './components/attendance/AttendanceTerminal';
import AccountActivation from './components/auth/AccountActivation';
import LoginPageWrapper from './components/auth/LoginPageWrapper';
import DashboardWrapper from './components/dashboard/DashboardWrapper';
import { customAuth, CustomUser } from './lib/customAuth';

function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on the activation page
  const isActivationPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return location.pathname === '/activate' && urlParams.has('token');
  };

  // Check authentication status
  useEffect(() => {
    // Skip auth check if we're on activation page or public routes
    if (isActivationPage() || location.pathname === '/' || location.pathname === '/attendance-terminal') {
      setIsLoading(false);
      return;
    }

    // For protected routes, check auth
    if (location.pathname !== '/login' && location.pathname !== '/activate') {
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, [location.pathname]);

  const checkAuthStatus = async () => {
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
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: CustomUser) => {
    setUser(userData);
    // Navigate to dashboard (will be handled by ProtectedRoute)
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await customAuth.signOut();
      setUser(null);
      navigate('/');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

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
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/attendance-terminal" element={<AttendanceTerminal />} />
      <Route path="/activate" element={<AccountActivation onNavigate={(path) => window.location.href = path} />} />
      
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
  );
}

export default App;
