# SKILL: Build Auditchain

**Trigger this skill when:** the user asks to build, extend, or modify Auditchain — the automated compliance audit pipeline for SaaS products.

**Do NOT trigger this skill for:** generic React/Supabase tasks unrelated to Auditchain, or for other compliance tools that aren't this specific product.

---

## 0. How to Use This Skill

You are building Auditchain inside Antigravity. Two source-of-truth documents govern this build:

1. **`Auditchain_Spec_Sheet.md`** — defines *what* to build: features, data model, constraints, acceptance criteria. This is the **product spec**.
2. **`Auditchain_Design_System.md`** — defines *how it looks*: tokens, components, screen-level application. This is the **visual spec**.

This skill defines the *build process* — the order, checkpoints, prompting discipline, and anti-patterns. When these three documents conflict, spec > design system > skill. Flag the conflict before proceeding.

**Operating principles:**
- **Build in phases, never all at once.** Each phase has a validation gate. Do not start phase N+1 until phase N's gate passes.
- **Every prompt includes the relevant excerpt from spec + design system.** Do not rely on memory of "what we discussed."
- **Ship the database before the UI.** Schema is ground truth. UI that predates its schema is throwaway work.
- **The AI Policy Extraction Agent (F2) is built last among the core features.** It depends on a working Events table, working auth, and a working control write path. Do not attempt it early.
- **Three-role access is non-negotiable from day one.** Compliance officer, engineer, and auditor see different things. Do not build a single-role UI and "add roles later."
- **No lorem ipsum, no fake data without a seed script.** Every demo control, event, and gap must come from a deterministic seed file so the state is reproducible across sessions.

---

## 1. The Six Phases

| # | Phase | Gate Before Advancing |
|---|---|---|
| P0 | Foundation — project scaffold, env, tokens | App runs locally; design tokens and compliance glow visible on a test page |
| P1 | Database & Auth — schema, RLS, Supabase Auth | Can insert a test event; engineer cannot read another engineer's tasks; auditor cannot access raw events table |
| P2 | Shell — app layout, router, role-aware nav, login | Compliance officer, engineer, and auditor land on different routes after login |
| P3 | Core Compliance Officer Features — Dashboard, Event Log, Gap Queue, Remediation | Can view live coverage, see a gap, assign a task, verify evidence |
| P4 | AI Policy Extraction Agent (F2) — the hardest feature | Can upload a SOC 2 prose document, extract controls, resolve ambiguities, activate, and see gaps auto-generated |
| P5 | Auditor Export Portal + Source Connections | Can generate an export, share the token URL, and auditor sees evidence-only view with no access to main app |
| P6 | Polish & Acceptance — mobile, edge cases, full acceptance sweep | All 20 acceptance criteria pass |

Skipping phases causes rework. Do not skip.

---

## 2. Phase 0 — Foundation

**Preconditions:** Antigravity project opened, Supabase account available, Claude API key available.

### Actions

1. **Initialize React + Vite + Tailwind CSS project.** Name it `auditchain`.
2. **Install dependencies:**
   ```
   react-router-dom, @supabase/supabase-js,
   lucide-react, pdfplumber (server-side Python), python-docx
   ```
3. **Create `.env.local`** with:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_CLAUDE_API_KEY=...
   ```
4. **Paste the Tailwind config from Design System §10** into `tailwind.config.js`. Do not modify the color or font values — especially do not change `accent.glow` from emerald to any other color.
5. **Load Satoshi + Inter** in `index.html` via the Fontshare and Google Fonts links from Design System §3.
6. **Apply the compliance glow and base styles** in `src/index.css`:
   ```css
   body {
     background: var(--bg-void);
     color: var(--text-primary);
     font-family: var(--font-body);
   }
   .app-main {
     background-image: var(--glow-compliance);
     min-height: 100vh;
   }
   ```
7. **Create `src/lib/supabase.js`** with the client initialization.
8. **Create `src/lib/claude.js`** with the Claude API fetch wrapper — no logic yet, just the base fetch to `https://api.anthropic.com/v1/messages`. This is a stub.
9. **Build a throwaway test page** at `/dev-tokens` that renders: one card, one severity pill (all four: critical/high/medium/low), one button, one input, and one coverage ring (static SVG). Confirm they match the design system visually.

### Gate
- App runs on `npm run dev` without errors.
- `/dev-tokens` renders all five components and they match the Design System spec.
- Dark background visible, compliance glow (emerald) renders at top-center.
- Tailwind token classes like `bg-surface`, `text-fg-primary`, `text-accent-glow` resolve correctly.

### Common failures
- Satoshi not loading → check Fontshare link is in `<head>`, not in a CSS import.
- Tailwind classes not applying → check `content` paths in `tailwind.config.js` include `./src/**/*.{js,jsx}`.
- Environment variables undefined → Vite requires `VITE_` prefix, restart the dev server after editing `.env.local`.
- Emerald glow not visible → make sure the class applies `background-image`, not `background-color`. They do not compose together.

---

## 3. Phase 1 — Database & Auth

**Preconditions:** P0 gate passed. Supabase project created.

### Actions

1. **Run schema migration.** In Supabase SQL editor, execute the full schema from Spec §3.1–3.8. Eight tables: `policy_documents`, `controls`, `events`, `control_mappings`, `gaps`, `remediation_tasks`, `audit_exports`, `users`.

2. **Apply the UNIQUE constraints:**
   - `control_mappings(control_id, event_id)` UNIQUE — the most critical constraint; prevents the same event evidencing the same control twice
   - `audit_exports.access_token` UNIQUE
   - `users.email` UNIQUE

3. **Apply the CHECK constraints** (Spec §6.1):
   - Events are immutable after insert: enforce via a Postgres trigger that raises an exception on any UPDATE to the `events` table.
   - Only one open gap per control: enforce via a partial unique index — `UNIQUE (control_id) WHERE status = 'open'`.
   - Remediation task evidence is append-only: enforce at application layer (no DELETE on `evidence_ref` once set), plus a trigger that prevents clearing an existing `evidence_ref`.

4. **Enable RLS on every table.** Write the policies from Spec §3.9. The most important policies:
   ```sql
   -- Engineers see only their assigned tasks
   CREATE POLICY "engineer_tasks_own"
   ON remediation_tasks FOR SELECT
   USING (
     assigned_to = auth.jwt() ->> 'email'
     OR
     (SELECT role FROM public.users WHERE id = auth.uid()) = 'compliance_officer'
   );

   -- Auditors have zero access to raw events
   CREATE POLICY "no_auditor_events"
   ON events FOR ALL
   USING (
     (SELECT role FROM public.users WHERE id = auth.uid()) IN ('compliance_officer', 'engineer')
   );
   ```

5. **Write a seed script** at `supabase/seed.sql`:
   - 3 users: `officer@auditchain.dev` (compliance_officer), `dev@auditchain.dev` (engineer), and an auditor account accessed only via token URL (no standard login)
   - 1 active policy document (SOC 2 Type II prose format)
   - 15 active controls across 3 frameworks (SOC 2: 8 controls, ISO 27001: 5 controls, GDPR: 2 controls)
   - 40 ingested events across 3 sources (CloudTrail: 20, GitHub: 12, Okta: 8) spanning the last 90 days
   - 10 control mappings (7 full matches, 2 partial, 1 gap-triggering none)
   - 4 open gaps (1 critical, 2 high, 1 medium)
   - 5 remediation tasks (2 pending, 1 in_progress, 1 submitted, 1 verified)
   - 1 past audit export (status: ready) with a valid access_token

6. **Test all three access patterns manually** before building any UI:
   - `officer@auditchain.dev` → can SELECT all tables
   - `dev@auditchain.dev` → can SELECT `remediation_tasks` only where `assigned_to = 'dev@auditchain.dev'`, cannot SELECT `events` or `policy_documents`
   - Auditor token URL → no Supabase auth session, only the token-gated API endpoint returns data

### Gate
- Seed script runs cleanly with no constraint violations.
- Inserting a duplicate `(control_id, event_id)` pair into `control_mappings` fails at the DB level.
- Attempting to UPDATE any row in the `events` table fails with the immutability trigger.
- Inserting a second open gap for a control that already has one open fails with the partial unique index.
- Engineer user can only see their own remediation tasks when querying via Supabase client.

### Common failures
- Partial unique index syntax — `CREATE UNIQUE INDEX` not `ALTER TABLE ADD CONSTRAINT` for conditional uniqueness.
- RLS on `audit_exports` accidentally blocking the token-gated API endpoint — the endpoint should use the service role key, not the anon key, so RLS does not apply to it.
- Seed inserts arriving in wrong order: insert `policy_documents` → `controls` → `events` → `control_mappings` → `gaps` → `remediation_tasks` → `audit_exports`. Foreign keys will reject out-of-order inserts.
- Forgetting to enable RLS after creating tables — tables are unrestricted by default in Supabase. Always `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY` explicitly.

---

## 4. Phase 2 — Shell & Login

**Preconditions:** P1 gate passed.

### Actions

1. **Set up React Router** with these routes:
   - `/login` — public
   - `/` — redirects based on role
   - `/dashboard`, `/policies`, `/events`, `/gaps`, `/remediation`, `/export`, `/connections` — compliance officer only
   - `/tasks` — engineer only
   - `/audit/:token` — auditor portal, no auth required, token-gated
   - `/403` — forbidden page

2. **Build a `<RoleGuard>` wrapper** that reads the user's role from Supabase `public.users` and redirects accordingly. Direct URL access by an engineer to `/policies` must redirect to `/403`, not render a blank page or a loading spinner forever.

3. **Build the app shell:**
   - `<Sidebar>` (Design System §8.1) — role-aware, different nav items per role, gap count badge on the Gap Queue nav item using live data
   - `<TopBar>` — breadcrumb (e.g., "Compliance / Gap Queue"), user display name top-right, logout button
   - `<Main>` — the compliance-glow wrapper that all page content renders inside

4. **Build the Login screen** per Design System §11.1:
   - Single email + password form — no tab toggle (unlike ForgeTrack, all human users use email)
   - On login: query `public.users` for the user's role immediately after `supabase.auth.signInWithPassword()`
   - Compliance officer → redirect to `/dashboard`
   - Engineer → redirect to `/tasks`
   - Auditor accounts do not use the login screen — they access `/audit/:token` directly

5. **Build the 403 page** — clean message "You don't have access to this page" with a button routing to the appropriate home route based on the last known role in session.

### Gate
- Compliance officer login → `/dashboard`. Engineer login → `/tasks`.
- Engineer typing `/gaps` in the URL → `/403`.
- Sidebar shows compliance officer nav (Dashboard, Policy Library, Event Log, Gap Queue, Remediation, Export, Source Connections) for officer; shows only (My Tasks) for engineer.
- Gap count badge on the Gap Queue nav item shows the live count of open gaps from the seed data.
- Logout clears session and redirects to `/login`.
- Compliance glow, active nav item with emerald left accent, and sidebar border all match the design system.

### Common failures
- Race condition: `<RoleGuard>` reads role before `supabase.auth.getSession()` resolves. Always render a neutral loading state (not a redirect) while session is initializing.
- Using `localStorage` to store role — a determined engineer could change their role client-side. Always re-query Supabase on route change.
- Auditor token route `/audit/:token` accidentally requiring auth — this route must be completely outside the `<RoleGuard>` wrapper. Token validation happens server-side via the service role key.
- Gap count badge making a query on every render — memoize or lift the gap count to a global context so it only fetches once per session, updating on gap status changes.

---

## 5. Phase 3 — Core Compliance Officer Features

**Preconditions:** P2 gate passed.

Build these four screens in this order. Each is independently testable before moving to the next.

### 5.1 Compliance Dashboard (`/dashboard`)

Follow Design System §11.2. Build in this sub-order: stat strip → framework coverage cards → critical gaps card → ingestion activity → remediation progress.

- **Hero:** "Compliance Coverage" in `text-display-hero`, last ingestion timestamp in `text-body-sm` `--text-secondary`
- **Stat strip:** Controls Active | Coverage % | Open Gaps | Days to Next Audit — all live queries, `tabular-nums`
- **Framework coverage cards (3-up):** one per active framework. Each card: radial SVG progress ring, coverage %, "X of Y controls evidenced", framework name, trend pill vs last week. Ring color: emerald ≥80%, amber 50–79%, red <50%.
- **Critical gaps card:** top 5 open gaps ordered by severity. Each item: control code (mono), requirement snippet (2 lines max), days open badge (red if >30), severity pill, "View" link to `/gaps`.
- **Ingestion activity card:** per-source last sync time + status dot (green=live, amber=stale >1hr, red=error) + events count last 24h.
- **Remediation progress card:** tasks total, in-progress, submitted, overdue — rendered as a horizontal stacked bar.

**Query discipline:** every card fetches its own data independently with its own loading skeleton. Never a single monolithic query in the parent component.

### 5.2 Event Log Explorer (`/events`)

Follow Design System §11.4.

- Ingestion health strip at top: one indicator per source with status dot, last sync time, 24h event count.
- Filter bar: source multi-select pills, actor text search, action text search, date range picker. All filters compose with AND logic.
- Events table: timestamp (mono), source pill, actor, action, resource, outcome pill (success/failure/unknown). Clicking a row opens a right-side panel.
- Right panel: raw `raw_payload` JSON in a `--bg-surface-inset` code block with `font-mono`. Below: "Mapped to X controls" with a list of those control codes.
- Checkbox + "Export as CSV" for selected rows.

### 5.3 Gap Queue (`/gaps`)

Follow Design System §11.5.

- Severity filter tabs: All | Critical | High | Medium | Low with live count badges.
- Gap cards in list layout. Each card: control code (mono, prominent), requirement text (2 lines), severity pill, framework tag, days open, number of tasks badge.
- Click to expand inline: full requirement text, evidence type needed, last evaluation date, partial match event timeline if `match_type = 'partial'`.
- "Create Task" button per gap: opens a modal — engineer email input, due date picker. Writes to `remediation_tasks`.
- "Re-evaluate" button: triggers an immediate mapping re-run for that control. Shows a loading state on the card; updates the gap status on completion.
- Bulk: checkbox selection → bulk assign engineer, bulk set due date.
- Empty state when all gaps are resolved: large emerald checkmark + "All controls evidenced" in `text-display-sm`.

### 5.4 Remediation Task Board (`/remediation`)

Follow Design System §11.6.

- Kanban: four columns — Pending | In Progress | Submitted | Verified. Column headers show live count.
- Task card: control code (mono, small), gap severity pill, assigned engineer initials circle, due date (red pill if overdue), paperclip icon if evidence attached.
- Overdue card: 3px `--danger-border` left accent, "X days overdue" micro pill. A real email notification would fire (simulate with a console.log for demo).
- Click → right-side detail panel: full control requirement, evidence instructions, due date. If engineer: "Upload Evidence" button + file input. If compliance officer: "Verify" button + "Send Back" button with a comment field.
- Verify action: marks task as `verified`, closes the parent gap (sets `status = 'closed'`, `closed_at = now()`), re-computes framework coverage in the dashboard.

### Gate
- Dashboard stat strip shows correct live counts from seed data — verify by checking raw DB values.
- Click "View" on a critical gap from the dashboard → lands on `/gaps` with that gap expanded.
- Create a task from the gap queue → card immediately appears in the Pending column of the remediation board.
- Mark a task as verified → parent gap status updates to `closed` → dashboard coverage % updates without a hard reload.
- Filter the event log by source "okta" → only Okta events appear.

### Common failures
- Framework coverage % calculated incorrectly — correct formula: `count(controls where at least one full or partial mapping exists in last 90 days) / count(all active controls for that framework) * 100`. Do not count controls with zero mappings as partial.
- Gap closing not updating dashboard — the coverage computation runs on the dashboard mount, not reactively. Either use a Supabase real-time subscription on the `gaps` table or force a re-fetch on navigation back to dashboard.
- Kanban columns using `position: fixed` widths that break at tablet — use CSS grid with `auto-fill` columns, minimum 240px.
- "Re-evaluate" gap triggering a Claude API call directly from the browser — never put the Claude API key in frontend code. The re-evaluation must call a backend endpoint (FastAPI route or Supabase edge function) that calls Claude server-side.

---

## 6. Phase 4 — AI Policy Extraction Agent (F2)

**Preconditions:** P3 gate passed. All four compliance officer screens work. Controls table has the correct schema and RLS policies are live.

This is the most complex feature. Build it in five sub-steps — do not attempt it monolithically.

### 6.1 File Upload UI (Step 1 of the pipeline)

Follow Design System §11.3 Step 1.

- Drag-drop zone: dashed 1px `--border-default` border, `--radius-2xl`, 200px min height. Accepts `.pdf` and `.docx` only, max 20MB. Reject all other types with an inline error.
- On drop: client-side displays filename, detected page count, file size. No Supabase writes yet.
- Framework dropdown: SOC 2 | ISO 27001 | GDPR | Custom.
- "Next" → sends file to the server (FastAPI endpoint or Supabase edge function) for text extraction. Server uses `pdfplumber` (PDF) or `python-docx` (DOCX), returns raw text. Store in component state.
- Step indicator advances to Step 2.

### 6.2 AI Clause Segmentation (Step 2 of the pipeline)

Once raw text arrives, call Claude API (server-side, never from the browser):

**Claude system prompt concept:**
```
You are a compliance document analyst. Read the following policy document text.
Identify every clause that contains a compliance requirement — a statement of
what the organization must do, ensure, maintain, or review. Return a JSON array
where each element is:
{
  "clause_id": "integer starting from 1",
  "clause_text": "exact text of the clause",
  "section_reference": "section number or heading if present, else null",
  "clause_type": "requirement" | "guidance" | "definition"
}
Skip preamble, scope statements, and definition sections.
Return only the JSON array. No preamble, no markdown fences.
```

- Claude returns a JSON array of clauses.
- Render as a numbered list: each clause with its type badge, an exclude checkbox, and the section reference in mono.
- Summary line: "X requirements, Y guidance clauses, Z definitions found."
- "Next" — only requirement-type clauses (with exclude unchecked) proceed to Step 3.

### 6.3 AI Control Extraction (Step 3 of the pipeline)

For each remaining requirement clause, call Claude (batched — send all clauses in one call, not one call per clause):

**Claude extraction prompt concept:**
```
You are a compliance control analyst. Given these requirement clauses and the
target framework, extract a structured control for each one. Return a JSON array
where each element is:
{
  "clause_id": "matches input clause_id",
  "control_code": "framework code if present (e.g. CC6.3), else auto-generate as CUSTOM-001",
  "requirement_text": "one clear, complete sentence stating what must be demonstrated",
  "evidence_type": "log" | "report" | "ticket" | "screenshot" | "policy_doc",
  "frequency": "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "annual",
  "owner_role": "infosec" | "devops" | "hr" | "legal",
  "ambiguity_flag": true | false,
  "ambiguity_reason": "one sentence explaining why, or null if not ambiguous",
  "split_from": "clause_id if this control was split from a multi-requirement clause, else null"
}
Return only the JSON array. No preamble, no markdown fences.
```

- Render as a full review table: control code (mono), requirement text (editable inline), evidence type dropdown, frequency dropdown, owner role dropdown, ambiguity badge.
- Ambiguous controls (amber row highlight) cannot be activated without a resolution note.
- "Next" is disabled until all ambiguous controls are either resolved or explicitly excluded.
- Allow: edit any field inline, merge two rows (combines requirement text), delete a row, add a missing row manually.

### 6.4 Confirmation + Activation (Steps 4 and 5)

- **Step 4 — Confirmation card:** count summary — X clean controls, Y with overridden ambiguity, Z excluded. "Activate X Controls" primary button. Warning text: "Activating will begin gap detection immediately."
- On activate:
  1. Write `policy_document` row to Supabase with `status = 'extracting'`.
  2. Write all approved controls to `controls` table with `is_active = true`.
  3. Run the mapping engine: for each new control, scan the last 90 days of `events` and write `control_mappings`.
  4. For controls with zero full or partial mappings → insert a `gaps` row with severity computed from framework + evidence_type + days_without_evidence.
  5. Update `policy_document.status = 'active'`.
- **Step 5 — Result card:** controls activated count, gaps detected count, link to Gap Queue.

**Never run Steps 3–5 from the browser.** All Claude calls, mapping scans, and DB writes happen in a FastAPI route or Supabase edge function. The browser only polls for status.

### Gate (Spec §8 acceptance criteria 1–5 must pass)
- Upload the SOC 2 Format A sample from Spec §7.1. Agent correctly detects CC6.3, splits the multi-requirement clause into two controls (quarterly access review + 4-hour termination revocation), and infers correct evidence types.
- Ambiguous controls are highlighted and "Activate" is blocked until resolved.
- Activation writes correct rows to `controls` and triggers gap detection immediately.
- Controls with no matching Okta/CloudTrail events in the last 90 days appear in the Gap Queue within 5 seconds of activation.
- The ISO 27001 table-format document (Spec §7.2) also imports correctly — control ID from the table maps to `control_code`.

### Common failures
- **Claude returns non-JSON** (explanation text before the array) → enforce `Content-Type: application/json` in the API call. Add response validation: if `JSON.parse()` throws, show "AI extraction failed — please retry or map controls manually." User can still proceed manually.
- **Multi-requirement clause not split** → the prompt must explicitly say "If a clause contains multiple distinct requirements, return them as separate items in the array." Add this to the system prompt.
- **Mapping engine marks empty evidence as a gap incorrectly** → a control with `frequency = 'annual'` needs only one matching event per year, not per 90 days. Build frequency-aware window logic into the mapping engine.
- **Running Claude from the browser** — the API key will be visible in devtools. This is a security hole. Move all Claude calls server-side immediately.
- **Activation runs synchronously blocking the UI** → activation must be async (show a progress indicator) because mapping 90 days of events against 15 controls can take 3–5 seconds.

---

## 7. Phase 5 — Auditor Export Portal + Source Connections

**Preconditions:** P4 gate passed.

### 7.1 Auditor Export Portal (`/export` for officer, `/audit/:token` for auditor)

**Officer side (`/export`):**
- Export builder form: export name, framework scope dropdown, date range picker (from / to), control scope (all active / specific domains via checkbox list).
- "Generate Export" → writes `audit_exports` row with `status = 'generating'`, triggers an async job.
- The job: fetches `controls` + `control_mappings` for the date range, groups events per control, calls Claude to draft a management response per control (server-side), updates `audit_exports.status = 'ready'`.
- Generated exports list: name, framework, date range, control count, generated date, status pill, copy-link button, revoke button (with confirmation dialog per Spec §6.2.4).

**Auditor side (`/audit/:token`):**
- No Supabase auth. The `access_token` is validated server-side against the `audit_exports` table. The server returns only the scoped export data.
- Layout: no sidebar. Auditchain header + export name + date range.
- Framework summary card: total controls, fully evidenced %, partially evidenced %, no evidence % — as a horizontal stacked bar.
- Control accordion list: each row has control code (mono), requirement text, evidence type pill, frequency pill. Expanding shows:
  - Event timeline: dots on a horizontal track, one dot per matched event, colored by match type.
  - Each event: actor, action (mono), resource, outcome pill, timestamp (mono).
  - AI management response in `--bg-surface-inset` block.
- "Download PDF" button — generates a structured PDF client-side (use `jsPDF` or equivalent).
- Direct access to `/dashboard`, `/gaps`, or any main app route by the auditor → redirect to the export portal or a neutral "Access denied" page.

### 7.2 Source Connections (`/connections`)

- Three integration cards: AWS CloudTrail, GitHub Audit Log, Okta.
- Each card: source icon placeholder, connection status pill, last sync time, events pulled last 24h, "Configure" button.
- Configuration panel (right-side panel on configure click): API key / OAuth credential input, scope checkboxes (which log types to ingest), ingestion schedule selector (15 min / hourly / daily), "Test Connection" button.
- Test connection: fires a live API call to the source, returns sample of last 5 events in a mini-table. If it fails, shows an error state with the reason (rate limit / bad credentials / service outage).
- Ingestion log below each card: last 20 runs — timestamp, event count, duration, status pill.
- **Failed ingestion run must be visible, never silent** (Spec §6.3.6): if a run returns an error, the card shows an error badge and the compliance officer sees it immediately.

### Gate
- Generate an export for SOC 2, last 90 days → status transitions generating → ready.
- Share the token URL → access in an incognito window → auditor sees the export portal with no access to any other route.
- Direct URL `/dashboard` in the auditor's incognito window → redirected, no app content visible.
- Revoke the export link → token URL no longer works.
- Configure a source connection with invalid credentials → error state on the card, logged in ingestion log.
- Simulate a failed ingestion run → error badge appears on the card immediately, not silently ignored.

### Common failures
- PDF download failing in the browser — `jsPDF` needs fonts loaded. Test the PDF output early; don't leave it to the last minute.
- Auditor token route re-using the Supabase anon key for data fetching — the anon key + RLS will block it. Use the service role key server-side to fetch export data, then pass only the scoped payload to the frontend.
- Source connection credentials stored in `localStorage` — credentials must go to the server (or Supabase Vault), never the browser.
- Ingestion status indicator not updating after a test — the status dot queries `ingestion_log` on mount only. Add a refetch after the test connection returns.

---

## 8. Phase 6 — Polish & Acceptance

**Preconditions:** P5 gate passed.

### Actions

1. **Walk through all 20 acceptance criteria in Spec §8.** Check each one off. Any failure = go back and fix before continuing.

2. **Mobile sweep at 375px:**
   - Sidebar → collapses to a bottom navigation bar or hamburger drawer.
   - All stat strips scroll horizontally inside a container; no wrapping.
   - Coverage ring cards stack to single column.
   - Hero display text scales down: use `clamp()` or responsive Tailwind (`text-4xl md:text-display-md lg:text-display-hero`).
   - Tables scroll horizontally, never break layout.
   - All touch targets ≥44×44px.

3. **Confirmation dialogs on all destructive actions** (Spec §6.2.4): deactivating a control, closing a gap manually, revoking an export link, deleting a policy document. Every dialog: title (what will happen), body (cannot be undone), Cancel (secondary button), Confirm (primary or destructive button).

4. **Empty states on every screen:**
   - Dashboard: no session today → "No ingestion sources connected yet" state.
   - Gap Queue: all gaps resolved → emerald checkmark + "All controls evidenced."
   - Event Log: no events matching filters → "No events match your filters" with a clear-filters link.
   - Remediation board: no tasks → "No tasks assigned" per column.
   - Auditor export portal: no controls with evidence → "No evidence recorded for this period."

5. **Loading skeletons (not spinners)** on every data-fetching component. Skeletons match the shape of the content — coverage ring skeleton is a grey circle, gap card skeleton is a rectangle with two lines.

6. **Keyboard navigation:** tab order is logical through the sidebar, filter bars, and table rows. Focus ring uses `--shadow-focus` (emerald 3px ring) per Design System. Escape closes all modals and right-side panels.

7. **Console clean:** zero errors, zero unhandled promise rejections, zero React key warnings. The Claude API should never surface raw error strings to the UI — catch all failures and show friendly messages.

### Final Gate — Ship Readiness Checklist

- [ ] All 20 acceptance criteria from Spec §8 verified
- [ ] Design system checklist from Design System §13 all checked
- [ ] Seeded demo data lets a fresh login immediately see a populated dashboard
- [ ] SOC 2 Format A prose document (Spec §7.1) imports end-to-end
- [ ] Compliance officer, engineer, and auditor each have a clean login → primary task flow with zero friction
- [ ] Works on a 375px mobile viewport for all three roles
- [ ] Auditor token URL tested in incognito — no main app routes accessible
- [ ] README documents: how to run locally, how to seed, demo accounts per role, how to revoke an export

---

## 9. Prompting Discipline

When the user asks you to do something, follow these patterns. If their prompt doesn't include what you need, ask once, concisely.

**Good prompt from user:**
> "Build Phase 3.3 — Gap Queue. Follow Spec §F3 and Design System §11.5. Don't build the export feature yet."

**Bad prompt from user:**
> "Make the compliance stuff work."

→ Respond by asking which phase and which screen, and point them at this skill file.

**When user says "just make it work":**
- Do not skip phases.
- Do not skip the database → RLS → UI order.
- If you must cut scope, cut *features* (e.g., skip the Source Connections screen for demo day), not *layers* (e.g., skipping RLS "temporarily" creates a permanent security hole).

---

## 10. Anti-Patterns (Do NOT Do These)

| Anti-pattern | Why it's wrong | What to do instead |
|---|---|---|
| Calling Claude API from the browser | API key exposed in devtools — a security breach | All Claude calls go through a FastAPI endpoint or Supabase edge function |
| Skipping RLS because "the UI hides it" | Any user with devtools can bypass the UI and query Supabase directly | RLS is the last line of defence, not an optional enhancement |
| Storing API credentials (CloudTrail, Okta, GitHub) in `localStorage` | Credentials are visible to any JavaScript on the page | Store credentials server-side only (Supabase Vault or encrypted env vars) |
| Building the control extraction UI before the schema is confirmed | Shape mismatch forces a rewrite on both sides | Schema first, always |
| Treating a control with `frequency = 'annual'` as a gap after 90 days | Wrong business logic — annual controls need one event per year, not per quarter | Build frequency-aware window logic in the mapping engine |
| Making audit exports mutable after generation | Corrupts the audit trail | Exports are point-in-time snapshots — write-once, read-many |
| Using `insert()` for control-event mappings without checking the unique constraint | Throws a 409 that surfaces as a raw error to the user | Use `upsert({ onConflict: 'control_id,event_id' })` or check existence first |
| Showing raw Supabase or Claude error strings in the UI | Leaks internals, looks unprofessional, can expose sensitive paths | Catch all errors, log to console, show a friendly message |
| Running the mapping engine synchronously on the main thread | Blocks the UI for several seconds on large event logs | Run mapping as a background job, poll for completion, show a progress indicator |
| Building F2 (policy extraction) without working ingestion and controls schema | Cannot test gap detection without events and controls in the DB | Build F2 in Phase 4, not earlier |
| Using hardcoded hex colors (`#10B981`, `#F43F5E`) | Breaks the design system | Use CSS variables / Tailwind tokens from Design System §10 |
| Marking emerald as a decorative color | Emerald means "passing" and "compliant" in this app — using it decoratively creates false signals | Use emerald only for: compliance glow, success states, active nav accent, focus rings |

---

## 11. Debugging Playbook

| Symptom | Likely cause | Fix |
|---|---|---|
| Engineer sees another engineer's tasks | RLS not enabled on `remediation_tasks`, or policy uses wrong field | `ALTER TABLE remediation_tasks ENABLE ROW LEVEL SECURITY` + verify policy filters by `assigned_to = auth.jwt() ->> 'email'` |
| Auditor token URL returns 403 | Server endpoint using anon key instead of service role key | The token-gated endpoint must use the service role key to bypass RLS |
| Claude returns text instead of JSON | Missing `Content-Type: application/json` or temperature too high | Set `temperature: 0` in the Claude call, add explicit JSON-only instruction in the system prompt |
| Control mapped as gap despite matching events existing | Mapping engine window logic wrong, or `match_type` threshold incorrect | Log the raw mapping query output, verify events fall within the frequency window for that control |
| Coverage % drops after new controls are activated | The coverage formula divides by the new total control count (correct), but the numerator still counts old mappings only | Mapping engine must run for new controls immediately on activation — verify the initial scan runs before the coverage query |
| Extraction review table shows all rows as ambiguous | Prompt not anchored — Claude defaulting to "flag everything" | Tighten the system prompt: "Only set ambiguity_flag to true if the requirement is genuinely unclear or contradictory. Standard compliance language is not ambiguous." |
| PDF download empty or corrupted | `jsPDF` missing font configuration | Load the jsPDF standard fonts before any `doc.text()` call; test PDF output in Phase 5, not Phase 6 |
| Ingestion error not visible on Source Connections | Failed run silently caught and swallowed | Never catch ingestion errors silently — always write the error to `ingestion_log` and set the card to error state |
| Mobile layout breaks at 375px | Fixed-width columns in the kanban or stat strip | Replace all fixed widths with `w-full`, `max-w-*`, and `overflow-x-auto` on horizontal scrolling containers |
| Focus ring invisible | `--shadow-focus` token not loaded or Tailwind `focus-visible` not applied | Verify `--shadow-focus: 0 0 0 3px rgba(16,185,129,0.25)` is in the CSS and applied via `focus-visible:ring` or `:focus-visible { box-shadow: var(--shadow-focus) }` |

---

## 12. What Success Looks Like

At the end of Phase 6:

1. A compliance officer can log in, see the live compliance posture across three frameworks, and identify the most critical gap in under 10 seconds.
2. A compliance officer can upload a raw SOC 2 policy PDF, walk through the extraction flow, activate controls, and watch gaps auto-populate in the Gap Queue — without writing a single rule manually.
3. An engineer can log in, see only their assigned remediation tasks, upload evidence, and mark a task submitted — from a 375px phone viewport.
4. A compliance officer can verify the engineer's evidence, close the gap, and watch the framework coverage percentage update on the dashboard.
5. An external auditor can access a time-bounded evidence portal via a token URL in incognito, see per-control evidence timelines and AI-drafted management responses, and download the full bundle as a PDF — without ever touching the main app.

If all five are true, the skill succeeded.

---

**End of skill.** Load alongside `Auditchain_Spec_Sheet.md` and `Auditchain_Design_System.md` in every Antigravity session that touches this codebase.
