import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, FileText, Activity, AlertTriangle,
  Wrench, Share2, Plug, CheckSquare, LogOut, ChevronLeft,
  Search, Settings
} from 'lucide-react';

const OfficerNav = [
  { label: 'Overview', section: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Compliance', section: true },
  { to: '/policies', label: 'Policy Library', icon: FileText },
  { to: '/events', label: 'Event Log', icon: Activity },
  { to: '/gaps', label: 'Gap Queue', icon: AlertTriangle, hasBadge: true },
  { label: 'Operations', section: true },
  { to: '/remediation', label: 'Remediation', icon: Wrench },
  { to: '/export', label: 'Export', icon: Share2 },
  { label: 'Settings', section: true },
  { to: '/connections', label: 'Connections', icon: Plug }
];

const EngineerNav = [
  { label: 'Overview', section: true },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare }
];

const Sidebar = ({ userRole }) => {
  const [openGapCount, setOpenGapCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function fetchGapCount() {
      const { count } = await supabase
        .from('gaps')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');
      setOpenGapCount(count || 0);
    }
    fetchGapCount();
  }, []);

  const navItems = userRole === 'compliance_officer' ? OfficerNav : (userRole === 'engineer' ? EngineerNav : []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} flex flex-col bg-[#0a0a12] border-r border-[rgba(255,255,255,0.06)] h-screen overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            A
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-wide text-white">Auditchain</span>
          )}
        </div>
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="text-[#52525B] hover:text-[#8A8A94] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-[#111118] rounded-lg px-3 h-9 border border-[rgba(255,255,255,0.06)]">
            <Search size={14} className="text-[#52525B]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-[#8A8A94] placeholder-[#3f3f46] outline-none w-full"
            />
          </div>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item, idx) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={idx} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mt-5 mb-2 px-3">
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                group flex items-center justify-between h-10 ${collapsed ? 'px-0 justify-center' : 'px-3'} rounded-lg text-[13px] transition-all duration-200 relative
                ${isActive 
                  ? 'bg-[#16161F] text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' 
                  : 'text-[#71717a] hover:bg-[#111118] hover:text-[#a1a1aa]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                  <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                    <Icon size={18} strokeWidth={1.75} className={isActive ? 'text-emerald-400' : 'text-[#52525B] group-hover:text-[#71717a]'} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.hasBadge && openGapCount > 0 && (
                    <div className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-[rgba(244,63,94,0.15)] text-[#F43F5E] text-[10px] font-semibold border border-[rgba(244,63,94,0.2)]">
                      {openGapCount}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.04)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
              {userRole === 'compliance_officer' ? 'AO' : 'BE'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate">
                {userRole === 'compliance_officer' ? 'Alice Officer' : 'Bob Engineer'}
              </div>
              <div className="text-[10px] text-[#52525B] capitalize truncate">
                {userRole?.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className={`flex ${collapsed ? 'justify-center' : ''} items-center gap-3 w-full h-10 ${collapsed ? 'px-0' : 'px-3'} rounded-lg text-[13px] text-[#71717a] hover:bg-[#111118] hover:text-[#a1a1aa] transition-all`}
        >
          <LogOut size={18} strokeWidth={1.75} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
