# Auditchain — Master Progress Tracker

## Overall Status

| Phase | Name | Status | Gate |
|-------|------|--------|------|
| 0 | Foundation | ✅ Complete | ✅ |
| 1 | Database & Auth | ✅ Complete | ✅ |
| 2 | Shell & Login | ✅ Complete | ✅ |
| 3 | Core Officer Features | ✅ Complete | ✅ |
| 4 | AI Policy Pipeline | 🔲 Not Started | — |
| 5 | Engineer Task View | 🔲 Not Started | — |
| 6 | Auditor Portal & Export | 🔲 Not Started | — |

---

## 📁 Project Folder Structure

```
d:\CODING\AntiVibe\
│
├── docs/                              # Spec & design documents
│   ├── Auditchain_Skill_Build.md
│   ├── Auditchain_Spec_Sheet.md
│   └── Auditchain_Design_System.md
│
├── frontend/                          # React + Vite application
│   ├── .env.local                     # Supabase keys + Gemini key
│   ├── tailwind.config.js             # Design tokens
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx                   # Entry point
│       ├── App.jsx                    # Router config
│       ├── index.css                  # Global styles + CSS variables
│       ├── App.css                    # Vite defaults (unused)
│       │
│       ├── lib/                       # Shared utilities
│       │   ├── supabase.js            # Supabase client init
│       │   └── gemini.js              # Gemini API stub
│       │
│       ├── components/
│       │   └── layout/                # App shell components
│       │       ├── Shell.jsx          # Main layout wrapper
│       │       ├── Sidebar.jsx        # Collapsible sidebar + nav
│       │       ├── TopBar.jsx         # Breadcrumbs + user info
│       │       └── RoleGuard.jsx      # Auth + RBAC enforcement
│       │
│       └── pages/                     # Route pages
│           ├── Login.jsx              # ✅ Auth login form
│           ├── Forbidden.jsx          # ✅ /403 access denied
│           ├── DevTokens.jsx          # ✅ Design system sandbox
│           ├── Dashboard.jsx          # ✅ Compliance dashboard
│           ├── Events.jsx             # ✅ Event log explorer
│           ├── Gaps.jsx               # ✅ Gap queue + create task
│           ├── Remediation.jsx        # ✅ Kanban remediation board
│           └── Placeholders.jsx       # 🔲 Stubs for future pages
│
├── backend/                           # FastAPI (Phase 4)
│   └── main.py                        # Stub server
│
└── supabase/                          # Database layer
    ├── migrations/
    │   └── 20260425000000_initial_schema.sql   # 8-table schema + RLS
    ├── seed.sql                       # Mock data (15 controls, events, etc)
    └── fix_auth_users.sql             # Auth user bootstrap
```

---

## ✅ Phase 0 — Foundation

| Task | Status |
|------|--------|
| Vite + React project | ✅ |
| Hierarchical folders (`frontend/`, `backend/`, `supabase/`) | ✅ |
| Tailwind CSS v3 + design tokens | ✅ |
| Inter + JetBrains Mono fonts | ✅ |
| `/dev-tokens` design sandbox | ✅ |

---

## ✅ Phase 1 — Database & Auth

| Task | Status |
|------|--------|
| 8-table schema + FK + CHECK constraints | ✅ |
| Event immutability trigger | ✅ |
| Row Level Security (RLS) | ✅ |
| Seed data (15 controls, events, gaps) | ✅ |
| Supabase client (`lib/supabase.js`) | ✅ |
| Gemini stub (`lib/gemini.js`) | ✅ |
| Remote Supabase connected + seeded | ✅ |

---

## ✅ Phase 2 — Shell & Login

| Task | Status |
|------|--------|
| React Router with all routes | ✅ |
| `RoleGuard` — session + RBAC | ✅ |
| `Shell` — layout with `useOutletContext` | ✅ |
| `Sidebar` — collapsible, search, user card, gap badge | ✅ |
| `TopBar` — breadcrumbs, bell, avatar | ✅ |
| `Login.jsx` — email/password + redirect by role | ✅ |
| `Forbidden.jsx` — `/403` page | ✅ |
| Root `/` → redirects to `/login` | ✅ |

---

## ✅ Phase 3 — Core Officer Features (ALL DONE)

| Task | Status | File |
|------|--------|------|
| **Compliance Dashboard** | ✅ | `Dashboard.jsx` |
| **Event Log Explorer** | ✅ | `Events.jsx` |
| **Gap Queue** | ✅ | `Gaps.jsx` |
| **Remediation Board** | ✅ | `Remediation.jsx` |

### What Each Page Contains:

**Dashboard** (`/dashboard`)
- 4x stat cards (Controls Active, Coverage %, Open Gaps, Days to Audit)
- 3x framework coverage rings (SOC2, ISO27001, GDPR)
- Critical gaps list with severity pills
- Ingestion activity with live/stale/error dots
- Remediation stacked bar chart
- Recent events table — all live from Supabase

**Event Log** (`/events`)
- Ingestion health strip (4 sources)
- Filter bar (source pills, actor/action search, outcome filter)
- Selectable table with checkboxes
- Right-side detail panel with raw JSON payload
- CSV export for selected rows

**Gap Queue** (`/gaps`)
- Severity filter tabs (All/Critical/High/Medium/Low) with counts
- Expandable gap cards with control code, requirement, days-open
- Create Task modal (assign engineer + due date)
- Re-evaluate button per gap

**Remediation Board** (`/remediation`)
- 4-column kanban (Pending → In Progress → Submitted → Verified)
- Task cards with severity, assignee, due date
- One-click status advancement
- Overdue alerts with red glow
- Expandable card detail with evidence info

---

## 🔲 Phase 4 — AI Policy Pipeline (NEXT)

| Task | Status |
|------|--------|
| Policy Library (`/policies`) — upload + document list | 🔲 |
| PDF/DOCX parsing via FastAPI backend | 🔲 |
| Gemini API for control extraction | 🔲 |
| Ambiguity flag review UI | 🔲 |
| Source Connections (`/connections`) | 🔲 |

---

## 🔲 Phase 5 — Engineer Task View

| Task | Status |
|------|--------|
| My Tasks (`/tasks`) — kanban board | 🔲 |
| Evidence upload | 🔲 |
| Status updates | 🔲 |

---

## 🔲 Phase 6 — Auditor Portal & Export

| Task | Status |
|------|--------|
| Export page (`/export`) | ✅ |
| Auditor Portal (`/audit/:token`) | 🔲 |
| Read-only audit report | 🔲 |

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Officer | `officer@auditchain.dev` | `password321` |
| Engineer | `dev@auditchain.dev` | `password321` |
