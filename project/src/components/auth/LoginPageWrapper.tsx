// components/auth/LoginPageWrapper.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from '../../Login/components/LoginPage';
import MFAVerification from './MFAVerification';
import OpeningCashModal from '../modals/OpeningCashModal';
import { customAuth, CustomUser } from '../../lib/customAuth';
import { getDashboardForRole } from '../../lib/rolePages';
import { posSessionService } from '../../lib/posSessionService';
import { mfaAuth, MFAVerificationData } from '../../lib/mfaAuth';

interface LoginPageWrapperProps {
  onLoginSuccess: (user: CustomUser) => void;
}

const LoginPageWrapper: React.FC<LoginPageWrapperProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
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
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);

  // State for MFA Verification
  const [mfaData, setMfaData] = useState<MFAVerificationData | null>(null);
  const [showMFA, setShowMFA] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already authenticated in memory
      const currentUser = customAuth.getCurrentUser();
      if (currentUser) {
        setCurrentUser(currentUser);
        onLoginSuccess(currentUser);
        setIsLoading(false);
        return;
      }

      // Check for stored session
      const userData = await customAuth.checkAuthStatus();
      if (userData) {
        setCurrentUser(userData);
        customAuth.setCurrentUser(userData);
        onLoginSuccess(userData);
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      setError('');
      const result = await customAuth.signInWithPassword(
        credentials.username,
        credentials.password
      );
      
      // Check if MFA is required
      if ('requiresMFA' in result && result.requiresMFA) {
        setMfaData({
          userId: result.userId,
          userEmail: result.userEmail,
          userName: result.userName,
          userRole: result.userRole
        });
        setShowMFA(true);
        return;
      }
      
      // Normal login successful
      const userData = result as CustomUser;
      
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
            setCurrentUser(userData);
            return; // Don't call onLoginSuccess yet, wait for opening cash
          }
        } else {
          // No POS session exists, show modal to create one
          setNeedsOpeningCash(true);
          setShowOpeningCashModal(true);
          setCurrentUser(userData);
          return; // Don't call onLoginSuccess yet, wait for opening cash
        }
      }
      
      setCurrentUser(userData);
      onLoginSuccess(userData);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    }
  };

  const handleMFAVerify = async (otp: string) => {
    if (!mfaData) return;
    
    try {
      setError('');
      const userData = await mfaAuth.verifyOTPAndCompleteLogin(mfaData, otp);
      
      // Check if user is a cashier and needs to set opening cash
      const isCashier = userData.role_name === 'cashier' || userData.role === 'cashier';
      
      if (isCashier) {
        const hasPosSession = (userData as any).current_pos_session;
        if (hasPosSession) {
          const session = (userData as any).current_pos_session;
          if (!session.starting_cash || session.starting_cash === 0) {
            setNeedsOpeningCash(true);
            setShowOpeningCashModal(true);
            setCurrentUser(userData);
            return; // Don't call onLoginSuccess yet, wait for opening cash
          }
        } else {
          setNeedsOpeningCash(true);
          setShowOpeningCashModal(true);
          setCurrentUser(userData);
          return; // Don't call onLoginSuccess yet, wait for opening cash
        }
      }
      
      setCurrentUser(userData);
      setShowMFA(false);
      setMfaData(null);
      onLoginSuccess(userData);
    } catch (err: any) {
      console.error('MFA verification error:', err);
      throw err; // Re-throw to let MFAVerification component handle it
    }
  };

  const handleMFACancel = () => {
    setShowMFA(false);
    setMfaData(null);
    setError('Login cancelled');
  };

  const handleOpeningCashSubmit = async (amount: number) => {
    try {
      if (!currentUser) return;

      console.log('💰 Submitting opening cash:', amount);

      // Check if there's an existing POS session
      const existingSession = (currentUser as any).current_pos_session;

      if (existingSession) {
        // Update existing session with opening cash
        await posSessionService.updateSession(existingSession.id, {
          starting_cash: amount
        });
        
        console.log('✅ Updated existing POS session with opening cash');
      } else {
        // Create new POS session
        if (!currentUser.branch_id) {
          throw new Error('User does not have a branch assigned');
        }

        const terminalId = await posSessionService.getAvailableTerminalForBranch(
          currentUser.branch_id,
          currentUser.id
        );

        const newSession = await posSessionService.createSession({
          cashier_id: currentUser.id,
          branch_id: currentUser.branch_id,
          terminal_id: terminalId || undefined,
          starting_cash: amount,
          notes: `Session started by ${currentUser.first_name} ${currentUser.last_name} with opening cash ₱${amount.toFixed(2)}`
        });

        // Update user object with new session
        (currentUser as any).current_pos_session = newSession;
        
        console.log('✅ Created new POS session with opening cash');
      }

      // Close modal and mark as complete
      setShowOpeningCashModal(false);
      setNeedsOpeningCash(false);
      setError('');

      // Now call onLoginSuccess
      onLoginSuccess(currentUser);
    } catch (err: any) {
      console.error('❌ Error setting opening cash:', err);
      throw new Error(err.message || 'Failed to set opening cash');
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

  // Show MFA verification if required
  if (showMFA && mfaData) {
    return (
      <MFAVerification
        userId={mfaData.userId}
        userEmail={mfaData.userEmail}
        userName={mfaData.userName}
        onVerify={handleMFAVerify}
        onCancel={handleMFACancel}
      />
    );
  }

  return (
    <>
      <LoginPage
        username={loginForm.username}
        password={loginForm.password}
        showPassword={loginForm.showPassword}
        isLoading={false}
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
      
      {/* Opening Cash Modal for Cashiers */}
      {currentUser && showOpeningCashModal && (
        <OpeningCashModal
          isOpen={showOpeningCashModal}
          cashierName={`${currentUser.first_name} ${currentUser.last_name}`}
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
    </>
  );
};

export default LoginPageWrapper;



