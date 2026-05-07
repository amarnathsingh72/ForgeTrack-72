-- Migration: Add DPDP framework support
-- Run this in Supabase SQL Editor

-- Update the framework check constraint on policy_documents
ALTER TABLE public.policy_documents DROP CONSTRAINT IF EXISTS policy_documents_framework_check;
ALTER TABLE public.policy_documents ADD CONSTRAINT policy_documents_framework_check 
  CHECK (framework IN ('soc2', 'iso27001', 'gdpr', 'dpdp', 'custom'));
