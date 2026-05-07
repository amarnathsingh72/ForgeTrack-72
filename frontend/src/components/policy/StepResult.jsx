import React from 'react';
import { CheckCircle2, Shield, AlertTriangle, ArrowRight } from 'lucide-react';

const StepResult = ({ result, onDone }) => {
  const { controls_activated = 0, gaps_detected = 0 } = result || {};

  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        <CheckCircle2 size={32} className="text-emerald-400" />
      </div>

      <h2 className="text-[22px] font-bold text-white mb-2">Controls Activated!</h2>
      <p className="text-[13px] text-[#71717a] mb-8">Your compliance controls are now live and being monitored.</p>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-[#0e0e16] rounded-xl border border-[rgba(16,185,129,0.15)] p-5">
          <Shield size={20} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-[28px] font-bold text-white tabular-nums">{controls_activated}</div>
          <div className="text-[10px] text-[#52525B] uppercase tracking-wider mt-1">Controls Active</div>
        </div>
        <div className="flex-1 bg-[#0e0e16] rounded-xl border border-[rgba(244,63,94,0.15)] p-5">
          <AlertTriangle size={20} className="text-rose-400 mx-auto mb-2" />
          <div className="text-[28px] font-bold text-white tabular-nums">{gaps_detected}</div>
          <div className="text-[10px] text-[#52525B] uppercase tracking-wider mt-1">Gaps Detected</div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onDone}
          className="flex-1 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[12px] font-medium text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
          Upload Another
        </button>
        <a href="/gaps"
          className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[12px] font-bold text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5">
          View Gap Queue <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
};

export default StepResult;
