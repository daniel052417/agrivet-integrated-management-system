import React, { ReactNode } from 'react';
import Sidebar from '../../shared/layout/Sidebar';
import Header from '../../shared/layout/Header';
import { UserProfile } from '../../../lib/supabase';

interface SharedLayoutProps {
  children: ReactNode;
  user: UserProfile;
  onLogout: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const SharedLayout: React.FC<SharedLayoutProps> = ({
  children,
  user,
  onLogout,
  activeSection = 'overview',
  onSectionChange
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={onSectionChange || (() => {})} 
        onLogout={onLogout} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SharedLayout;
