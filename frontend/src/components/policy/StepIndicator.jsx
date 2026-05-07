import React from 'react';
import { Check } from 'lucide-react';

const steps = ['Upload', 'Segment', 'Extract', 'Review', 'Activate'];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-1 mb-8">
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
              ${done ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}
              ${active ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : ''}
              ${!done && !active ? 'bg-[rgba(255,255,255,0.04)] text-[#52525B] border border-[rgba(255,255,255,0.08)]' : ''}
            `}>
              {done ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-emerald-400' : done ? 'text-[#a1a1aa]' : 'text-[#3f3f46]'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-[2px] mb-5 rounded-full ${i < current ? 'bg-emerald-500' : 'bg-[rgba(255,255,255,0.06)]'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepIndicator;
