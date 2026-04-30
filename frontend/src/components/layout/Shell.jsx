import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Shell = () => {
  // Get user data from the parent RoleGuard's outlet context
  const { userRole, userDisplayName } = useOutletContext();

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Sidebar */}
      {userRole !== 'auditor' && <Sidebar userRole={userRole} />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden app-main">
        {userRole !== 'auditor' && (
          <TopBar userDisplayName={userDisplayName} role={userRole} />
        )}
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-10 pt-6 pb-24">
            <Outlet context={{ userRole, userDisplayName }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shell;
