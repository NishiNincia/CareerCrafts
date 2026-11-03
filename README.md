# CareerCrafts / SkillBridge AI

A React frontend and Express backend prototype for job search, skill building,
and AI-assisted resume analysis. Resume files are parsed by the backend, analyzed
with Gemini, and saved in PostgreSQL.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL running locally or reachable from your machine
- A Gemini API key for AI resume analysis

## Quick start (Windows PowerShell)

Run commands from the repository root unless a step says otherwise. Keep the
backend and frontend running in separate terminals.

### 1. Configure the backend

Copy and paste this into PowerShell from the repository root to create the
backend environment file:

```powershell
Set-Location .\skillbridge-ai-backend-prototype
@'
PORT=4000
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skillbridge
DB_USER=postgres
DB_PASSWORD=replace-with-your-postgres-password
GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
'@ | Set-Content -Encoding ascii .\src\.env
```

Edit `src\.env` and replace the three `replace-with-...` values with your own
JWT secret, PostgreSQL password, and Gemini API key. To generate a random JWT
secret, run:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create a PostgreSQL database named `skillbridge` (or set `DB_NAME` to an
existing database). The configured `DB_USER` must have permission to create and
update the application's tables. The backend applies its resume-analysis
schema at startup.

Install dependencies and start the backend:

```powershell
npm.cmd install
npm.cmd start
```

The backend listens on `http://localhost:4000`. Check it in another terminal:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

### 2. Start the frontend

Open a second PowerShell terminal at the repository root:

```powershell
Set-Location .\skillbridge-ai-frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:3000`).
The frontend's default backend URL is `http://localhost:4000`. To use another
backend URL, create `skillbridge-ai-frontend\.env.local` with:

```dotenv
VITE_BACKEND_API_URL=http://localhost:4000
```

Restart the frontend after changing its environment file.

## Gemini settings

The backend loads `skillbridge-ai-backend-prototype\src\.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Required for Gemini analysis | Gemini API credential |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Primary model |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.5-flash` | Final-attempt fallback |
| `GEMINI_REQUEST_TIMEOUT_MS` | `60000` | Per-request timeout |
| `GEMINI_RETRY_BUDGET_MS` | `140000` | Total request/retry budget |
| `RESUME_ANALYSIS_JOB_TIMEOUT_MS` | `155000` minimum | Worker job timeout |
| `RESUME_ANALYSIS_JOB_LEASE_MS` | `185000` minimum | Worker lease |

Use model identifiers available to your Gemini API key. A fallback can be
disabled by setting `GEMINI_FALLBACK_MODEL` to the same value as
`GEMINI_MODEL`. Restart the backend after any environment changes.

## Tests and builds

Backend tests:

```powershell
Set-Location .\skillbridge-ai-backend-prototype
npm.cmd test
```

Frontend production build:

```powershell
Set-Location .\skillbridge-ai-frontend
npm.cmd run build
```

## Resume analysis endpoints

Resume endpoints require authentication:

- `POST /api/resumes/analyze` — upload a PDF/DOCX and optionally include a job
  description; returns a queued analysis job.
- `GET /api/resumes/jobs/:jobId` — poll job status and retrieve its saved result.
- `POST /api/resumes/jobs/:jobId/retry` — retry a failed analysis.
- `GET /api/resumes/latest` — retrieve the signed-in user's latest saved result.

Detailed API and scoring notes are in
[`skillbridge-ai-backend-prototype/src/README.md`](./skillbridge-ai-backend-prototype/src/README.md).

## Secrets

Local `.env` files are ignored by Git. Never commit API keys, database passwords,
or real JWT secrets. Keep `.env.example` files limited to safe placeholders.
