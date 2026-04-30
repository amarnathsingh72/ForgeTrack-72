import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Query role
      const { data: userRow, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (roleError) throw new Error("Could not verify user role.");

      const role = userRow?.role;
      if (role === 'compliance_officer') {
        navigate('/dashboard');
      } else if (role === 'engineer') {
        navigate('/tasks');
      } else {
        throw new Error("Invalid role detected for standard login.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void app-main flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface rounded-2xl p-12 shadow-[var(--shadow-raised)] border border-[var(--border-subtle)] relative overflow-hidden">
        <div className="absolute inset-0 bg-card-gradient pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-2 mb-10">
          <div className="w-12 h-12 bg-accent-glow text-void rounded-xl mx-auto flex items-center justify-center font-bold text-xl mb-4 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            A
          </div>
          <h1 className="text-h2">Auditchain</h1>
          <p className="text-body text-fg-secondary">Compliance Operations Center</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="block text-label text-fg-secondary uppercase tracking-[0.08em]">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full bg-surface-inset border border-[var(--border-default)] rounded-md px-4 py-3 text-fg-primary text-[14px] focus:outline-none focus:border-accent-glow focus:shadow-[var(--shadow-focus)]"
              />
            </div>
            
            <div className="space-y-2 text-left">
              <label className="block text-label text-fg-secondary uppercase tracking-[0.08em] flex justify-between">
                <span>Password</span>
                <a href="#" className="text-fg-tertiary hover:text-fg-secondary capitalize tracking-normal font-normal">Forgot Password?</a>
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-surface-inset border border-[var(--border-default)] rounded-md px-4 py-3 text-fg-primary text-[14px] focus:outline-none focus:border-accent-glow focus:shadow-[var(--shadow-focus)]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="text-caption text-danger-fg text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-fg-primary text-void rounded-md px-5 py-3 font-medium text-[14px] leading-[1.5] tracking-[-0.005em] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
