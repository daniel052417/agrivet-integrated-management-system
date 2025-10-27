import { useState, useEffect } from 'react';
import LoginPage from './Login/components/LoginPage';
import AccountActivation from './components/auth/AccountActivation';
import { customAuth, CustomUser } from './lib/customAuth';
import { getDashboardForRole } from './lib/rolePages';

function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    showPassword: false
  });

  // Check if we're on the activation page
  const isActivationPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isActivation = window.location.pathname === '/activate' && urlParams.has('token');
    console.log('🔍 Activation page check:', {
      pathname: window.location.pathname,
      hasToken: urlParams.has('token'),
      token: urlParams.get('token'),
      isActivation
    });
    return isActivation;
  };

  // Check authentication status
  useEffect(() => {
    // Skip auth check if we're on activation page
    if (isActivationPage()) {
      setIsLoading(false);
      return;
    }
    checkAuthStatus();
  }, []);

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
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      setError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      setError('');
      const userData = await customAuth.signInWithPassword(
        credentials.username,
        credentials.password
      );
      setUser(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await customAuth.signOut();
      setUser(null);
      setError('');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
    }
  };

  const handleUsernameChange = (value: string) => {
    setLoginForm(prev => ({ ...prev, username: value }));
  };

  const handlePasswordChange = (value: string) => {
    setLoginForm(prev => ({ ...prev, password: value }));
  };

  const handleToggleShowPassword = () => {
    setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };

  // Get dashboard component for user's role
  const getDashboardComponent = () => {
    if (!user) return null;
    return getDashboardForRole(user.role_name || user.role);
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

  // Show activation page if on /activate route
  if (isActivationPage()) {
    console.log('🎯 Rendering AccountActivation component');
    return (
      <AccountActivation
        onNavigate={(path) => {
          console.log('🔄 Navigating to:', path);
          window.location.href = path;
        }}
      />
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <LoginPage
        username={loginForm.username}
        password={loginForm.password}
        showPassword={loginForm.showPassword}
        isLoading={isLoading}
        error={error}
        onUsernameChange={handleUsernameChange}
        onPasswordChange={handlePasswordChange}
        onToggleShowPassword={handleToggleShowPassword}
        onLoginSubmit={(e) => {
          e.preventDefault();
          handleLogin({
            username: loginForm.username,
            password: loginForm.password,
          });
        }}
      />
    );
  }

  // Render role-based dashboard
  const renderDashboard = () => {
    if (!user) {
      return null;
    }

    const DashboardComponent = getDashboardComponent();
    
    if (!DashboardComponent) {
      // Fallback for unknown roles
      console.warn(`Unknown role: ${user.role_name}, falling back to default dashboard`);
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
            <p className="text-gray-600">Your role does not have access to any dashboard.</p>
            <p className="text-sm text-gray-500 mt-2">Role: {user.role_name}</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    
    // Render the appropriate dashboard component
    return <DashboardComponent user={user} onLogout={handleLogout} />;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderDashboard()}
      
      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
