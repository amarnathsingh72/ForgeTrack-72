import React, { useState, useRef } from 'react';
import { Upload, FileText, Clock } from 'lucide-react';

const FRAMEWORKS = [
  { value: 'soc2', label: 'SOC 2 Type II' },
  { value: 'iso27001', label: 'ISO 27001' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'dpdp', label: 'DPDP' },
  { value: 'custom', label: 'Custom / Internal' },
];

import { usePolicy } from '../../lib/PolicyContext';

const StepUpload = () => {
  const { handleUpload, uploading } = usePolicy();
  const [file, setFile] = useState(null);
  const [framework, setFramework] = useState('soc2');
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are accepted.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File exceeds 20MB limit.');
      return;
    }
    setError('');
    setFile(f);
  };

  const onUploadClick = async () => {
    if (!file) return;
    await handleUpload(file, framework);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-[18px] font-bold text-white mb-1">Upload Policy Document</h2>
      <p className="text-[13px] text-[#52525B] mb-6">Upload a compliance policy to extract controls via AI.</p>

      {/* Drop zone */}
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFile} />
      <div
        onClick={() => inputRef.current?.click()}
        className={`w-full flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer group transition-all
          ${file ? 'border-emerald-500/50 bg-[rgba(16,185,129,0.03)]' : 'border-[rgba(255,255,255,0.1)] hover:border-emerald-500/40 hover:bg-[rgba(16,185,129,0.02)]'}`}
      >
        {file ? (
          <>
            <FileText size={28} className="text-emerald-400 mb-2" />
            <span className="text-[14px] font-semibold text-white">{file.name}</span>
            <span className="text-[12px] text-[#71717a] mt-1">{(file.size / 1024).toFixed(0)} KB — Click to change</span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.05)] group-hover:bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#71717a] group-hover:text-emerald-400 transition-colors mb-3">
              <Upload size={24} />
            </div>
            <span className="text-[14px] font-semibold text-white">Click to upload</span>
            <span className="text-[12px] text-[#71717a] mt-1">PDF or DOCX up to 20MB</span>
          </>
        )}
      </div>

      {/* Framework selector */}
      <div className="mt-5">
        <label className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider mb-2 block">Target Framework</label>
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="w-full h-10 rounded-lg bg-[#0e0e16] border border-[rgba(255,255,255,0.08)] text-white text-[13px] px-3 focus:outline-none focus:border-emerald-500/50"
        >
          {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {error && <p className="text-rose-400 text-[12px] mt-3">{error}</p>}

      <button
        onClick={onUploadClick}
        disabled={!file || uploading}
        className="w-full mt-6 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[13px] font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? <><Clock size={14} className="animate-spin" /> Uploading & Parsing...</> : 'Upload & Parse Document'}
      </button>
    </div>
  );
};

export default StepUpload;
