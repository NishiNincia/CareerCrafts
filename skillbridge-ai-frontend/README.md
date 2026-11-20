# CareerCrafts / SkillBridge AI frontend

This React, TypeScript, and Vite application is the frontend for the
CareerCrafts / SkillBridge AI employment and career-development prototype. It
has role-based worker and employer portals. The worker portal includes job and
gig search, projects, resume analysis, and the Learning Hub. The employer portal
includes job and gig management and company scheme information.

The frontend uses the Express backend for authentication, job listings and
applications, gigs and projects, resume analysis, learning roadmaps and
progress, and company profile/scheme access. Some secondary prototype views,
such as worker messages and notifications and several employer summary panels,
use local JSON fixtures rather than persisted account data.

## Deployed page

- [CareerCrafts login](https://career-crafts-bice.vercel.app/login)

## Run locally

Use the repository root [README](../README.md) to configure and start the
backend and PostgreSQL. Then, from this directory, install and start the
frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

By default, local development sends API requests to `http://localhost:4000`.
To use another local backend URL, create `.env.local` in this directory:

```dotenv
VITE_BACKEND_API_URL=http://localhost:4000
```

Restart Vite after changing the environment file. Do not put backend secrets or
the Gemini API key in frontend environment variables.

Production builds use the URL in `.env.production`. Vercel project environment
variables can override this value; set `VITE_BACKEND_API_URL` there if you
manage production configuration in Vercel.

## Available routes

- Worker: `/worker/dashboard`, `/worker/jobs`, `/worker/gigs`,
  `/worker/projects`, `/worker/resume-ai`, `/worker/learning`,
  `/worker/profile`, `/worker/messages`, and `/worker/notifications`.
- Employer: `/employer/dashboard`, `/employer/post-job`, `/employer/post-gig`,
  `/employer/gigs`, `/employer/schemes`, `/employer/analytics`,
  `/employer/candidates`, `/employer/payments`, `/employer/reviews`, and
  `/employer/tracking`.
- Authentication: `/login` and `/register`.

Portal routes require authentication and the matching worker or employer role.

## Build

```powershell
npm.cmd run build
```
