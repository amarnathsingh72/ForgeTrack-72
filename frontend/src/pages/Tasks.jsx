import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Clock, Upload, X, AlertTriangle, FileText, Loader2, Activity, Download } from 'lucide-react';

/* ─── Engineer Task Card ─── */
const TaskCard = ({ task, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const daysUntilDue = Math.round((new Date(task.due_date).getTime() - Date.now()) / 86400000);
  const isOverdue = daysUntilDue < 0 && task.status !== 'verified' && task.status !== 'submitted';

  const handleStatusChange = async (newStatus) => {
    try {
      await supabase.from('remediation_tasks').update({ status: newStatus }).eq('id', task.id);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    // Simulate upload delay
    setTimeout(async () => {
      try {
        await supabase.from('remediation_tasks').update({ 
          evidence_ref: `s3://evidence/${file.name}`,
          status: 'submitted' 
        }).eq('id', task.id);
        onUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }, 1500);
  };

  return (
    <div className={`bg-[#0e0e16] rounded-xl border transition-all overflow-hidden ${
      isOverdue ? 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
    }`}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between mb-3">
          <code className="text-[11px] font-mono font-semibold text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2 py-0.5 rounded">
            {task.gaps?.controls?.control_code || 'TASK'}
          </code>
          {isOverdue ? (
            <span className="text-[10px] font-bold text-rose-400 bg-[rgba(244,63,94,0.1)] px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={10} /> Overdue ({Math.abs(daysUntilDue)}d)
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-[#71717a] flex items-center gap-1 uppercase tracking-wider">
              <Clock size={10} /> Due in {daysUntilDue}d
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#e4e4e7] font-medium leading-snug mb-2">{task.description}</p>
        <p className="text-[12px] text-[#71717a] line-clamp-2">{task.gaps?.controls?.requirement_text}</p>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[rgba(255,255,255,0.04)] pt-4 bg-[rgba(255,255,255,0.01)] space-y-4">
          <div>
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Evidence Required</div>
            <div className="text-[12px] text-white bg-[#111118] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
              Please provide a <span className="font-semibold text-emerald-400">{task.gaps?.controls?.evidence_type || 'screenshot'}</span> proving this control is implemented.
            </div>
          </div>
          
          {task.evidence_ref ? (
            <div>
              <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Uploaded Evidence</div>
              <div className="flex items-center gap-2 text-[12px] text-emerald-400 bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.1)] rounded-lg px-3 py-2">
                <FileText size={14} /> {task.evidence_ref.split('/').pop()}
              </div>
            </div>
          ) : (
            <div>
              <input type="file" id={`file-${task.id}`} className="hidden" onChange={handleUpload} />
              <label htmlFor={`file-${task.id}`} className="w-full flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] hover:border-emerald-500/50 hover:bg-[rgba(16,185,129,0.02)] transition-all cursor-pointer group">
                {uploading ? (
                  <Loader2 size={20} className="text-emerald-500 animate-spin mb-2" />
                ) : (
                  <Upload size={20} className="text-[#52525B] group-hover:text-emerald-400 transition-colors mb-2" />
                )}
                <span className="text-[12px] font-medium text-[#a1a1aa] group-hover:text-white transition-colors">
                  {uploading ? 'Uploading securely...' : 'Click to upload evidence'}
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <button onClick={(e) => { e.stopPropagation(); handleStatusChange('in_progress'); }} className="flex-1 h-9 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-[12px] font-medium text-white hover:bg-[rgba(255,255,255,0.04)] transition-all">
                Mark In Progress
              </button>
            )}
            {task.status === 'in_progress' && !task.evidence_ref && (
              <button disabled className="flex-1 h-9 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[12px] font-medium text-[#52525B] cursor-not-allowed transition-all">
                Upload Evidence to Submit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Tasks View ─── */
const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('remediation_tasks')
        .select('*, gaps(severity, controls(control_code, requirement_text, evidence_type))')
        .eq('assigned_to', user.email)
        .order('due_date', { ascending: true });
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDownloadLogs = () => {
    const csv = [
      ['Task ID', 'Control', 'Requirement', 'Status', 'Due Date', 'Evidence'].join(','),
      ...tasks.map(t => [
        t.id,
        t.gaps?.controls?.control_code,
        `"${t.description.replace(/"/g, '""')}"`,
        t.status,
        t.due_date,
        t.evidence_ref || 'N/A'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'my_remediation_history.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeTasks = tasks.filter(t => t.status !== 'verified');
  const historyTasks = tasks.filter(t => t.status === 'verified');
  const completedCount = historyTasks.length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const cols = [
    { id: 'pending', title: 'To Do', color: '#8A8A94', bg: 'rgba(255,255,255,0.02)' },
    { id: 'in_progress', title: 'In Progress', color: '#3B82F6', bg: 'rgba(59,130,246,0.05)' },
    { id: 'submitted', title: 'Under Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.05)' }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-[#16161F] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.04)]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">My Remediation Workflow</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Manage compliance tasks and track your resolution progress.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#0e0e16] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-[10px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Resolution Rate</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-[14px] font-bold text-white tabular-nums">{progressPercent}%</span>
                </div>
             </div>
             <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
             <div className="flex flex-col text-right">
                <span className="text-[10px] text-[#52525B] uppercase font-bold tracking-widest mb-1">Total Impact</span>
                <span className="text-[14px] font-bold text-white">{completedCount} / {totalCount} Tasks Resolved</span>
             </div>
          </div>
          
          <button 
            onClick={handleDownloadLogs}
            className="h-10 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[12px] font-bold text-white hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2"
          >
            <Download size={14} /> Download History
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        {cols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col bg-[#0a0a12] rounded-xl border border-[rgba(255,255,255,0.04)] overflow-hidden min-h-[400px]">
              <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between shrink-0" style={{ background: col.bg }}>
                <h3 className="text-[13px] font-semibold text-white">{col.title}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.05)] text-[#a1a1aa]">{colTasks.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                ))}
                {colTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[rgba(255,255,255,0.04)] rounded-xl text-[12px] text-[#52525B] gap-2">
                    <Activity size={20} className="opacity-20" />
                    No active tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolved History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <h2 className="text-[16px] font-bold text-white tracking-tight">Resolved History</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{historyTasks.length} Verified</span>
        </div>
        
        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,0.02)]">
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-4">Control</th>
                <th className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-4">Requirement</th>
                <th className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-4">Resolved Date</th>
                <th className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 px-4">Evidence Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
              {historyTasks.map(task => (
                <tr key={task.id} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <code className="text-[11px] font-mono text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2 py-0.5 rounded">
                      {task.gaps?.controls?.control_code}
                    </code>
                  </td>
                  <td className="py-4 px-4 text-[13px] text-[#a1a1aa]">{task.description}</td>
                  <td className="py-4 px-4 text-[12px] text-[#52525B] tabular-nums">
                    {new Date(task.completed_at || task.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-[11px] text-emerald-500 font-medium">
                      <FileText size={12} /> {task.evidence_ref ? task.evidence_ref.split('/').pop() : 'verified_doc.pdf'}
                    </div>
                  </td>
                </tr>
              ))}
              {historyTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[13px] text-[#3f3f46]">No resolved tasks in your history.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
