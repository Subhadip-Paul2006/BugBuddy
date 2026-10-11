# 🛠️ BugBuddy — Developer Environment Setup Guide

Welcome to the BugBuddy developer setup guide! Follow these instructions to set up your local development environment, run tests, and launch the application.

---

## 1. Prerequisites

Before starting, ensure your system has:

- **Node.js**: Version `20.x` or higher (LTS recommended).
  - Verify: `node -v`
- **npm**: Version `10.x` or higher.
  - Verify: `npm -v`
- **Git**: Installed and accessible in your shell.
  - Verify: `git --version`
- **Operating System**: macOS, Linux, or Windows (PowerShell or Bash).

---

## 2. Clone & Dependency Installation

```bash
# 1. Clone the repository
git clone https://github.com/Subhadip-Paul2006/BugBuddy.git
cd BugBuddy

# 2. Install dependencies cleanly
npm install
```

---

## 3. Environment Configuration

BugBuddy works **completely offline with rich mock heuristics out of the box** without any external API keys.

To connect optional real cloud AI providers (Google Gemini or OpenAI):

```bash
# Copy the example environment file
cp .env.example .env
```

Open `.env` and fill in your keys:

```ini
# Server Port & Binding
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=*

# Default Provider ('gemini', 'openai', or 'mock')
DEFAULT_AI_PROVIDER=mock

# Google Gemini API Key (Optional)
GEMINI_API_KEY=your_gemini_key_here

# OpenAI API Key (Optional)
OPENAI_API_KEY=your_openai_key_here
```

> 🔒 **Security Notice**: `.env` is ignored by `.gitignore`. Never commit `.env` or paste real secrets into public branches.

---

## 4. Running BugBuddy Locally

BugBuddy operates with a decoupled architecture: a Vite frontend (port 3000) and a Node backend (port 3001).

### Terminal 1: Launch Backend AI Server
```bash
npm start
# Server listens at http://0.0.0.0:3001
# Health check available at http://localhost:3001/health
```

### Terminal 2: Launch Frontend Development Server
```bash
npm run dev
# Vite server starts at http://localhost:3000
# Proxies /api requests to http://localhost:3001
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**.

---

## 5. Verification & Testing Commands

Run the full verification suite to ensure code health before making changes:

```bash
# 1. Automated Unit & Integration Tests (192 assertions across 27 suites)
npm test

# 2. Knowledge Base Validation (Ingestion & Schema Integrity)
npm run validate:knowledge

# 3. Retrieval Benchmark Evaluation (BM25 & Hybrid RRF accuracy)
npm run evaluate:retrieval

# 4. Local Semantic Embedding Model Verification (ONNX Transformers.js)
npm run verify:stage6

# 5. Live AI Smoke Test
npm run smoke:ai

# 6. Production TypeScript Compilation & Vite Build
npm run build
```

---

## 6. Troubleshooting Common Issues

### Issue 1: Port 3000 or 3001 Already in Use
- **Symptom**: `EADDRINUSE: address already in use :::3001`
- **Solution**:
  - Windows: `Get-NetTCPConnection -LocalPort 3001 | Stop-Process -Id {$_.OwningProcess} -Force`
  - Linux/macOS: `lsof -i :3001 -t | xargs kill -9`
  - Or configure a different port: `PORT=3005 npm start`

### Issue 2: Offline Fallback Active Notice in UI
- **Symptom**: UI displays *"DETERMINISTIC RETRIEVAL FALLBACK"* banner.
- **Cause**: Either backend server on port 3001 is stopped, or no valid `GEMINI_API_KEY` / `OPENAI_API_KEY` is set.
- **Resolution**: This is normal and expected behaviour. BugBuddy transparently falls back to its deterministic Stage 4 knowledge base so debugging workflows continue without interruption.

### Issue 3: ONNX Transformers.js First Run Delay
- **Symptom**: First execution of semantic search takes ~1.5s longer than subsequent searches.
- **Cause**: Xenova ONNX pipeline initializes the lightweight `all-MiniLM-L6-v2` model in memory on initial demand.
- **Resolution**: Subsequent queries execute in sub-millisecond in-memory speeds.

---

## 7. Safe Shutdown

To stop local servers:
- In each terminal window, press <kbd>Ctrl</kbd> + <kbd>C</kbd>.
