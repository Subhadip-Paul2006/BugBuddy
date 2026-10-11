# ⚠️ BugBuddy v0.1.0 — Known Limitations & Architectural Boundaries

This document provides a transparent, code-verified inventory of known limitations, operational boundaries, and non-goals in BugBuddy v0.1.0.

---

## 1. Provider Credentials & Deterministic Fallback Mode

- **Cloud AI Requirement**: Full generative AI diagnosis and personalized conversational chat require a valid server-side `GEMINI_API_KEY` (Google Gemini) or `OPENAI_API_KEY` (OpenAI).
- **Graceful Deterministic Fallback**: When no API key is set, or if an external provider API is experiencing an outage or quota limit, the backend orchestrator safely falls back to BugBuddy's Stage 4 deterministic BM25 knowledge engine. The UI honestly displays a *"DETERMINISTIC RETRIEVAL FALLBACK"* banner.
- **Client Offline Mode**: If the backend server itself is completely unreachable (e.g. cold start or network loss), the frontend client runs a browser-side deterministic knowledge search so users are never blocked.

---

## 2. State & Persistence Boundaries

- **Client-Side Storage**: Developer stats (Level, XP, streak), quest progress, and Bug Graveyard history persist exclusively in the browser's `localStorage` (`bugbuddy_v1_*`).
- **No Multi-Device Sync**: Progress made on one browser/device does not sync to other devices.
- **In-Memory Backend Search Indexes**: The backend BM25 and vector search indexes are maintained in Node process memory. They rebuild in ~1.5s upon server startup from `knowledge/*.json` files.
- **No Database Dependency**: BugBuddy v0.1.0 intentionally avoids an external SQL or NoSQL database to ensure lightweight, zero-maintenance hackathon MVP hosting.

---

## 3. Runtime & Performance Considerations

- **Free-Tier Cold Starts**: When hosted on Render's free tier, the backend web service may spin down after 15 minutes of inactivity. Initial wake-up requests may take 30–50 seconds. During this window, the frontend gracefully falls back to client-side retrieval.
- **Transformers.js ONNX Initialization**: The local vector embedding pipeline loads `Xenova/all-MiniLM-L6-v2` ONNX weights into memory on initial demand. The first vector calculation takes ~1.4 seconds; all subsequent queries execute in sub-millisecond time.
- **Static Code Analysis Only**: BugBuddy analyzes code statically; it does not compile or run user code. Dynamic runtime edge-cases (e.g., race conditions that only manifest under heavy load) can only be diagnosed based on static code smells and provided stack traces.

---

## 4. Scope Non-Goals for v0.1.0

The following features were intentionally excluded from the v0.1.0 MVP:
- Real-time multiplayer co-op sessions and boss raids (planned for Phase 4).
- User authentication, logins, and passwords (planned for Phase 5).
- Automated GitHub PR review bot integration.
