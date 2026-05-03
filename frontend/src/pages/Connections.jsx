import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

const sources = [
  { id: 'github', name: 'GitHub Actions', type: 'CI/CD', status: 'connected', lastSync: '10 mins ago', logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
  { id: 'aws', name: 'AWS CloudTrail', type: 'Infrastructure', status: 'connected', lastSync: '1 hour ago', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' },
  { id: 'jira', name: 'Jira Software', type: 'Ticketing', status: 'error', lastSync: '2 days ago', errorMsg: 'API token expired', logo: 'https://cdn.iconscout.com/icon/free/png-256/free-jira-3628777-3029997.png' },
  { id: 'okta', name: 'Okta SSO', type: 'Identity', status: 'disconnected', lastSync: 'Never', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Okta_logo.svg/1200px-Okta_logo.svg.png' }
];

const SourceCard = ({ source }) => {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => setConnecting(false), 2000);
  };

  return (
    <div className="bg-[#0e0e16] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 hover:border-[rgba(255,255,255,0.1)] transition-all flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white p-2 flex items-center justify-center shrink-0">
            <img src={source.logo} alt={source.name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white">{source.name}</h3>
            <span className="text-[11px] text-[#71717a] uppercase tracking-wider">{source.type}</span>
          </div>
        </div>
        {source.status === 'connected' && <div className="bg-[rgba(16,185,129,0.1)] text-emerald-400 border border-[rgba(16,185,129,0.2)] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Active</div>}
        {source.status === 'error' && <div className="bg-[rgba(244,63,94,0.1)] text-rose-400 border border-[rgba(244,63,94,0.2)] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={10} /> Error</div>}
        {source.status === 'disconnected' && <div className="bg-[rgba(255,255,255,0.05)] text-[#71717a] border border-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Disconnected</div>}
      </div>

      <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.04)] space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#52525B]">Last Sync</span>
          <span className="text-[#a1a1aa] font-medium">{source.lastSync}</span>
        </div>
        
        {source.status === 'error' && (
          <div className="bg-[rgba(244,63,94,0.05)] border border-[rgba(244,63,94,0.1)] rounded-lg p-2 text-[11px] text-rose-400 flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{source.errorMsg}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {source.status === 'connected' ? (
            <>
              <button className="flex-1 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.06)] text-[11px] font-medium text-white transition-colors flex items-center justify-center gap-1.5">
                <RefreshCw size={12} /> Sync Now
              </button>
              <button className="h-8 w-8 rounded-lg bg-[rgba(244,63,94,0.05)] hover:bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.1)] text-rose-400 flex items-center justify-center transition-colors">
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect}
              disabled={connecting}
              className="w-full h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[11px] font-bold text-white transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {connecting ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
              {connecting ? 'Connecting...' : 'Configure Connection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Connections = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Source Connections</h1>
          <p className="text-[13px] text-[#52525B] mt-1">Manage API integrations that feed event logs into Auditchain</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[12px] font-medium text-white hover:bg-[rgba(255,255,255,0.08)] transition-all flex items-center gap-2">
          <ExternalLink size={14} /> API Documentation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sources.map(source => (
          <SourceCard key={source.id} source={source} />
        ))}
        
        {/* Add Custom Source Card */}
        <div className="bg-[rgba(255,255,255,0.02)] rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] transition-all flex flex-col items-center justify-center h-full min-h-[220px] cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] group-hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#71717a] group-hover:text-white transition-colors mb-3">
            <Plus size={20} />
          </div>
          <h3 className="text-[14px] font-semibold text-white">Add Custom Source</h3>
          <p className="text-[11px] text-[#52525B] text-center mt-1 px-6">Connect via generic Webhook or REST API</p>
        </div>
      </div>
    </div>
  );
};

export default Connections;
