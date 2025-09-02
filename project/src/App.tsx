import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, UserProfile } from './lib/supabase';
import LoginPage from '../src/Login/components/LoginPage';
import AdminDashboard from '../src/DashboardLayout/AdminDashboard';
import POSInterface from './POS/components/POSInterface';


function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser(data);
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Fetch user profile from users table
        await fetchUserProfile(authData.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid username or password');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address');
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please try again later');
      } else {
        setError('Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUsername('');
      setPassword('');
      setError('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (user) {
    // Cashiers go directly to POS system
    if (user.role === 'cashier') {
      return <POSInterface user={user} onLogout={handleLogout} />;
    }
    
    // All other roles (admin, manager, staff, etc.) go to admin dashboard
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Login form
  return (
    <LoginPage
      username={username}
      password={password}
      showPassword={showPassword}
      isLoading={isLoading}
      error={error}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onToggleShowPassword={() => setShowPassword(!showPassword)}
      onLoginSubmit={handleLogin}
    />
  );
}

export default App;