import React, { createContext, useContext, useState, useCallback } from 'react';
import { segmentPolicy, extractControls, activateControls } from './api';

const PolicyContext = createContext();

export const PolicyProvider = ({ children }) => {
  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [policyId, setPolicyId] = useState(null);
  const [segmentData, setSegmentData] = useState(null);
  const [extractedControls, setExtractedControls] = useState([]);
  const [activationResult, setActivationResult] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState('');

  // Track if a background process is active
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');

  const resetWizard = useCallback(() => {
    setWizardOpen(false);
    setStep(0);
    setPolicyId(null);
    setSegmentData(null);
    setExtractedControls([]);
    setActivationResult(null);
    setError('');
    setIsProcessing(false);
    setProcessingLabel('');
  }, []);

  const handleUpload = async (file, framework) => {
    setUploading(true);
    setError('');
    setIsProcessing(true);
    setProcessingLabel('Uploading & Parsing...');
    try {
      const { uploadPolicy } = await import('./api');
      const result = await uploadPolicy(file, framework, 'officer@auditchain.dev');
      handleUploaded(result);
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    } finally {
      setUploading(false);
    }
  };

  const handleUploaded = async (result) => {
    setPolicyId(result.policy_id);
    setUploading(false);
    setStep(1);
    
    // Auto-start segmentation
    setStepLoading(true);
    setIsProcessing(true);
    setProcessingLabel('Segmenting Policy...');
    try {
      const segResult = await segmentPolicy(result.policy_id);
      setSegmentData(segResult);
    } catch (err) { 
      setError(err.message); 
      setIsProcessing(false);
    } finally { 
      setStepLoading(false);
      // We don't set isProcessing(false) here because we want to show it's "ready for review" or just keep the indicator if needed
      // Actually, let's keep it true until the user finishes or if it's just "idle"
      setProcessingLabel('Ready for Review');
    }
  };

  const handleSegmentNext = async () => {
    setStepLoading(true);
    setError('');
    setIsProcessing(true);
    setProcessingLabel('Extracting Controls...');
    try {
      const activeClauses = (segmentData?.clauses || []).filter(c => !c._excluded);
      const result = await extractControls(policyId, activeClauses);
      setExtractedControls(result.controls || []);
      setStep(2);
      setProcessingLabel('Ready to Activate');
    } catch (err) { 
      setError(err.message); 
      setIsProcessing(false);
    } finally { 
      setStepLoading(false);
    }
  };

  const handleExcludeClause = (idx) => {
    setSegmentData(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.clauses = [...updated.clauses];
      updated.clauses[idx] = { ...updated.clauses[idx], _excluded: !updated.clauses[idx]._excluded };
      const reqs = updated.clauses.filter(c => c.clause_type === 'requirement' && !c._excluded);
      updated.requirements_count = reqs.length;
      return updated;
    });
  };

  const handleUpdateControl = (idx, field, value) => {
    setExtractedControls(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleActivate = async () => {
    setStepLoading(true);
    setError('');
    setIsProcessing(true);
    setProcessingLabel('Activating Controls...');
    try {
      const result = await activateControls(policyId, extractedControls);
      setActivationResult(result);
      setStep(3);
      setIsProcessing(false);
      setProcessingLabel('');
    } catch (err) { 
      setError(err.message); 
      setIsProcessing(false);
    } finally { 
      setStepLoading(false);
    }
  };

  const value = {
    wizardOpen, setWizardOpen,
    step, setStep,
    uploading, setUploading,
    policyId, setPolicyId,
    segmentData, setSegmentData,
    extractedControls, setExtractedControls,
    activationResult, setActivationResult,
    stepLoading, setStepLoading,
    error, setError,
    isProcessing, setIsProcessing,
    processingLabel,
    resetWizard,
    handleUpload,
    handleUploaded,
    handleSegmentNext,
    handleExcludeClause,
    handleUpdateControl,
    handleActivate
  };

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  );
};

export const usePolicy = () => {
  const context = useContext(PolicyContext);
  if (!context) {
    throw new Error('usePolicy must be used within a PolicyProvider');
  }
  return context;
};
