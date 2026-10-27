# Resume analysis API

The backend runs the idempotent `prisma/resume-analysis.sql` schema update at
startup. It extends the existing PostgreSQL `resumes` table and creates
normalized tables for experience, education, projects, skills, certifications,
courses, and saved course recommendations. Resume records are associated with
the authenticated user; uploaded document contents are extracted in memory and
are not stored as raw text.

## Endpoints

All resume and recommendation endpoints require an `Authorization: Bearer
<token>` header.

- `POST /api/resumes/analyze` accepts a multipart PDF/DOCX field named `resume`
  (maximum 5 MB), or JSON with a `resumeText` string (maximum 100,000
  characters). It returns the extracted profile, career level, resume scores,
  skill gaps, and saved course recommendations.
- `GET /api/resumes/latest` returns the signed-in user's most recent analysis.
- `GET /api/recommendations/courses` returns courses recommended from that
  user's latest career level and skill gaps.

The career level uses the frontend's `Beginner`, `Intermediate`, and `Advanced`
categories. Five or more years, senior titles, mentoring, or large-system
design classify as `Advanced`. A real experience entry, more than two years,
or a complex independent project classify as `Intermediate`; otherwise the
result is `Beginner`. The parser is heuristic and does not send resume content
to an external AI service.

## Development

From this directory, run `npm start` and `npm test`. Database connection and
JWT settings are read from `src/.env` using the existing backend configuration.
The frontend connects to `http://localhost:4000` by default; set
`VITE_BACKEND_API_URL` in the frontend environment to use a different backend
origin.