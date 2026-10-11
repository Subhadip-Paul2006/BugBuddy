# Changelog

All notable changes to BugBuddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Ender Dragon boss fight modal & multiplayer bug raid sessions (Phase 4).
- User authentication and cloud-synced player profiles.

---

## [0.1.0] - 2026-10-11 (Release Candidate)

### Added
- **Minecraft-Inspired Developer Survival World UI**: 8 complete screens including Base Camp Dashboard, Confession Booth, Debugging Chat, Pet Habitat, Quest Board, Bug Graveyard, Knowledge Codex, and Settings Screen.
- **ByteBuddy Pet Companion**: Virtual cyber-golem with 5 dynamic mood states (`HAPPY`, `NEUTRAL`, `DISAPPOINTED`, `DRAMATIC_DESPAIR`, `VICTORIOUS`), feed/pet/play interactions, and 8-bit Web Audio synthesizer sound effects.
- **Bug Confession Booth**: Multi-language code editor with language selector (C, C++, Java, Python, JavaScript, TypeScript), client-side secret redaction, and JudgmentTerminal offering sarcastic roasts, root cause analysis, code diffs, citations, and +50 XP resolution.
- **Interactive Debugging Chat Workbench**: Multi-turn sprint chat with 7 contextual follow-up action chips (`Simpler`, `Deeper`, `Minimal Diff`, `Worked Example`, `More Tests`, `Explain Specific Line`, `Roast Again`) and code block copy buttons.
- **Curated Multi-Language Knowledge Base**: 60 validated records (10 per canonical language) with verified code examples, root causes, and official documentation source links.
- **Hybrid Retrieval Engine**: Dual BM25 inverted index and dense ONNX vector search (`Xenova/all-MiniLM-L6-v2`) fused via Reciprocal Rank Fusion (RRF) with graceful deterministic fallback.
- **Server-Side AI Provider Architecture**: Standalone Node.js HTTP backend supporting Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), and Mock providers with server-isolated API keys and 64 KB request payload boundaries.
- **Health Checks & Deployment Configuration**: Production-ready `/health` endpoint, `HOST=0.0.0.0` binding, configurable CORS allowlists, and Render Blueprint (`render.yaml`).
- **Comprehensive Quality Gates**: 192 automated unit/integration tests across 27 suites, knowledge validation script, and held-out retrieval evaluation suite.

### Security
- Implemented client-side secret redaction (`scanAndRedactSecrets()`) before payload transmission.
- Strict server-side isolation for third-party AI credentials (no `VITE_*` secret leaking).
- Enforced 64 KB payload boundary on `/api/diagnose` to mitigate denial of service.
- Ensured user code is analyzed statically and never executed on the host.

### Limitations
- Cloud AI features require valid `GEMINI_API_KEY` or `OPENAI_API_KEY` configured in the backend environment; otherwise, the system operates in Stage 4 deterministic fallback mode.
- Player stats and quest progress are stored locally in the browser (`localStorage`) without cross-device cloud sync.
