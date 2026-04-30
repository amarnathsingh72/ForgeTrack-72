**PRODUCT SPEC SHEET**
**Auditchain**

Automated Compliance Audit Pipeline for SaaS Products

Date: April 2026

Version: 1.0

# **1. Product Overview**

## **1.1 Product Name & Description**

| Field | Detail |
| :---- | :---- |
| Product Name | Auditchain |
| One-line Description | An automated compliance audit pipeline that ingests system logs, access events, and policy documents to generate a live audit trail and gap report for SaaS products |
| Product Type | Internal platform / Web application |
| Version | 1.0 (MVP / Demo Build) |

## **1.2 Problem Statement**

SaaS companies pursuing SOC 2, ISO 27001, or GDPR compliance currently manage their audit evidence across disconnected systems: CloudTrail exports in S3, access logs in Okta, GitHub audit logs downloaded manually, and policy documents scattered across Confluence and Google Drive. This creates three specific problems:

* **Evidence is never current:** By the time an audit begins, evidence is already weeks or months stale. Compliance officers spend 6–12 weeks manually pulling exports from 8+ systems and collating them into spreadsheets before a single control can be assessed.

* **Gaps are discovered too late:** There is no mechanism to detect that a required control has no supporting evidence until an auditor asks for it. Companies learn about compliance gaps during the audit, not before it.

* **No single audit trail:** There is no system that answers basic questions like "Show me all evidence that MFA was enforced on admin accounts in the last 90 days" or "Which controls have zero events mapped to them this quarter" without manual cross-referencing.

## **1.3 Target User**

Primary user: The Compliance Officer or InfoSec Lead who needs to manage the compliance posture of the organization, review control coverage, assign remediation tasks to engineers, and produce audit-ready evidence packages for external auditors.

Secondary user: The Platform or DevOps Engineer who receives remediation tasks (e.g., "Enable MFA on all admin accounts," "Add logging to the payments service") and needs to mark them complete with evidence references.

External user: The External Auditor who requires read-only access to a time-bounded evidence portal with per-control evidence bundles and AI-drafted management responses. Auditors cannot view internal task boards, system configurations, or anything outside their assigned audit scope.

This requires three distinct roles: Compliance Officer (full access), Engineer (task-scoped access), and Auditor (read-only evidence portal). Authentication is required for all roles.

#

# **2. Core Features**

## **2.1 Feature List**

| \# | Feature | Priority | Description |
| :---- | :---- | :---- | :---- |
| F1 | Evidence Ingestion Engine | Must Have | Connect AWS CloudTrail, GitHub Audit Log, and Okta as live event sources. Normalize all incoming events into a canonical schema: {timestamp, actor, action, resource, outcome}. Schedule pulls every 15 minutes. Manual policy document upload (PDF/DOCX) also supported. |
| F2 | AI Policy Extraction Agent | Must Have | Upload a compliance policy document. An AI agent reads the document, segments it into individual clauses, extracts structured controls ({control\_id, requirement\_text, evidence\_type, frequency}), flags ambiguous clauses for human review, and activates the control library on confirmation. |
| F3 | Control Mapping Engine | Must Have | For each active control, match normalized events from the evidence store against the control's evidence criteria. Classify each mapping as full, partial, or none. Controls with no matched events for the required period are flagged as gaps. |
| F4 | Compliance Dashboard | Must Have | Show live framework coverage by control domain, gap count by severity, recent ingestion activity, and a per-framework readiness score. Compliance officers see the full posture at a glance. |
| F5 | Gap Queue & Remediation Tasks | Must Have | Automatically generate a remediation task for every detected gap. Tasks include: the control requirement, evidence type needed, deadline (derived from framework audit window), and severity. Engineers are assigned tasks and can upload evidence on completion. |
| F6 | Auditor Export Portal | Should Have | Generate a time-bounded evidence package for a specified audit scope. Each control gets a bundle: matched events, control text, and an AI-drafted management response. Auditors access via a read-only portal link. |
| F7 | Authentication & Role-Based Access | Must Have | Login system with three roles: Compliance Officer (full CRUD access to all features), Engineer (read/update access to assigned tasks only), and Auditor (read-only access to exported evidence portal, scoped to their assigned audit). |

## **2.2 Feature F2 Deep Dive: AI Policy Extraction Agent**

**This is the most complex feature and requires detailed specification. The policy extraction is not a simple PDF parser. It uses an AI agent to read dense regulatory and compliance language and produce machine-readable structured controls that the mapping engine can act on.**

### **2.2.1 Why an AI Agent for Policy Extraction?**

Compliance policy documents are not standardized. A SOC 2 Type II policy document, an ISO 27001 Information Security Policy, and a company's internal Access Control Policy all describe the same class of requirements in entirely different formats. Specific variations include:

* Narrative prose: requirements written as paragraphs ("The organization shall ensure that all privileged access is reviewed on a quarterly basis") rather than structured rules

* Nested clause hierarchies: ISO 27001 uses clause numbers (e.g., A.9.2.3) while SOC 2 uses Trust Service Criteria codes (e.g., CC6.3) — the agent must detect and preserve these identifiers

* Implicit evidence types: the policy says "reviewed quarterly" but does not say what form that review takes — the agent must infer the evidence type (access review report, ticket, screenshot)

* Cross-references: clauses that say "as defined in section 4.2" — the agent must resolve these before structuring the control

* Overlapping requirements: the same underlying control requirement may appear in multiple sections with slightly different wording — the agent must deduplicate

A traditional regex or rule-based parser would either miss controls or produce duplicates. An AI agent can read the full document semantically, understand which clauses are requirements versus guidance, and extract a clean structured control library.

###

### **2.2.2 Policy Extraction Pipeline: Step by Step**

**Step 1: Document Upload**

* User drags and drops a PDF or DOCX file onto the upload area, or clicks to browse
* Client-side validation: file type must be .pdf or .docx, maximum size 20MB, file must not be empty
* File is uploaded to the server where pdfplumber (PDF) or python-docx (DOCX) extracts raw text
* Display: filename, detected page count, estimated clause count, file size
* User selects the target compliance framework from a dropdown: SOC 2, ISO 27001, GDPR, or Custom

**Step 2: AI Agent Clause Segmentation**

* The raw document text is sent to the AI agent in chunks of 8,000 tokens
* The agent receives a system prompt that instructs it to identify and number every distinct requirement clause in the document

*Agent system prompt concept:*

*"You are a compliance document analyst. Read the following policy document text. Identify every clause that contains a compliance requirement — a statement of what the organization must do, ensure, maintain, or review. Return a JSON array where each element is: {clause\_id, clause\_text, section\_reference, clause\_type: 'requirement' | 'guidance' | 'definition'}. Skip preamble, scope statements, and definition sections."*

* Agent returns a JSON array of segmented clauses
* The segmentation result is displayed as a numbered list for the user to review before proceeding

**Step 3: AI Agent Control Extraction**

* For each clause classified as 'requirement', the agent runs a second extraction pass
* The agent maps each requirement clause to a structured control record

*Control extraction prompt concept:*

*"You are a compliance control analyst. Given this requirement clause and the target framework (SOC 2 / ISO 27001 / GDPR), extract a structured control. Return JSON with: {control\_id (use framework code if present, else auto-generate), requirement\_text (one clear sentence), evidence\_type (what artifact proves compliance: 'log', 'report', 'ticket', 'screenshot', 'policy\_doc'), frequency ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'), owner\_role ('infosec', 'devops', 'hr', 'legal'), ambiguity\_flag (true if the requirement is unclear or underspecified)}."*

* Agent returns structured control JSON for each clause
* Controls with ambiguity\_flag: true are shown in a separate review queue before activation

**Step 4: Human Review & Override**

* All extracted controls are displayed in a review table: control ID, requirement text, evidence type, frequency, owner role, ambiguity flag
* Compliance officer can: edit any field, merge duplicate controls, delete irrelevant controls, or add missing controls manually
* Ambiguous controls are highlighted in amber — user must either resolve the ambiguity or explicitly accept it with a note
* The review table supports bulk accept ("Activate all clean controls") while leaving ambiguous ones for manual resolution

**Step 5: Control Library Activation**

* On confirmation, all approved controls are written to the Control table and immediately become active in the mapping engine
* Each newly activated control triggers an initial mapping scan across the last 90 days of ingested events
* Controls with no matching events in the past 90 days are immediately flagged as gaps and added to the gap queue
* Activation metadata is logged: document name, upload timestamp, total controls extracted, controls accepted, controls with ambiguity overrides, user who activated

# **3. Data Model**

The database schema consists of six primary tables and two operational tables. All tables use auto-incrementing integer IDs as primary keys unless otherwise noted.

## **3.1 PolicyDocuments Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique document identifier |
| title | TEXT | NOT NULL | Document title (e.g., "Access Control Policy v3.1") |
| framework | TEXT | NOT NULL | Target compliance framework: soc2 / iso27001 / gdpr / custom |
| raw\_text | TEXT | NOT NULL | Full extracted text from the uploaded file |
| file\_ref | TEXT | NOT NULL | Storage path to the original uploaded file |
| uploaded\_by | TEXT | NOT NULL | Email of the user who uploaded |
| uploaded\_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |
| parsed\_at | TIMESTAMP | NULLABLE | When AI extraction completed |
| status | TEXT | NOT NULL | pending / extracting / review / active / archived |
| total\_controls\_extracted | INTEGER | NULLABLE | Count of controls extracted by AI agent |

## **3.2 Controls Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique control identifier |
| policy\_id | INTEGER | FOREIGN KEY → PolicyDocuments(id), NOT NULL | Source policy document |
| control\_code | TEXT | NULLABLE | Framework code if present (e.g., CC6.3, A.9.2.3) |
| requirement\_text | TEXT | NOT NULL | One-sentence statement of what must be demonstrated |
| evidence\_type | TEXT | NOT NULL | log / report / ticket / screenshot / policy\_doc |
| frequency | TEXT | NOT NULL | continuous / daily / weekly / monthly / quarterly / annual |
| owner\_role | TEXT | NOT NULL | infosec / devops / hr / legal |
| ambiguity\_flag | BOOLEAN | DEFAULT false | True if AI flagged this control as unclear |
| ambiguity\_note | TEXT | NULLABLE | Human-entered resolution note if ambiguity was overridden |
| is\_active | BOOLEAN | DEFAULT true | Whether this control is currently being monitored |
| created\_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

## **3.3 Events Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique event identifier |
| source | TEXT | NOT NULL | cloudtrail / github / okta / manual |
| actor | TEXT | NOT NULL | User or service that performed the action |
| action | TEXT | NOT NULL | Normalized action label (e.g., "iam.user.mfa\_enabled") |
| resource | TEXT | NOT NULL | Resource affected (e.g., "iam/user/admin@company.com") |
| outcome | TEXT | NOT NULL | success / failure / unknown |
| raw\_payload | JSONB | NOT NULL | Original event payload from the source system |
| normalized\_at | TIMESTAMP | DEFAULT NOW() | When the event was ingested and normalized |
| event\_ts | TIMESTAMP | NOT NULL | When the event actually occurred in the source system |

## **3.4 ControlMappings Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique mapping record |
| control\_id | INTEGER | FOREIGN KEY → Controls(id), NOT NULL | The control being evidenced |
| event\_id | INTEGER | FOREIGN KEY → Events(id), NOT NULL | The event providing evidence |
| match\_type | TEXT | NOT NULL | full / partial / none |
| confidence\_score | DECIMAL(4,3) | NOT NULL | AI confidence score 0.000–1.000 |
| matched\_at | TIMESTAMP | DEFAULT NOW() | When the mapping was computed |

**UNIQUE CONSTRAINT: (control\_id, event\_id) — prevents duplicate mapping records.**

## **3.5 Gaps Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique gap record |
| control\_id | INTEGER | FOREIGN KEY → Controls(id), NOT NULL | The control with no sufficient evidence |
| detected\_at | TIMESTAMP | DEFAULT NOW() | When the gap was first identified |
| severity | TEXT | NOT NULL | critical / high / medium / low |
| status | TEXT | NOT NULL | open / in\_progress / closed |
| last\_evaluated\_at | TIMESTAMP | DEFAULT NOW() | When the gap was last re-evaluated |
| closed\_at | TIMESTAMP | NULLABLE | When the gap was resolved |

## **3.6 RemediationTasks Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique task record |
| gap\_id | INTEGER | FOREIGN KEY → Gaps(id), NOT NULL | The gap this task addresses |
| assigned\_to | TEXT | NOT NULL | Email of the engineer assigned |
| description | TEXT | NOT NULL | What the engineer must do and what evidence to upload |
| due\_date | DATE | NOT NULL | Deadline derived from framework audit window |
| evidence\_ref | TEXT | NULLABLE | URL or storage path to uploaded evidence |
| status | TEXT | NOT NULL | pending / in\_progress / submitted / verified |
| created\_at | TIMESTAMP | DEFAULT NOW() | When the task was generated |
| completed\_at | TIMESTAMP | NULLABLE | When the engineer submitted evidence |

## **3.7 AuditExports Table**

Tracks every evidence package generated for external auditors.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique export record |
| name | TEXT | NOT NULL | Export label (e.g., "SOC 2 Type II — Q1 2026") |
| framework | TEXT | NOT NULL | The compliance framework scope |
| from\_date | DATE | NOT NULL | Start of the audit evidence window |
| to\_date | DATE | NOT NULL | End of the audit evidence window |
| generated\_by | TEXT | NOT NULL | Email of the compliance officer who created it |
| generated\_at | TIMESTAMP | DEFAULT NOW() | Export creation timestamp |
| access\_token | TEXT | UNIQUE, NOT NULL | Secure token used for auditor portal access |
| control\_count | INTEGER | NOT NULL | Number of controls included in this export |
| status | TEXT | NOT NULL | generating / ready / expired |

## **3.8 Users Table (Authentication)**

Managed by Supabase Auth. Each user has a role that determines their access level.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY (Supabase auto) | Supabase Auth user ID |
| email | TEXT | UNIQUE, NOT NULL | Login email for all user types |
| role | TEXT | NOT NULL, CHECK (compliance\_officer/engineer/auditor) | Determines access: compliance\_officer = full CRUD, engineer = task-scoped, auditor = read-only export portal |
| display\_name | TEXT | NOT NULL | Shown in the UI |
| created\_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |

## **3.9 Row Level Security Policies**

These Supabase RLS policies enforce access control at the database level, not just the frontend.

* PolicyDocuments table: Compliance officers can SELECT/INSERT/UPDATE/DELETE. Engineers and auditors have NO access.

* Controls table: Compliance officers can SELECT/INSERT/UPDATE/DELETE. Engineers can SELECT active controls only. Auditors have NO direct access (they see controls only through the export).

* Events table: Compliance officers can SELECT/INSERT all rows. Engineers can SELECT only. Auditors have NO access.

* ControlMappings table: Compliance officers can SELECT/INSERT. Engineers can SELECT. Auditors have NO access.

* Gaps table: Compliance officers can SELECT/INSERT/UPDATE/DELETE. Engineers can SELECT gaps linked to their assigned tasks. Auditors have NO access.

* RemediationTasks table: Compliance officers can SELECT/INSERT/UPDATE/DELETE. Engineers can SELECT/UPDATE only rows WHERE assigned\_to = auth.user().email. Auditors have NO access.

* AuditExports table: Compliance officers can SELECT/INSERT. Auditors access export data through a separate token-gated API endpoint, not direct table access.

## **3.10 Entity Relationships**

* PolicyDocuments 1:N Controls (one policy document produces many controls)

* Controls 1:N ControlMappings (one control is evidenced by many events)

* Events 1:N ControlMappings (one event can provide evidence for multiple controls)

* Controls 1:1 Gap (a control either has a gap or does not — only one open gap per control at a time)

* Gaps 1:N RemediationTasks (one gap can have multiple remediation tasks assigned to different engineers)

* AuditExports contains a snapshot of Controls + ControlMappings for the specified date range

# **4. Tech Stack**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Frontend | React (Antigravity default) | Component-based, Antigravity generates React by default |
| Styling | Tailwind CSS | Utility-first, no custom CSS files needed, Antigravity handles this well |
| PDF Parsing | pdfplumber (Python, server-side) | Handles text-based PDFs reliably; python-docx for DOCX files |
| AI Agent | Claude API (claude-sonnet) | Superior at structured JSON output from dense regulatory prose; handles long documents well |
| Database | Supabase PostgreSQL | Built-in Auth, Row Level Security for role-based access, free tier sufficient for MVP |
| Authentication | Supabase Auth | Built-in email/password auth with role metadata, integrates with RLS |
| Authorization | Supabase Row Level Security (RLS) | Policies enforce engineer task-scoping and prevent auditor access to raw system data |
| Event Sources | AWS SDK (CloudTrail), GitHub REST API, Okta API | Official SDKs with OAuth/API key auth; all free to query for existing customers |
| Scheduler | APScheduler (Python) | Lightweight cron-style job runner; runs ingestion pulls every 15 minutes |
| State Management | React useState/useReducer | No external state library needed for this scope |
| Icons | Lucide React | Clean, consistent icon set available in Antigravity |

#

#

# **5. Screen Specifications**

## **5.1 Compliance Dashboard (Home Screen)**

**Purpose: At-a-glance view of overall compliance posture and critical gaps.**

Layout: Single page, above-the-fold primary information.

* Top bar: App name 'Auditchain' + navigation links (Dashboard, Policy Library, Event Log, Gap Queue, Remediation, Export)

* Hero stat strip: Controls Active | Evidence Coverage % | Open Gaps | Days to Next Audit

* Card 1 — Framework Coverage: per-framework radial progress ring showing % of controls with sufficient evidence. One ring per active framework (SOC 2, ISO 27001, GDPR).

* Card 2 — Critical Gaps: list of top 5 open gaps by severity, with control code, requirement snippet, days open, and a "View" button

* Card 3 — Ingestion Activity: last 5 ingestion runs per source (CloudTrail, GitHub, Okta), showing event count and last sync time

* Card 4 — Remediation Progress: tasks total, tasks in-progress, tasks submitted, tasks overdue — shown as a horizontal progress bar breakdown

## **5.2 Policy Library & Control Extractor**

**Purpose: Upload policy documents and manage the active control library.**

* Tab row: All Controls | By Framework | Pending Review

* Upload button top-right: opens the 5-step AI extraction flow (Upload → Segment → Extract → Review → Activate)

* Step indicator across top of extraction flow: 5 numbered circles with connecting lines

* Step 1 — Upload: drag-drop zone with file type and size limits. On drop: show filename, page count, detected framework hint, file size. Framework selector dropdown. "Next" to proceed.

* Step 2 — Segmentation Preview: numbered list of all clauses the agent identified as requirements vs. guidance. User can exclude clauses before proceeding. Summary: "X requirements, Y guidance clauses, Z definitions found." "Next."

* Step 3 — Control Extraction Review: full table of extracted controls — control code, requirement text, evidence type, frequency, owner role, ambiguity badge. User can edit any field inline. Ambiguous controls highlighted in amber. "Next" disabled until all ambiguous controls are resolved or overridden.

* Step 4 — Final Confirmation: count summary (X clean controls, Y with overridden ambiguity). "Activate X Controls" primary button. Warning: "Activating will begin gap detection immediately for all controls."

* Step 5 — Activation Result: success card showing controls activated, initial gaps detected, and a link to the Gap Queue.

* Control library table: sortable by framework, owner role, evidence type. Each row shows control code, requirement text (truncated), evidence type pill, frequency, owner role, and active status toggle.

## **5.3 Event Log Explorer**

**Purpose: Browse all ingested events and inspect raw evidence.**

* Filter bar: source dropdown (All / CloudTrail / GitHub / Okta), actor search, action search, date range picker

* Events table: timestamp, source pill, actor, action, resource, outcome pill (success/failure), "View Raw" button

* "View Raw" opens a JSON inspector panel on the right showing the full raw\_payload for that event

* Mapped controls panel: for each event row, a small badge shows how many controls this event is mapped to. Clicking opens a side panel listing those controls.

* Export selected: checkbox selection + "Export as CSV" for auditor evidence collection

* Ingestion health bar at top: last sync time per source with status indicator (live / stale / error)

## **5.4 Gap Queue**

**Purpose: Review all detected compliance gaps and their severity.**

* Filter tabs: All | Critical | High | Medium | Low | Closed

* Gap cards (list layout): each gap shows control code, requirement text, severity pill, days open, framework badge, owner role, and number of assigned remediation tasks

* Clicking a gap card expands to show: full control requirement, evidence type needed, last evaluation date, matched events (if partial match), and assigned tasks

* "Create Task" button per gap: opens a form to assign an engineer and set a due date

* "Re-evaluate" button per gap: triggers an immediate re-run of the mapping engine for that control

* Bulk actions: select multiple gaps → bulk assign to engineer / bulk set due date

## **5.5 Remediation Task Board**

**Purpose: Manage task assignments and track engineer progress toward gap resolution.**

* Kanban-style board: four columns — Pending | In Progress | Submitted | Verified

* Each task card: control code, gap severity pill, assigned engineer initials, due date (red if overdue), evidence upload indicator

* Compliance officer view: sees all tasks across all engineers

* Engineer view: sees only their assigned tasks (RLS-enforced)

* Task detail panel (click to open): full control requirement, due date, evidence instructions, "Upload Evidence" button (engineers only), verification form (compliance officer only)

* "Verify" action: compliance officer reviews uploaded evidence, marks task as Verified or sends back to In Progress with a comment

* Overdue indicator: tasks past their due date show a red "X days overdue" pill and trigger an email notification to the assigned engineer and the compliance officer

## **5.6 Auditor Export Portal**

**Purpose: Generate and share a time-bounded evidence package with external auditors.**

* Export builder form: export name, framework scope, date range (from / to), control selection (all active / specific domains only)

* "Generate Export" triggers an async job: fetches all control mappings within the date range, groups events per control, and AI-drafts a one-paragraph management response for each control

* Generated export list: name, framework, date range, control count, generated date, status (generating / ready / expired), share link button

* Auditor access portal (accessed via unique token URL, no login required): read-only view of the export
  * Framework summary card: total controls, fully evidenced %, partially evidenced %, no evidence %
  * Control-by-control accordion: each control shows requirement text, evidence type, frequency, and a timeline of matched events with actor, action, resource, and timestamp
  * AI management response: displayed per control, editable by compliance officer before sharing
  * Download button: exports full evidence bundle as a structured PDF

* Compliance officer can revoke or expire any export link at any time

## **5.7 Source Connections**

**Purpose: Configure and manage event source integrations.**

* Integration cards: one per supported source (AWS CloudTrail, GitHub, Okta)
* Each card shows: connection status pill (connected / disconnected / error), last sync time, events ingested in last 24h, and a configuration button

* Configuration panel (per source): API key or OAuth credentials input, scope selection (which log types to pull), ingestion schedule (15 min / hourly / daily), test connection button

* Connection test: fires a test pull and shows a sample of the last 5 events returned — compliance officer can verify the data looks correct before saving

* Ingestion log: per source, a table of the last 20 ingestion runs with timestamp, event count pulled, errors if any

## **5.8 Login Screen**

**Purpose: Authenticate users and route them to the correct view based on their role.**

* Clean centered login form: email + password + "Sign In" button

* On successful Compliance Officer login: redirect to Compliance Dashboard (full app with all features)

* On successful Engineer login: redirect to Remediation Task Board (task-scoped view only)

* On successful Auditor login via token URL: redirect directly to the Auditor Export Portal (no standard login required for auditors — they access via unique share link only)

* Error handling: "Invalid credentials" for wrong password, "Account not found" for unknown email

* "Forgot Password" link for all roles

##

##

## **5.9 Navigation: Role-Based**

**The navigation bar changes based on the logged-in user's role:**

Compliance Officer navigation: Dashboard | Policy Library | Event Log | Gap Queue | Remediation | Export | Logout

Engineer navigation: My Tasks | Logout

Auditor navigation: (accessed only via token URL — no standard nav; only the export portal is visible)

Compliance-officer-only routes (Policy Library, Event Log, Gap Queue, Export) are not just hidden — the routes themselves return 403 Forbidden if an engineer attempts to access them directly via URL.

# **6. Constraints & Business Rules**

**These are the non-negotiable rules that prevent the application from producing incorrect or inconsistent data. Every constraint listed here MUST be specified in prompts to the AI builder. If a constraint is not explicitly stated, the AI will make a silent decision that may violate it.**

## **6.1 Data Integrity Constraints**

1. **No duplicate control-event mappings:** A control cannot be mapped to the same event twice. Enforced at database level via UNIQUE(control\_id, event\_id) and at application level before insert.

2. **No duplicate gap per control:** Only one open gap record may exist per control at any time. If a gap is re-detected after being closed, a new gap record is created — the old one is not reopened.

3. **Events are immutable:** Once an event is ingested and normalized, its record cannot be modified. Corrections to incorrect events must be achieved by ingesting a correcting event, not editing existing ones. This preserves audit trail integrity.

4. **Control activation is logged:** Every time a control is activated, deactivated, or edited post-activation, the change is recorded in a ControlChangeLog table with the user, timestamp, and before/after values.

5. **Audit exports are point-in-time snapshots:** An export captures the state of controls and evidence at the moment of generation. Subsequent changes to the control library or newly ingested events do not retroactively update existing exports.

6. **Remediation task evidence is append-only:** Engineers can upload new evidence but cannot delete previously uploaded evidence. This prevents evidence tampering after a task has been submitted.

## **6.2 UI/UX Constraints**

1. **Mobile responsive:** All screens must be usable on a mobile device (minimum 375px width). The remediation task board must work on a phone so engineers can update task status from anywhere.

2. **Role-based access is mandatory at the database level:** Engineers must only see their own tasks. This is enforced via Supabase RLS, not just UI-level conditionals. Even if an engineer modifies the frontend code, the database will reject queries for other engineers' tasks.

3. **Compliance officer-only routes are protected:** Policy Library, Event Log, Gap Queue, and Export routes return 403 if an engineer attempts direct URL access.

4. **Confirmation before destructive or irreversible actions:** Any action that cannot be undone must show a confirmation dialog. This includes: deactivating a control, closing a gap manually, revoking an auditor export link, and deleting a policy document.

5. **Gap severity is system-determined, not user-set:** Gap severity is computed by the system based on the control's framework, evidence type, and days without sufficient evidence. Compliance officers cannot manually override severity without creating an audit log entry explaining the override.

## **6.3 Ingestion & Extraction Constraints**

1. **Maximum policy document size: 20MB.** Files larger than this are rejected with a clear error message.

2. **Accepted formats: .pdf and .docx only.** Other file types are rejected at the client-side validation step.

3. **AI control extraction must be user-confirmed:** The auto-extracted control library is always shown for human review before activation. The system never activates controls without explicit compliance officer confirmation of the extraction result.

4. **Ambiguous controls must be resolved before activation:** Controls flagged with ambiguity\_flag: true cannot be activated without a human-entered resolution note. The system will not silently activate ambiguous controls.

5. **Every policy extraction run is logged:** The PolicyDocuments table records every upload and extraction attempt, including the original file reference, total controls extracted, and user who activated. This creates a full provenance chain.

6. **Event ingestion failures are surfaced, not silent:** If any ingestion source returns an error (expired credentials, API rate limit, service outage), the Source Connections screen shows an error state and the compliance officer is notified. The system does not silently skip events.

# **7. Sample Policy Document Formats the Agent Must Handle**

These are the real policy document structures the AI agent will encounter. Format A is the primary format — the most common export from enterprise GRC tools and compliance consultants.

## **7.1 Format A: SOC 2 Trust Service Criteria Narrative (Primary Format)**

**This is the most common format. Controls are written as multi-paragraph prose organized by Trust Service Criteria code. Evidence requirements are implicit in the prose.**

Example clause:

*CC6.3 — The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on approved and documented access requests, and the access is removed in a timely manner when individuals no longer require such access.*

*The organization maintains a formal Access Control Policy that requires all access requests to be submitted via the IT service desk ticketing system and approved by the resource owner. Access provisioning is completed within 24 hours of approval. Quarterly access reviews are conducted for all privileged accounts. Terminated employees have system access revoked within 4 hours of HR notification.*

**What the AI agent must do with this format:**

* Detect that CC6.3 is a framework control code and preserve it
* Extract the multi-paragraph requirement as a single control requirement: "All privileged access must be reviewed quarterly and revoked within 4 hours of employee termination"
* Infer evidence types: the quarterly review implies an "access review report" artifact; the 4-hour revocation implies "log" evidence (Okta deprovisioning event with timestamp)
* Infer frequency: "quarterly" for the access review control; "continuous" for the termination revocation control
* Recognize these as two separate controls embedded in one clause and split them accordingly

## **7.2 Format B: ISO 27001 Annex A Table Format**

An alternative format where controls are presented as a structured table in the policy document.

| Control ID | Control Title | Control Statement | Implementation Notes |
| :---- | :---- | :---- | :---- |
| A.9.2.3 | Management of privileged access rights | Allocation and use of privileged access rights shall be restricted and controlled. | Review of privileged accounts conducted semi-annually. All privileged access requires MFA. |

*Simpler format: control ID and statement are explicit. Agent maps Control ID → control\_code, Control Statement → requirement\_text, Implementation Notes → additional context. Evidence type and frequency must still be inferred from the Implementation Notes.*

## **7.3 Format C: Real-World Edge Cases**

Variations the agent must handle gracefully:

* Scope statements that look like requirements: "This policy applies to all employees and contractors with access to production systems." The agent must not extract this as a control — it is a scope definition, not a requirement.

* Requirements with multiple evidence types: "The organization shall maintain an asset inventory (log) and conduct an annual risk assessment (report)." Agent must split into two controls with distinct evidence types.

* Conditional requirements: "Where cloud services are used, encryption must be enabled at rest and in transit." Agent must flag these as conditional and note the condition in the requirement text.

* Cross-references to other documents: "Access provisioning follows the procedure defined in HR-PROC-004." Agent must extract the control but flag that the evidence standard is defined in an external document not present in the upload.

* Framework-specific language mixed with custom requirements: some companies embed their own internal requirements alongside framework language. Agent must distinguish between standard framework controls (preserving the official control code) and custom controls (auto-generating a code in the format CUSTOM-XXX).

# **8. Acceptance Criteria**

The demo is considered complete when all of the following are true:

1. Dashboard loads with correct coverage percentages and gap counts from seed data

2. A SOC 2 policy document (Format A — prose narrative with CC codes) can be uploaded, segmented, extracted, reviewed, and activated successfully

3. AI agent correctly identifies CC6.3 as a control code, splits multi-part requirements into separate controls, and infers evidence type and frequency from prose

4. Ambiguous controls are flagged and cannot be activated without a resolution note

5. Control activation immediately triggers a gap scan and populates the Gap Queue with controls that have no matched events in the past 90 days

6. Event Log Explorer shows ingested events from at least one connected source with correct normalization (actor, action, resource, outcome)

7. Control mapping engine correctly matches a sample Okta event (user MFA enabled) to the corresponding MFA-enforcement control

8. A gap correctly generates a remediation task and the task appears in the engineer's task board

9. Engineer can log in and sees only their assigned tasks — no other engineer's tasks are visible

10. Engineer can upload evidence on a task and mark it as submitted — the compliance officer sees the update

11. Compliance officer can verify a submitted task, which closes the associated gap

12. An audit export can be generated for a specified date range and framework scope

13. The AI-drafted management response appears per control in the generated export

14. Auditor can access the export via the token URL without a standard login

15. Auditor cannot access the main app routes (Dashboard, Policy Library, etc.) via direct URL — returns 403 or redirect

16. Source Connections screen shows connection status, last sync time, and events-in-24h for each source

17. A failed ingestion run (simulated with invalid credentials) shows an error state on the Source Connections screen — no silent failure

18. All screens are responsive on a 375px mobile viewport

19. Compliance officer confirmation dialogs appear before: deactivating a control, closing a gap manually, and revoking an auditor export link

20. No console errors, no unhandled promise rejections, no blank screens on any user flow
