# 📋 BugBuddy v0.1.0 — Release Manifest

**Release Version:** `v0.1.0-rc1`  
**Distribution Channel:** Source Repository & Hosted Web MVP  
**Canonical Git Remote:** `https://github.com/Subhadip-Paul2006/BugBuddy.git`  
**Target Branch:** `main`

---

## 1. Intended Release Artifacts & Source Inventory

### A. Root Application & Configuration
- [`package.json`](file:///d:/GHW_Challange01/package.json): Project manifest, production scripts, runtime and dev dependencies.
- [`package-lock.json`](file:///d:/GHW_Challange01/package-lock.json): Deterministic dependency lockfile.
- [`tsconfig.json`](file:///d:/GHW_Challange01/tsconfig.json) & [`tsconfig.node.json`](file:///d:/GHW_Challange01/tsconfig.node.json): Strict TypeScript configurations.
- [`vite.config.ts`](file:///d:/GHW_Challange01/vite.config.ts): Vite build configuration with development proxy to port 3001.
- [`index.html`](file:///d:/GHW_Challange01/index.html): HTML5 SPA entry point with Google Fonts preconnect.
- [`.env.example`](file:///d:/GHW_Challange01/.env.example): Safe environment variable placeholders.
- [`render.yaml`](file:///d:/GHW_Challange01/render.yaml): Render Blueprint for static frontend and Node backend.
- [`LICENSE`](file:///d:/GHW_Challange01/LICENSE): MIT License.

### B. Core Application Source (`src/`)
- `src/App.tsx`: Main router, state coordinator, global inventory HUD.
- `src/main.tsx`: React 18 DOM mount entry point.
- `src/components/`:
  - `confession/`: `BugConfessionBooth`, `CodeEditorArea`, `JudgmentTerminal`, `LanguageSelector`.
  - `chat/`: `DebugChat`.
  - `basecamp/`: `BaseCampDashboard`.
  - `habitat/`: `PetHabitat`.
  - `quests/`: `QuestBoard`.
  - `graveyard/`: `BugGraveyard`.
  - `codex/`: `KnowledgeCodex`.
  - `settings/`: `SettingsScreen`.
  - `common/`: `PixelIcon`, `LanguagePixelLogo`.
  - `navigation/`: `DeveloperInventory`.
- `src/server/`:
  - `index.ts`: Node HTTP server, health checks, host binding (`0.0.0.0`).
  - `aiRouter.ts`: 64KB payload boundary, CORS matching, orchestrator dispatch.
- `src/knowledge/`:
  - `ingest.ts`, `schema.ts`, `validator.ts`, `normalizer.ts`: Corpus ingestion and validation.
  - `search.ts`: BM25 inverted index.
  - `vectorSearch.ts`: Dense vector index with cosine similarity.
  - `hybridSearch.ts`: Reciprocal Rank Fusion (RRF) search engine.
  - `embeddings.ts`: Transformers.js ONNX adapter (`all-MiniLM-L6-v2`).
  - `ai/`: `orchestrator.ts`, `registry.ts`, `providers/` (`geminiProvider`, `openaiProvider`, `mockProvider`).
- `src/services/`:
  - `knowledgeService.ts`: Client API client with offline fallback.
  - `chatService.ts`: Multi-turn thread and action chip generator.
- `src/utils/`:
  - `secretRedactor.ts`: Client-side heuristic regex secret scrubber.
  - `audioSystem.ts`: Web Audio procedural 8-bit chiptune synthesizer.
  - `storage.ts`: Versioned local persistence (`bugbuddy_v1_*`).

### C. Curated Knowledge Base (`knowledge/`)
- 60 validated records across 6 files:
  - `knowledge/c.json` (10 records)
  - `knowledge/cpp.json` (10 records)
  - `knowledge/java.json` (10 records)
  - `knowledge/python.json` (10 records)
  - `knowledge/javascript.json` (10 records)
  - `knowledge/typescript.json` (10 records)

### D. Automated Test Suite (`tests/`)
- 27 test files covering 192 assertions:
  - Language adapters, ingestion schema, secret redactor, storage engine, pet mood transitions, BM25 scoring, hybrid fusion, AI provider errors, failure modes, UI integration.

---

## 2. Excluded Non-Release Artifacts

The following files and directories are strictly excluded from the release:
- `node_modules/`: Third-party dependencies (restored via `npm ci`).
- `.env` and `.env.*`: Secrets and live API credentials.
- `dist/` & `build/`: Temporary compilation output (built on-demand).
- `coverage/`: Test coverage reports.
- `graphify-out/cache/` & `graphify-out/.graphify_*`: Graphify AST cache files.
- Scratch files and OS metadata (`.DS_Store`, `Thumbs.db`, `*.log`).

---

## 3. Runtime Dependency Matrix

| Package | Version | Usage |
| :--- | :---: | :--- |
| `react` | `^18.3.1` | Core UI library |
| `react-dom` | `^18.3.1` | DOM renderer |
| `@xenova/transformers` | `^2.17.2` | In-memory ONNX semantic embeddings |
| `tsx` | `^4.23.15` | Fast TypeScript execution runtime for backend |
| `vite` (dev) | `^5.4.11` | Build bundler & local dev server |
| `typescript` (dev) | `^5.6.3` | Type checker |
