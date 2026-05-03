import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Upload, Clock, CheckCircle2, AlertTriangle, FileSearch, Trash2, Shield } from 'lucide-react';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchPolicies = async () => {
    try {
      const { data } = await supabase.from('policy_documents').select('*').order('uploaded_at', { ascending: false });
      setPolicies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    // Fake upload and AI parsing since backend is paused
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('policy_documents').insert({
          title: file.name.replace('.pdf', '').replace('.docx', ''),
          framework: 'custom',
          raw_text: 'Sample extracted text...',
          file_ref: `s3://policies/${file.name}`,
          uploaded_by: user?.email || 'officer',
          status: 'extracting', // Simulate AI pipeline
        });
        await fetchPolicies();
        setUploading(false);
        
        // After 3 seconds, simulate AI finishing
        setTimeout(async () => {
          const { data } = await supabase.from('policy_documents').select('id').order('id', { ascending: false }).limit(1);
          if (data && data.length > 0) {
            await supabase.from('policy_documents').update({ status: 'review', total_controls_extracted: Math.floor(Math.random() * 20) + 5 }).eq('id', data[0].id);
            fetchPolicies();
          }
        }, 3000);
      } catch (err) {
        console.error(err);
        setUploading(false);
      }
    }, 1500);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-400', border: 'border-[rgba(16,185,129,0.2)]', icon: CheckCircle2, label: 'Active' },
      extracting: { bg: 'rgba(59,130,246,0.1)', text: 'text-blue-400', border: 'border-[rgba(59,130,246,0.2)]', icon: RefreshCw, label: 'AI Extracting...' },
      review: { bg: 'rgba(245,158,11,0.1)', text: 'text-amber-400', border: 'border-[rgba(245,158,11,0.2)]', icon: AlertTriangle, label: 'Review Required' },
      pending: { bg: 'rgba(255,255,255,0.05)', text: 'text-[#a1a1aa]', border: 'border-[rgba(255,255,255,0.1)]', icon: Clock, label: 'Pending' }
    };
    const RefreshCw = ({size}) => <Clock size={size} className="animate-spin" />;
    const b = badges[status] || badges.pending;
    const Icon = b.icon;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 uppercase tracking-wider w-fit ${b.bg} ${b.text} ${b.border}`}>
        <Icon size={12} /> {b.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Policy Library</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Upload compliance documents to automatically extract controls via AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
            <h2 className="text-[14px] font-semibold text-white mb-4">Upload New Policy</h2>
            <input type="file" id="policy-upload" accept=".pdf,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
            <label htmlFor="policy-upload" className={`w-full flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
              uploading ? 'border-emerald-500/50 bg-[rgba(16,185,129,0.02)]' : 'border-[rgba(255,255,255,0.1)] hover:border-emerald-500/50 hover:bg-[rgba(16,185,129,0.02)]'
            }`}>
              {uploading ? (
                <>
                  <Clock size={28} className="text-emerald-500 animate-spin mb-3" />
                  <span className="text-[14px] font-semibold text-white">Uploading...</span>
                  <span className="text-[12px] text-[#71717a] mt-1 text-center px-4">Sending securely to backend</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] group-hover:bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#71717a] group-hover:text-emerald-400 transition-colors mb-3">
                    <Upload size={24} />
                  </div>
                  <span className="text-[14px] font-semibold text-white">Click to upload</span>
                  <span className="text-[12px] text-[#71717a] mt-1 text-center px-4">Supports PDF & DOCX up to 50MB</span>
                </>
              )}
            </label>
            
            <div className="mt-5 p-4 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
              <div className="flex items-start gap-3">
                <FileSearch size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[12px] font-semibold text-white">How AI Extraction Works</h4>
                  <p className="text-[11px] text-[#a1a1aa] mt-1 leading-relaxed">
                    When you upload a document, Auditchain parses the text and uses Gemini AI to identify compliance requirements. You will be asked to review and approve the extracted controls before they are activated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2">
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
                    <td className="py-4 px-4">
                      {getStatusBadge(policy.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[13px] font-medium text-white tabular-nums flex items-center gap-1.5">
                        <Shield size={14} className="text-[#52525B]" />
                        {policy.total_controls_extracted || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {policy.status === 'review' ? (
                        <button className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-[11px] font-semibold text-white transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                          Review AI Output
                        </button>
                      ) : (
                        <button className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(244,63,94,0.1)] border border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-rose-400 flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {policies.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#52525B] text-[13px]">
                      No policies found. Upload your first document to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
