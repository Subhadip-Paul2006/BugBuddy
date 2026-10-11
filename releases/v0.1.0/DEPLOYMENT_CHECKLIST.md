# 🚀 BugBuddy v0.1.0 — Deployment Checklist

Follow this operational checklist when performing the initial manual deployment of BugBuddy v0.1.0 to Render.

---

## 1. Pre-Deployment Configuration Verification

- [ ] Confirm `render.yaml` exists and defines both `bugbuddy-backend` and `bugbuddy-frontend`.
- [ ] Confirm `.env` is **NOT** tracked in git (`git status` shows clean, no `.env`).
- [ ] Confirm all local preflight gates pass (`npm run build`, `npm test`, `npm run validate:knowledge`).

---

## 2. Backend Web Service Deployment (`bugbuddy-backend`)

- [ ] Create Web Service on Render linked to `https://github.com/Subhadip-Paul2006/BugBuddy.git`.
- [ ] Set Environment: `Node`.
- [ ] Set Build Command: `npm install`.
- [ ] Set Start Command: `npm start`.
- [ ] Set Health Check Path: `/health`.
- [ ] Configure Environment Variables (Server-side):
  - [ ] `NODE_ENV`: `production`
  - [ ] `PORT`: `10000` (Render default)
  - [ ] `HOST`: `0.0.0.0`
  - [ ] `CORS_ORIGIN`: `*` (or intended frontend URL)
  - [ ] `DEFAULT_AI_PROVIDER`: `gemini` (or `openai` / `mock`)
  - [ ] `GEMINI_API_KEY`: *(paste secret)*
  - [ ] `OPENAI_API_KEY`: *(paste secret)*
- [ ] Trigger manual build and verify deployment logs.
- [ ] Verify health probe:
  ```bash
  curl -i https://<BACKEND-URL>/health
  # Expected: HTTP 200 {"status":"ok","service":"bugbuddy-ai-backend",...}
  ```

---

## 3. Frontend Static Site Deployment (`bugbuddy-frontend`)

- [ ] Create Static Site on Render linked to same repository.
- [ ] Set Build Command: `npm install && npm run build`.
- [ ] Set Publish Directory: `dist`.
- [ ] Add Rewrite Rule:
  - Source: `/*`
  - Destination: `/index.html`
- [ ] Configure Environment Variables (Build-time):
  - [ ] `VITE_API_BASE_URL`: `https://<BACKEND-URL>` (backend URL without trailing slash)
- [ ] Trigger manual build and verify asset generation in `dist/`.

---

## 4. Post-Deployment Smoke Verification

- [ ] Load frontend URL in a clean browser window.
- [ ] Verify Base Camp renders without missing assets or font issues.
- [ ] Submit a sample Python bug in Confession Booth. Verify roast, diagnosis, and code fix diff appear.
- [ ] Click "Verify & Resolve Bug" and confirm +50 XP is awarded.
- [ ] Send a test inquiry in Debugging Chat and verify response with action chips.
- [ ] Check browser developer console for zero unhandled exceptions.

---

## 5. Security Tightening & Rollback Ready

- [ ] Update backend `CORS_ORIGIN` to exact deployed frontend URL (e.g. `https://bugbuddy.onrender.com`).
- [ ] Confirm previous deploy version is identified in Render dashboard for rollback readiness.
