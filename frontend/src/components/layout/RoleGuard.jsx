import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const RoleGuard = ({ allowedRoles = [] }) => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (mounted) {
            setSessionData({ user: null, role: null });
            setLoading(false);
          }
          return;
        }

        // Fetch user role from public.users table
        const { data: userRow, error } = await supabase
          .from('users')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single();
          
        if (mounted) {
          setSessionData({
            user: session.user,
            role: userRow?.role || null,
            displayName: userRow?.display_name || session.user.email
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('RoleGuard error:', err);
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-glow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData?.user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role satisfies requirements
  if (allowedRoles.length > 0 && (!sessionData.role || !allowedRoles.includes(sessionData.role))) {
    return <Navigate to="/403" replace state={{ role: sessionData.role }} />;
  }

  // Inject session context down (since Shell needs role and display name)
  return <Outlet context={{ userRole: sessionData.role, userDisplayName: sessionData.displayName }} />;
};

export default RoleGuard;
