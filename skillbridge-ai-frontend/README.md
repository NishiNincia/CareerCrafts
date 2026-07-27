# SkillBridge AI - Backend

AI-powered employment platform connecting local workers with micro-entrepreneurs for
permanent jobs and hyperlocal hourly gigs, with AI-assisted resume analysis, job/course/
government-scheme recommendations.

Built as a **microservice-ready modular monolith** on Spring Boot 3 / Java 21.

## Tech stack

| Concern            | Technology |
|---------------------|------------|
| Language / runtime  | Java 21 |
| Framework           | Spring Boot 3 |
| Build               | Maven |
| Database            | PostgreSQL + PostGIS |
| Cache               | Redis |
| Search              | Elasticsearch |
| Messaging           | RabbitMQ |
| Realtime            | Spring WebSocket + STOMP |
| Object storage      | S3-compatible (AWS S3 / MinIO / DO Spaces) |
| Auth                | JWT + Spring Security + Google OAuth2 |
| API docs            | springdoc-openapi / Swagger UI |
| Migrations          | Flyway |

## Module layout

Each business capability is its own package under `com.skillbridge.platform`, following
`controller / service / service.impl / repository / entity / dto / mapper / config` inside
each module:

```
auth            – register/login/refresh/logout, OTP placeholder, Google OAuth2
users           – worker profile, skills, experience, education, certificates, portfolio
employers       – business profile, verification, hiring pipeline, interview scheduling
jobs            – permanent job CRUD, search, nearby, recommendations, applications
gigs            – hourly gig CRUD, nearby, dispatch, accept/decline, OTP, ratings
resumes         – upload, parsing, resume score, ATS score, skill gaps
ai              – pluggable AI contracts (ResumeParser, ResumeScorer, AtsScorer, OCR)
recommendations – Strategy-pattern job/course/scheme/resume/skill-gap recommendations
learning        – courses, progress, certificates, learning paths
schemes         – government scheme discovery, eligibility, bookmarks
notifications   – email / push / in-app notifications
chat            – conversations, messages, realtime via WebSocket
payments        – wallet, transactions, gig payments, refunds
tracking        – live location, nearby search, ETA, gig travel history
analytics       – worker / employer / platform statistics
websocket       – STOMP config, JWT handshake auth
security        – JWT, Spring Security config, roles
common          – base entity, API response envelope, exceptions, shared config
```

## Running locally

### Option 1: Docker Compose (recommended)

```bash
docker compose up --build
```

This starts Postgres+PostGIS, Redis, RabbitMQ, Elasticsearch, MinIO (S3-compatible
storage), and the Spring Boot app itself, wired together with sane defaults.

The app will be available at `http://localhost:8080`, with Swagger UI at
`http://localhost:8080/swagger-ui.html`.

### Option 2: Run the app locally against Dockerized infra

```bash
docker compose up postgres redis rabbitmq elasticsearch minio
cp .env.example .env   # edit as needed
./mvnw spring-boot:run
```

## Database migrations

Schema is managed by Flyway; migrations live in `src/main/resources/db/migration`.
They run automatically on startup (`spring.flyway.enabled=true`). Seed data
(`V4__seed_data.sql`) adds a handful of demo courses and government schemes so the
recommendation/learning/scheme endpoints return something in a fresh environment.

## Authentication

- `POST /api/v1/auth/register` / `login` / `refresh` / `logout`
- `POST /api/v1/auth/otp/request` / `otp/verify` (OTP is logged server-side in dev;
  wire `AuthServiceImpl.requestOtp` to a real SMS gateway for production)
- Google login: redirect the frontend to `GET /oauth2/authorization/google`; on success
  the user is redirected back to `app.oauth2.redirect-uri` with `accessToken` and
  `refreshToken` query params.
- All other endpoints require `Authorization: Bearer <accessToken>`.

## AI integration points

No AI/ML model logic lives in this codebase by design. Instead, the `ai` module defines
provider-agnostic contracts:

- `ResumeParser` – extract structured data from an uploaded resume
- `ResumeScorer` – score overall resume quality
- `AtsScorer` – score a resume against a specific job description
- `OcrService` – extract text from scanned documents

Each has a deterministic placeholder `@Component` implementation so the full pipeline
(upload → parse → score → recommend) works end-to-end today. To integrate a real
provider (an LLM API, a dedicated resume-parsing SaaS, AWS Textract, etc.), implement
the relevant interface in a new `@Component`/`@Primary` bean — no other code changes.

The `recommendations` module follows the same pattern via the **Strategy pattern**:
`JobRecommendationStrategy`, `CourseRecommendationStrategy`, `SchemeRecommendationStrategy`,
`ResumeRecommendationStrategy`, and `SkillGapRecommendationStrategy` can each be swapped
for an ML-backed implementation independently.

## API documentation

Once running, full interactive API docs are at:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Testing

```bash
./mvnw test
```

## Notes / known placeholders (clearly marked in code)

- SMS OTP delivery is logged, not sent (see `AuthServiceImpl.requestOtp`).
- Push notifications are logged, not sent via FCM/APNs (see `LoggingPushNotificationSender`).
- Resume parsing/scoring uses deterministic heuristics until an external AI provider is wired in.
- Payment gateway integration (Razorpay/Stripe/etc.) is not wired — wallet credit/debit/refund
  logic exists, but no external gateway webhook handling has been implemented yet.
