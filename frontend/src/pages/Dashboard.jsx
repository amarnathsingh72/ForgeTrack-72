import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  TrendingDown, Activity, ArrowUpRight, BarChart3, Eye
} from 'lucide-react';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, color, loading }) => {
  const colorMap = {
    emerald: { text: '#10B981', icon: 'rgba(16,185,129,0.2)' },
    red:     { text: '#F43F5E', icon: 'rgba(244,63,94,0.2)' },
    blue:    { text: '#3B82F6', icon: 'rgba(59,130,246,0.2)' },
    amber:   { text: '#F59E0B', icon: 'rgba(245,158,11,0.2)' },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className="group bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 hover:border-[rgba(255,255,255,0.1)] transition-all overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: c.icon }}>
          <Icon size={20} style={{ color: c.text }} />
        </div>
      </div>
      <div className="text-[28px] font-bold text-white tracking-tight tabular-nums leading-none mb-1">
        {loading ? <div className="h-8 w-16 bg-[#16161F] rounded animate-pulse" /> : value}
      </div>
      <div className="text-[12px] text-[#71717a] font-medium">{label}</div>
    </div>
  );
};

/* ─── Radial Progress Ring ─── */
const ProgressRing = ({ percentage, size = 64, strokeWidth = 5, color = '#10B981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 6px ${color}40)` }} />
    </svg>
  );
};

/* ─── Framework Card ─── */
const FrameworkCard = ({ name, coverage, evidenced, total, loading }) => {
  const ringColor = coverage >= 80 ? '#10B981' : coverage >= 50 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="bg-[#111118] rounded-xl border border-[rgba(255,255,255,0.04)] p-4 hover:border-[rgba(255,255,255,0.08)] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[13px] font-semibold text-white mb-0.5">{name}</div>
          <div className="text-[11px] text-[#52525B]">
            {loading ? '...' : `${evidenced} of ${total} evidenced`}
          </div>
        </div>
        <div className="relative w-16 h-16">
          <ProgressRing percentage={loading ? 0 : coverage} size={64} strokeWidth={5} color={ringColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-bold text-white tabular-nums">{loading ? '—' : `${coverage}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Gap Row ─── */
const GapRow = ({ code, requirement, severity, daysOpen, onClick }) => {
  const sevColors = {
    critical: { bg: 'rgba(244,63,94,0.1)', text: '#F43F5E', border: 'rgba(244,63,94,0.2)' },
    high: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    medium: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
    low: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: 'rgba(16,185,129,0.2)' },
  };
  const s = sevColors[severity] || sevColors.medium;
  return (
    <div onClick={onClick} className="flex items-center justify-between py-3 group hover:bg-[rgba(255,255,255,0.02)] px-2 -mx-2 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <code className="text-[12px] font-mono text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2 py-1 rounded font-medium shrink-0">{code}</code>
        <span className="text-[13px] text-[#a1a1aa] truncate">{requirement}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border" style={{ background: s.bg, color: s.text, borderColor: s.border }}>{severity}</span>
        <span className={`text-[11px] font-semibold tabular-nums ${daysOpen > 30 ? 'text-rose-400' : 'text-[#52525B]'}`}>{daysOpen}d</span>
        <ArrowUpRight size={14} className="text-[#3f3f46] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

/* ─── Stacked Bar ─── */
const StackedBar = ({ segments }) => {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div className="w-full h-3 rounded-full bg-[rgba(255,255,255,0.04)] flex overflow-hidden">
      {segments.map((seg, i) => (
        <div key={i} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }} />
      ))}
    </div>
  );
};

/* ═══ MAIN DASHBOARD ═══ */
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ controls: 0, coverage: 0, openGaps: 0, daysToAudit: 0 });
  const [frameworks, setFrameworks] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [remStats, setRemStats] = useState({ total: 0, inProgress: 0, submitted: 0, overdue: 0, verified: 0 });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        // 1. Controls count
        const { count: controlCount } = await supabase.from('controls').select('id', { count: 'exact', head: true }).eq('is_active', true);

        // 2. Open gaps with control info
        const { data: gapData, count: gapCount } = await supabase
          .from('gaps').select('*, controls(control_code, requirement_text)', { count: 'exact' }).eq('status', 'open').order('severity').limit(5);

        // 3. Control mappings count (for coverage)
        const { data: mappings } = await supabase.from('control_mappings').select('control_id');
        const uniqueMapped = new Set(mappings?.map(m => m.control_id) || []);
        const coverage = controlCount > 0 ? Math.round((uniqueMapped.size / controlCount) * 100) : 0;

        // 4. Days to next audit (from audit_exports)
        const { data: exports } = await supabase.from('audit_exports').select('to_date').order('to_date', { ascending: false }).limit(1);
        let daysToAudit = 0;
        if (exports?.[0]?.to_date) {
          const lastEnd = new Date(exports[0].to_date);
          const nextAudit = new Date(lastEnd);
          nextAudit.setMonth(nextAudit.getMonth() + 3); // Next quarter
          daysToAudit = Math.max(0, Math.ceil((nextAudit - new Date()) / 86400000));
        }

        // 5. Framework breakdown (from policy_documents + controls)
        const { data: policies } = await supabase.from('policy_documents').select('id, framework, total_controls_extracted').eq('status', 'active');
        const fwData = (policies || []).map(p => {
          const policyControls = controlCount; // simplified: all controls belong to policy
          const mapped = uniqueMapped.size;
          const cov = policyControls > 0 ? Math.round((mapped / policyControls) * 100) : 0;
          return { name: p.framework.toUpperCase(), coverage: Math.min(cov, 100), evidenced: mapped, total: p.total_controls_extracted || policyControls };
        });

        // 6. Remediation stats
        const { data: tasks } = await supabase.from('remediation_tasks').select('status, due_date');
        const now = new Date();
        const rs = { total: tasks?.length || 0, inProgress: 0, submitted: 0, overdue: 0, verified: 0 };
        (tasks || []).forEach(t => {
          if (t.status === 'in_progress') rs.inProgress++;
          else if (t.status === 'submitted') rs.submitted++;
          else if (t.status === 'verified') rs.verified++;
          if (t.status === 'pending' && new Date(t.due_date) < now) rs.overdue++;
        });

        // 7. Recent events
        const { data: evData } = await supabase.from('events').select('*').order('timestamp', { ascending: false }).limit(6);

        setStats({ controls: controlCount || 0, coverage: Math.min(coverage, 100), openGaps: gapCount || 0, daysToAudit });
        setFrameworks(fwData.length > 0 ? fwData : [{ name: 'SOC 2', coverage, evidenced: uniqueMapped.size, total: controlCount || 0 }]);
        setGaps(gapData || []);
        setRemStats(rs);
        setEvents(evData || []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sourceColors = {
    github: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', border: 'rgba(139,92,246,0.2)' },
    aws_cloudtrail: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    jira: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
    okta: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: 'rgba(16,185,129,0.2)' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Compliance Coverage</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
        <button onClick={() => navigate('/export')} className="h-9 px-4 rounded-lg bg-emerald-500 text-[12px] font-semibold text-white hover:bg-emerald-400 transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)]">
          Create report
        </button>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Controls Active" value={stats.controls} icon={Shield} color="blue" loading={loading} />
        <StatCard label="Coverage" value={`${stats.coverage}%`} icon={CheckCircle2} color="emerald" loading={loading} />
        <StatCard label="Open Gaps" value={stats.openGaps} icon={AlertTriangle} color="red" loading={loading} />
        <StatCard label="Days to Next Audit" value={stats.daysToAudit} icon={Clock} color="amber" loading={loading} />
      </div>

      {/* Framework Coverage + Critical Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-white">Framework Coverage</h2>
            <button onClick={() => navigate('/policies')} className="text-[11px] text-[#52525B] hover:text-[#8A8A94] flex items-center gap-1">View all <ArrowUpRight size={11} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {frameworks.map((fw, i) => (
              <FrameworkCard key={i} name={fw.name} coverage={fw.coverage} evidenced={fw.evidenced} total={fw.total} loading={loading} />
            ))}
          </div>
        </div>

        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-white">Critical Gaps</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(244,63,94,0.1)] text-rose-400 border border-[rgba(244,63,94,0.15)]">{stats.openGaps} open</span>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {loading ? <div className="py-8 text-center text-[13px] text-[#3f3f46]">Loading...</div> :
              gaps.length > 0 ? gaps.sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3)).map(gap => (
                <GapRow key={gap.id} code={gap.controls?.control_code || 'N/A'} requirement={gap.controls?.requirement_text || '—'}
                  severity={gap.severity} daysOpen={Math.max(1, Math.round((Date.now() - new Date(gap.detected_at || gap.created_at).getTime()) / 86400000))}
                  onClick={() => navigate('/gaps')} />
              )) : (
                <div className="flex flex-col items-center py-8">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                  <span className="text-[13px] text-[#52525B]">All controls evidenced</span>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Remediation Progress + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remediation */}
        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-white">Remediation Progress</h2>
            <button onClick={() => navigate('/remediation')} className="text-[11px] text-[#52525B] hover:text-[#8A8A94] flex items-center gap-1">View board <ArrowUpRight size={11} /></button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total', value: remStats.total, color: '#8A8A94' },
              { label: 'In Progress', value: remStats.inProgress, color: '#3B82F6' },
              { label: 'Submitted', value: remStats.submitted, color: '#F59E0B' },
              { label: 'Overdue', value: remStats.overdue, color: '#F43F5E' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-[20px] font-bold tabular-nums" style={{ color: item.color }}>{loading ? '—' : item.value}</div>
                <div className="text-[10px] text-[#52525B] mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          <StackedBar segments={[
            { value: remStats.inProgress || 1, color: '#3B82F6' },
            { value: remStats.submitted || 1, color: '#F59E0B' },
            { value: remStats.overdue || 1, color: '#F43F5E' },
            { value: remStats.verified || 1, color: '#10B981' },
          ]} />
          <div className="flex items-center justify-center gap-6 mt-4">
            {[{ label: 'In Progress', color: '#3B82F6' }, { label: 'Submitted', color: '#F59E0B' }, { label: 'Overdue', color: '#F43F5E' }, { label: 'Verified', color: '#10B981' }].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] text-[#52525B]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-white">Recent Events</h2>
            <button onClick={() => navigate('/events')} className="text-[11px] text-[#52525B] hover:text-[#8A8A94] flex items-center gap-1">View all <ArrowUpRight size={11} /></button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                {['Time', 'Source', 'Action', 'Outcome'].map(h => (
                  <th key={h} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] pb-3 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const sc = sourceColors[ev.source] || { bg: 'rgba(255,255,255,0.05)', text: '#71717a', border: 'rgba(255,255,255,0.06)' };
                return (
                  <tr key={ev.id} onClick={() => navigate('/events')} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
                    <td className="py-2.5 pr-3 text-[11px] font-mono text-[#52525B] tabular-nums whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>{ev.source}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-[11px] text-[#a1a1aa] truncate max-w-[120px]">{ev.action}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        ev.outcome === 'success' ? 'bg-[rgba(16,185,129,0.1)] text-emerald-400 border-[rgba(16,185,129,0.15)]' :
                        ev.outcome === 'failure' ? 'bg-[rgba(244,63,94,0.1)] text-rose-400 border-[rgba(244,63,94,0.15)]' :
                        'bg-[rgba(255,255,255,0.05)] text-[#71717a] border-[rgba(255,255,255,0.06)]'
                      }`}>{ev.outcome}</span>
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && !loading && (
                <tr><td colSpan={4} className="py-6 text-center text-[12px] text-[#3f3f46]">No events yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
