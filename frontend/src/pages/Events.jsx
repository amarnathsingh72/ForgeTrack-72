import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search, Filter, Download, ChevronDown, X, Activity,
  ArrowUpRight, ChevronRight, Clock, Copy, Check
} from 'lucide-react';

/* ─── Source Status Indicator ─── */
const SourceIndicator = ({ source, lastSync, count, status }) => {
  const statusColors = { live: '#10B981', stale: '#F59E0B', error: '#F43F5E' };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-all">
      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: statusColors[status], color: statusColors[status] }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">{source}</div>
        <div className="text-[10px] text-[#52525B] tabular-nums">{lastSync}</div>
      </div>
      <div className="text-[14px] font-bold text-white tabular-nums">{count}</div>
    </div>
  );
};

/* ─── Filter Pill ─── */
const FilterPill = ({ label, active, onClick, onRemove }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold transition-all border ${
      active
        ? 'bg-[rgba(16,185,129,0.1)] text-emerald-400 border-[rgba(16,185,129,0.2)]'
        : 'bg-[#111118] text-[#71717a] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] hover:text-[#a1a1aa]'
    }`}
  >
    {label}
    {active && onRemove && (
      <X size={10} className="ml-0.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onRemove(); }} />
    )}
  </button>
);

/* ─── Detail Panel ─── */
const DetailPanel = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event.raw_payload || {}, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[420px] shrink-0 bg-[#0a0a12] border-l border-[rgba(255,255,255,0.06)] h-full overflow-y-auto animate-slideIn">
      <div className="sticky top-0 bg-[#0a0a12] z-10 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Event Details</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#52525B] hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Meta fields */}
        {[
          { label: 'Timestamp', value: new Date(event.timestamp).toLocaleString() },
          { label: 'Source', value: event.source },
          { label: 'Actor', value: event.actor },
          { label: 'Action', value: event.action },
          { label: 'Resource', value: event.resource },
          { label: 'Outcome', value: event.outcome },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-1">{label}</div>
            <div className="text-[13px] text-[#a1a1aa]">{value || '—'}</div>
          </div>
        ))}

        {/* Raw Payload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em]">Raw Payload</div>
            <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[#52525B] hover:text-emerald-400 transition-colors">
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-[#0e0e14] rounded-lg p-4 text-[11px] font-mono text-[#71717a] overflow-x-auto border border-[rgba(255,255,255,0.04)] max-h-[300px] overflow-y-auto leading-relaxed">
            {JSON.stringify(event.raw_payload || { note: 'No raw payload stored' }, null, 2)}
          </pre>
        </div>

        {/* Mapped Controls */}
        <div>
          <div className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.1em] mb-2">Mapped Controls</div>
          {event._mappedControls && event._mappedControls.length > 0 ? (
            <div className="space-y-2">
              {event._mappedControls.map((ctrl, i) => (
                <div key={i} className="flex items-center gap-2 py-2 px-3 bg-[#111118] rounded-lg border border-[rgba(255,255,255,0.04)]">
                  <code className="text-[11px] font-mono text-emerald-400 bg-[rgba(16,185,129,0.08)] px-2 py-0.5 rounded">{ctrl}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-[#3f3f46] italic">No control mappings found</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   EVENT LOG EXPLORER
   ═══════════════════════════════════════════════════ */
const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Filters
  const [sourceFilter, setSourceFilter] = useState([]);
  const [actorSearch, setActorSearch] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .order('timestamp', { ascending: false });

        // Fetch control mappings for each event
        const enriched = await Promise.all((data || []).map(async (ev) => {
          const { data: mappings } = await supabase
            .from('control_mappings')
            .select('controls(control_code)')
            .eq('event_id', ev.id);
          return { ...ev, _mappedControls: mappings?.map(m => m.controls?.control_code).filter(Boolean) || [] };
        }));

        setEvents(enriched);
      } catch (err) {
        console.error('Events load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Available sources from data
  const availableSources = useMemo(() => [...new Set(events.map(e => e.source))], [events]);

  // Filtered events
  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (sourceFilter.length > 0 && !sourceFilter.includes(ev.source)) return false;
      if (actorSearch && !ev.actor?.toLowerCase().includes(actorSearch.toLowerCase())) return false;
      if (actionSearch && !ev.action?.toLowerCase().includes(actionSearch.toLowerCase())) return false;
      if (outcomeFilter && ev.outcome !== outcomeFilter) return false;
      return true;
    });
  }, [events, sourceFilter, actorSearch, actionSearch, outcomeFilter]);

  // Toggle source filter
  const toggleSource = (src) => {
    setSourceFilter(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  };

  // Toggle row selection
  const toggleRow = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Export CSV
  const handleExport = () => {
    const rows = filtered.filter(ev => selectedRows.has(ev.id));
    if (rows.length === 0) return;
    const headers = ['timestamp', 'source', 'actor', 'action', 'resource', 'outcome'];
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'events_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const sourceColors = {
    github: { bg: 'rgba(139,92,246,0.1)', text: '#8B5CF6', border: 'rgba(139,92,246,0.2)' },
    aws_cloudtrail: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    jira: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
    okta: { bg: 'rgba(16,185,129,0.1)', text: '#10B981', border: 'rgba(16,185,129,0.2)' },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#16161F] rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.04)]" />)}
        </div>
        <div className="h-96 bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.04)]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Main Content */}
      <div className={`flex-1 space-y-5 min-w-0 ${selectedEvent ? 'pr-0' : ''}`}>
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-white tracking-tight">Event Log Explorer</h1>
            <p className="text-[13px] text-[#52525B] mt-1">{filtered.length} events from {availableSources.length} sources</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <button onClick={handleExport} className="h-9 px-4 rounded-lg bg-emerald-500 text-[12px] font-semibold text-white hover:bg-emerald-400 transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] flex items-center gap-2">
                <Download size={14} />
                Export {selectedRows.size} as CSV
              </button>
            )}
          </div>
        </div>

        {/* Ingestion Health Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['github', 'aws_cloudtrail', 'jira', 'okta'].map(src => {
            const srcEvents = events.filter(e => e.source === src);
            let lastSync = 'Never';
            let status = 'error';
            if (srcEvents.length > 0) {
              const diffMs = new Date() - new Date(srcEvents[0].timestamp);
              const diffMins = Math.floor(diffMs / 60000);
              const diffHrs = Math.floor(diffMins / 60);
              if (diffMins < 60) lastSync = `${diffMins} min ago`;
              else if (diffHrs < 24) lastSync = `${diffHrs} hrs ago`;
              else lastSync = `${Math.floor(diffHrs/24)} days ago`;
              
              status = diffHrs >= 24 ? 'error' : (diffHrs >= 1 ? 'stale' : 'live');
            }
            const displayNames = { github: 'GitHub Actions', aws_cloudtrail: 'AWS CloudTrail', jira: 'Jira', okta: 'Okta SSO' };
            
            return (
              <SourceIndicator 
                key={src}
                source={displayNames[src]} 
                lastSync={lastSync} 
                count={srcEvents.length} 
                status={status} 
              />
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Source pills */}
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#3f3f46]" />
              {availableSources.map(src => (
                <FilterPill
                  key={src}
                  label={src}
                  active={sourceFilter.includes(src)}
                  onClick={() => toggleSource(src)}
                  onRemove={() => toggleSource(src)}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-[rgba(255,255,255,0.06)]" />

            {/* Actor search */}
            <div className="flex items-center gap-2 bg-[#111118] rounded-lg px-3 h-8 border border-[rgba(255,255,255,0.06)] w-36">
              <Search size={12} className="text-[#3f3f46]" />
              <input value={actorSearch} onChange={e => setActorSearch(e.target.value)} placeholder="Actor..." className="bg-transparent text-[11px] text-[#a1a1aa] placeholder-[#3f3f46] outline-none w-full" />
            </div>

            {/* Action search */}
            <div className="flex items-center gap-2 bg-[#111118] rounded-lg px-3 h-8 border border-[rgba(255,255,255,0.06)] w-36">
              <Search size={12} className="text-[#3f3f46]" />
              <input value={actionSearch} onChange={e => setActionSearch(e.target.value)} placeholder="Action..." className="bg-transparent text-[11px] text-[#a1a1aa] placeholder-[#3f3f46] outline-none w-full" />
            </div>

            {/* Outcome filter */}
            <div className="flex items-center gap-1.5">
              {['success', 'failure', 'unknown'].map(o => (
                <FilterPill key={o} label={o} active={outcomeFilter === o} onClick={() => setOutcomeFilter(outcomeFilter === o ? '' : o)} onRemove={() => setOutcomeFilter('')} />
              ))}
            </div>

            {(sourceFilter.length > 0 || actorSearch || actionSearch || outcomeFilter) && (
              <button onClick={() => { setSourceFilter([]); setActorSearch(''); setActionSearch(''); setOutcomeFilter(''); }} className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors ml-auto">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-24rem)]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#0e0e16] z-10">
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="accent-emerald-500 w-3.5 h-3.5" onChange={(e) => {
                      if (e.target.checked) setSelectedRows(new Set(filtered.map(ev => ev.id)));
                      else setSelectedRows(new Set());
                    }} checked={selectedRows.size === filtered.length && filtered.length > 0} />
                  </th>
                  {['Timestamp', 'Source', 'Actor', 'Action', 'Resource', 'Outcome', 'Mapped'].map(h => (
                    <th key={h} className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-[0.08em] py-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const sc = sourceColors[ev.source] || { bg: 'rgba(255,255,255,0.05)', text: '#71717a', border: 'rgba(255,255,255,0.06)' };
                  const isSelected = selectedEvent?.id === ev.id;
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(isSelected ? null : ev)}
                      className={`border-b border-[rgba(255,255,255,0.03)] cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(16,185,129,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="accent-emerald-500 w-3.5 h-3.5" checked={selectedRows.has(ev.id)} onChange={() => toggleRow(ev.id)} />
                      </td>
                      <td className="py-3 pr-4 text-[12px] font-mono text-[#52525B] tabular-nums whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>{ev.source}</span>
                      </td>
                      <td className="py-3 pr-4 text-[12px] text-[#a1a1aa]">{ev.actor}</td>
                      <td className="py-3 pr-4 text-[12px] text-[#a1a1aa]">{ev.action}</td>
                      <td className="py-3 pr-4 text-[12px] text-[#71717a] truncate max-w-[180px]">{ev.resource}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          ev.outcome === 'success' ? 'bg-[rgba(16,185,129,0.1)] text-emerald-400 border-[rgba(16,185,129,0.15)]' :
                          ev.outcome === 'failure' ? 'bg-[rgba(244,63,94,0.1)] text-rose-400 border-[rgba(244,63,94,0.15)]' :
                          'bg-[rgba(255,255,255,0.05)] text-[#71717a] border-[rgba(255,255,255,0.06)]'
                        }`}>{ev.outcome}</span>
                      </td>
                      <td className="py-3">
                        {ev._mappedControls.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[rgba(59,130,246,0.1)] text-blue-400 border border-[rgba(59,130,246,0.15)]">
                            {ev._mappedControls.length}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-[13px] text-[#3f3f46]">No events match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEvent && (
        <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default Events;
