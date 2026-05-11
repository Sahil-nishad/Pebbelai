# Production Deployment Guide: PebelAI Careers Module

This guide covers the necessary steps to ensure the Careers module works perfectly in a live production environment.

## 1. Backend (FastAPI) Configuration

The backend is designed to run on a platform like **Render** using the provided `Dockerfile` and `render.yaml`.

### Environment Variables (Render Dashboard)
Set these variables in your Render service settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Set to `production` | `production` |
| `DATABASE_URL` | Supabase Postgres URL (use pooler port 6543) | `postgresql+psycopg://postgres.hbtox...:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| `FRONTEND_APP_URL` | Your live site URL | `https://pebelai.com` |
| `CAREERS_INTERNAL_API_KEY` | Must match the frontend key | `Xk9p2mLvNqR4wT8yJ3hF7cB6dE0sA1oZ` |
| `OPENAI_API_KEY` | Required for AI email generation | `sk-proj-...` |
| `UPLOAD_DIR` | Directory for persistent storage | `/app/storage/resumes` |

### Database Migrations
The `start.sh` script automatically runs `alembic upgrade head` on startup. Ensure your Supabase database is reachable from your Render service.

---

## 2. Frontend (Next.js) Configuration

The frontend is designed to run on **Vercel**.

### Environment Variables (Vercel Dashboard)
Set these variables in your Vercel project settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `CAREERS_API_URL` | The URL of your deployed Render service | `https://pebelai-careers-api.onrender.com` |
| `CAREERS_INTERNAL_API_KEY` | Must match the backend key | `Xk9p2mLvNqR4wT8yJ3hF7cB6dE0sA1oZ` |
| `GMAIL_CLIENT_ID` | Google OAuth Client ID | `...apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` |
| `NEXT_PUBLIC_GMAIL_CLIENT_ID` | Publicly accessible Client ID for OAuth | `...apps.googleusercontent.com` |

---

## 3. Google OAuth Setup (Gmail Integration)

To enable "Connect Gmail" in the settings:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to **APIs & Services > Credentials**.
4.  Create an **OAuth 2.0 Client ID** (Web Application).
5.  **Authorized Redirect URIs**:
    *   Development: `http://localhost:3000/api/careers/gmail/callback`
    *   Production: `https://pebelai.com/api/careers/gmail/callback`
6.  Copy the Client ID and Secret to your environment variables.

---

## 4. Troubleshooting Production Issues

### "Request failed" Error
If you see "Request failed" on the Careers page:
1.  Check the **Vercel logs** to see if the proxy is reaching the backend.
2.  Check the **Render logs** to see if the backend is crashing (usually due to a wrong `DATABASE_URL` password).
3.  Ensure `CAREERS_API_URL` does **not** have a trailing slash.

### Resume Upload Fails
1.  Verify that your Render service has a **Disk** attached and mounted at `/app/storage`.
2.  Ensure the `UPLOAD_DIR` environment variable is set to `/app/storage/resumes`.
