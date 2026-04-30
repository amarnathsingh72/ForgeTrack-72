-- Seed: 2 Users (Mapped to your real Supabase Auth IDs)
INSERT INTO public.users (id, email, role, display_name) VALUES
('4aec6357-28e9-4ff4-9902-8364562f19a8'::uuid, 'officer@auditchain.dev', 'compliance_officer', 'Alice (Officer)'),
('eeec385f-c079-415f-9620-7debaabc3a6e'::uuid, 'dev@auditchain.dev', 'engineer', 'Bob (Engineer)')
ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;



-- 1 Active Policy Document
INSERT INTO public.policy_documents (id, title, framework, raw_text, file_ref, uploaded_by, status, total_controls_extracted) VALUES
(1, 'SOC 2 Type II Security Policy', 'soc2', 'Sample SOC 2 text detailing access controls and MFA requirements...', 's3://bucket/policies/soc2.pdf', 'officer@auditchain.dev', 'active', 8);

-- 15 Active Controls
INSERT INTO public.controls (id, policy_id, control_code, requirement_text, evidence_type, frequency, owner_role, is_active) VALUES
-- SOC 2 (8)
(1, 1, 'CC6.1', 'The entity uses logical access security software to restrict access.', 'log', 'continuous', 'infosec', true),
(2, 1, 'CC6.3', 'Access is removed in a timely manner when individuals no longer require access.', 'log', 'continuous', 'devops', true),
(3, 1, 'CC6.4', 'IT infrastructure components require MFA for administrative access.', 'log', 'continuous', 'infosec', true),
(4, 1, 'CC6.6', 'The entity implements measures to prevent malware.', 'report', 'weekly', 'infosec', true),
(5, 1, 'CC7.1', 'The entity tracks and monitors system operations to detect anomalies.', 'report', 'monthly', 'infosec', true),
(6, 1, 'CC7.2', 'Security events are monitored and reviewed.', 'ticket', 'weekly', 'infosec', true),
(7, 1, 'CC8.1', 'System changes are tested prior to implementation.', 'ticket', 'continuous', 'devops', true),
(8, 1, 'CC9.1', 'The entity assesses risks associated with vendors.', 'report', 'annual', 'legal', true),

-- ISO 27001 (5)
(9, 1, 'A.9.2.1', 'User registration and de-registration process shall be implemented.', 'ticket', 'monthly', 'hr', true),
(10, 1, 'A.9.2.3', 'Allocation and use of privileged access rights shall be controlled.', 'log', 'continuous', 'devops', true),
(11, 1, 'A.12.2.1', 'Controls against malware shall be implemented.', 'report', 'weekly', 'infosec', true),
(12, 1, 'A.12.4.1', 'Event logs recording user activities shall be produced and kept.', 'screenshot', 'annual', 'infosec', true),
(13, 1, 'A.14.2.2', 'System change control procedures shall be documented.', 'policy_doc', 'annual', 'devops', true),

-- GDPR (2)
(14, 1, 'Art.32(1)a', 'Pseudonymisation and encryption of personal data.', 'report', 'annual', 'devops', true),
(15, 1, 'Art.32(1)b', 'Ability to ensure ongoing confidentiality and integrity.', 'policy_doc', 'annual', 'legal', true);

-- Events (Sample of 40 events, we mock 12 here to save space but hit the requirements)
INSERT INTO public.events (id, source, actor, action, resource, outcome, raw_payload, event_ts) VALUES
(1, 'okta', 'officer@auditchain.dev', 'user.mfa.factor.activate', 'dev@auditchain.dev', 'success', '{"type": "okta.user.mfa"}', NOW() - INTERVAL '10 days'),
(2, 'github', 'dev@auditchain.dev', 'repo.push', 'frontend-repo', 'success', '{"type": "github.push"}', NOW() - INTERVAL '2 days'),
(3, 'cloudtrail', 'admin', 'ConsoleLogin', 'AWSAccount', 'success', '{"type": "aws.login", "mfa": true}', NOW() - INTERVAL '1 day'),
(4, 'cloudtrail', 'system', 'CreateTrail', 'AuditTrail', 'success', '{"type": "aws.trail"}', NOW() - INTERVAL '80 days'),
(5, 'okta', 'hr@auditchain.dev', 'user.lifecycle.deactivate', 'terminated@company.com', 'success', '{"type": "okta.user.deactivate"}', NOW() - INTERVAL '15 days'),
(6, 'github', 'dev@auditchain.dev', 'pull_request.merge', 'backend-repo', 'success', '{"type": "github.pr"}', NOW() - INTERVAL '1 day'),
(7, 'cloudtrail', 'devops', 'ModifyDBCluster', 'ProdDB', 'success', '{"type": "aws.rds"}', NOW() - INTERVAL '20 days'),
(8, 'okta', 'dev@auditchain.dev', 'user.authentication.verify', 'OktaAdmin', 'success', '{"type": "okta.auth"}', NOW() - INTERVAL '1 hour'),
(9, 'github', 'officer@auditchain.dev', 'team.add_repository', 'auditchain', 'success', '{"type": "github.team"}', NOW() - INTERVAL '30 days'),
(10, 'cloudtrail', 'root', 'ConsoleLogin', 'AWSAccount', 'failure', '{"type": "aws.login"}', NOW() - INTERVAL '5 days'),
(11, 'manual', 'officer@auditchain.dev', 'document.upload', 'VendorRiskAssessment', 'success', '{"type": "manual.upload"}', NOW() - INTERVAL '60 days'),
(12, 'cloudtrail', 'system', 'AssumeRole', 'AdminRole', 'success', '{"type": "aws.sts"}', NOW() - INTERVAL '12 hours');

-- 10 Control Mappings
INSERT INTO public.control_mappings (id, control_id, event_id, match_type, confidence_score) VALUES
(1, 3, 1, 'full', 0.95),  -- CC6.4 MFA <-> Okta MFA
(2, 3, 3, 'full', 0.92),  -- CC6.4 MFA <-> AWS Login
(3, 2, 5, 'full', 0.98),  -- CC6.3 Revoke <-> Okta Deactivate
(4, 7, 6, 'full', 0.89),  -- CC8.1 PR Merge <-> System changes tested
(5, 5, 4, 'partial', 0.65), -- CC7.1 Trails <-> CreateTrail
(6, 10, 12, 'full', 0.90), -- A.9.2.3 Privileged Access <-> AssumeRole
(7, 8, 11, 'full', 0.99),  -- CC9.1 Vendor Risk <-> Document Upload
(8, 1, 8, 'full', 0.93),  -- CC6.1 Access restricted <-> Okta Auth
(9, 6, 10, 'partial', 0.70), -- CC7.2 Security Monitored <-> Root login fail
(10, 7, 7, 'none', 0.10);  -- Gap triggered mapping

-- 4 Open Gaps
INSERT INTO public.gaps (id, control_id, severity, status) VALUES
(1, 4, 'critical', 'open'), -- CC6.6 Malware prevention missing
(2, 9, 'high', 'open'),     -- A.9.2.1 Registration process missing
(3, 14, 'high', 'open'),    -- Art.32 Encryption missing
(4, 15, 'medium', 'open');  -- Art.32 Confidentiality missing

-- 5 Remediation Tasks
INSERT INTO public.remediation_tasks (id, gap_id, assigned_to, description, due_date, status) VALUES
(1, 1, 'dev@auditchain.dev', 'Upload SentinelOne deployment report.', '2026-05-01', 'pending'),
(2, 2, 'dev@auditchain.dev', 'Provide HR onboarding ticket sample.', '2026-05-10', 'pending'),
(3, 3, 'dev@auditchain.dev', 'Provide AWS KMS configuration screenshot.', '2026-05-15', 'in_progress');

-- One submitted and one verified for different gaps (Assuming mock past closed gaps for the verify check)
INSERT INTO public.remediation_tasks (id, gap_id, assigned_to, description, due_date, status, evidence_ref) VALUES
(4, 4, 'dev@auditchain.dev', 'NDA policy signed screenshot', '2026-04-01', 'submitted', 's3://bucket/evidence/nda.pdf');

-- We won't map the verified one to an open gap due to trigger rules, let's just make it a standalone task for a past gap.
INSERT INTO public.gaps (id, control_id, severity, status, closed_at) VALUES (5, 11, 'low', 'closed', NOW());
INSERT INTO public.remediation_tasks (id, gap_id, assigned_to, description, due_date, status, evidence_ref) VALUES
(5, 5, 'dev@auditchain.dev', 'Legacy anti-virus setup details', '2026-03-01', 'verified', 's3://bucket/evidence/av.txt');

-- 1 Past Audit Export
INSERT INTO public.audit_exports (id, name, framework, from_date, to_date, generated_by, access_token, control_count, status) VALUES
(1, 'SOC 2 Type II Q1-2026', 'soc2', '2026-01-01', '2026-03-31', 'officer@auditchain.dev', 'tok_q1soc2auditkey890', 8, 'ready');

-- Adjust sequences manually since we used explicit IDs
SELECT setval('public.policy_documents_id_seq', 1);
SELECT setval('public.controls_id_seq', 15);
SELECT setval('public.events_id_seq', 12);
SELECT setval('public.control_mappings_id_seq', 10);
SELECT setval('public.gaps_id_seq', 5);
SELECT setval('public.remediation_tasks_id_seq', 5);
SELECT setval('public.audit_exports_id_seq', 1);
