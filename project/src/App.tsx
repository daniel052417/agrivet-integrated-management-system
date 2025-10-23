import { useState, useEffect } from 'react';
import LoginPage from './Login/components/LoginPage';
import AccountActivation from './components/auth/AccountActivation';
import OpeningCashModal from './components/modals/OpeningCashModal';
import { customAuth, CustomUser } from './lib/customAuth';
import { getDashboardForRole } from './lib/rolePages';
import { posSessionService } from './lib/posSessionService';

function App() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    showPassword: false
  });

  // State for Opening Cash Modal
  const [showOpeningCashModal, setShowOpeningCashModal] = useState(false);
  const [needsOpeningCash, setNeedsOpeningCash] = useState(false);

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
      
      // Check if user is a cashier and needs to set opening cash
      const isCashier = userData.role_name === 'cashier' || userData.role === 'cashier';
      
      if (isCashier) {
        // Check if there's an existing POS session
        const hasPosSession = (userData as any).current_pos_session;
        
        if (hasPosSession) {
          // If POS session exists, check if it needs opening cash
          const session = (userData as any).current_pos_session;
          
          // If starting_cash is 0 or null, show modal
          if (!session.starting_cash || session.starting_cash === 0) {
            setNeedsOpeningCash(true);
            setShowOpeningCashModal(true);
          }
        } else {
          // No POS session exists, show modal to create one
          setNeedsOpeningCash(true);
          setShowOpeningCashModal(true);
        }
      }
      
      setUser(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    }
  };

  const handleOpeningCashSubmit = async (amount: number) => {
    try {
      if (!user) return;

      console.log('💰 Submitting opening cash:', amount);

      // Check if there's an existing POS session
      const existingSession = (user as any).current_pos_session;

      if (existingSession) {
        // Update existing session with opening cash
        await posSessionService.updateSession(existingSession.id, {
          starting_cash: amount
        });
        
        console.log('✅ Updated existing POS session with opening cash');
      } else {
        // Create new POS session
        if (!user.branch_id) {
          throw new Error('User does not have a branch assigned');
        }

        const terminalId = await posSessionService.getAvailableTerminalForBranch(
          user.branch_id,
          user.id
        );

        const newSession = await posSessionService.createSession({
          cashier_id: user.id,
          branch_id: user.branch_id,
          terminal_id: terminalId || undefined,
          starting_cash: amount,
          notes: `Session started by ${user.first_name} ${user.last_name} with opening cash ₱${amount.toFixed(2)}`
        });

        // Update user object with new session
        (user as any).current_pos_session = newSession;
        
        console.log('✅ Created new POS session with opening cash');
      }

      // Close modal and mark as complete
      setShowOpeningCashModal(false);
      setNeedsOpeningCash(false);
      setError('');

    } catch (err: any) {
      console.error('❌ Error setting opening cash:', err);
      throw new Error(err.message || 'Failed to set opening cash');
    }
  };

  const handleLogout = async () => {
    try {
      await customAuth.signOut();
      setUser(null);
      setError('');
      setShowOpeningCashModal(false);
      setNeedsOpeningCash(false);
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
      
      {/* Opening Cash Modal for Cashiers */}
      {user && showOpeningCashModal && (
        <OpeningCashModal
          isOpen={showOpeningCashModal}
          cashierName={`${user.first_name} ${user.last_name}`}
          onSubmit={handleOpeningCashSubmit}
          onClose={() => {
            // Only allow closing if not required
            if (!needsOpeningCash) {
              setShowOpeningCashModal(false);
            }
          }}
          isClosable={!needsOpeningCash}
        />
      )}
      
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