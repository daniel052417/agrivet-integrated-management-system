import React, { useState, useEffect } from 'react';
import { DynamicDashboard, SuperAdminDashboard } from './components/DynamicDashboard';
import { LoginPage } from './Login/components/LoginPage';
import { supabase, UserProfile } from './lib/supabase';
import { SYSTEM_ROLES } from './types/permissions';

function AppNew() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        setUser(userData);
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password,
      });

      if (authError) {
        throw authError;
      }

      if (data.user) {
        // Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        setUser(userData);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setError('');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
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

  // Show login if not authenticated
  if (!user) {
    return (
      <LoginPage
        username=""
        password=""
        showPassword={false}
        isLoading={false}
        error={error}
        onUsernameChange={() => {}}
        onPasswordChange={() => {}}
        onToggleShowPassword={() => {}}
        onLoginSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleLogin({
            username: formData.get('username') as string,
            password: formData.get('password') as string,
          });
        }}
      />
    );
  }

  // Render role-based dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case SYSTEM_ROLES.SUPER_ADMIN:
        return <SuperAdminDashboard />;
      
      case SYSTEM_ROLES.HR_ADMIN:
      case SYSTEM_ROLES.HR_STAFF:
        return <DynamicDashboard roleId={user.role} />;
      
      case SYSTEM_ROLES.MARKETING_ADMIN:
      case SYSTEM_ROLES.MARKETING_STAFF:
        return <DynamicDashboard roleId={user.role} />;
      
      case SYSTEM_ROLES.CASHIER:
        return <DynamicDashboard roleId={user.role} />;
      
      case SYSTEM_ROLES.INVENTORY_CLERK:
        return <DynamicDashboard roleId={user.role} />;
      
      default:
        return <DynamicDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">AgriVet Management System</h1>
                <span className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {user.role?.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, {user.first_name} {user.last_name}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderDashboard()}
        </main>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
  );
}

export default AppNew;





