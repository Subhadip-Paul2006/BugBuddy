# BugBuddy v0.1.0 Release Changelog

*This document records the specific release delta for version `v0.1.0-rc1`. For complete ongoing release history, refer to the root [CHANGELOG.md](../../CHANGELOG.md).*

---

## [0.1.0-rc1] - 2026-10-11

### Initial Release Candidate (v0.1.0-rc1)

#### Added
- **Minecraft-Inspired Developer Survival World**:
  - Base Camp Dashboard with dynamic ByteBuddy cyber-golem companion.
  - Persistent 8-slot developer inventory HUD with player level and XP hotbar.
  - Bug Confession Booth with language selector, code editor, and JudgmentTerminal.
  - Interactive Debugging Chat workbench with 7 contextual follow-up action chips.
  - Pet Habitat with Feed, Pet, and Play actions and Web Audio 8-bit procedural synthesizer.
  - Quest Board with daily quests, sprint goals, and progress bars.
  - Bug Graveyard tombstone archive with filter tags.
  - Knowledge Codex index with 60 curated multi-language debugging records.
  - Settings Screen with Clean Font mode, High Contrast mode, and local storage purge.
- **Backend Architecture**:
  - Standalone Node.js HTTP service listening on `HOST=0.0.0.0` and `PORT=3001` with `/health` check.
  - Hybrid retrieval engine combining BM25 keyword matching and dense ONNX vector search (`all-MiniLM-L6-v2`) via Reciprocal Rank Fusion (RRF).
  - Server-side AI provider integration supporting Google Gemini, OpenAI, and Mock engines.
  - Configurable CORS allowlist matching with `Vary: Origin`.
- **Security & Safety**:
  - Client-side secret redactor (`scanAndRedactSecrets()`) scrubbing API keys, JWTs, and passwords.
  - Strict 64 KB request payload boundary.
  - Zero server-side code execution.
- **Verification & Deployment Configuration**:
  - Declarative Render Blueprint (`render.yaml`).
  - Automated quality gate suite passing 192 unit/integration tests and 60 knowledge records.
