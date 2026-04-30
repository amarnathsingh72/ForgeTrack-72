import React from 'react';

const DevTokens = () => {
  return (
    <div className="p-8 space-y-12 max-w-4xl mx-auto w-full pt-16 pb-32">
      <h1 className="text-display-hero">Design Tokens</h1>
      
      {/* 1. Card Example */}
      <section className="space-y-4">
        <h2 className="text-h2">1. Card & Surface</h2>
        <div className="bg-surface shadow-[var(--shadow-card)] ring-1 ring-[var(--border-subtle)] rounded-xl p-8 max-w-md relative overflow-hidden">
          {/* subtle inside gradient */}
          <div className="absolute inset-0 bg-card-gradient opacity-100 pointer-events-none rounded-xl" />
          <div className="relative z-10 space-y-4">
            <h3 className="text-h3">Card Title</h3>
            <p className="text-body text-fg-secondary">This demonstrates the glass surface look with subtle borders.</p>
          </div>
        </div>
      </section>

      {/* 2. Severity Pills */}
      <section className="space-y-4">
        <h2 className="text-h2">2. Severity Pills</h2>
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro bg-danger-bg text-danger-fg border border-[var(--danger-border)]">
            CRITICAL
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro bg-warning-bg text-warning-fg border border-[var(--warning-border)]">
            HIGH
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro bg-info-bg text-info-fg border border-[var(--info-border)]">
            MEDIUM
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro bg-success-bg text-success-fg border border-[var(--success-border)]">
            LOW
          </span>
        </div>
      </section>

      {/* 3. Button Example */}
      <section className="space-y-4">
        <h2 className="text-h2">3. Buttons</h2>
        <div className="flex gap-4 items-center">
          <button className="bg-fg-primary text-void rounded-md px-5 py-3 font-medium text-[14px] leading-[1.5] tracking-[-0.005em] hover:opacity-90">
            Primary Action
          </button>
          <button className="bg-surface-raised text-fg-primary border border-border-default rounded-md px-5 py-3 font-medium text-[14px]">
            Secondary Action
          </button>
        </div>
      </section>

      {/* 4. Input Example */}
      <section className="space-y-4">
        <h2 className="text-h2">4. Inputs</h2>
        <div className="max-w-xs space-y-2">
          <label className="block text-label text-fg-secondary uppercase tracking-[0.08em]">Email Address</label>
          <input 
            type="email" 
            placeholder="officer@auditchain.dev" 
            className="w-full bg-surface-inset border border-border-default rounded-md px-4 py-3 text-fg-primary text-[14px] focus:outline-none focus:border-accent-glow focus:shadow-[var(--shadow-focus)]"
          />
        </div>
      </section>

      {/* 5. Static Coverage Ring */}
      <section className="space-y-4">
        <h2 className="text-h2">5. Coverage Ring (Static)</h2>
        <div className="bg-surface shadow-[var(--shadow-card)] ring-1 ring-[var(--border-subtle)] rounded-2xl p-10 max-w-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-card-gradient opacity-100 pointer-events-none rounded-2xl" />
          <div className="relative z-10 text-center space-y-6">
            <h3 className="text-label text-fg-tertiary uppercase tracking-[0.08em]">SOC 2 TYPE II</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-[var(--border-subtle)]" />
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeDasharray="283" strokeDashoffset="30" strokeLinecap="round" className="stroke-[var(--success-fg)]" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-display-md tabular-nums">87%</span>
              </div>
            </div>

            <p className="text-label text-fg-tertiary uppercase tracking-[0.08em]">13 of 15 controls evidenced</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DevTokens;
