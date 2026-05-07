import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { segmentPolicy, extractControls, activateControls } from '../lib/api';
import { FileText, Shield, Clock, CheckCircle2, AlertTriangle, Trash2, Plus } from 'lucide-react';
import StepIndicator from '../components/policy/StepIndicator';
import StepUpload from '../components/policy/StepUpload';
import StepSegment from '../components/policy/StepSegment';
import StepReview from '../components/policy/StepReview';
import StepResult from '../components/policy/StepResult';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [policyId, setPolicyId] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [extractedControls, setExtractedControls] = useState([]);
  const [activationResult, setActivationResult] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPolicies = async () => {
    try {
      const { data } = await supabase.from('policy_documents').select('*').order('uploaded_at', { ascending: false });
      setPolicies(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolicies(); }, []);

  // ── Step handlers ──
  const handleUploaded = async (result) => {
    setPolicyId(result.policy_id);
    setUploading(false);
    setStep(1);
    // Auto-start segmentation
    setStepLoading(true);
    try {
      const segResult = await segmentPolicy(result.policy_id);
      setSegmentData(segResult);
      setStep(1);
    } catch (err) { setError(err.message); }
    finally { setStepLoading(false); }
  };

  const handleSegmentNext = async () => {
    setStepLoading(true);
    setError('');
    try {
      const activeClauses = (segmentData?.clauses || []).filter(c => !c._excluded);
      const result = await extractControls(policyId, activeClauses);
      setExtractedControls(result.controls || []);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setStepLoading(false); }
  };

  const handleExcludeClause = (idx) => {
    const updated = { ...segmentData };
    updated.clauses = [...updated.clauses];
    updated.clauses[idx] = { ...updated.clauses[idx], _excluded: !updated.clauses[idx]._excluded };
    const reqs = updated.clauses.filter(c => c.clause_type === 'requirement' && !c._excluded);
    updated.requirements_count = reqs.length;
    setSegmentData(updated);
  };

  const handleUpdateControl = (idx, field, value) => {
    const updated = [...extractedControls];
    updated[idx] = { ...updated[idx], [field]: value };
    setExtractedControls(updated);
  };

  const handleActivate = async () => {
    setStepLoading(true);
    setError('');
    try {
      const result = await activateControls(policyId, extractedControls);
      setActivationResult(result);
      setStep(3);
      fetchPolicies();
    } catch (err) { setError(err.message); }
    finally { setStepLoading(false); }
  };

  const resetWizard = () => {
    setWizardOpen(false);
    setStep(0);
    setPolicyId(null);
    setSegmentData(null);
    setExtractedControls([]);
    setActivationResult(null);
    setError('');
    fetchPolicies();
  };

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

  // ── Wizard Modal ──
  if (wizardOpen) {
    // Map step index to actual wizard step (0=upload, 1=segment, 2=review, 3=result)
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

          {step === 0 && <StepUpload onUploaded={handleUploaded} uploading={uploading} setUploading={setUploading} />}
          {step === 1 && <StepSegment data={segmentData} onNext={handleSegmentNext} onExclude={handleExcludeClause} loading={stepLoading} />}
          {step === 2 && <StepReview controls={extractedControls} onUpdateControl={handleUpdateControl} onActivate={handleActivate} loading={stepLoading} />}
          {step === 3 && <StepResult result={activationResult} onDone={resetWizard} />}
        </div>
      </div>
    );
  }

  // ── Library View ──
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Policy Library</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Upload compliance documents to automatically extract controls via AI.</p>
        </div>
        <button onClick={() => setWizardOpen(true)}
          className="h-9 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[12px] font-bold text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-2">
          <Plus size={14} /> New Extraction
        </button>
      </div>

      <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[rgba(255,255,255,0.02)]">
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['Document Name', 'Framework', 'Status', 'Controls', ''].map((h, i) => (
                <th key={i} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#52525B] text-[13px]">Loading...</td></tr>
            ) : policies.map(policy => (
              <tr key={policy.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="py-4 px-4">
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
                <td className="py-4 px-4">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#16161F] text-[#a1a1aa] border border-[rgba(255,255,255,0.06)] uppercase">
                    {policy.framework}
                  </span>
                </td>
                <td className="py-4 px-4">{getStatusBadge(policy.status)}</td>
                <td className="py-4 px-4">
                  <div className="text-[13px] font-medium text-white tabular-nums flex items-center gap-1.5">
                    <Shield size={14} className="text-[#52525B]" />
                    {policy.total_controls_extracted || '—'}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(244,63,94,0.1)] border border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-rose-400 flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
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
