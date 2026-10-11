# 🚀 BugBuddy — Production Deployment Guide

This guide describes how to configure, verify, and manually deploy the BugBuddy application to a cloud hosting platform such as Render for public MVP access.

---

## 1. System Architecture

BugBuddy operates on a decoupled two-service architecture:

1. **Frontend**: Vite + React Single-Page Application (SPA).
   - Deployed as a **Static Site**.
   - Output directory: `dist/`.
   - Communicates with the backend API via HTTP `fetch` using `VITE_API_BASE_URL`.
   - Features client-side graceful fallback to offline deterministic diagnosis if the backend service is temporarily unreachable or offline.

2. **Backend**: Standalone Node.js HTTP Server (`src/server/index.ts`).
   - Deployed as a **Web Service** (Node environment).
   - Listens on `HOST` (`0.0.0.0`) and `PORT` (`process.env.PORT || 3001`).
   - Serves AI diagnosis at `/api/diagnose` and `/api/debug/ai-diagnose`.
   - Serves health checks at `/health` and `/api/health`.
   - Keeps all AI provider API keys securely server-side.
   - Enforces a 64 KB request payload boundary and redacts credentials from all output logs.

---

## 2. Confirmed Repository Commands

| Purpose | Exact Command | Execution Scope |
| :--- | :--- | :--- |
| **Local Development (Frontend)** | `npm run dev` | Runs Vite dev server on port 3000 (proxies `/api` to 3001) |
| **Local Development (Backend)** | `npm run start:server` or `npm start` | Runs Node backend on port 3001 |
| **Production Frontend Build** | `npm run build` | Compiles TypeScript (`tsc`) and bundles to `dist/` |
| **Production Backend Start** | `npm start` | Executes `tsx src/server/index.ts` |
| **Unit & Integration Tests** | `npm test` | Runs 192 automated test assertions |
| **Knowledge Base Validation** | `npm run validate:knowledge` | Ingests and validates all 60 knowledge records |
| **Retrieval Benchmarking** | `npm run evaluate:retrieval` | Runs BM25 & Hybrid RRF evaluation benchmarks |
| **Local Semantic Verification** | `npm run verify:stage6` | Verifies real ONNX transformer embeddings |
| **Backend AI Smoke Test** | `npm run smoke:ai` | Verifies provider connectivity or fallback handling |

---

## 3. Environment Variables Specification

> **SECURITY MANDATE**: Never commit real API keys or sensitive values to version control. Server-side keys must only be entered via hosting provider secret dashboards.

### A. Backend Web Service (`bugbuddy-backend`)

| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | Optional | `production` | Node execution environment |
| `PORT` | Auto | `10000` (on Render) / `3001` | Server port |
| `HOST` | Recommended | `0.0.0.0` | Network binding interface |
| `CORS_ORIGIN` | Recommended | `*` | Allowed frontend origin URL (e.g. `https://bugbuddy.onrender.com`) |
| `DEFAULT_AI_PROVIDER` | Optional | `mock` | Preferred provider: `'openai'`, `'gemini'`, or `'mock'` |
| `GEMINI_API_KEY` | Optional* | None | Google Generative Language API key |
| `GEMINI_BASE_URL` | Optional | Google v1beta URL | Custom endpoint for Gemini/Gemma models |
| `OPENAI_API_KEY` | Optional* | None | OpenAI API key |
| `OPENAI_BASE_URL` | Optional | `https://api.openai.com/v1` | Custom endpoint for OpenAI-compatible providers |

*\*Note: If neither provider key is provided, the backend truthfully defaults to `'mock'` or deterministic knowledge retrieval without crashing.*

### B. Frontend Static Site (`bugbuddy-frontend`)

| Variable Name | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_BASE_URL` | Required for cross-origin | Empty / relative | Full URL of deployed backend (e.g. `https://bugbuddy-api.onrender.com`) |

---

## 4. Manual Deployment Instructions (Render)

### Step 1: Deploy Backend Web Service
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `https://github.com/Subhadip-Paul2006/BugBuddy.git`.
4. Configure service settings:
   - **Name**: `bugbuddy-backend`
   - **Environment**: `Node`
   - **Region**: Closest to your users (e.g. Oregon, Frankfurt, Singapore)
   - **Branch**: `main` (or designated deployment branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: **No** (Manual control recommended for hackathon submissions)
5. Under **Advanced** > **Health Check Path**: Set to `/health`.
6. Add Environment Variables:
   - `HOST`: `0.0.0.0`
   - `CORS_ORIGIN`: `*` (or your static site URL once created)
   - `DEFAULT_AI_PROVIDER`: `gemini` (or `openai` / `mock`)
   - `GEMINI_API_KEY`: *(paste secret key)*
   - `OPENAI_API_KEY`: *(paste secret key)*
7. Click **Create Web Service**.
8. Once deployed, note your service URL (e.g., `https://bugbuddy-api.onrender.com`).

### Step 2: Deploy Frontend Static Site
1. Click **New +** > **Static Site**.
2. Connect your GitHub repository.
3. Configure static site settings:
   - **Name**: `bugbuddy-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: **No**
4. Under **Redirects / Rewrites**:
   - Add a rewrite rule for client-side SPA routing:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. Under **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://bugbuddy-api.onrender.com` (use your backend URL from Step 1, without trailing slash)
6. Click **Create Static Site**.
7. Once deployed, note your frontend URL (e.g., `https://bugbuddy.onrender.com`).

### Step 3: Tighten CORS on Backend (Recommended)
1. Go to `bugbuddy-backend` > **Environment**.
2. Update `CORS_ORIGIN` to your frontend URL: `https://bugbuddy.onrender.com`.
3. Save changes and trigger manual redeploy.

---

## 5. Post-Deployment Verification & Smoke Tests

After deployment, perform these verification checks:

1. **Backend Health Check**:
   ```bash
   curl -i https://bugbuddy-api.onrender.com/health
   ```
   - **Expected Result**: HTTP 200 with JSON payload `{"status":"ok","service":"bugbuddy-ai-backend",...}`.

2. **Backend Diagnosis Endpoint Probe**:
   ```bash
   curl -i -X POST https://bugbuddy-api.onrender.com/api/diagnose \
     -H "Content-Type: application/json" \
     -d '{"language":"python","code":"def add(x, l=[]): l.append(x); return l"}'
   ```
   - **Expected Result**: HTTP 200 with grounded diagnosis, roast, and verified fix.

3. **Frontend In-Browser Verification**:
   - Load the frontend URL in a browser.
   - Confirm base camp, pixel sprite, mood indicator, and navigation bar render correctly.
   - Navigate to **Confession Booth**, select Python, click **Load Sample**, and submit.
   - Confirm JudgmentTerminal returns genuine roast, root cause analysis, and code fix.
   - Click **Verify & Resolve Bug** to confirm XP is awarded and status changes to resolved.
   - Navigate to **Debugging Chat** and send a test question. Confirm multi-turn response and action chips render properly.

---

## 6. Rollback Procedure

If unexpected regressions occur in production:

1. **Frontend Rollback**:
   - In Render Dashboard > `bugbuddy-frontend` > **Events** / **Deploys**.
   - Locate the previous successful deploy commit.
   - Click the three dots menu > **Rollback to this deploy**.
   - Reversion takes effect within ~30 seconds.

2. **Backend Rollback**:
   - In Render Dashboard > `bugbuddy-backend` > **Events** / **Deploys**.
   - Select the previous stable deploy > **Rollback to this deploy**.
   - Confirm health check returns 200 on `/health`.

3. **Emergency Safe Offline Mode**:
   - If the backend web service experiences an outage or third-party AI provider quota exhaustion, the frontend will automatically fall back to client-side deterministic diagnosis without crashing.
