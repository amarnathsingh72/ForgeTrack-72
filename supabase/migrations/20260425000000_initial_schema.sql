-- Clean up existing tables to avoid "already exists" errors
DROP TABLE IF EXISTS public.audit_exports CASCADE;
DROP TABLE IF EXISTS public.remediation_tasks CASCADE;
DROP TABLE IF EXISTS public.gaps CASCADE;
DROP TABLE IF EXISTS public.control_mappings CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.controls CASCADE;
DROP TABLE IF EXISTS public.policy_documents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table (Extensions to Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('compliance_officer', 'engineer', 'auditor')),
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. PolicyDocuments Table
CREATE TABLE public.policy_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  framework TEXT NOT NULL CHECK (framework IN ('soc2', 'iso27001', 'gdpr', 'custom')),
  raw_text TEXT NOT NULL,
  file_ref TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'extracting', 'review', 'active', 'archived')),
  total_controls_extracted INTEGER
);

ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- 3. Controls Table
CREATE TABLE public.controls (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  control_code TEXT,
  requirement_text TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('log', 'report', 'ticket', 'screenshot', 'policy_doc')),
  frequency TEXT NOT NULL CHECK (frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  owner_role TEXT NOT NULL CHECK (owner_role IN ('infosec', 'devops', 'hr', 'legal')),
  ambiguity_flag BOOLEAN DEFAULT false,
  ambiguity_note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

-- 4. Events Table
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('cloudtrail', 'github', 'okta', 'manual')),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'unknown')),
  raw_payload JSONB NOT NULL,
  normalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_ts TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Event immutability trigger
CREATE OR REPLACE FUNCTION prevent_event_updates()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Events are immutable and cannot be modified once ingested.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_immutability
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION prevent_event_updates();

-- 5. ControlMappings Table
CREATE TABLE public.control_mappings (
  id SERIAL PRIMARY KEY,
  control_id INTEGER NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('full', 'partial', 'none')),
  confidence_score DECIMAL(4,3) NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (control_id, event_id)
);

ALTER TABLE public.control_mappings ENABLE ROW LEVEL SECURITY;

-- 6. Gaps Table
CREATE TABLE public.gaps (
  id SERIAL PRIMARY KEY,
  control_id INTEGER NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')),
  last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.gaps ENABLE ROW LEVEL SECURITY;

-- Partial unique index to enforce only one open gap per control
CREATE UNIQUE INDEX open_gap_per_control_idx 
ON public.gaps (control_id) 
WHERE status = 'open';

-- 7. RemediationTasks Table
CREATE TABLE public.remediation_tasks (
  id SERIAL PRIMARY KEY,
  gap_id INTEGER NOT NULL REFERENCES public.gaps(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL, -- Email
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  evidence_ref TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted', 'verified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.remediation_tasks ENABLE ROW LEVEL SECURITY;

-- Trigger to prevent clearing existing evidence on task
CREATE OR REPLACE FUNCTION prevent_evidence_clearing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.evidence_ref IS NOT NULL AND NEW.evidence_ref IS NULL THEN
    RAISE EXCEPTION 'Cannot clear previously uploaded evidence.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_evidence_append_only
BEFORE UPDATE ON public.remediation_tasks
FOR EACH ROW EXECUTE FUNCTION prevent_evidence_clearing();

-- 8. AuditExports Table
CREATE TABLE public.audit_exports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_token TEXT UNIQUE NOT NULL,
  control_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('generating', 'ready', 'expired'))
);

ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-------------------------------------------------------------------------------

-- 1. Users table
CREATE POLICY "officer_users_all" ON public.users FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "own_user_select" ON public.users FOR SELECT
USING (id = auth.uid());

-- 2. PolicyDocuments
CREATE POLICY "officer_policies_all" ON public.policy_documents FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

-- 3. Controls
CREATE POLICY "officer_controls_all" ON public.controls FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "engineer_controls_select" ON public.controls FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'engineer' 
  AND is_active = true
);

-- 4. Events
CREATE POLICY "officer_events_insert_select" ON public.events FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "officer_events_insert" ON public.events FOR INSERT
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "engineer_events_select" ON public.events FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'engineer');
-- NOTE: Policy blocks auditors implicitly because they lack 'compliance_officer' or 'engineer' role

-- 5. ControlMappings
CREATE POLICY "officer_mappings_all" ON public.control_mappings FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "engineer_mappings_select" ON public.control_mappings FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'engineer');

-- 6. Gaps
CREATE POLICY "officer_gaps_all" ON public.gaps FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "engineer_tasks_gaps_select" ON public.gaps FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'engineer'
  AND id IN (SELECT gap_id FROM public.remediation_tasks WHERE assigned_to = auth.jwt() ->> 'email')
);

-- 7. RemediationTasks
CREATE POLICY "officer_tasks_all" ON public.remediation_tasks FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "engineer_tasks_own_select" ON public.remediation_tasks FOR SELECT
USING (assigned_to = auth.jwt() ->> 'email');

CREATE POLICY "engineer_tasks_own_update" ON public.remediation_tasks FOR UPDATE
USING (assigned_to = auth.jwt() ->> 'email')
WITH CHECK (assigned_to = auth.jwt() ->> 'email');

-- 8. AuditExports
CREATE POLICY "officer_exports_select_insert" ON public.audit_exports FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer');
-- Token gated api will use service role key so they bypass RLS.
