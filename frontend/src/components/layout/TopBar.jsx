import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, User as UserIcon, Key, LogOut, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePolicy } from '../../lib/PolicyContext';

const TopBar = ({ userDisplayName, role, userEmail }) => {
  const { isProcessing, processingLabel, setWizardOpen } = usePolicy();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('No user found');
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      alert('A password reset email has been sent to your inbox.');
      setShowProfile(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const mockNotifications = [
    { id: 1, title: 'New Gap Detected', desc: 'CC6.6 Malware prevention missing', time: '10m ago', icon: AlertTriangle, color: '#F43F5E' },
    { id: 2, title: 'Task Verified', desc: 'SentinelOne deployment report approved', time: '2h ago', icon: CheckCircle2, color: '#10B981' },
    { id: 3, title: 'Sync Warning', desc: 'Okta SSO sync delayed by 3 hours', time: '5h ago', icon: AlertTriangle, color: '#F59E0B' },
  ];

  return (
    <div className="h-14 border-b border-[rgba(255,255,255,0.06)] px-6 flex items-center justify-between shrink-0 bg-[rgba(10,10,18,0.6)] backdrop-blur-md relative z-40">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-[#52525B] font-medium">Dashboard</span>
        <ChevronRight size={12} className="text-[#3f3f46]" />
        <span className="text-white font-medium">{currentPathName}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Background Task Indicator */}
        {isProcessing && (
          <button 
            onClick={() => {
              setWizardOpen(true);
              navigate('/policies');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse transition-all hover:bg-emerald-500/20"
          >
            <Loader2 size={12} className="animate-spin" />
            <span className="text-[11px] font-bold tracking-tight uppercase">{processingLabel}</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${showNotifications ? 'bg-[#16161F] text-white border-[rgba(255,255,255,0.12)]' : 'bg-[#111118] text-[#52525B] border-[rgba(255,255,255,0.06)] hover:text-[#8A8A94] hover:border-[rgba(255,255,255,0.1)]'}`}
          >
            <Bell size={16} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0e0e16] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-slideIn">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] flex justify-between items-center">
                <h3 className="text-[13px] font-semibold text-white">Notifications</h3>
                <span className="text-[11px] text-emerald-400 cursor-pointer hover:text-emerald-300">Mark all read</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer flex gap-3">
                    <div className="mt-0.5"><n.icon size={14} color={n.color} /></div>
                    <div>
                      <div className="text-[13px] font-medium text-[#e4e4e7]">{n.title}</div>
                      <div className="text-[12px] text-[#71717a] mt-0.5">{n.desc}</div>
                      <div className="text-[10px] text-[#52525B] mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 pl-4 border-l border-[rgba(255,255,255,0.06)] hover:opacity-80 transition-opacity text-left"
          >
            <div className="hidden sm:block text-right">
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
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0e0e16] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-slideIn">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]">
                <div className="text-[13px] font-semibold text-white truncate">{userDisplayName}</div>
                <div className="text-[11px] text-[#71717a] truncate">{role?.replace('_', ' ')}</div>
              </div>
              <div className="p-1.5">
                <button onClick={handleChangePassword} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors">
                  <Key size={14} /> Change Password
                </button>
                <div className="my-1 border-t border-[rgba(255,255,255,0.04)]" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-rose-400 hover:text-rose-300 hover:bg-[rgba(244,63,94,0.1)] rounded-lg transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
