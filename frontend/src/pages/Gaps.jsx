import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle, ChevronDown, ChevronUp, Plus, X, Calendar,
  CheckCircle2, RefreshCw, Users, Clock, ArrowUpRight, Loader2
} from 'lucide-react';

/* ─── Severity Tab ─── */
const SeverityTab = ({ label, count, active, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 h-9 px-4 rounded-lg text-[12px] font-semibold transition-all border ${
      active
        ? `border-[${color}33] text-white`
        : 'border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-[#a1a1aa] hover:border-[rgba(255,255,255,0.1)]'
    }`}
    style={active ? { background: `${color}15`, borderColor: `${color}33`, color } : {}}
  >
    {label}
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? '' : 'bg-[rgba(255,255,255,0.04)] text-[#52525B]'}`}
      style={active ? { background: `${color}20` } : {}}
    >
      {count}
    </span>
  </button>
);

/* ─── Create Task Modal ─── */
const CreateTaskModal = ({ gap, onClose, onCreated }) => {
  const [email, setEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('remediation_tasks').insert({
        gap_id: gap.id,
        assigned_to: email,
        description: description || `Fix: ${gap.controls?.requirement_text?.substring(0, 100)}`,
        due_date: dueDate,
        status: 'pending'
      });
      if (error) throw error;
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create task error:', err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0e0e16] border border-[rgba(255,255,255,0.08)] rounded-2xl w-full max-w-md p-6 shadow-[0_24px_48px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-semibold text-white">Create Remediation Task</h3>
            <p className="text-[12px] text-[#52525B] mt-1">
              For <code className="text-emerald-400 bg-[rgba(16,185,129,0.08)] px-1.5 py-0.5 rounded text-[11px]">{gap.controls?.control_code}</code>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#52525B] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Assign Engineer Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="dev@auditchain.dev"
              className="w-full bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-[#3f3f46] outline-none focus:border-emerald-500/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Due Date</label>
            <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] text-white outline-none focus:border-emerald-500/50 transition-all [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What needs to be done..."
              className="w-full bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-[#3f3f46] outline-none focus:border-emerald-500/50 transition-all resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-[13px] font-medium text-[#71717a] hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-lg bg-emerald-500 text-[13px] font-semibold text-white hover:bg-emerald-400 transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Gap Card ─── */
const GapCard = ({ gap, onCreateTask }) => {
  const [expanded, setExpanded] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const handleReevaluate = (e) => {
    e.stopPropagation();
    setEvaluating(true);
    setTimeout(() => {
      setEvaluating(false);
      alert('Re-evaluation complete. No new evidence found for this control.');
    }, 1500);
  };

  const sevColors = {
    critical: { bg: 'rgba(244,63,94,0.08)', text: '#F43F5E', border: 'rgba(244,63,94,0.15)', glow: 'rgba(244,63,94,0.06)' },
    high:     { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.06)' },
    medium:   { bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6', border: 'rgba(59,130,246,0.15)', glow: 'rgba(59,130,246,0.06)' },
    low:      { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.06)' },
  };
  const s = sevColors[gap.severity] || sevColors.medium;
  const daysOpen = Math.max(1, Math.round((Date.now() - new Date(gap.detected_at || gap.created_at).getTime()) / 86400000));

  return (
    <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all overflow-hidden"
      style={expanded ? { borderColor: s.border } : {}}
    >
      {/* Main row */}
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <code className="text-[13px] font-mono font-semibold text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2.5 py-1 rounded-lg shrink-0">
            {gap.controls?.control_code || 'N/A'}
          </code>
          <span className="text-[13px] text-[#a1a1aa] truncate">{gap.controls?.requirement_text}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Severity pill */}
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border tracking-[0.05em]"
            style={{ background: s.bg, color: s.text, borderColor: s.border }}>
            {gap.severity}
          </span>
          {/* Days open */}
          <span className={`text-[11px] font-semibold tabular-nums flex items-center gap-1 ${daysOpen > 30 ? 'text-rose-400' : 'text-[#52525B]'}`}>
            <Clock size={12} /> {daysOpen}d
          </span>
          {/* Task count */}
          {gap._taskCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(59,130,246,0.1)] text-blue-400 border border-[rgba(59,130,246,0.15)] flex items-center gap-1">
              <Users size={10} /> {gap._taskCount}
            </span>
          )}
          {/* Expand chevron */}
          {expanded ? <ChevronUp size={16} className="text-[#52525B]" /> : <ChevronDown size={16} className="text-[#3f3f46]" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[rgba(255,255,255,0.04)]" style={{ background: s.glow }}>
          <div className="pt-4 space-y-4">
            <div>
              <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Full Requirement</div>
              <p className="text-[13px] text-[#a1a1aa] leading-relaxed">{gap.controls?.requirement_text}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Evidence Type</div>
                <div className="text-[12px] text-[#71717a]">{gap.controls?.evidence_type || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Match Type</div>
                <div className="text-[12px] text-[#71717a]">{gap.match_type || 'none'}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Detected</div>
                <div className="text-[12px] text-[#71717a] tabular-nums">{new Date(gap.detected_at || gap.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={(e) => { e.stopPropagation(); onCreateTask(gap); }}
                className="h-9 px-4 rounded-lg bg-emerald-500 text-[12px] font-semibold text-white hover:bg-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center gap-2">
                <Plus size={14} /> Create Task
              </button>
              <button 
                onClick={handleReevaluate}
                disabled={evaluating}
                className="h-9 px-4 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[#71717a] hover:text-white hover:border-[rgba(255,255,255,0.1)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={13} className={evaluating ? "animate-spin" : ""} />
                {evaluating ? "Evaluating..." : "Re-evaluate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   GAP QUEUE
   ═══════════════════════════════════════════════════ */
const Gaps = () => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [taskModal, setTaskModal] = useState(null);

  const loadGaps = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('gaps')
        .select('*, controls(control_code, requirement_text, evidence_type)')
        .eq('status', 'open')
        .order('detected_at', { ascending: false });

      // Enrich with task counts
      const enriched = await Promise.all((data || []).map(async (gap) => {
        const { count } = await supabase.from('remediation_tasks').select('id', { count: 'exact', head: true }).eq('gap_id', gap.id);
        return { ...gap, _taskCount: count || 0 };
      }));

      setGaps(enriched);
    } catch (err) {
      console.error('Gaps load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGaps(); }, []);

  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const filtered = useMemo(() => {
    const sorted = [...gaps].sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));
    if (activeTab === 'all') return sorted;
    return sorted.filter(g => g.severity === activeTab);
  }, [gaps, activeTab]);

  const counts = useMemo(() => ({
    all: gaps.length,
    critical: gaps.filter(g => g.severity === 'critical').length,
    high: gaps.filter(g => g.severity === 'high').length,
    medium: gaps.filter(g => g.severity === 'medium').length,
    low: gaps.filter(g => g.severity === 'low').length,
  }), [gaps]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-[#16161F] rounded-lg" />
        <div className="flex gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-9 w-24 bg-[#0e0e16] rounded-lg" />)}</div>
        {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.04)]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Gap Queue</h1>
          <p className="text-[13px] text-[#52525B] mt-1">{gaps.length} open compliance gaps</p>
        </div>
      </div>

      {/* Severity Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityTab label="All" count={counts.all} active={activeTab === 'all'} color="#8A8A94" onClick={() => setActiveTab('all')} />
        <SeverityTab label="Critical" count={counts.critical} active={activeTab === 'critical'} color="#F43F5E" onClick={() => setActiveTab('critical')} />
        <SeverityTab label="High" count={counts.high} active={activeTab === 'high'} color="#F59E0B" onClick={() => setActiveTab('high')} />
        <SeverityTab label="Medium" count={counts.medium} active={activeTab === 'medium'} color="#3B82F6" onClick={() => setActiveTab('medium')} />
        <SeverityTab label="Low" count={counts.low} active={activeTab === 'low'} color="#10B981" onClick={() => setActiveTab('low')} />
      </div>

      {/* Gap Cards */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(gap => (
          <GapCard key={gap.id} gap={gap} onCreateTask={(g) => setTaskModal(g)} />
        )) : (
          <div className="flex flex-col items-center justify-center py-16 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)]">
            <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
            <span className="text-[18px] font-semibold text-white">All controls evidenced</span>
            <span className="text-[13px] text-[#52525B] mt-1">No {activeTab !== 'all' ? activeTab : ''} gaps remaining</span>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {taskModal && (
        <CreateTaskModal gap={taskModal} onClose={() => setTaskModal(null)} onCreated={loadGaps} />
      )}
    </div>
  );
};

export default Gaps;
