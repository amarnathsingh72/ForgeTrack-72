import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { segmentPolicy, extractControls, activateControls } from '../lib/api';
import { FileText, Shield, Clock, CheckCircle2, AlertTriangle, Trash2, Plus, Download, History } from 'lucide-react';
import StepIndicator from '../components/policy/StepIndicator';
import StepUpload from '../components/policy/StepUpload';
import StepSegment from '../components/policy/StepSegment';
import StepReview from '../components/policy/StepReview';
import StepResult from '../components/policy/StepResult';

import { usePolicy } from '../lib/PolicyContext';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    wizardOpen, setWizardOpen,
    step, setStep,
    uploading, setUploading,
    policyId, setPolicyId,
    segmentData, setSegmentData,
    extractedControls, setExtractedControls,
    activationResult, setActivationResult,
    stepLoading, setStepLoading,
    error, setError,
    handleUploaded,
    handleSegmentNext,
    handleExcludeClause,
    handleUpdateControl,
    handleActivate,
    resetWizard
  } = usePolicy();

  const fetchPolicies = async () => {
    try {
      const { data } = await supabase.from('policy_documents').select('*').order('uploaded_at', { ascending: false });
      setPolicies(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchPolicies(); 
  }, []);

  useEffect(() => {
    if (!wizardOpen && activationResult) {
      fetchPolicies();
    }
  }, [wizardOpen, activationResult]);

  const getStatusBadge = (status) => {
    const map = {
      active: { bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-400', border: 'border-[rgba(16,185,129,0.2)]', icon: CheckCircle2, label: 'Active' },
      extracting: { bg: 'rgba(59,130,246,0.1)', text: 'text-blue-400', border: 'border-[rgba(59,130,246,0.2)]', icon: Clock, label: 'Extracting' },
      review: { bg: 'rgba(245,158,11,0.1)', text: 'text-amber-400', border: 'border-[rgba(245,158,11,0.2)]', icon: AlertTriangle, label: 'Review' },
      pending: { bg: 'rgba(255,255,255,0.05)', text: 'text-[#a1a1aa]', border: 'border-[rgba(255,255,255,0.1)]', icon: Clock, label: 'Pending' },
      archived: { bg: 'rgba(255,255,255,0.05)', text: 'text-[#52525B]', border: 'border-[rgba(255,255,255,0.06)]', icon: Clock, label: 'Archived' },
    };
    const b = map[status] || map.pending;
    const Icon = b.icon;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 uppercase tracking-wider w-fit ${b.text} ${b.border}`} style={{ background: b.bg }}>
        <Icon size={12} /> {b.label}
      </span>
    );
  };

  if (wizardOpen) {
    const wizardStep = step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 3 : 4;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-white tracking-tight">AI Control Extraction</h1>
          <button onClick={resetWizard} className="h-8 px-4 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[12px] text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors">
            ← Back to Library
          </button>
        </div>

        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
          <StepIndicator current={wizardStep} />
          {error && <div className="mb-4 p-3 rounded-lg bg-[rgba(244,63,94,0.05)] border border-rose-500/20 text-rose-400 text-[12px]">{error}</div>}

          {step === 0 && <StepUpload />}
          {step === 1 && <StepSegment data={segmentData} onNext={handleSegmentNext} onExclude={handleExcludeClause} loading={stepLoading} />}
          {step === 2 && <StepReview controls={extractedControls} onUpdateControl={handleUpdateControl} onActivate={handleActivate} loading={stepLoading} />}
          {step === 3 && <StepResult result={activationResult} onDone={resetWizard} />}
        </div>
      </div>
    );
  }

  const totalControls = policies.reduce((acc, p) => acc + (p.total_controls_extracted || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Policy Library</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Manage your organization's compliance documents and AI-extracted controls.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#0e0e16] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-[10px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Total Policies</span>
                <span className="text-[18px] font-bold text-white tabular-nums">{policies.length}</span>
             </div>
             <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
             <div className="flex flex-col">
                <span className="text-[10px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Active Controls</span>
                <span className="text-[18px] font-bold text-emerald-400 tabular-nums">{totalControls}</span>
             </div>
          </div>
          
          <button 
            onClick={() => setWizardOpen(true)}
            className="h-10 px-5 rounded-xl bg-emerald-500 text-[13px] font-bold text-white hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
          >
            <Plus size={16} /> New Extraction
          </button>
        </div>
      </div>

      <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
           <div className="flex items-center gap-2">
              <History size={16} className="text-[#52525B]" />
              <h2 className="text-[12px] font-bold text-white uppercase tracking-wider">Document History</h2>
           </div>
           <button 
             onClick={() => {
               const csv = [['Name', 'Framework', 'Status', 'Controls', 'Date'].join(','), ...policies.map(p => [p.title, p.framework, p.status, p.total_controls_extracted || 0, p.uploaded_at].join(','))].join('\n');
               const blob = new Blob([csv], { type: 'text/csv' });
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a'); a.href = url; a.download = 'policy_history.csv'; a.click();
               URL.revokeObjectURL(url);
             }}
             className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
           >
             <Download size={12} /> Export History
           </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[rgba(255,255,255,0.01)]">
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['Document Name', 'Framework', 'Status', 'Controls', 'Actions'].map((h, i) => (
                <th key={i} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#52525B] text-[13px]">Loading...</td></tr>
            ) : policies.map(policy => (
              <tr key={policy.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#a1a1aa]">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white">{policy.title}</div>
                      <div className="text-[11px] text-[#71717a] mt-0.5">Uploaded {new Date(policy.uploaded_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#16161F] text-[#a1a1aa] border border-[rgba(255,255,255,0.06)] uppercase">
                    {policy.framework}
                  </span>
                </td>
                <td className="py-4 px-6">{getStatusBadge(policy.status)}</td>
                <td className="py-4 px-6">
                  <div className="text-[13px] font-medium text-white tabular-nums flex items-center gap-1.5">
                    <Shield size={14} className="text-[#52525B]" />
                    {policy.total_controls_extracted || '—'}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-white flex items-center justify-center transition-colors">
                      <Download size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(244,63,94,0.1)] border border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-rose-400 flex items-center justify-center transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {policies.length === 0 && !loading && (
              <tr><td colSpan={5} className="py-12 text-center text-[#52525B] text-[13px]">No policies found. Click "New Extraction" to upload your first document.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Policies;
