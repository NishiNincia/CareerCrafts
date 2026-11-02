# Resume analysis API

The backend runs the idempotent `prisma/resume-analysis.sql` schema update at
startup. It extends the existing PostgreSQL `resumes` table and creates
normalized tables for experience, education, projects, skills, certifications,
courses, saved course recommendations, and analysis jobs. Extracted resume text
is retained in PostgreSQL for traceability and job retries; all resume records
and job lookups are scoped to the authenticated user.

## Endpoints

All resume and recommendation endpoints require an authorization token.

- `POST /api/resumes/analyze` accepts a multipart PDF/DOCX field named `resume`
  (maximum 5 MB), or JSON with a `resumeText` string (maximum 100,000
  characters). New analyses return a job identifier and `queued` status.
  Identical resume text, job description, user, and model reuse an existing job
  or saved result.
- `GET /api/resumes/jobs/:jobId` returns the authenticated user's current job
  stage and, after persistence, the completed result.
- `POST /api/resumes/jobs/:jobId/retry` requeues a failed job without requiring
  another upload.
- `GET /api/resumes/latest` returns the signed-in user's most recent analysis.
- `GET /api/recommendations/courses` returns courses recommended from that
  user's latest career level and skill gaps.

PDF and DOCX text extraction remains in the request path; Gemini analysis,
profile scoring, course matching, and persistence run in a PostgreSQL-backed
worker. The Gemini request uses JSON structured output and a short per-attempt
timeout, with at most one bounded retry for transient provider errors. Model
availability and supported generation settings are documented at
https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash and
https://ai.google.dev/gemini-api/docs/structured-output.

Scores are deterministic, not model-generated: ATS score is the percentage of
five detected sections (contact, summary, experience, education, skills);
profile completion is the percentage of six profile fields (name, summary,
experience, education, skills, projects); skill strength is 10 points per
distinct extracted skill, capped at 100; resume score is 50% ATS + 30% profile
completion + 20% skill strength. Job-specific missing keywords come from the
Gemini comparison to the supplied job description. When no job description is
provided, the parser's general career-level skill gaps are shown instead.

The career level uses the frontend's `Beginner`, `Intermediate`, and `Advanced`
categories. Five or more years, senior titles, mentoring, or large-system
design classify as `Advanced`. A real experience entry, more than two years,
or a complex independent project classify as `Intermediate`; otherwise the
result is `Beginner`.

## Development

From this directory, configure `GEMINI_API_KEY`, database connection, and JWT
settings in `src/.env`, then run `npm start` and `npm test`. Optional Gemini
settings are `GEMINI_MODEL` (defaults to `gemini-3.8-flash`),
`GEMINI_FALLBACK_MODEL` (defaults to the verified `gemini-3.5-flash`),
`GEMINI_REQUEST_TIMEOUT_MS` (defaults to 60000; configured values are clamped
to 1000-60000),
`GEMINI_RETRY_BUDGET_MS` (defaults to 140000; automatically raised to allow
two full attempts, backoff, and processing overhead), `RESUME_ANALYSIS_JOB_TIMEOUT_MS` (defaults to
155000 and cannot be lower than the retry budget plus 15000), and
`RESUME_ANALYSIS_JOB_LEASE_MS` (defaults to 185000 and automatically raised to
outlive the worker timeout). The fallback is used on the final attempt after
transient errors or when the primary model returns 404; it can be disabled by
setting it to the same value as `GEMINI_MODEL`. The SDK's hidden retries are
disabled so HTTP status and provider errors remain available to application
logging. Gemini 3 models use low thinking level; 2.5 models use a zero thinking
budget. The generation prompt is capped at 14000 resume characters and 3000
job-description characters with a 4096-token output cap. Truncated responses
are reported as failures and are not persisted as successful analyses.
SDK failures log the SDK error name/code, actual HTTP status, failure origin,
and elapsed time. The frontend connects to `http://localhost:4000` by default; set
`VITE_BACKEND_API_URL` in the frontend environment to use a different backend
origin. The `/worker/resume-ai` page polls actual backend job stages and allows
failed jobs to be retried while keeping the selected upload and job description.
