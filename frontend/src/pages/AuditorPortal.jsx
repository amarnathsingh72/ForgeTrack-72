import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, FileText, CheckCircle2, Clock, Calendar, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const AuditorPortal = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedControl, setExpandedControl] = useState(null);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://auditchain-api.onrender.com';
        const response = await fetch(`${API_BASE}/api/audit/${token}`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Failed to load audit portal');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <p className="text-[14px] text-[#71717a] font-medium animate-pulse">Decrypting Evidence Package...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0e0e16] border border-rose-500/20 rounded-2xl p-8 text-center shadow-[0_20px_50px_rgba(244,63,94,0.1)]">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-[20px] font-bold text-white mb-2">Access Denied</h1>
          <p className="text-[14px] text-[#71717a] leading-relaxed mb-8">{error}</p>
          <div className="text-[12px] text-[#3f3f46]">If you believe this is an error, please contact your compliance representative.</div>
        </div>
      </div>
    );
  }

  const { export_details, controls } = data;
  const compliantCount = controls.filter(c => c.events.length > 0).length;
  const coveragePercent = Math.round((compliantCount / controls.length) * 100);

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-emerald-500/30">
      {/* Header */}
      <header className="h-20 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,18,0.8)] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">Auditchain Portal</h1>
              <div className="text-[11px] text-[#71717a] font-semibold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400">Verified Evidence</span>
                <span className="w-1 h-1 rounded-full bg-[#3f3f46]" />
                {export_details.framework.toUpperCase()}
              </div>
            </div>
          </div>
          <button className="h-10 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[13px] font-bold hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2">
            <Download size={16} /> Download CSV Report
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 bg-[#0e0e16] rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32" />
             <div>
                <h2 className="text-[24px] font-bold mb-2">{export_details.name}</h2>
                <p className="text-[14px] text-[#71717a] leading-relaxed max-w-xl">
                  This report contains a point-in-time snapshot of compliance evidence for the period 
                  <span className="text-white font-medium mx-1">{new Date(export_details.from_date).toLocaleDateString()}</span> 
                  to 
                  <span className="text-white font-medium mx-1">{new Date(export_details.to_date).toLocaleDateString()}</span>.
                </p>
             </div>
             <div className="flex gap-8 mt-8">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Generated On</span>
                  <span className="text-[14px] font-medium flex items-center gap-2"><Calendar size={14} className="text-[#3f3f46]" /> {new Date(export_details.generated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Audit Scope</span>
                  <span className="text-[14px] font-medium flex items-center gap-2"><Shield size={14} className="text-[#3f3f46]" /> {controls.length} Controls</span>
                </div>
             </div>
          </div>
          
          <div className="bg-[#0e0e16] rounded-2xl border border-[rgba(255,255,255,0.06)] p-8 flex flex-col items-center justify-center text-center">
             <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[rgba(255,255,255,0.02)]" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={276} strokeDashoffset={276 - (276 * coveragePercent) / 100}
                    className="text-emerald-500 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[20px] font-bold">{coveragePercent}%</div>
             </div>
             <div className="text-[14px] font-bold text-white uppercase tracking-wider">Evidence Coverage</div>
             <div className="text-[12px] text-[#71717a] mt-1">{compliantCount} of {controls.length} controls fully evidenced</div>
          </div>
        </div>

        {/* Controls List */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-bold text-[#52525B] uppercase tracking-[0.2em] mb-4">Control-by-Control Evidence</h3>
          {controls.map(ctrl => (
            <div 
              key={ctrl.id} 
              className={`rounded-2xl border transition-all duration-300 ${
                expandedControl === ctrl.id 
                  ? 'bg-[#0e0e16] border-emerald-500/30 ring-1 ring-emerald-500/10' 
                  : 'bg-[#0e0e16] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
              }`}
            >
              <div 
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedControl(expandedControl === ctrl.id ? null : ctrl.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[12px] border ${
                    ctrl.events.length > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {ctrl.control_code || 'CTRL'}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white">{ctrl.requirement_text}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#52525B] flex items-center gap-1 uppercase font-bold tracking-wider">
                        <Calendar size={10} /> {ctrl.frequency}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#3f3f46]" />
                      <span className="text-[11px] text-[#52525B] flex items-center gap-1 uppercase font-bold tracking-wider">
                        <FileText size={10} /> {ctrl.evidence_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ctrl.events.length > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-tight">
                      <CheckCircle2 size={12} /> {ctrl.events.length} Events
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-bold uppercase tracking-tight">
                      <Clock size={12} /> No Evidence Found
                    </div>
                  )}
                  {expandedControl === ctrl.id ? <ChevronUp size={18} className="text-[#3f3f46]" /> : <ChevronDown size={18} className="text-[#3f3f46]" />}
                </div>
              </div>

              {expandedControl === ctrl.id && (
                <div className="px-5 pb-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                    {/* Management Response */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12} className="text-emerald-500" /> Management Response
                      </h4>
                      <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[13px] text-[#e4e4e7] leading-relaxed italic">
                        "{ctrl.management_response}"
                      </div>
                    </div>

                    {/* Evidence Timeline */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} className="text-blue-500" /> Evidence Timeline
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                        {ctrl.events.length > 0 ? ctrl.events.map((ev, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center justify-between group">
                            <div>
                              <div className="text-[12px] font-medium text-white group-hover:text-emerald-400 transition-colors">{ev.action}</div>
                              <div className="text-[10px] text-[#52525B] mt-0.5">{ev.actor} • {ev.resource}</div>
                            </div>
                            <div className="text-[11px] text-[#71717a] font-mono">{new Date(ev.event_ts).toLocaleDateString()}</div>
                          </div>
                        )) : (
                          <div className="py-8 text-center text-[#52525B] text-[13px] border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl">
                            No events matched for this period.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row items-center justify-between gap-4 text-[#3f3f46]">
        <div className="text-[12px]">© 2026 Auditchain Technologies. All evidence cryptographically verified.</div>
        <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Audit Standards</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default AuditorPortal;
