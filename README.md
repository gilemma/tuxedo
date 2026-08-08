# Tuxedo Audit

Personal web app for clinical coding audit — case ledger, review workspace, coder correspondence, and analytics.

Design docs live one level up in `..\` (storyboard, thread model, dev plan). This directory is the code repo.

## Stack

React 18 + Vite (SPA) · TypeScript strict · React Router 6 · TanStack Query · Tailwind CSS · Supabase (Postgres + Auth) · Render (static hosting) · Vitest · Playwright (one smoke flow).

## Layout

```
src/
  supabase/           Supabase client + generated types
  modules/            feature modules — each with its own model/ + views/
    ledger/           scenes 01, 11
    intake/           scenes 02, 03
    review/           scenes 04, 05, 06
    correspondence/   scenes 07–10
    analytics/        scene 12
    admin/            scenes 13–16
  shared/             cross-module: ui, hooks, types, fmt
  presentation/       design tokens + app chrome (theming lives here)
supabase/migrations/  plain SQL, one file per phase
.github/workflows/    CI (lint + test)
tests/e2e/            Playwright smoke
scripts/              one-off maintenance scripts (e.g. pg_dump backup)
```

Module boundaries: each module exposes a small `index.ts` public API. Cross-module reaches go through those only; internals stay private (to be enforced via ESLint `no-restricted-imports` once scaffolded).

## First-week checklist

See `..\dev_plan.html` §IX. Short version: Supabase project → GitHub repo → Vite scaffold → Tailwind + tokens → Supabase CLI + 0001 migration → sign-in wired to `profiles` → Render deploy.
