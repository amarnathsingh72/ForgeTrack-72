import React from 'react';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="bg-danger-bg ring-1 ring-[var(--danger-border)] p-4 rounded-full">
        <svg className="w-8 h-8 text-danger-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-display-sm text-fg-primary">Access Denied</h1>
        <p className="text-body-lg text-fg-secondary">You don't have permission to view this page.</p>
      </div>
      
      <button 
        onClick={() => navigate('/')}
        className="btn-primary bg-fg-primary text-void rounded-md px-5 py-3 font-medium text-[14px] leading-[1.5] tracking-[-0.005em] hover:opacity-90"
      >
        Return to Home
      </button>
    </div>
  );
};

export default Forbidden;
