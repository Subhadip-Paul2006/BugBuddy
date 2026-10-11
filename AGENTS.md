# ⚡ MANDATORY TOKEN MINIMIZATION WITH GRAPHIFY (Active on EVERY Prompt)

This repository contains a pre-built deterministic knowledge graph at `graphify-out/graph.json` with 700+ nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

**STRICT TOKEN SAVING POLICY FOR ALL AGENTS (AGY CLI & IDE CHAT):**
To eliminate unnecessary context token consumption and avoid context window bloat:

1. **QUERY GRAPH FIRST ON EVERY PROMPT**:
   - For ANY question about codebase architecture, file relationships, features, data flow, component structure, or bug locations:
   - **DO NOT** use `grep_search`, `list_dir`, `list_directory`, or read entire files (`view_file` on whole documents).
   - **YOUR FIRST ACTION MUST BE**:
     - `graphify query "<question>"` (for concepts and multi-hop paths)
     - `graphify path "<ComponentA>" "<ComponentB>"` (for relationship tracing)
     - `graphify explain "<concept>"` (for focused concept definitions and neighbors)
   - These commands return a compact, high-precision subgraph in ~100–300 tokens (yielding up to 99% token savings vs loading full files).

2. **SURGICAL FILE READING ONLY**:
   - Once `graphify query` pinpoints the target `source_file` and line reference (e.g. `at=docs/UI_UX.md:L7`), inspect ONLY that specific slice using line ranges (`StartLine` and `EndLine`).
   - Never load entire multi-hundred line files into context when a 20-line snippet answers the question.

3. **INCREMENTAL AST UPDATES**:
   - After creating or modifying any code or doc files in this session, run `graphify update .` to keep the graph current.
   - This runs locally using Tree-sitter AST parsing at ZERO API token cost.

4. **GRAPH ASSETS**:
   - Knowledge Graph: `graphify-out/graph.json`
   - Visual Graph: `graphify-out/graph.html`
   - Architecture Summary: `graphify-out/GRAPH_REPORT.md`

---

## 🤖 General Agent Working Directives

### 1. Codebase Inspection & Verification
- Inspect the codebase before making architectural assumptions.
- Never guess command names, API paths, or environment variables. Verify against `package.json`, `src/server/aiRouter.ts`, and `src/services/knowledgeService.ts`.
- Never claim a test passed unless you executed the command and observed the real output.

### 2. Confirmed Project Commands
```bash
# Production build & TypeScript check
npm run build

# Production backend start (0.0.0.0:3001)
npm start

# Automated unit & integration tests (192 assertions)
npm test

# Knowledge base schema, count & conflict validation
npm run validate:knowledge

# Retrieval benchmarking (BM25 & Hybrid RRF)
npm run evaluate:retrieval

# Local ONNX semantic embedding pipeline check
npm run verify:stage6

# Live AI provider connectivity probe / fallback verification
npm run smoke:ai

# Local development frontend server with proxy
npm run dev
```

### 3. Subsystem Ownership Boundaries
- **UI Components** (`src/components/`): Pure presentation and user interactions. Use design tokens from `src/styles/pixel-ui.css`.
- **Client Services** (`src/services/`): API client (`knowledgeService.ts`), conversation threads (`chatService.ts`).
- **Server HTTP Layer** (`src/server/`): `index.ts` (HTTP server, health checks, host binding) and `aiRouter.ts` (64KB payload limit, CORS, routing).
- **Knowledge & Retrieval** (`src/knowledge/`): Curated records (`knowledge/`), schema validation, BM25 (`search.ts`), ONNX vector search (`vectorSearch.ts`), hybrid fusion (`hybridSearch.ts`), provider registry (`ai/`).
- **Storage & State** (`src/utils/storage.ts`): Versioned `localStorage` keys (`bugbuddy_v1_*`) with safe fallback when unavailable.

### 4. Secret & Privacy Rules
- **NEVER** expose, commit, or print real API keys, passwords, or `.env` files.
- Never prefix server-only keys with `VITE_` (Vite inlines `VITE_*` into client-side JS bundles).
- User code submitted for debugging is scrubbed client-side via `scanAndRedactSecrets()` before leaving the browser.
- **NEVER execute user-submitted code**. BugBuddy only performs static analysis and knowledge retrieval.

### 5. Git Safety & Approval Protocol
- Maintain clean atomic changes.
- Never force-push or rewrite remote Git history.
- Never add `node_modules/`, `.env`, temporary caches, or local browser artifacts to Git commits.
- A passing local build is not a deployed release. Never publish a release without explicit user authorization and live deployment verification.
