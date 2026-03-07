# Deployment Guide — Civic Sense Portal

This guide walks you through deploying all three services to **free-tier** cloud platforms:

| Service | Platform | URL pattern |
|---------|----------|-------------|
| Frontend (React PWA) | Vercel | `https://civic-sense.vercel.app` |
| Backend (Node.js API) | Render | `https://civic-sense-backend.onrender.com` |
| AI Service (FastAPI) | Render (Docker) | `https://civic-sense-ai.onrender.com` |
| Database | MongoDB Atlas M0 | `cluster0.xxxxx.mongodb.net` |

---

## Prerequisites

- GitHub repository pushed and public (or connected to Render/Vercel)
- Accounts created on: [Vercel](https://vercel.com), [Render](https://render.com), [MongoDB Atlas](https://cloud.mongodb.com), [Cloudinary](https://cloudinary.com), [Firebase](https://console.firebase.google.com), [Groq](https://console.groq.com)

---

## Step 1 — MongoDB Atlas (production cluster)

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com/)
2. **Create Project** → name it `civic-sense`
3. **Build a Cluster** → choose **M0 Free** → region nearest to your Render region (Oregon = US West)
4. **Database Access** → Add user → Authentication: Password → Auto-generate password → copy it
5. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) for Render (Render IPs are dynamic)
6. **Connect** → Drivers → Node.js → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/civic_sense_db?retryWrites=true&w=majority
   ```
7. Save this as `MONGODB_URI` — you'll set it in Render's dashboard in Step 3.

---

## Step 2 — Deploy AI Service on Render (Docker)

The AI service needs to be deployed first so you have its URL for the backend.

1. Go to [dashboard.render.com](https://dashboard.render.com/) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `civic-sense-ai`
   - **Region:** Oregon (US West)
   - **Runtime:** Docker
   - **Root Directory:** `ai-service`
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** Free
4. **Environment Variables** → Add:
   | Key | Value |
   |-----|-------|
   | `GROQ_API_KEY` | *(from [console.groq.com](https://console.groq.com))* |
   | `GROQ_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` |
   | `PORT` | `8000` |
   | `ENV` | `production` |
5. Click **Create Web Service** → wait for build (~5 min for Docker with TF dependencies)
6. Copy the deploy URL: `https://civic-sense-ai.onrender.com`
7. Verify: visit `https://civic-sense-ai.onrender.com/health` — should return `{"status":"ok",...}`

> **Note:** On the free tier, Render spins down services after 15 minutes of inactivity.
> The first request after spin-down takes ~30 seconds. This is expected for a demo.

---

## Step 3 — Deploy Backend on Render (Node.js)

### Option A — Render Blueprint (recommended)

The `render.yaml` at the repo root defines both services. Use this for one-click setup:

1. Render Dashboard → **New** → **Blueprint**
2. Connect your GitHub repo → Render auto-detects `render.yaml`
3. Fill in the sync-false env vars in the popup:
   - `MONGODB_URI` — from Step 1
   - `FIREBASE_PROJECT_ID` — your Firebase project ID
   - `FIREBASE_SERVICE_ACCOUNT` — paste the full JSON string (see below)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `AI_SERVICE_URL` — from Step 2 (e.g. `https://civic-sense-ai.onrender.com`)
   - `FRONTEND_URL` — leave blank for now; set after Vercel deploy (Step 4)
4. Click **Apply** — both services deploy together

### Option B — Manual

1. Render Dashboard → **New** → **Web Service**
2. Connect repo, set Root Directory: `server`
3. Build: `npm install`, Start: `node app.js`
4. Set all env vars from `server/.env.example`

### Firebase Service Account JSON

1. Firebase Console → Project Settings → Service Accounts
2. **Generate new private key** → download JSON
3. Minify it (one line): `jq -c . < firebase-service-account.json`
4. Paste as the value of `FIREBASE_SERVICE_ACCOUNT` in Render

> The server's `config/firebase.js` reads this env var automatically.

---

## Step 4 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** → Add all from `client/.env.example`:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://civic-sense-backend.onrender.com/api` |
   | `VITE_FIREBASE_API_KEY` | *(Firebase web app config)* |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | *(from Firebase console)* |
   | `VITE_FIREBASE_APP_ID` | *(from Firebase console)* |
5. Click **Deploy** → wait ~2 min
6. Copy the Vercel URL: `https://civic-sense-xxxxx.vercel.app`

The `client/vercel.json` handles SPA routing and correct headers for the service worker automatically.

---

## Step 5 — Wire CORS (connect Vercel → Render)

After Vercel deploys, go back to Render backend dashboard:

1. `civic-sense-backend` → **Environment** → edit `FRONTEND_URL`
2. Set value to your Vercel URL: `https://civic-sense-xxxxx.vercel.app`
3. Click **Save Changes** — Render auto-redeploys

The backend supports comma-separated origins if you have multiple:
```
FRONTEND_URL=https://civic-sense.vercel.app,https://www.civicsense.app
```

---

## Step 6 — Seed the Database

After the backend is live and `MONGODB_URI` is set in your local `server/.env`:

```bash
cd server
node utils/seed.js
```

This creates:
- 3 departments (Sanitation, Public Works, Electrical)
- 1 admin placeholder user
- 10 realistic civic issues across Indian cities with various statuses

**After seeding, promote the admin account:**
1. Register normally on the live site with your admin email
2. In MongoDB Atlas UI → Browse Collections → **users** → find your document
3. Change `role` from `"CITIZEN"` to `"ADMIN"` → Update

---

## Step 7 — End-to-end Smoke Test

Run the smoke test against production after all three services are live:

```bash
BACKEND_URL=https://civic-sense-backend.onrender.com \
AI_URL=https://civic-sense-ai.onrender.com \
FRONTEND_URL=https://civic-sense.vercel.app \
node server/scripts/smokeTest.js
```

Expected output: `✅  All checks passed — production deployment looks healthy!`

The test verifies:
- Backend health, API root, public issue list, CORS headers, auth gates (401)
- AI health, class list, validation rejection
- Frontend HTML, manifest, service worker, SPA routing

---

## Step 8 — Firebase Auth Domains

Add your Vercel domain to Firebase's authorized domains:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain** → `civic-sense-xxxxx.vercel.app`
3. Also add your custom domain if you have one

Without this, Google Sign-In will fail on production.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| AI service 502 | Cold start | Wait 30 s and retry (free tier spin-down) |
| CORS error in browser | `FRONTEND_URL` not set | Set it in Render and redeploy |
| Firebase Google login fails | Domain not authorized | Add Vercel URL to Firebase Auth domains |
| Image upload fails | Cloudinary env vars missing | Check `CLOUDINARY_*` in Render backend |
| `/api/health` returns 503 | Backend deploying | Wait ~2 min after deploy |
| `SKIP_FIREBASE_AUTH=true` in prod | Accidental env var | Set it to `false` or remove it |

---

## Environment Variable Summary

### `server/.env` (Render Backend)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<auto-generated-by-render>
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AI_SERVICE_URL=https://civic-sense-ai.onrender.com
FRONTEND_URL=https://civic-sense.vercel.app
SKIP_FIREBASE_AUTH=false
```

### `ai-service/.env` (Render AI Service)

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
PORT=8000
ENV=production
```

### `client/.env` (Vercel Frontend)

```env
VITE_API_URL=https://civic-sense-backend.onrender.com/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
