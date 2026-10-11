# BugBuddy — Technical Requirements Document (TRD)

**Version:** 1.2.0 (Release Candidate v0.1.0)  
**Status:** Approved Technical Architecture  
**Canonical Document:** [docs/TRD.md](docs/TRD.md)  
**Product Specification:** [PRD.md](PRD.md) | [docs/PRD.md](docs/PRD.md)  
**Diagrams:** [docs/architecture/diagrams/](docs/architecture/diagrams/)  
**Deployment Guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 1. System Architecture Overview

BugBuddy employs a decoupled, two-tier architecture:

```
[ Developer Browser ]
         │
         ├── (Static Assets) ──> [ Render Static Site: bugbuddy-frontend ] (dist/)
         │
         └── (POST /api/diagnose) ──> [ Render Web Service: bugbuddy-backend ] (:3001 / :10000)
                                                 │
                                                 ├── In-Memory BM25 Index (60 records)
                                                 ├── Local ONNX Vector Index (384-dim)
                                                 └── Server-Side AI Provider (Gemini / OpenAI / Mock)
```

1. **Frontend Tier (Vite 5 + React 18 SPA)**:
   - Client-side static single-page application built into `dist/`.
   - Communicates with the backend via `fetch` to `${VITE_API_BASE_URL}/api/diagnose`.
   - Includes client-side secret redaction and a deterministic offline fallback engine.
2. **Backend Tier (Node.js HTTP Server)**:
   - Standalone HTTP server (`src/server/index.ts`) written in TypeScript and executed via `tsx`.
   - Listens on `HOST` (`0.0.0.0`) and `PORT` (`3001` or `process.env.PORT`).
   - Handles hybrid BM25 + ONNX vector knowledge retrieval and dispatches to cloud LLM providers.

---

## 2. API Specifications & Data Contracts

### 2.1 Health Check Endpoints
- **Endpoints**: `GET /health` and `GET /api/health`
- **Response** (HTTP 200 OK):
  ```json
  {
    "status": "ok",
    "service": "bugbuddy-ai-backend",
    "timestamp": "2026-10-11T09:27:11.000Z",
    "env": "production"
  }
  ```

### 2.2 AI Diagnosis Endpoint
- **Endpoints**: `POST /api/diagnose` and `POST /api/debug/ai-diagnose`
- **Payload Limit**: Maximum 64 KB (65,536 bytes). Returns HTTP 413 if exceeded.
- **Request Body (JSON)**:
  ```typescript
  interface UserSubmissionContext {
    language: 'c' | 'cpp' | 'java' | 'python' | 'javascript' | 'typescript'; // Required
    code: string;                                                            // Required (non-empty)
    errorMessage?: string;                                                   // Optional compiler / runtime trace
    question?: string;                                                       // Optional developer question
    expectedBehavior?: string;                                               // Optional expected output
    actualBehavior?: string;                                                 // Optional actual output
    providerId?: 'gemini' | 'openai' | 'mock';                               // Optional provider override
    retrievalMode?: 'bm25' | 'vector' | 'hybrid';                            // Optional search strategy
    tone?: 'mild' | 'spicy' | 'savage';                                      // Optional roast intensity
  }
  ```
- **Success Response (HTTP 200 JSON)**:
  ```typescript
  interface AIDiagnosisResponse {
    summary: string;
    roast: string;
    codeExplanation: string;
    probableRootCause: string;
    whyItWorks: string;
    suggestedFix: {
      buggyExample: string;
      fixedExample: string;
      explanation: string;
    };
    verificationTests: string[];
    citedRecordIds: string[];
    citedSources: Array<{
      recordId: string;
      recordTitle: string;
      url: string;
      category: string;
      language: string;
      isPrimary: boolean;
    }>;
    confidenceScore: number;
    isGrounded: boolean;
    usedFallback: boolean;
    providerUsed: string;
    modelUsed: string;
    retrievalDurationMs: number;
    inferenceDurationMs: number;
  }
  ```
- **Error Response (HTTP 400 / 405 / 413 / 500 JSON)**:
  ```json
  {
    "error": "Sanitized error message without leaked credentials.",
    "code": "SERVER_ERROR"
  }
  ```

---

## 3. Knowledge Base & Hybrid Retrieval Engine

1. **Ingestion & Validation**:
   - Curated records stored in `knowledge/*.json` across 6 languages (60 total records).
   - Validated via `npm run validate:knowledge` enforcing schema adherence and preventing ID collisions.
2. **Dual-Index Search**:
   - **BM25 Inverted Index** (`src/knowledge/search.ts`): High-precision token-matched scoring with term frequency weighting.
   - **Dense Vector Search** (`src/knowledge/vectorSearch.ts`): Uses Transformers.js (`@xenova/transformers`) with local ONNX model `Xenova/all-MiniLM-L6-v2` generating 384-dimensional cosine similarity vectors.
   - **Hybrid Fusion (RRF)** (`src/knowledge/hybridSearch.ts`): Fuses BM25 and semantic vector ranks using Reciprocal Rank Fusion:
     $$\text{RRF Score} = \sum_{m \in \{\text{BM25}, \text{Vector}\}} \frac{1}{60 + \text{Rank}_m}$$
3. **Citation Provenance Guard**:
   - Responses are strictly grounded against retrieved sources; fabricated citation IDs are filtered out before reaching the client.

---

## 4. AI Provider Abstraction & Fallback

- **Google Gemini**: Uses Google Generative Language REST API (`GEMINI_API_KEY`). Defaults to `gemini-2.5-flash`.
- **OpenAI**: Uses OpenAI Chat Completions API (`OPENAI_API_KEY`). Defaults to `gpt-4o-mini`.
- **Mock Provider**: Built-in deterministic mock provider for zero-key local operation.
- **Deterministic Fallback**: If cloud providers fail, time out (15s), or return errors, the orchestrator safely falls back to BugBuddy's Stage 4 deterministic engine, honestly setting `usedFallback: true`.

---

## 5. Security & Boundary Architecture

- **No Code Execution**: Submissions are analyzed statically. User code is never compiled, eval'd, or executed.
- **Client-Side Secret Redaction**: `scanAndRedactSecrets()` in `src/utils/secretRedactor.ts` strips OpenAI keys (`sk-...`), Google keys (`AIzaSy...`), JWTs, and Basic Auth tokens before transmission.
- **CORS Protection**: Supports `CORS_ORIGIN` allowlist matching with `Vary: Origin` header.
- **Server-Only Credentials**: Secrets reside exclusively in server memory; never prefixed with `VITE_`.
- **Client-Side Persistence**: `src/utils/storage.ts` manages versioned localStorage (`bugbuddy_v1_*`) with fallback to memory if storage is unavailable or quota is exceeded.

For exhaustive historical technical specifications and requirements traceability matrices, see [docs/TRD.md](docs/TRD.md).
