# Graph Report - GHW_Challange01  (2026-10-10)

## Corpus Check
- 75 files · ~99,690 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 2)

## Summary
- 537 nodes · 1281 edges · 23 communities (17 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f085cae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Minecraft HUD Design System
- knowledgeService.ts
- evaluator.ts
- package.json
- json
- Quickstart & Setup Workflow
- AGENTS.md
- GEMINI.md
- compilerOptions
- BugBuddy Knowledge Base — Status & Audit Report
- compilerOptions
- semantic.test.ts
- BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide
- knowledge.test.ts
- types/index.ts
- search.ts
- audioSystem.ts
- response.test.ts
- validator.ts
- types.ts
- attribution.test.ts
- hybridSearch.ts
- PixelIcon.tsx

## God Nodes (most connected - your core abstractions)
1. `KnowledgeSearchIndex` - 31 edges
2. `NormalizedKnowledgeRecord` - 27 edges
3. `VectorSearchIndex` - 23 edges
4. `react` - 22 edges
5. `ByteBuddyMood` - 20 edges
6. `App()` - 19 edges
7. `CanonicalLanguage` - 19 edges
8. `CanonicalLanguage` - 17 edges
9. `verifyStage6()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Retrieval Modes` --references--> `EmbeddingError`  [INFERRED]
  docs/KNOWLEDGE_BASE.md → src/knowledge/embeddings.ts
- `11.1.2 Model Specification & Local Setup` --references--> `LocalTransformersEmbeddingAdapter`  [INFERRED]
  docs/KNOWLEDGE_BASE.md → src/knowledge/embeddings.ts
- `7.1 Scope & Architecture` --references--> `DiagnosisResponse`  [INFERRED]
  docs/KNOWLEDGE_BASE_STATUS.md → src/knowledge/response.ts
- `Stage 4 Specific Test Breakdown (`tests/response.test.ts`)` --references--> `DiagnosisResponse`  [INFERRED]
  docs/KNOWLEDGE_BASE_STATUS.md → src/knowledge/response.ts
- `8.4 Response Grounding Preservation (`src/knowledge/response.ts`)` --references--> `buildDiagnosisResponse()`  [INFERRED]
  docs/KNOWLEDGE_BASE_STATUS.md → src/knowledge/response.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AST Debugging Pipeline Architecture** — docs_audit_archify_research, docs_phases_phase1_engine, docs_trd_ast_debugging_engine [INFERRED 0.95]
- **Minecraft Gamified Survival Loop** — readme_survival_metaphor, docs_phases_phase2_gamification, docs_trd_state_management, docs_ui_ux_hud_components [INFERRED 0.95]

## Communities (23 total, 6 thin omitted)

### Community 0 - "Minecraft HUD Design System"
Cohesion: 0.14
Nodes (25): Codebase Integrity & Free Tooling Rules, Gamified Vocabulary Enforcement, AI System Prompt & Coding Directives, Archify AST Analysis Research, Phase 0 Documentation Audit, Phase 1: AST Debugging Engine, Phase 2: Survival Mechanics & Mob Engine, Phase 3: Minecraft HUD & Canvas World (+17 more)

### Community 1 - "knowledgeService.ts"
Cohesion: 0.11
Nodes (24): DebugChat(), renderMessageContent(), ALL_CHIPS, createInitialChatSession(), FOLLOW_UP_CHIP_LABELS, generateActionResponse(), sendChatMessage(), ALL_CORPUS_ENTRIES (+16 more)

### Community 2 - "evaluator.ts"
Cohesion: 0.25
Nodes (13): main(), EvaluationCase, AggregateMetrics, CaseEvaluationResult, computeAggregate(), evaluateRetrieval(), formatEvaluationReportMarkdown(), LanguageEvaluationSummary (+5 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (32): dependencies, react, react-dom, @xenova/transformers, devDependencies, tsx, @types/node, @types/react (+24 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 9 - "BugBuddy Knowledge Base — Status & Audit Report"
Cohesion: 0.07
Nodes (29): 10. Parallel-Agent Safety Confirmation, 1. Executive Summary, 2.1 Tool Execution & Environment Verification, 2. Workspace & Environment Verification, 3.1 Initial Entry Counts Baseline, 3.2 Content Quality Baseline, 3.3 Initial Stage 1 Decision, 3. Stage 1 Baseline Completion Audit (+21 more)

### Community 10 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 11 - "semantic.test.ts"
Cohesion: 0.06
Nodes (31): 8.1 Architecture & Typed Provider Interface, 8.2 Vector Similarity Search (`src/knowledge/vectorSearch.ts`), 8.3 Hybrid Search & Reciprocal Rank Fusion (`src/knowledge/hybridSearch.ts`), 8.4 Response Grounding Preservation (`src/knowledge/response.ts`), 8.5 Automated Test Verification (`npm test`), 8.6 Benchmark Results (`npm run evaluate:retrieval`), 8.7 Type Checking & Production Build, 8.8 Stage 6B Runtime Activation & Empirical Verification (`npm run verify:stage6`) (+23 more)

### Community 12 - "BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide"
Cohesion: 0.04
Nodes (47): 10.1.1 AttributedSource Contract, 10.1.2 Attribution & Anti-Fabrication Principles, 10.1 Source Attribution & Citation Provenance, 10.2.1 Dataset Schema, 10.2.2 Query Distribution, 10.2 Retrieval Evaluation Dataset, 10.3 Evaluation Metrics & Definitions, 10.4 Actual Evaluation Benchmark Results (+39 more)

### Community 13 - "knowledge.test.ts"
Cohesion: 0.14
Nodes (6): createLanguageCountMap(), IngestionOptions, ingestKnowledgeFile(), isValidHttpUrl(), validateDataset(), validateRecord()

### Community 14 - "types/index.ts"
Cohesion: 0.10
Nodes (44): react, react-dom, App(), BaseCampDashboard(), BaseCampDashboardProps, ALL_MOODS, MOOD_DETAILS, MoodInfo (+36 more)

### Community 15 - "search.ts"
Cohesion: 0.09
Nodes (19): 8.1 Architecture & Capabilities, 8.2 Usage Examples, 8. Stage 3 Keyword Retrieval & Search Filtering Engine, Grounding LLM Prompts with `buildKnowledgePromptContext`, Indexing and Searching via `KnowledgeSearchIndex`, Standalone Functional Search, findUnknownExpectedIds(), buildKnowledgePromptContext() (+11 more)

### Community 16 - "audioSystem.ts"
Cohesion: 0.12
Nodes (35): DebugChatProps, LanguagePixelLogo(), LanguagePixelLogoProps, BugConfessionBooth(), BugConfessionBoothProps, CodeEditorArea(), CodeEditorAreaProps, PLACEHOLDERS (+27 more)

### Community 17 - "response.test.ts"
Cohesion: 0.13
Nodes (14): AttributedSource, BASE_LIMITATIONS, buildDiagnosisResponse(), createNoMatchResponse(), DEFAULT_MIN_RELEVANCE_SCORE, diagnoseProblem(), DiagnosisResponse, DiagnosisResponseOptions (+6 more)

### Community 18 - "validator.ts"
Cohesion: 0.26
Nodes (11): normalizeDifficulty(), normalizeLanguage(), normalizeRecord(), ID_REGEX, LANGUAGE_ALIASES, REQUIRED_FIELDS, SUPPORTED_CATEGORIES, SUPPORTED_DIFFICULTIES (+3 more)

### Community 19 - "types.ts"
Cohesion: 0.33
Nodes (8): 5.1 Architecture & Modules, main(), formatDiagnostics(), formatIngestionSummary(), CanonicalDifficulty, IngestionResult, ValidationError, ValidationResult

### Community 21 - "hybridSearch.ts"
Cohesion: 0.31
Nodes (8): EvaluationOptions, HybridRetrievalMode, HybridSearchDiagnostic, HybridSearchOptions, HybridSearchResultItem, HybridSearchResults, SearchOptions, SearchResultItem

## Knowledge Gaps
- **14 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `tsx`, `typescript` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 188 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KnowledgeEntry` connect `search.ts` to `knowledgeService.ts`, `semantic.test.ts`, `BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide`, `knowledge.test.ts`, `response.test.ts`, `types.ts`, `attribution.test.ts`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `KnowledgeSearchIndex` (e.g. with `Indexing and Searching via `KnowledgeSearchIndex`` and `5.1 Architecture & Modules`) actually correct?**
  _`KnowledgeSearchIndex` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Minecraft HUD Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Why does `BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide` connect `BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide` to `search.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `NormalizedKnowledgeRecord` (e.g. with `Normalized Knowledge Record` and `5.1 Architecture & Modules`) actually correct?**
  _`NormalizedKnowledgeRecord` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `knowledgeService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1106612685560054 - nodes in this community are weakly interconnected._