# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Accrion is a behavioral financial advisory CRM for independent financial advisors (Next.js 14 App Router + TypeScript + Supabase). Advisors track client behavioral patterns (stated vs. revealed risk, temperament, panic threshold), log decisions with emotional context, manage goals, and run review cycles. Clients get a portal to view their plan and book/reschedule/cancel review calls.

## Commands

```bash
npm run dev         # start dev server (localhost:3000)
npm run build        # production build
npm run start         # run production build
npm run lint          # next lint
npm run typecheck   # tsc --noEmit
```

There is no test suite configured in this repo.

### Database setup (Supabase)

Run these in the Supabase SQL Editor, in order:
1. `supabase/migrations/accrion-schema.sql` — tables, indexes, RLS policies
2. `supabase/migrations/accrion-seed.sql` — optional sample advisor/client

`supabase/migrations/phase1-complete-reset-fixed.sql` is a reset script, not part of the normal setup path.

Required env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Demo logins after seeding: advisor `tanay@accrion.co` / `advisor123`, client `arjun.mehta@email.com` / `client123`.

## Architecture

### Auth & route protection
- Auth is Supabase Auth (not the `next-auth`/`bcryptjs` mentioned in the README — those are stale; actual sessions are Supabase cookie-based sessions via `@supabase/ssr`).
- Role (`ADVISOR` | `CLIENT`) lives in `user_metadata.role` on the Supabase auth user, with a `public.users` mirror table as a fallback source of truth on first login (`app/api/auth/login/route.ts` backfills `user_metadata` from the `users` table if missing).
- `middleware.ts` is the only place enforcing auth/role redirects for pages: unauthenticated users get bounced to `/login`, and `/advisor/*` vs `/client/*` are gated by `user_metadata.role`. Its matcher covers everything except `_next` static assets and image files — **this includes `/api/*` routes** (except `/api/auth/*`, which is explicitly public).
- **API routes themselves do not re-check auth or role** — they call `createServiceClient()` (service-role key, bypasses RLS) directly and trust the request. Adding a new API route means either relying on the middleware gate being sufficient for that path, or adding an explicit check — don't assume the route handler itself validates the caller.

### Data access layer
- `lib/supabase/client.ts` — browser client (`'use client'`, anon key), used in client components for auth (`getUser`, `signOut`) and realtime-style reads.
- `lib/supabase/server.ts` — three exports: `createClient()` (cookie-bound, RLS-respecting, for server components), `createServiceClient()` (service-role key, bypasses RLS — used by almost all API routes and everything in `lib/data/`), and `getServerSupabase()` (legacy alias for `createClient()`).
- `lib/data/*.ts` — server-only data-fetching functions (one file per domain: `clients`, `client-detail`, `dashboard`, `flags`, `goals`, `reviews`), all built on `createServiceClient()`. These are called directly from Server Components (e.g. `app/advisor/dashboard/page.tsx` calls `getDashboardStats()` etc. in `Promise.all`) — there's no fetch/API round-trip for advisor pages.
- The client portal (`app/client/portal/page.tsx`) is a `'use client'` component instead, so it fetches its own data through `/api/client/portal` and `/api/advisor/availability` after resolving the session client-side.
- `lib/types.ts` is the single source of truth for domain types (`Role`, `ClientProfile`, `Goal`, `BehavioralFlag`, `DecisionEntry`, `ReviewCycle`, etc.) and their enum-like string unions (statuses, severities, temperaments). Match these when shaping Supabase query results — most data files cast query results with `as unknown as X` rather than validating shape.

### App structure
- `app/advisor/*` — advisor-facing pages (dashboard, clients list/detail, flags, reviews, settings), wrapped by `app/advisor/layout.tsx` which renders the fixed `Sidebar`.
- `app/client/portal` — single-page client portal (all sections are scroll-anchored within one client component rather than separate routes).
- `app/api/advisor/*` and `app/api/client/*` — route handlers backing both areas; `app/api/auth/login` handles sign-in (POST) and sign-out (DELETE).
- `components/advisor/*` — advisor-only UI (modals, sidebar, page-specific client components); `components/ui/*` — shared primitives (`Card`, `Badge`, `Tabs`, `ThemeToggle`).

### Styling / theming
- Tailwind config (`tailwind.config.ts`) maps semantic color tokens (`bg-primary/secondary/tertiary`, `fg-primary/secondary/muted`, `border`, `accent`/`accent-warm`, `success`/`warning`/`danger`) to CSS variables, toggled via `darkMode: 'class'` — always use these semantic classes (e.g. `text-fg-primary`, `bg-bg-secondary`) rather than raw Tailwind color scales, and check `app/globals.css` for the variable definitions when adding new colors.
- Fonts are exposed as `font-serif` (Lora — used for headings), `font-sans` (DM Sans — body), `font-mono` (JetBrains Mono — dates/timestamps).
- `lib/theme-provider.tsx` + `components/ui/ThemeToggle.tsx` manage light/dark mode.

### Behavioral domain concepts (useful for reading UI code)
- Every client has a **stated risk score** (self-reported) vs **revealed risk score** (behaviorally inferred) — the gap between them is a recurring UI element (`RiskGapVisual` in the client portal, drift assessments on reviews).
- `decision_temperament` (`DELIBERATE`, `REACTIVE`, `AVOIDANT`, `OVERCONFIDENT`, `ANCHORED`, `BALANCED`) and review `drift_assessment` (`ON_TRACK` → `CRITICAL`) drive most of the color-coded badges across advisor and client views.
- `is_internal` flags on `behavioral_flags`, `decision_log`, and `communications` distinguish advisor-only notes from content visible to the client portal — respect this when adding new read paths for the client side.
