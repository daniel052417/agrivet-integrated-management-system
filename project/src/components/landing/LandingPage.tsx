// components/landing/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Clock, Building2 } from 'lucide-react';
import { settingsService } from '../../lib/settingsService';
import { customAuth } from '../../lib/customAuth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Tiongson');
  const [tagline, setTagline] = useState('AGRIVET');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getAllSettings();
        const general = settings.general || {};
        setCompanyLogo(general.companyLogo || settings.company_logo || null);
        
        // Extract company name
        const fullCompanyName = general.companyName || settings.company_name || 'Tiongson';
        setCompanyName(fullCompanyName.split(' ')[0]);
        setTagline(fullCompanyName.includes(' ') ? fullCompanyName.split(' ').slice(1).join(' ') : 'AGRIVET');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleLoginClick = () => {
    // Check if user is already authenticated
    const currentUser = customAuth.getCurrentUser();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleAttendanceClick = () => {
    navigate('/attendance-terminal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Header with Logo and Company Name */}
        <div className="text-center mb-12">
          {companyLogo ? (
            <div className="flex justify-center mb-6">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-24 w-24 object-contain"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{companyName}</h1>
          <p className="text-xl text-gray-600">{tagline}</p>
          <p className="text-sm text-gray-500 mt-2">Management System</p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Login to System Card */}
          <button
            onClick={handleLoginClick}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-emerald-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <LogIn className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Login to System</h2>
              <p className="text-gray-600 text-center mb-4">
                Access the admin dashboard, POS system, and management features
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>For Admins & Cashiers</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>

          {/* Attendance Terminal Card */}
          <button
            onClick={handleAttendanceClick}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-emerald-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Attendance Terminal</h2>
              <p className="text-gray-600 text-center mb-4">
                Quick time-in and time-out using facial recognition
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>Kiosk Mode</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Select an option above to continue
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

