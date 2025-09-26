import React, { useState } from 'react';
import SimplifiedSidebar from '../shared/layout/SimplifiedSidebar';
import Header from '../shared/layout/Header';
import { SimplifiedUser } from '../../lib/simplifiedAuth';

// HR-specific components
import HRDashboard from '../../components/hr/HRDashboard';
import AttendanceDashboard from '../../components/hr/AttendanceDashboard';
import LeaveManagement from '../../components/hr/LeaveManagement';
import HRAnalytics from '../../components/hr/HRAnalytics';
import PayrollCompensation from '../../components/hr/PayrollCompensation';
import UserAccounts from '../../Admin/components/Users/UserAccounts';
import AddStaff from '../../Admin/components/Staff/AddStaff';
import RolesPermissions from '../../Admin/components/Staff/RolesPermissions';
import UserActivity from '../../Admin/components/Users/UserActivity';
import UserPermissions from '../../Admin/components/Users/UserPermissions';

interface HRDashboardProps {
  user: SimplifiedUser;
  onLogout: () => void;
}

const HRDashboardComponent: React.FC<HRDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('hr-dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'hr-dashboard':
        return <HRDashboard />;
      case 'attendance-dashboard':
        return <AttendanceDashboard />;
      case 'leave-management':
        return <LeaveManagement />;
      case 'hr-analytics':
        return <HRAnalytics />;
      case 'payroll':
        return <PayrollCompensation />;
      case 'user-accounts':
        return <UserAccounts />;
      case 'add-staff':
        return <AddStaff onBack={() => setActiveSection('user-accounts')} />;
      case 'roles-permissions':
        return <RolesPermissions />;
      case 'user-activity':
        return <UserActivity />;
      case 'user-permissions':
        return <UserPermissions />;
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {activeSection.replace('-', ' ').toUpperCase()}
              </h2>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SimplifiedSidebar 
        user={user} 
        onLogout={onLogout}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => {}} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default HRDashboardComponent;