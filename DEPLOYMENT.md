# 🚀 Deploy to Vercel — Cyber Crime Reporting Portal

This repo deploys as **two separate Vercel projects** from the **same GitHub repository**:

| Project | Root Directory | What it is |
|---|---|---|
| **Frontend** | `/` (repo root) | Create React App static site |
| **Backend** | `backend` | Express API running as a Vercel serverless function |

> **Nothing in your app logic changed.** Every change is *additive* and activated by environment variables. With no new env vars set, local `npm start` / `npm run dev` behave exactly as before.

---

## 0. Prerequisites (do these first)

1. **MongoDB Atlas** — a free cluster + connection string.
   - In Atlas → **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Vercel's serverless IPs can connect.
2. **Cloudinary** (free) — for evidence file storage. Vercel's filesystem is read‑only, so local‑disk uploads can't work; files go to Cloudinary instead.
   - Sign up → Dashboard → copy the **`CLOUDINARY_URL`** (looks like `cloudinary://<key>:<secret>@<cloud>`).
3. Push this repo to **GitHub** (already done).
4. A **Vercel** account (free Hobby plan is fine).

---

## 1. Deploy the BACKEND project

1. Vercel → **Add New… → Project** → import this repo.
2. **Root Directory → `backend`** (click *Edit* and select the `backend` folder). ⚠️ This is the most important setting.
3. Framework Preset: **Other** (leave as detected). Build/Output settings: leave default — `backend/vercel.json` handles routing.
4. Add the **Environment Variables** below, then **Deploy**.
5. After it deploys you'll get a URL like `https://your-backend.vercel.app`. **Copy it.**

### Backend environment variables (Vercel → backend project → Settings → Environment Variables)

| Variable | Value / Example | Required |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/CyberCrimeDB?retryWrites=true&w=majority` | ✅ |
| `JWT_SECRET` | a long random string | ✅ |
| `JWT_EXPIRES_IN` | `7d` | optional |
| `DEFAULT_ADMIN_EMAIL` | `admin@cybercrime.local` | ✅ (first login) |
| `DEFAULT_ADMIN_PASSWORD` | `Admin@12345` | ✅ (first login) |
| `NODE_ENV` | `production` | ✅ |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` (exact, **no trailing slash**). Accepts a **comma‑separated list** to also allow preview URLs or an apex/www domain, e.g. `https://app.vercel.app,https://app-git-main.vercel.app` | ✅ |
| `PUBLIC_BASE_URL` | `https://your-backend.vercel.app` (no trailing slash) | recommended |
| `TRUST_PROXY` | `true` | ✅ |
| `SESSION_COOKIE_SECURE` | `true` | ✅ |
| `SESSION_COOKIE_SAMESITE` | `none` (needed for cross‑domain cookies) | ✅ |
| `CLOUDINARY_URL` | `cloudinary://<key>:<secret>@<cloud>` | ✅ (uploads) |
| `CRON_SECRET` | a long random string | ✅ (background jobs) |

> You won't know the frontend URL yet on the very first deploy. That's fine — deploy the backend, deploy the frontend, then come back and set `CORS_ORIGIN` to the real frontend URL and **redeploy the backend** (Deployments → ⋯ → Redeploy).

**Test it:** open `https://your-backend.vercel.app/api/health` → you should see `{"ok":true,...}`.

---

## 2. Deploy the FRONTEND project

1. Vercel → **Add New… → Project** → import the **same** repo again.
2. **Root Directory → `/`** (repo root — leave default).
3. Framework Preset: **Create React App** (auto‑detected).
4. Add the env vars below, then **Deploy**.

### Frontend environment variables (Vercel → frontend project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `https://your-backend.vercel.app/api` | **must end in `/api`** |
| `REACT_APP_ENABLE_REALTIME` | `false` | disables WebSocket attempts (see note below) |

> ⚠️ **CRA bakes `REACT_APP_*` into the build.** If you change these later you must **redeploy** the frontend for the change to take effect.

---

## 3. Connect the two (final wiring)

1. Frontend deployed → copy its URL (`https://your-frontend.vercel.app`).
2. Go to the **backend** project → set `CORS_ORIGIN` to that exact URL → **Redeploy** the backend.
3. Open the frontend, sign in with `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`.

Done. ✅

---

## 4. Background jobs (SLA escalation & reminders)

On a normal server these run on in‑process timers. Serverless functions freeze between requests, so they're triggered over HTTP instead. Two secured endpoints exist:

- `GET /api/cron/escalation`
- `GET /api/cron/reminders`

Both require the `CRON_SECRET` (sent as `Authorization: Bearer <CRON_SECRET>` or `?key=<CRON_SECRET>`).

**Vercel Cron** is already configured in `backend/vercel.json` (runs daily — the Hobby plan only allows daily schedules, and Vercel injects the `CRON_SECRET` header automatically).

**To run them at the original frequency** (escalation ≈15 min, reminders ≈5 min), use a free external scheduler — e.g. [cron-job.org](https://cron-job.org) or UptimeRobot — to GET:

```
https://your-backend.vercel.app/api/cron/escalation?key=YOUR_CRON_SECRET   every 15 min
https://your-backend.vercel.app/api/cron/reminders?key=YOUR_CRON_SECRET    every 5 min
```

(Or upgrade to Vercel Pro for sub‑daily cron schedules.)

---

## 5. What changed vs. running on a normal server (read this)

Everything still works; three features behave slightly differently on Vercel's serverless model:

| Feature | On Vercel | Impact |
|---|---|---|
| **Realtime (Socket.IO)** | WebSockets aren't supported on serverless. `REACT_APP_ENABLE_REALTIME=false` turns off connection attempts. | Notifications/reminders update via **polling** (every 30–60s) instead of instantly. No data loss. |
| **Evidence uploads** | Stored on **Cloudinary** (env‑gated) instead of local disk. | Works fully — just requires `CLOUDINARY_URL`. |
| **Background sweeps** | Triggered by **cron HTTP calls** instead of in‑process timers. | Works once cron is set up (section 4). |

If you ever want the *exact* original behavior (instant WebSockets, in‑process timers, local disk) with **zero** of these caveats, deploy the **backend** to a long‑running host (Render / Railway / Fly.io) and keep the **frontend** on Vercel. The code supports both with no changes — just leave `CLOUDINARY_URL` unset to use disk, and `REACT_APP_ENABLE_REALTIME` unset to keep realtime on. (This is what the project README originally recommended.)

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend loads but every API call fails / CORS error | `CORS_ORIGIN` (backend) must equal the frontend URL exactly, no trailing slash. Redeploy backend after changing. |
| `/api/health` returns 503 "database connection failed" | Check `MONGO_URI` and that Atlas Network Access allows `0.0.0.0/0`. |
| Login works but evidence upload fails | `CLOUDINARY_URL` not set (or invalid) on the backend project. |
| API calls go to `localhost:5000` | `REACT_APP_API_URL` wasn't set at build time — set it and **redeploy** the frontend. |
| Routes 404 on refresh (e.g. `/admin/dashboard`) | Ensure root `vercel.json` is present (it adds the SPA fallback) — it is in this repo. |
| Cron endpoint returns 401 | `CRON_SECRET` mismatch between the env var and the `?key=`/Bearer value. |
| `maxDuration` deploy error | Remove the `functions` block from `backend/vercel.json` (Hobby plan duration limits). |

---

## Quick reference — files added/changed for deployment

**Added:** `vercel.json` (frontend) · `.vercelignore` · `.env.example` · `backend/vercel.json` · `backend/.vercelignore` · `backend/app.js` · `backend/api/index.js` · `backend/lib/db.js` · `backend/routes/cronRoutes.js` · `backend/utils/storage.js` · `backend/utils/fileUrl.js`

**Changed (additive / env‑gated only):** `backend/server.js` (now imports the shared `app.js`) · `backend/middleware/upload.js` · `backend/controllers/evidenceController.js` · `backend/controllers/complaintController.js` · `backend/package.json` (added `cloudinary`, `engines`) · `backend/.env.example` · `src/services/socket.js`
