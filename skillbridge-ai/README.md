# SkillBridge AI — Frontend

An AI-powered employment platform connecting skilled workers with jobs and
hourly gigs. Built with Next.js App Router, TypeScript, Tailwind CSS,
shadcn/ui-style primitives, Framer Motion, Zustand, and TanStack Query.

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Pick
**Worker** or **Employer** and sign in with any email/password (this build
uses mock data, no backend required).

## Architecture

```
app/                      Next.js App Router routes
  (auth)/                 Login & register (route group, no URL segment)
  worker/                 Worker portal — layout + 9 feature pages
  employer/               Employer portal — layout + 8 feature pages
components/
  ui/                     Reusable shadcn-style primitives (Button, Card, Dialog…)
  layout/                 Sidebar, Topbar, MobileNav, ThemeToggle
  shared/                 Cross-portal building blocks (MapView, StatCard, CountdownRing…)
  providers/              ThemeProvider, QueryProvider
features/
  worker/                 Worker-only components + hooks (incoming gig modal, dashboard cards)
  employer/               Employer-only components + hooks (pipeline chart, tracking map, forms)
  auth/                   Login/register form logic
services/                 Mock API layer (simulates latency; swap for real fetch calls)
store/                    Zustand stores: auth, ui, gig (drives the incoming-gig modal)
hooks/                    Shared hooks: countdown, media query, toast
types/                    Shared TypeScript interfaces
lib/                      cn(), formatters, constants, query client
mock/                     JSON fixtures backing the services layer
```

## Signature interaction: the Incoming Gig modal

Click **"Simulate incoming gig"** on the Worker Dashboard or Gigs page. This
triggers a Rapido/Uber-style bottom-sheet modal with:

- Background blur + spring slide-up entrance
- A gradient countdown ring (20s response window) that turns red under 30%
- Accept → success checkmark animation; Decline → auto-expiry handling
- Wired end-to-end through `store/gig-store.ts` and `services/worker.service.ts`

## Swapping mock data for a real backend

Every function in `services/worker.service.ts` and `services/employer.service.ts`
returns a typed Promise. Replace the `mockRequest(...)` body with a real
`fetch`/API client call — the React Query hooks in `features/*/hooks` and all
consuming components require no changes.

## Design tokens

Color, type, radius, and shadow tokens live in `tailwind.config.ts` and
`app/globals.css` (CSS variables, light + dark). See the comment block at the
top of `tailwind.config.ts` for the palette rationale.
