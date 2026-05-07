import React, { useState } from 'react';
import { AlertTriangle, Check, Edit3, Shield } from 'lucide-react';

const evidenceLabels = { log: 'Log', report: 'Report', ticket: 'Ticket', screenshot: 'Screenshot', policy_doc: 'Policy Doc' };
const freqLabels = { continuous: 'Continuous', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const roleLabels = { infosec: 'InfoSec', devops: 'DevOps', hr: 'HR', legal: 'Legal' };

const StepReview = ({ controls, onUpdateControl, onActivate, loading }) => {
  const [editIdx, setEditIdx] = useState(null);

  const ambiguousCount = controls.filter(c => c.ambiguity_flag).length;
  const unresolvedCount = controls.filter(c => c.ambiguity_flag && !c.ambiguity_note).length;

  return (
    <div>
      <h2 className="text-[18px] font-bold text-white mb-1">Review Extracted Controls</h2>
      <p className="text-[13px] text-[#52525B] mb-4">
        {controls.length} controls extracted. {ambiguousCount > 0 && <span className="text-amber-400">{ambiguousCount} flagged as ambiguous.</span>}
      </p>

      {/* Controls table */}
      <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[rgba(255,255,255,0.02)]">
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              {['Code', 'Requirement', 'Evidence', 'Freq', 'Owner', 'Status'].map(h => (
                <th key={h} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
            {controls.map((ctrl, i) => (
              <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="py-3 px-3">
                  <span className="text-[11px] font-bold text-white bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded">{ctrl.control_code}</span>
                </td>
                <td className="py-3 px-3 max-w-[280px]">
                  {editIdx === i ? (
                    <textarea
                      value={ctrl.requirement_text}
                      onChange={e => onUpdateControl(i, 'requirement_text', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.04)] border border-emerald-500/30 rounded p-1.5 text-[11px] text-white resize-none h-16 focus:outline-none"
                    />
                  ) : (
                    <p className="text-[11px] text-[#a1a1aa] leading-relaxed line-clamp-2 cursor-pointer" onClick={() => setEditIdx(i)}>{ctrl.requirement_text}</p>
                  )}
                </td>
                <td className="py-3 px-3">
                  <select value={ctrl.evidence_type} onChange={e => onUpdateControl(i, 'evidence_type', e.target.value)}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded text-[10px] text-white px-1.5 py-1 focus:outline-none">
                    {Object.entries(evidenceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="py-3 px-3">
                  <select value={ctrl.frequency} onChange={e => onUpdateControl(i, 'frequency', e.target.value)}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded text-[10px] text-white px-1.5 py-1 focus:outline-none">
                    {Object.entries(freqLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="py-3 px-3">
                  <select value={ctrl.owner_role} onChange={e => onUpdateControl(i, 'owner_role', e.target.value)}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded text-[10px] text-white px-1.5 py-1 focus:outline-none">
                    {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="py-3 px-3">
                  {ctrl.ambiguity_flag ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1"><AlertTriangle size={10} /> Ambiguous</span>
                      <input
                        type="text"
                        placeholder="Resolution note..."
                        value={ctrl.ambiguity_note || ''}
                        onChange={e => onUpdateControl(i, 'ambiguity_note', e.target.value)}
                        className="bg-[rgba(245,158,11,0.05)] border border-amber-500/20 rounded text-[10px] text-white px-2 py-1 focus:outline-none focus:border-amber-500/50 w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><Check size={10} /> Clean</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-[12px] text-[#52525B]">
          <Shield size={14} className="inline mr-1" />
          {controls.length} controls ready • {unresolvedCount > 0 && <span className="text-amber-400">{unresolvedCount} unresolved ambiguities</span>}
        </div>
        <button
          onClick={onActivate}
          disabled={loading || unresolvedCount > 0}
          className="h-11 px-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[13px] font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? 'Activating...' : `Activate ${controls.length} Controls`}
        </button>
      </div>
    </div>
  );
};

export default StepReview;
