import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Clock, CheckCircle2, Loader2, AlertTriangle, ArrowRight,
  Upload, Calendar, User, FileText, ChevronDown, ChevronUp,
  MoreHorizontal, X
} from 'lucide-react';

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: '#71717a', icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6', icon: Loader2 },
  { id: 'submitted', label: 'Submitted', color: '#F59E0B', icon: Upload },
  { id: 'verified', label: 'Verified', color: '#10B981', icon: CheckCircle2 },
];

/* ─── Task Card ─── */
const TaskCard = ({ task, onStatusChange, onExpand }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isOverdue = task.status === 'pending' && new Date(task.due_date) < new Date();
  const daysLeft = Math.ceil((new Date(task.due_date) - new Date()) / 86400000);

  const sevColors = {
    critical: { bg: 'rgba(244,63,94,0.08)', text: '#F43F5E', border: 'rgba(244,63,94,0.15)' },
    high:     { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
    medium:   { bg: 'rgba(59,130,246,0.08)',  text: '#3B82F6', border: 'rgba(59,130,246,0.15)' },
    low:      { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.15)' },
  };
  const sev = task.gaps?.severity ? sevColors[task.gaps.severity] : sevColors.medium;

  const nextStatus = {
    pending: 'in_progress',
    in_progress: 'submitted',
    submitted: 'verified',
  };

  const handleAdvance = async (e) => {
    e.stopPropagation();
    const next = nextStatus[task.status];
    if (!next) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('remediation_tasks')
        .update({ status: next })
        .eq('id', task.id);
      if (error) throw error;
      onStatusChange();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`bg-[#111118] rounded-xl border transition-all cursor-pointer group ${
        isOverdue ? 'border-[rgba(244,63,94,0.2)] shadow-[0_0_12px_rgba(244,63,94,0.05)]' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        {/* Top row: control code + severity */}
        <div className="flex items-center justify-between mb-2">
          <code className="text-[12px] font-mono font-semibold text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2 py-0.5 rounded">
            {task.gaps?.controls?.control_code || 'N/A'}
          </code>
          {task.gaps?.severity && (
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border tracking-[0.05em]"
              style={{ background: sev.bg, color: sev.text, borderColor: sev.border }}>
              {task.gaps.severity}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[13px] text-[#a1a1aa] leading-relaxed mb-3 line-clamp-2">{task.description}</p>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                {task.assigned_to?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="text-[10px] text-[#52525B] truncate max-w-[80px]">{task.assigned_to?.split('@')[0]}</span>
            </div>

            {/* Due date */}
            <div className={`flex items-center gap-1 text-[10px] tabular-nums ${isOverdue ? 'text-rose-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-[#52525B]'}`}>
              <Calendar size={10} />
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Advance button */}
          {nextStatus[task.status] && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="opacity-0 group-hover:opacity-100 h-7 px-3 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[10px] font-semibold text-[#71717a] hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all flex items-center gap-1.5"
            >
              {updating ? <Loader2 size={10} className="animate-spin" /> : <ArrowRight size={10} />}
              {nextStatus[task.status].replace('_', ' ')}
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[rgba(255,255,255,0.04)] mt-0">
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Full Requirement</div>
                <p className="text-[11px] text-[#71717a] leading-relaxed">{task.gaps?.controls?.requirement_text || '—'}</p>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">Evidence</div>
                <p className="text-[11px] text-[#71717a] font-mono break-all">{task.evidence_ref || 'Not yet submitted'}</p>
              </div>
            </div>

            {isOverdue && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(244,63,94,0.06)] border border-[rgba(244,63,94,0.12)]">
                <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                <span className="text-[11px] text-rose-400">Overdue by {Math.abs(daysLeft)} days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   REMEDIATION BOARD
   ═══════════════════════════════════════════════════ */
const Remediation = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const { data } = await supabase
        .from('remediation_tasks')
        .select('*, gaps(severity, controls(control_code, requirement_text))')
        .order('due_date', { ascending: true });
      setTasks(data || []);
    } catch (err) {
      console.error('Tasks load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const columnTasks = useMemo(() => {
    const map = {};
    COLUMNS.forEach(col => { map[col.id] = []; });
    tasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  // Summary stats
  const overdue = tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-[#16161F] rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-96 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.04)]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Remediation Board</h1>
          <p className="text-[13px] text-[#52525B] mt-1">
            {tasks.length} tasks · {overdue > 0 && <span className="text-rose-400">{overdue} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Summary pills */}
          {COLUMNS.map(col => (
            <div key={col.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-[12px] text-[#52525B]">{col.label}</span>
              <span className="text-[12px] font-bold text-white tabular-nums">{columnTasks[col.id]?.length || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const colTasks = columnTasks[col.id] || [];
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: col.color }} className={col.id === 'in_progress' ? 'animate-spin' : ''} />
                  <span className="text-[13px] font-semibold text-white">{col.label}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[#52525B]">{colTasks.length}</span>
                </div>
              </div>

              {/* Column body */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1 scrollbar-thin">
                {colTasks.length > 0 ? colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={loadTasks} />
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-[#0e0e16] rounded-xl border border-dashed border-[rgba(255,255,255,0.06)] text-center">
                    <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-2">
                      <Icon size={18} style={{ color: col.color }} className="opacity-30" />
                    </div>
                    <span className="text-[12px] text-[#3f3f46]">No {col.label.toLowerCase()} tasks</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Remediation;
