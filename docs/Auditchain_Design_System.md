# Auditchain — Design System

**Purpose:** This document defines the visual language for Auditchain. Antigravity must apply these tokens and patterns consistently across every screen. No deviations unless explicitly requested.

**Reference aesthetic:** Dark, clinical, data-dense compliance dashboard. Think "secure operations center meets enterprise audit room." Heavy contrast between oversized coverage metrics and micro-status labels. Glass-surface cards on a near-black canvas with a single emerald radial glow — the color of a system that is passing. Severity communicated through a strict four-color traffic light system. No decorative color. Everything means something.

---

## 1. Visual Direction

| Principle | Meaning |
|---|---|
| **Dark-first, always** | No light mode. Canvas is near-black. White-on-dark throughout. |
| **Coverage numbers dominate** | Compliance percentages and gap counts are the hero. They run 56–80px. Labels are 11–12px uppercase. |
| **Glass surfaces, not solid cards** | Cards are subtly lighter than the canvas with a thin 1px border at ~10% white opacity. Faint top-to-bottom gradient inside. |
| **Color is severity, not decoration** | Emerald = compliant/passing. Red = critical. Amber = warning. Blue = informational. Everything else is grayscale. |
| **One emerald glow per page** | Top-center radial gradient (emerald) above the main content communicates system health. Never repeat it. |
| **Borders are whispers** | Dividers and borders are 1px at 6–10% white opacity. No hard lines. |
| **Density with breathing room** | Compliance dashboards are information-dense. Cards get 24–32px padding; sections get 32–48px gaps. Never sacrifice either. |

---

## 2. Color Tokens

Use these as CSS custom properties. No hardcoded hex values in components.

```css
:root {
  /* Canvas & Surfaces */
  --bg-void: #07070B;           /* Outermost page background */
  --bg-canvas: #0B0B11;         /* Main app background */
  --bg-surface: #111118;        /* Default card background */
  --bg-surface-raised: #16161F; /* Hover state, active nav item, modals */
  --bg-surface-inset: #0E0E14;  /* Input fields, inset wells */

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);  /* Default card borders */
  --border-default: rgba(255, 255, 255, 0.10); /* Stronger dividers */
  --border-strong: rgba(255, 255, 255, 0.16);  /* Focus rings, active states */

  /* Text */
  --text-primary: #F5F5F7;   /* Headings, main content */
  --text-secondary: #8A8A94; /* Labels, secondary info */
  --text-tertiary: #52525B;  /* Placeholder, disabled, captions */
  --text-inverse: #0B0B11;   /* For buttons on light bg (rare) */

  /* Accent — the compliance glow */
  --accent-glow: #10B981;             /* Emerald — used for top radial gradient and focus */
  --accent-glow-soft: rgba(16, 185, 129, 0.12);

  /* Semantic — Compliant / Success */
  --success-fg: #10B981;
  --success-bg: rgba(16, 185, 129, 0.12);
  --success-border: rgba(16, 185, 129, 0.25);

  /* Semantic — Critical Gap / Danger */
  --danger-fg: #F43F5E;
  --danger-bg: rgba(244, 63, 94, 0.12);
  --danger-border: rgba(244, 63, 94, 0.25);

  /* Semantic — Warning / Partial */
  --warning-fg: #F59E0B;
  --warning-bg: rgba(245, 158, 11, 0.12);
  --warning-border: rgba(245, 158, 11, 0.25);

  /* Semantic — Info / Neutral highlight */
  --info-fg: #3B82F6;
  --info-bg: rgba(59, 130, 246, 0.12);
  --info-border: rgba(59, 130, 246, 0.25);
}
```

**Usage rules:**
- Page `<body>` → `--bg-void`
- Main app shell → `--bg-canvas`
- Cards → `--bg-surface` with 1px `--border-subtle`
- Card on hover or active state → `--bg-surface-raised`
- Inputs/textareas → `--bg-surface-inset` with `--border-default`
- Never layer more than 3 shades of dark in one view.

---

## 3. Typography

**Font families:**
```css
--font-display: 'Satoshi', 'Inter', system-ui, sans-serif; /* Headings, hero numbers */
--font-body: 'Inter', system-ui, sans-serif;               /* Everything else */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;       /* Control codes, event payloads, timestamps */
```

Load Satoshi from Fontshare (free): `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`

**Type scale:**

| Token | Size | Line Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| `text-display-hero` | 72px / 4.5rem | 1.0 | 700 | -0.03em | Page-level hero ("Compliance Coverage") |
| `text-display-lg` | 56px / 3.5rem | 1.05 | 700 | -0.025em | Section heroes ("87% Covered") |
| `text-display-md` | 40px / 2.5rem | 1.1 | 700 | -0.02em | Hero metrics (coverage %, gap counts) |
| `text-display-sm` | 32px / 2rem | 1.15 | 600 | -0.015em | Card main values |
| `text-h1` | 28px / 1.75rem | 1.2 | 600 | -0.01em | Page titles |
| `text-h2` | 22px / 1.375rem | 1.3 | 600 | -0.005em | Section titles |
| `text-h3` | 18px / 1.125rem | 1.4 | 600 | 0 | Card titles |
| `text-body-lg` | 16px / 1rem | 1.5 | 400 | 0 | Primary body copy |
| `text-body` | 14px / 0.875rem | 1.5 | 400 | 0 | Default body |
| `text-body-sm` | 13px / 0.8125rem | 1.45 | 400 | 0 | Secondary body |
| `text-caption` | 12px / 0.75rem | 1.4 | 500 | 0.01em | Captions, meta |
| `text-label` | 11px / 0.6875rem | 1.3 | 500 | 0.08em, UPPERCASE | Tiny section labels ("Controls", "Framework") |
| `text-micro` | 10px / 0.625rem | 1.2 | 600 | 0.06em, UPPERCASE | Severity badges, source tags |

**Rules:**
- Coverage percentages and gap counts always use `font-display` with `tabular-nums` font-feature for clean digit alignment.
- Control codes (CC6.3, A.9.2.3) and event timestamps always use `font-mono`.
- Uppercase labels always get letter-spacing (tracking). Never uppercase body text.
- Never use font-weight 400 on `text-display-*` — it looks anemic on dark.

---

## 4. Spacing Scale

4px base. Use only these values. No custom spacing.

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

**Common applications:**
- Card padding: `--space-6` (24px) on mobile, `--space-8` (32px) on desktop
- Gap between cards: `--space-6`
- Gap between page sections: `--space-12`
- Icon-to-label gap inside nav item: `--space-3`
- Button internal padding: `--space-3` vertical, `--space-5` horizontal

---

## 5. Border Radius

```
--radius-sm: 6px      /* Badges, small severity pills */
--radius-md: 10px     /* Buttons, inputs */
--radius-lg: 14px     /* Nav items, small cards */
--radius-xl: 18px     /* Default cards */
--radius-2xl: 24px    /* Hero cards, coverage ring containers */
--radius-full: 9999px /* Status pills, source indicator dots */
```

**Rules:**
- Default card = `--radius-xl` (18px)
- Buttons and inputs = `--radius-md` (10px)
- Severity pills and status indicators always fully rounded
- Never mix more than 2 radii in one component

---

## 6. Shadows, Glows & Effects

Shadows are subtle on dark UI. We use **glows** (colored blur) and **inner highlights** instead of drop shadows.

```css
/* Card lift — barely perceptible */
--shadow-card: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-subtle);

/* Raised card (modals, active states) */
--shadow-raised: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-default);

/* Focus ring */
--shadow-focus: 0 0 0 3px rgba(16, 185, 129, 0.25);

/* The page-level compliance glow (apply once, at top-center of main content) */
--glow-cosmic: radial-gradient(
  ellipse 600px 300px at 50% -100px,
  rgba(16, 185, 129, 0.14),
  rgba(16, 185, 129, 0) 70%
);

/* Card inner highlight — creates the glass look */
--card-gradient: linear-gradient(
  180deg,
  rgba(255, 255, 255, 0.02) 0%,
  rgba(255, 255, 255, 0) 50%
);
```

**Cards get three stacked layers:**
1. Base: `background: var(--bg-surface)`
2. Gradient overlay: `background-image: var(--card-gradient)`
3. Border: `box-shadow: var(--shadow-card)` (which includes the inset border)

**Background dot grid (subtle, optional, main canvas only):**
```css
background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
background-size: 24px 24px;
```

---

## 7. Layout System

**Breakpoints:**
- Mobile: 375px–767px
- Tablet: 768px–1023px
- Desktop: 1024px+

**Sidebar:**
- Width on desktop: 260px
- Collapses to icon-only (72px) on tablet
- Becomes a bottom nav or drawer on mobile

**Main content area:**
- Max width: 1440px, centered
- Horizontal padding: 24px (mobile), 32px (tablet), 48px (desktop)
- Top padding: 32px minimum to let the compliance glow breathe

**Grid:**
- 12-column on desktop, 24px gutter
- Stat cards: typically 4-up on desktop, 2-up on tablet, 1-up on mobile
- Dashboard cards: 2-up framework rings + 2-up status cards below

---

## 8. Component Specifications

### 8.1 Sidebar Navigation

**Structure:**
```
[Logo + App name] [Collapse chevron]
─────────────────────────────────────
[Welcome block: "Welcome Back, {name}" + last login]
─────────────────────────────────────
LABEL: Overview
 ▸ Dashboard (active)
LABEL: Compliance
 ▸ Policy Library
 ▸ Event Log
 ▸ Gap Queue
LABEL: Operations
 ▸ Remediation
 ▸ Export
LABEL: Settings
 ▸ Source Connections
 ▸ Logout
```

**Visual rules:**
- Background: `--bg-canvas` (same as main — no darker sidebar)
- Right edge: 1px `--border-subtle` divider
- Section labels: `text-label` style, `--text-tertiary` color, `--space-6` bottom margin
- Nav items: 44px height, `--space-4` horizontal padding, `--radius-lg`
- Icon size: 20px, stroke width 1.75px, color `--text-secondary`
- Label font: `text-body`, color `--text-secondary`
- **Active state:** background `--bg-surface-raised`, icon + label color `--text-primary`, 2px inset left border in `--accent-glow` (full height of item)
- Hover state: background `--bg-surface` (no transform, no shadow)
- Badges next to nav items (e.g., gap count "7"): `text-micro`, `--radius-full`, bg `--danger-bg`, text `--danger-fg` — the gap count is the most critical live indicator in the sidebar

### 8.2 Cards

**Default card:**
```css
.card {
  background: var(--bg-surface);
  background-image: var(--card-gradient);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: var(--space-8);
}
```

**Hero card (the big ones — framework coverage ring, critical gap summary):**
- `--radius-2xl` (24px)
- Padding: `--space-10` (40px)
- Often contains a radial progress ring or sparkline at the bottom

**Card header pattern:**
```
[Small label: "FRAMEWORK COVERAGE" or "CRITICAL GAPS"]  [optional icon]
[Large title: "SOC 2 Type II" style]
```
- Label uses `text-label`, color `--text-tertiary`, margin-bottom `--space-2`
- Title uses `text-h2` or `text-display-sm` depending on card importance

**Card with metric:**
```
[Framework icon circle]  [Label "SOC 2 TYPE II"]  [⋮ menu]
                         [Name "Trust Service Criteria"]

                         [Tiny caption "Coverage"]
                         [HUGE NUMBER "87%"]

                         [Trend pill "↑ 3% this week"]

                         [Progress bar — full width, 6px tall]
```

### 8.3 Buttons

**Primary button:**
```css
.btn-primary {
  background: var(--text-primary); /* white bg on dark */
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font: 500 14px var(--font-body);
  letter-spacing: -0.005em;
}
.btn-primary:hover { background: #E5E5E7; }
```

**Secondary button (ghost on dark):**
```css
.btn-secondary {
  background: var(--bg-surface-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 20px;
}
```

**Destructive button:** same shape as secondary but `color: var(--danger-fg)` and border `var(--danger-border)`.

**Icon button:** 40×40 square, `--radius-md`, background `--bg-surface-raised`, icon `--text-secondary`.

**Sizes:**
- Small: 32px height, 12px horizontal padding, 13px text
- Default: 40px height, 20px horizontal padding, 14px text
- Large: 48px height, 24px horizontal padding, 16px text

### 8.4 Inputs & Forms

```css
.input {
  background: var(--bg-surface-inset);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font: 400 14px var(--font-body);
  height: 44px;
}
.input:focus {
  border-color: var(--accent-glow);
  box-shadow: var(--shadow-focus);
  outline: none;
}
.input::placeholder { color: var(--text-tertiary); }
```

**Label above input:** `text-label`, color `--text-secondary`, margin-bottom `--space-2`.

**Helper text below:** `text-caption`, color `--text-tertiary`.

**Error state:** border `--danger-border`, helper text `--danger-fg`.

### 8.5 Severity & Status Pills

**Severity pill (used for gap severity, control risk level):**
```html
<span class="pill pill-danger">
  <Icon /> CRITICAL
</span>
```
```css
.pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font: 600 12px var(--font-body);
  font-variant-numeric: tabular-nums;
}
.pill-danger  { background: var(--danger-bg);  color: var(--danger-fg);  border: 1px solid var(--danger-border); }
.pill-warning { background: var(--warning-bg); color: var(--warning-fg); border: 1px solid var(--warning-border); }
.pill-success { background: var(--success-bg); color: var(--success-fg); border: 1px solid var(--success-border); }
.pill-info    { background: var(--info-bg);    color: var(--info-fg);    border: 1px solid var(--info-border); }
```

**Tag (metadata — framework label, evidence type, source):** smaller, less saturated — `text-micro`, `--bg-surface-raised` bg, `--text-secondary` color.

### 8.6 Tables

Tables are **minimal borders, heavy whitespace**.

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.table thead th {
  text-align: left;
  padding: 16px 20px;
  font: 500 12px var(--font-body);
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}
.table tbody td {
  padding: 18px 20px;
  font: 400 14px var(--font-body);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}
.table tbody tr:hover { background: var(--bg-surface-raised); }
```

**Sortable column headers:** include a tiny chevron icon (⇅) `--text-tertiary`, 12px, after the label.

**Control code column:** always `font-mono`, `--text-tertiary`, smaller font — it's metadata, not the main content.

**Status column values:** always a severity or status pill, never raw text.

### 8.7 Stat Strip (Coverage Strip)

The horizontal strip showing quick compliance stats.

**Structure:**
```
[Icon] [LABEL] [BIG NUMBER] | [Icon] [LABEL] [BIG NUMBER] | ...
```
- Items separated by 1px vertical dividers (`--border-subtle`)
- Each item gap: `--space-3` between icon/label/number
- Label: `text-caption`, color `--text-tertiary`
- Number: `text-body-lg`, weight 600, color `--text-primary`, `tabular-nums`
- Horizontally scrollable on mobile (no wrap)

For Auditchain, use this for: Controls Active | Coverage % | Open Gaps | Days to Audit.

### 8.8 Coverage & Gap Status Indicators

Beyond pills, coverage status is shown as a **colored dot or ring**:
- Fully evidenced: 8px circle, `--success-fg`, optional 16px glow halo
- Partially evidenced: 8px circle, `--warning-fg`
- No evidence / gap: 8px circle, `--danger-fg`
- No data yet: 8px circle, `--text-tertiary` at 40% opacity

**Framework coverage ring (radial progress):**
- Outer ring: 4px stroke, `--border-subtle`
- Progress arc: 4px stroke, `--success-fg` for ≥80%, `--warning-fg` for 50–79%, `--danger-fg` for <50%
- Center value: `text-display-md`, `tabular-nums`
- Label below: `text-label`, `--text-tertiary`

**Control mapping timeline:**
- Each event = a 6px dot on a horizontal timeline
- Dot color: `--success-fg` for full match, `--warning-fg` for partial match
- Timeline track: 1px `--border-subtle`
- Hover: dot expands to 10px and shows a tooltip with actor + action + timestamp

### 8.9 Sparklines & Charts

- Line width: 1.5px
- Stroke color: `--text-primary` at 80% opacity, or `--success-fg`/`--danger-fg` for trending charts
- Area fill under line: linear gradient from stroke color at 20% opacity to transparent
- No axis labels, no gridlines on sparklines
- Data point markers: 3px circles, only on hover or at end point

For full charts (e.g., gap count over time, events ingested per day): thin gridlines at `--border-subtle`, axis labels `text-caption` in `--text-tertiary`.

### 8.10 Step Indicator (Used in Policy Extraction Flow)

```
○─────○─────●─────○─────○
1     2     3     4     5
```
- Inactive step: `--bg-surface-raised` circle, `--text-tertiary` number
- Active step: `--accent-glow` circle background, white number, `text-body` weight 600 label below
- Completed step: `--success-bg` circle background, checkmark icon
- Connecting line: 1px `--border-default`, filled with `--success-fg` for completed segments
- Step labels: `text-caption`, `--text-secondary`, below each circle

### 8.11 Modal / Dialog

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(7, 7, 11, 0.7);
  backdrop-filter: blur(8px);
}
.modal {
  background: var(--bg-surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-raised);
  padding: var(--space-10);
  max-width: 560px;
  width: calc(100% - 32px);
}
```

**Confirmation dialogs** (required for destructive actions per spec):
- Title: `text-h2`
- Body: `text-body-lg` in `--text-secondary`
- Actions: destructive button right-aligned, "Cancel" secondary button to its left, `--space-3` gap

### 8.12 Toast Notifications

Top-right corner, stacked vertically.
- Width: 360px, padding `--space-4` `--space-5`
- Background: `--bg-surface-raised`, border `--border-default`, `--radius-lg`
- Leading icon (20px): green check for success, red X for error, amber triangle for warning
- Title: `text-body`, weight 600
- Body: `text-body-sm`, `--text-secondary`
- Auto-dismiss after 4s. Dismissable via X button (icon button style).

---

## 9. Iconography

- **Library:** Lucide React (already in spec tech stack)
- **Default size:** 20px (24px for section headers, 16px for inline with text)
- **Stroke width:** 1.75px uniformly
- **Color:** `--text-secondary` by default; `--text-primary` on active/hover; semantic colors for status
- Never use filled icons. Outlined only.

**Icon mapping for Auditchain nav:**
- Dashboard → `LayoutDashboard`
- Policy Library → `FileText`
- Event Log → `Activity`
- Gap Queue → `AlertTriangle`
- Remediation → `Wrench`
- Export → `Share2`
- Source Connections → `Plug`
- My Tasks (engineer) → `CheckSquare`
- Settings → `Settings`
- Logout → `LogOut`

**Icon mapping for data types:**
- Control → `Shield`
- Gap → `AlertOctagon`
- Event → `Zap`
- Evidence → `Paperclip`
- Framework → `BookOpen`
- Auditor → `Eye`
- Task → `ClipboardList`

---

## 10. Tailwind Config Snippet

Antigravity should extend the default Tailwind theme with this config so the tokens are directly usable as utility classes.

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        void: '#07070B',
        canvas: '#0B0B11',
        surface: {
          DEFAULT: '#111118',
          raised: '#16161F',
          inset: '#0E0E14',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        fg: {
          primary: '#F5F5F7',
          secondary: '#8A8A94',
          tertiary: '#52525B',
        },
        accent: {
          glow: '#10B981',
        },
        success: { DEFAULT: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
        danger:  { DEFAULT: '#F43F5E', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
        info:    { DEFAULT: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['4.5rem', { lineHeight: '1.0',  letterSpacing: '-0.03em',  fontWeight: '700' }],
        'display-lg':   ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md':   ['2.5rem', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'display-sm':   ['2rem',   { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'label':        ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        'micro':        ['0.625rem',  { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        'xl':  '1.125rem', // 18px
        '2xl': '1.5rem',   // 24px
      },
      backgroundImage: {
        'compliance-glow': 'radial-gradient(ellipse 600px 300px at 50% -100px, rgba(16,185,129,0.14), rgba(16,185,129,0) 70%)',
        'card-gradient':   'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 50%)',
        'dot-grid':        'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
};
```

---

## 11. Screen-Specific Application

Apply the system to each screen as follows. Each description assumes the common layout: sidebar on left, main content area with compliance glow at top-center.

### 11.1 Login Screen

- No sidebar. Full-screen centered form.
- Background: `bg-void` + compliance glow
- Card: `bg-surface`, `rounded-2xl`, max-width 440px, padding 48px
- Logo at top (32px), app name below in `text-h2`
- Single login form — no tab toggle (all roles use email + password; auditors access via token URL, not this screen)
- Inputs as specified in 8.4
- "Sign In" primary button, full width
- Error message area above button, `text-caption` color `--danger-fg`

### 11.2 Compliance Dashboard

- **Hero row:** "Compliance Coverage" in `text-display-hero`, "Last ingestion: {time} ago" below in `text-body-sm` `--text-secondary`
- **Stat strip (ticker-style):** Controls Active | Coverage % | Open Gaps | Days to Audit
- **Cards row 1 (3-up — one per active framework):** Framework coverage ring card — radial progress ring + big percentage + "X of Y controls evidenced" below + framework name + "View Details" link
- **Cards row 2 (2-up):**
  - Critical Gaps — list of top 5 gaps by severity with control code (mono), requirement snippet, days open, severity pill
  - Ingestion Activity — last sync per source with status dot, event count last 24h, "Reconnect" button if error
- All cards use default card styling. Primary metrics use `text-display-md` with `tabular-nums`.

### 11.3 Policy Library & Control Extractor

- Page title: `text-h1` "Policy Library"
- "Upload Policy Document" primary button top-right
- Tab bar: All Controls | By Framework | Pending Review — pill-style tabs, active tab has `bg-surface-raised` background
- Control library table: control code (mono), requirement text (truncated to 2 lines), evidence type pill, frequency pill, owner role tag, active toggle
- Upload flow:
  - Step indicator as specified in 8.10
  - Step 1: drag-drop zone (200px min height, dashed 1px `--border-default`, `--radius-2xl`)
  - Step 2: segmentation results as numbered list cards — each clause with a type badge (requirement / guidance / definition) and an exclude checkbox
  - Step 3: extraction review table — inline-editable cells, amber row highlight for ambiguous controls
  - Step 4: confirmation card with counts and "Activate" primary button
  - Step 5: success card with gap scan results and link to Gap Queue

### 11.4 Event Log Explorer

- Page title: `text-h1` "Event Log"
- Filter bar: source multi-select pills + actor text input + action text input + date range picker — all in a single row card
- Ingestion health strip: one status indicator per source (dot + label + last-sync time + count)
- Events table as specified in 8.6. Source shown as a pill. Outcome (success/failure) as a status pill.
- Right side panel (slides in on row click): raw JSON payload in a dark `--bg-surface-inset` code block with `font-mono`, "Mapped Controls" list below

### 11.5 Gap Queue

- Page title: `text-h1` "Gap Queue"
- Severity filter tabs: All | Critical | High | Medium | Low — with count badges per tab
- Gap list (card-list layout): each gap card has control code (mono, large), requirement text (2 lines), severity pill, framework tag, days-open badge (red if >30), assigned tasks count
- Expanded gap: slides open inline. Full requirement text. Evidence type needed. Last evaluated date. Matched events timeline (if partial). Assigned tasks mini-list.
- "Create Task" secondary button per gap. Opens a modal: engineer email input + due date picker.
- Empty state (all gaps resolved): large emerald checkmark icon + "All controls evidenced" in `text-display-sm` `--success-fg`

### 11.6 Remediation Task Board

- Page title: `text-h1` "Remediation"
- Kanban columns: Pending | In Progress | Submitted | Verified — each column has a count badge
- Task card: control code (mono, small), gap severity pill, engineer avatar initials circle, due date (red if overdue), evidence indicator (paperclip icon when evidence attached)
- Overdue card: `--danger-border` left accent (3px), "X days overdue" micro pill
- Task detail panel (right side panel): full control requirement, due date, evidence instructions in `text-body-sm`, "Upload Evidence" secondary button (engineer only), evidence file list, "Verify" / "Send Back" action buttons (compliance officer only) with comment input

### 11.7 Auditor Export Portal

- No sidebar. Full-screen portal layout. Header: Auditchain logo + export name + date range.
- Background: `bg-void` + compliance glow (same as main app — auditors see the same quality)
- Framework summary card (hero): total controls, fully evidenced %, partially evidenced %, no evidence % — shown as a horizontal stacked bar
- Control accordion list: each control row has control code (mono), requirement text, evidence type pill, frequency pill. Expanding shows:
  - Events timeline (dots on a horizontal track, as in 8.8)
  - Each event: actor, action, resource, outcome pill, timestamp (mono)
  - AI management response: displayed in a `font-serif` italic style inside a `--bg-surface-inset` block
- "Download PDF" primary button top-right — exports the full evidence bundle

### 11.8 Source Connections

- Page title: `text-h1` "Source Connections"
- Integration cards (3-up grid): AWS CloudTrail, GitHub Audit Log, Okta
- Each card: source logo placeholder icon, connection status pill (Connected / Disconnected / Error), last sync time, events pulled in last 24h, "Configure" secondary button
- Configuration panel (slides in from right): credential input fields, scope checkboxes, schedule selector (15 min / hourly / daily), "Test Connection" secondary button
- Test result inline: sample of last 5 events returned in a mini-table — actor, action, timestamp
- Ingestion log below the card: last 20 runs table — timestamp, event count, duration, status pill

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use `tabular-nums` on all coverage percentages and gap counts | Let numbers jitter by using proportional figures |
| Use emerald for compliance glow and success state only | Paint any element emerald just for brand decoration |
| Apply compliance glow once at top of main content | Repeat the glow in multiple places on one screen |
| Use severity pills (Critical / High / Medium / Low) for all gap and control status | Use raw colored text for severity |
| Keep borders at 6–16% white opacity | Use solid `#333` borders that read as lines |
| Pair huge coverage percentages with tiny framework labels | Use 20–28px everywhere — it reads as flat |
| Use control codes in `font-mono` | Render control codes in `font-body` — they look like prose |
| Let cards breathe with 24–32px padding | Cram controls list edge-to-edge |
| Use Satoshi for display, Inter for body, JetBrains Mono for codes | Introduce a fourth font family |
| Keep icons outlined, 1.75px stroke | Mix outlined and filled icons |
| Use `accent-glow` (emerald) only for focus rings, active states, and the page glow | Paint buttons or large areas green — it creates false "all clear" signals |
| Show gap count badge in sidebar using `--danger-fg` | Hide critical information in the navigation |

---

## 13. Implementation Checklist for Antigravity

Before shipping any screen, verify:

- [ ] Page background is `bg-void` or `bg-canvas`, not pure black
- [ ] Compliance radial glow applied once at top-center of main content (emerald, not indigo)
- [ ] All cards use `bg-surface` + `card-gradient` overlay + `shadow-card`
- [ ] All numeric values use `font-variant-numeric: tabular-nums`
- [ ] Control codes (CC6.3, A.9.2.3, CUSTOM-001) rendered in `font-mono`
- [ ] All status (gap severity, control coverage, task status, event outcome) uses pills, not raw colored text
- [ ] Display-size hero numbers (`text-display-md` or larger) appear on every primary screen
- [ ] Sidebar active item has the 2px left accent-glow border (emerald)
- [ ] Gap count badge in sidebar nav item uses `--danger-bg` / `--danger-fg`
- [ ] Icons are Lucide, outlined, 20px, 1.75 stroke
- [ ] Every destructive action has a confirmation modal (deactivate control, close gap manually, revoke export link)
- [ ] Mobile viewport (375px) renders without horizontal scroll
- [ ] Focus states use `--accent-glow` (emerald) 3px ring (keyboard accessibility)
- [ ] No `color: #fff`, no `background: #000` hardcoded — only tokens
- [ ] Step indicator shows correct active / completed / pending states in the policy extraction flow

---

**End of design system.** Reference this doc in every Antigravity prompt that builds or modifies UI for Auditchain.
