// components/dashboard/DashboardWrapper.tsx
import { CustomUser } from '../../lib/customAuth';
import { getDashboardForRole } from '../../lib/rolePages';

interface DashboardWrapperProps {
  user: CustomUser;
  onLogout: () => void;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ user, onLogout }) => {
  const DashboardComponent = getDashboardForRole(user.role_name || user.role);
  
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
            onClick={onLogout}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
  
  // Render the appropriate dashboard component
  return <DashboardComponent user={user} onLogout={onLogout} />;
};

export default DashboardWrapper;




