import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, ChevronRight } from 'lucide-react';

const TopBar = ({ userDisplayName, role }) => {
  const location = useLocation();

  const routeNames = {
    '/dashboard': 'Dashboard',
    '/policies': 'Policy Library',
    '/events': 'Event Log',
    '/gaps': 'Gap Queue',
    '/remediation': 'Remediation',
    '/export': 'Export',
    '/connections': 'Source Connections',
    '/tasks': 'My Tasks'
  };

  const currentPathName = routeNames[location.pathname] || 'Auditchain';

  return (
    <div className="h-14 border-b border-[rgba(255,255,255,0.06)] px-6 flex items-center justify-between shrink-0 bg-[rgba(10,10,18,0.6)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-[#52525B] font-medium">Dashboard</span>
        <ChevronRight size={12} className="text-[#3f3f46]" />
        <span className="text-white font-medium">{currentPathName}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="relative w-9 h-9 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#52525B] hover:text-[#8A8A94] hover:border-[rgba(255,255,255,0.1)] transition-all">
          <Bell size={16} />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l border-[rgba(255,255,255,0.06)]">
          <div className="text-right">
            <div className="text-[13px] font-medium text-white leading-tight">
              {userDisplayName}
            </div>
            <div className="text-[10px] text-[#52525B] capitalize">
              {role?.replace('_', ' ')}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[rgba(255,255,255,0.06)]">
            {userDisplayName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
