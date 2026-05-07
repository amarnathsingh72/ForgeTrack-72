import React from 'react';
import { CheckCircle2, BookOpen, Info, X } from 'lucide-react';

const typeColors = {
  requirement: { bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-400', border: 'border-[rgba(16,185,129,0.2)]' },
  guidance: { bg: 'rgba(59,130,246,0.1)', text: 'text-blue-400', border: 'border-[rgba(59,130,246,0.2)]' },
  definition: { bg: 'rgba(255,255,255,0.05)', text: 'text-[#a1a1aa]', border: 'border-[rgba(255,255,255,0.1)]' },
};

const StepSegment = ({ data, onNext, onExclude, loading }) => {
  const { clauses = [], requirements_count = 0, guidance_count = 0, definitions_count = 0 } = data || {};

  return (
    <div>
      <h2 className="text-[18px] font-bold text-white mb-1">Clause Segmentation</h2>
      <p className="text-[13px] text-[#52525B] mb-4">AI identified the following clauses. Uncheck any you want to exclude.</p>

      {/* Summary strip */}
      <div className="flex gap-3 mb-5">
        {[
          { label: 'Requirements', count: requirements_count, color: 'text-emerald-400' },
          { label: 'Guidance', count: guidance_count, color: 'text-blue-400' },
          { label: 'Definitions', count: definitions_count, color: 'text-[#a1a1aa]' },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-[#0e0e16] rounded-lg border border-[rgba(255,255,255,0.06)] p-3 text-center">
            <div className={`text-[20px] font-bold ${s.color} tabular-nums`}>{s.count}</div>
            <div className="text-[10px] text-[#52525B] uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Clause list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scroll">
        {clauses.map((clause, i) => {
          const tc = typeColors[clause.clause_type] || typeColors.definition;
          return (
            <div key={i} className={`bg-[#0e0e16] rounded-lg border border-[rgba(255,255,255,0.06)] p-4 ${clause._excluded ? 'opacity-40' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-white bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded">{clause.clause_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tc.text} ${tc.border}`} style={{ background: tc.bg }}>
                      {clause.clause_type}
                    </span>
                    {clause.section_reference && (
                      <span className="text-[10px] text-[#52525B]">§ {clause.section_reference}</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#a1a1aa] leading-relaxed line-clamp-3">{clause.clause_text}</p>
                </div>
                <button
                  onClick={() => onExclude(i)}
                  className="shrink-0 w-7 h-7 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(244,63,94,0.1)] border border-[rgba(255,255,255,0.06)] text-[#71717a] hover:text-rose-400 flex items-center justify-center transition-colors"
                  title={clause._excluded ? 'Include' : 'Exclude'}
                >
                  {clause._excluded ? <Info size={12} /> : <X size={12} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="w-full mt-6 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[13px] font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? 'Extracting Controls...' : `Extract Controls from ${requirements_count} Requirements →`}
      </button>
    </div>
  );
};

export default StepSegment;
