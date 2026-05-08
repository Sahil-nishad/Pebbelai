# PebelAI Careers MVP

`PebelAI Careers` is a production-oriented recruiter outreach module added to the existing PebelAI platform. It reuses the current NextAuth session and dashboard shell, adds a dedicated FastAPI careers backend, and covers the Phase 1 MVP flow:

- resume upload and parsing
- recruiter post discovery with safe Playwright automation
- recruiter email extraction and profile matching
- AI-generated cold emails with manual approval
- Gmail sending with resume attachment
- application and reply tracking analytics

## Architecture

Frontend:
- Next.js App Router
- Tailwind CSS
- existing UI primitives in `components/ui`
- authenticated proxy routes under `app/api/careers`

Backend:
- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- Redis + Celery
- Playwright
- OpenAI API
- Gmail API

## Folder Structure

```text
app/
  (dashboard)/careers/
  api/careers/[...path]/route.ts
components/
  careers/
services/
  careers.ts
types/
  careers.ts
backend/
  app/
    agents/
    models/
    prompts/
    routes/
    schemas/
    services/
    utils/
    workers/
  alembic/
  requirements.txt
  Dockerfile
docker-compose.yml
```

## Environment Setup

Frontend `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
CAREERS_API_URL=http://localhost:8000
CAREERS_INTERNAL_API_KEY=change-me
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
```

Backend `backend/.env`:

```env
DATABASE_URL=sqlite:///./storage/careers.db
REDIS_URL=redis://localhost:6379/0
CAREERS_INTERNAL_API_KEY=change-me
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
FRONTEND_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:8000/auth/gmail/callback
GMAIL_REFRESH_TOKEN=...
GMAIL_SENDER_EMAIL=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM_EMAIL=...
```

## Local Development

1. Install frontend dependencies with `npm install`.
2. Install backend dependencies with `pip install -r backend/requirements.txt`.
3. Install Playwright Chromium with `python -m playwright install chromium`.
4. Start the backend with `uvicorn app.main:app --reload --port 8000` from `backend/`.
5. Start the frontend with `npm run dev`.

Local note:
- the backend defaults to SQLite and auto-creates careers tables on startup, so the MVP works locally without Postgres or Redis
- for production, point `DATABASE_URL` at PostgreSQL and run Alembic/Supabase migrations

## Docker

Run the full stack:

```bash
docker compose up --build
```

Services started:
- `frontend` on `http://localhost:3000`
- `backend` on `http://localhost:8000`
- `postgres` on `localhost:5432`
- `redis` on `localhost:6379`
- `worker` for background recruiter refresh tasks
- `beat` for scheduled Celery tasks (recruiter feed refreshed every 6 hours)

## API Surface

Frontend-facing routes:
- `GET  /api/careers/analytics`
- `GET  /api/careers/applications`
- `PATCH /api/careers/applications/{id}/reply` — mark reply status (pending / replied / rejected / no_response)
- `GET  /api/careers/recruiters`
- `POST /api/careers/recruiters/search`
- `GET  /api/careers/resume`
- `POST /api/careers/resume`
- `POST /api/careers/outreach/generate`
- `POST /api/careers/outreach/send`
- `GET  /api/careers/followup` — list follow-ups (optional `?application_id=`)
- `POST /api/careers/followup/send` — send a follow-up email
- `GET  /api/careers/gmail/status` — check Gmail OAuth connection
- `POST /api/careers/gmail/initiate` — start Gmail OAuth flow
- `GET  /api/careers/gmail/callback` — OAuth callback (server-side)

Backend routes are exposed under `http://localhost:8000/api/careers/*` and trust only proxied requests signed with `CAREERS_INTERNAL_API_KEY`.

## Security Notes

- Existing platform auth is reused through the Next.js proxy layer.
- Resume uploads are size-limited and extension-validated.
- Careers endpoints enforce per-user rate limits.
- Gmail sending remains manual approval only.
- Recruiter search uses low-volume Playwright automation with delays and result caps.
- SMTP fallback is available when Gmail OAuth is not configured.

## Deployment

Frontend:
- deploy the Next.js app to Vercel or your current platform
- set `CAREERS_API_URL` to the deployed FastAPI base URL
- keep `CAREERS_INTERNAL_API_KEY` identical on both services

Backend:
- deploy the `backend/` service to Railway, Render, Fly.io, ECS, or Kubernetes
- provision PostgreSQL and Redis
- run `alembic upgrade head` during release
- run a separate Celery worker process
- persist `backend/storage/resumes` to object storage or a mounted volume for production

## Notes

- The existing auth system was intentionally reused; no duplicate auth stack was added.
- Gmail OAuth storage is scaffolded through `gmail_connections`, while send falls back to SMTP when Gmail OAuth is not configured.
- The recruiter search service is intentionally conservative to avoid aggressive scraping behavior.
