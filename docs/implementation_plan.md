# Auditchain Phase 2: Shell & Login

This plan outlines the architecture for Phase 2, establishing the application Shell, Routing, and Authentication flows according to the Auditchain Spec and Design System.

## User Review Required

> [!WARNING]
> This phase will implement **Supabase Auth**. Since you have already set up the project locally/remotely:
> 1. You will need to populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env.local`.
> 2. Ensure Email Auth is enabled in your Supabase Auth provider settings.
> 3. We will build a login form but won't have a sign-up form per spec (assuming accounts are pre-provisioned). Is that correct?

## Proposed Changes

### 1. Routing & Layout Infrastructure
- #### [MODIFY] `frontend/src/App.jsx`
  Define routing for all core paths: `/login`, `/dashboard`, `/events`, `/gaps`, `/remediation`, `/export`, `/connections`, `/tasks`, `/audit/:token`, and `/403`. 
- #### [NEW] `frontend/src/components/layout/RoleGuard.jsx`
  A higher-order component that checks user session, queries the `users` table for `role`, and enforces the spec:
  - Compliance officers land on `/dashboard` and have full access.
  - Engineers land on `/tasks` and are blocked (403) from officer areas.
  - Neutral loading state while fetching session.
- #### [NEW] `frontend/src/components/layout/Shell.jsx`
  The main authenticated wrapper applying the `compliance-glow`. Contains `<Sidebar>` and `<TopBar>`.

### 2. Application Shell Components
- #### [NEW] `frontend/src/components/layout/Sidebar.jsx`
  Role-aware navigation list matching Design System §8.1. Uses Lucide icons, features active state left-accent `emerald` glow, and dynamically filters items based on the user's role. Includes a mock/stub live-count on the "Gap Queue" item.
- #### [NEW] `frontend/src/components/layout/TopBar.jsx`
  Top-right user display name, current route breadcrumbs, and a clean Logout button that tears down the session.

### 3. Authentication Screens
- #### [NEW] `frontend/src/pages/Login.jsx`
  Single email/password form modeled after Design System §11.1 (bg-void + compliance glow, max 440px wide). Includes Supabase `signInWithPassword` integration.
- #### [NEW] `frontend/src/pages/Forbidden.jsx`
  The clean `/403` page "You don't have access to this page" offering a route back to the user's correct home route.

## Open Questions

> [!IMPORTANT]
> - Do you want me to pre-fill the `.env.local` inside my environment, or will you handle that entirely on your end during the verification stage?
> - Let me know if I should proceed with building Phase 2 immediately.

## Verification Plan

### Automated Tests
- Build test: `npm run build` will verify syntax and structural sanity.
- All structural layouts matching mobile specifications (375px) via Tailwind breakpoints will be evaluated.

### Manual Verification
- Navigating to `/` unauthenticated will redirect to `/login`.
- If an engineer signs in with `dev@auditchain.dev`, typing `/dashboard` in the URL manually will redirect to `/403`.
- The dashboard Sidebar will accurately collapse or restructure matching design constraints.
