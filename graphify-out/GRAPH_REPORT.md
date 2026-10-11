# Graph Report - GHW_Challange01  (2026-10-11)

## Corpus Check
- 116 files · ~143,738 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .mmd 8, (none) 2, .css 2)

## Summary
- 890 nodes · 2280 edges · 50 communities (45 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62571f22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Minecraft HUD Design System
- types/index.ts
- search.ts
- package.json
- graphify_pretool.py
- Quickstart & Setup Workflow
- 🤖 General Agent Working Directives
- GEMINI.md
- compilerOptions
- BugBuddy Knowledge Base — Status & Audit Report
- compilerOptions
- knowledgeSearch.test.ts
- 11. Stage 6: Semantic & Hybrid Retrieval
- knowledge.test.ts
- App.tsx
- KnowledgeSearchIndex
- 10. Stage 5: Source Attribution & Retrieval Evaluation
- 🛠️ BugBuddy — Developer Environment Setup Guide
- 8.1 Architecture & Capabilities
- attribution.test.ts
- semantic.test.ts
- aiIntegration.test.ts
- BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide
- 🚀 BugBuddy — Production Deployment Guide
- 2. Pre-Release Quality Gates (Must Pass 100%)
- IndexInvalidationTracker
- maintenance.ts
- 7. How to Run Validation and Tests
- 🔒 Security Policy
- 9. Stage 4 Structured Debugging Response Engine
- 📢 BugBuddy v0.1.0 Release Notes
- 10.4 Actual Evaluation Benchmark Results
- 1. Implemented Security Controls
- 🏛️ BugBuddy — Architecture Documentation & Visualization Workflow
- BugBuddy — Product Requirements Document (PRD)
- Contributor Covenant Code of Conduct
- 1. Intended Release Artifacts & Source Inventory
- BugBuddy — Technical Requirements Document (TRD)
- [0.1.0] - 2026-10-11 (Release Candidate)
- 🤝 Contributing to BugBuddy
- Product Requirements Document
- 🚀 BugBuddy v0.1.0 — Deployment Checklist
- v0.1.0/CHANGELOG.md
- ⚠️ BugBuddy v0.1.0 — Known Limitations & Architectural Boundaries
- README.md
- 🚦 BugBuddy v0.1.0 — Release Checklist & Governance Gates
- AI System Prompt & Coding Directives
- 🧪 BugBuddy v0.1.0 — QA Audit & Verification Report
- Client State & Survival Engine
- 3. Canonical Metadata Schema

## God Nodes (most connected - your core abstractions)
1. `KnowledgeSearchIndex` - 40 edges
2. `NormalizedKnowledgeRecord` - 34 edges
3. `PixelIcon()` - 33 edges
4. `react` - 30 edges
5. `App()` - 30 edges
6. `CanonicalLanguage` - 29 edges
7. `CanonicalLanguage` - 25 edges
8. `VectorSearchIndex` - 25 edges
9. `ByteBuddyMood` - 22 edges
10. `scanAndRedactSecrets()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `12.4 Strict Grounding & Anti-Fabrication Pipeline` --references--> `AIDebugOrchestrator`  [INFERRED]
  docs/KNOWLEDGE_BASE.md → src/knowledge/ai/orchestrator.ts
- `Retrieval Modes` --references--> `EmbeddingError`  [INFERRED]
  docs/KNOWLEDGE_BASE.md → src/knowledge/embeddings.ts
- `11.1.2 Model Specification & Local Setup` --references--> `LocalTransformersEmbeddingAdapter`  [INFERRED]
  docs/KNOWLEDGE_BASE.md → src/knowledge/embeddings.ts
- `7.1 Scope & Architecture` --references--> `DiagnosisResponse`  [INFERRED]
  docs/KNOWLEDGE_BASE_STATUS.md → src/knowledge/response.ts
- `Stage 4 Specific Test Breakdown (`tests/response.test.ts`)` --references--> `DiagnosisResponse`  [INFERRED]
  docs/KNOWLEDGE_BASE_STATUS.md → src/knowledge/response.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AST Debugging Pipeline Architecture** — docs_audit_archify_research, docs_phases_phase1_engine, docs_trd_ast_debugging_engine [INFERRED 0.95]
- **Minecraft Gamified Survival Loop** — readme_survival_metaphor, docs_phases_phase2_gamification, docs_trd_state_management, docs_ui_ux_hud_components [INFERRED 0.95]

## Communities (50 total, 5 thin omitted)

### Community 0 - "Minecraft HUD Design System"
Cohesion: 0.21
Nodes (12): Archify AST Analysis Research, Phase 0 Documentation Audit, Phase 1: AST Debugging Engine, Phase 3: Minecraft HUD & Canvas World, Phase 4: Co-Op Multiplayer & Bug Raids, Implementation Roadmap & Milestones, AST Debugging & Pattern Matcher, 8-Bit Retro Audio Design (+4 more)

### Community 1 - "types/index.ts"
Cohesion: 0.10
Nodes (40): react-dom, runLiveIntegrationTest(), verifyServerFlow(), CHIP_PIXEL_ICONS, DebugChat(), DebugChatProps, renderMessageContent(), KnowledgeCodexProps (+32 more)

### Community 2 - "search.ts"
Cohesion: 0.07
Nodes (62): 12.1 Overview & Architecture, 12.2 Security Architecture & Credentials Management, 12.4 Strict Grounding & Anti-Fabrication Pipeline, 12.5 Deterministic Fallback Engine, 12.6 Environment Configuration & Server Execution, 12.7 Automated Test Suite & Verification Results, 12. Stage 7: AI Provider Integration & Grounded Diagnosis Orchestrator, Configuration (`.env.example`): (+54 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (35): dependencies, react, react-dom, tsx, @xenova/transformers, devDependencies, @types/node, @types/react (+27 more)

### Community 6 - "🤖 General Agent Working Directives"
Cohesion: 0.25
Nodes (7): 1. Codebase Inspection & Verification, 2. Confirmed Project Commands, 3. Subsystem Ownership Boundaries, 4. Secret & Privacy Rules, 5. Git Safety & Approval Protocol, 🤖 General Agent Working Directives, ⚡ MANDATORY TOKEN MINIMIZATION WITH GRAPHIFY (Active on EVERY Prompt)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 9 - "BugBuddy Knowledge Base — Status & Audit Report"
Cohesion: 0.06
Nodes (31): 10. Knowledge Roadmap & Planned Stages, 11. Parallel-Agent Safety Confirmation, 1. Executive Summary, 2.1 Tool Execution & Environment Verification, 2. Workspace & Environment Verification, 3.1 Initial Entry Counts Baseline, 3.2 Content Quality Baseline, 3.3 Initial Stage 1 Decision (+23 more)

### Community 10 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 12 - "11. Stage 6: Semantic & Hybrid Retrieval"
Cohesion: 0.18
Nodes (11): 11.1.1 Typed Provider Interface, 11.1.2 Model Specification & Local Setup, 11.1 Embedding Provider Architecture, 11.2 In-Memory Vector Search Index, 11.3 Hybrid Search & Reciprocal Rank Fusion (RRF), 11.4 Benchmark Comparisons & Evaluation Results, 11.5 Running Stage 6 Commands, 11. Stage 6: Semantic & Hybrid Retrieval (+3 more)

### Community 13 - "knowledge.test.ts"
Cohesion: 0.13
Nodes (14): createLanguageCountMap(), IngestionOptions, ingestKnowledgeDirectory(), ingestKnowledgeFile(), normalizeLanguage(), ID_REGEX, LANGUAGE_ALIASES, REQUIRED_FIELDS (+6 more)

### Community 14 - "App.tsx"
Cohesion: 0.05
Nodes (119): react, B. Core Application Source (`src/`), App(), BossAttackType, BossFightModal(), BossFightModalProps, CombatLogEntry, KnowledgeCodex() (+111 more)

### Community 15 - "KnowledgeSearchIndex"
Cohesion: 0.19
Nodes (10): evaluateRetrieval(), evaluateRetrievalCase(), findUnknownExpectedIds(), IndexedDocument, KnowledgeSearchIndex, searchKnowledgeBase(), splitCamelCase(), tokenize() (+2 more)

### Community 16 - "10. Stage 5: Source Attribution & Retrieval Evaluation"
Cohesion: 0.20
Nodes (10): 10.1.1 AttributedSource Contract, 10.1.2 Attribution & Anti-Fabrication Principles, 10.1 Source Attribution & Citation Provenance, 10.2.1 Dataset Schema, 10.2.2 Query Distribution, 10.2 Retrieval Evaluation Dataset, 10.3 Evaluation Metrics & Definitions, 10.5 Known Ranking Weaknesses & BM25 Limitations (+2 more)

### Community 17 - "🛠️ BugBuddy — Developer Environment Setup Guide"
Cohesion: 0.14
Nodes (13): 1. Prerequisites, 2. Clone & Dependency Installation, 3. Environment Configuration, 4. Running BugBuddy Locally, 5. Verification & Testing Commands, 6. Troubleshooting Common Issues, 7. Safe Shutdown, 🛠️ BugBuddy — Developer Environment Setup Guide (+5 more)

### Community 18 - "8.1 Architecture & Capabilities"
Cohesion: 0.33
Nodes (7): 8.1 Architecture & Capabilities, 8.2 Usage Examples, 8. Stage 3 Keyword Retrieval & Search Filtering Engine, Grounding LLM Prompts with `buildKnowledgePromptContext`, Indexing and Searching via `KnowledgeSearchIndex`, Standalone Functional Search, buildKnowledgePromptContext()

### Community 19 - "attribution.test.ts"
Cohesion: 0.13
Nodes (7): normalizeDifficulty(), normalizeRecord(), DEFAULT_MIN_RELEVANCE_SCORE, formatDiagnosisResponseMarkdown(), createMockRecord(), createMockRecord(), createMockRecord()

### Community 20 - "semantic.test.ts"
Cohesion: 0.05
Nodes (32): 8.1 Architecture & Typed Provider Interface, 8.2 Vector Similarity Search (`src/knowledge/vectorSearch.ts`), 8.3 Hybrid Search & Reciprocal Rank Fusion (`src/knowledge/hybridSearch.ts`), 8.4 Response Grounding Preservation (`src/knowledge/response.ts`), 8.5 Automated Test Verification (`npm test`), 8.6 Benchmark Results (`npm run evaluate:retrieval`), 8.7 Type Checking & Production Build, 8.8 Stage 6B Runtime Activation & Empirical Verification (`npm run verify:stage6`) (+24 more)

### Community 21 - "aiIntegration.test.ts"
Cohesion: 0.09
Nodes (11): 12.3 Provider Abstraction Layer & Supported Models, Supported Providers:, runLiveSmokeTest(), GeminiProvider, MockAIProvider, OpenAIProvider, AIProviderRegistry, AIProvider (+3 more)

### Community 22 - "BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide"
Cohesion: 0.25
Nodes (7): 1. Overview, 2. Directory Layout, 4. Ingestion Workflow, 5. Validation Rules & Diagnostics, 6. How to Add a New Knowledge Record, BugBuddy Knowledge Base — Architecture, Schema & Ingestion Guide, Normalized Knowledge Record

### Community 23 - "🚀 BugBuddy — Production Deployment Guide"
Cohesion: 0.17
Nodes (12): 1. System Architecture, 2. Confirmed Repository Commands, 3. Environment Variables Specification, 4. Manual Deployment Instructions (Render), 5. Post-Deployment Verification & Smoke Tests, 6. Rollback Procedure, A. Backend Web Service (`bugbuddy-backend`), B. Frontend Static Site (`bugbuddy-frontend`) (+4 more)

### Community 24 - "2. Pre-Release Quality Gates (Must Pass 100%)"
Cohesion: 0.18
Nodes (10): 1. Release Lifecycle Stages, 2. Pre-Release Quality Gates (Must Pass 100%), 3. Deployment Coordination Workflow, 4. Emergency Incident & Rollback Protocol, 📦 BugBuddy — Release Process & Quality Gates, Gate 1: Knowledge Base Ingestion & Integrity, Gate 2: Full Automated Unit & Integration Test Suite, Gate 3: Retrieval Benchmark Evaluation (+2 more)

### Community 26 - "maintenance.ts"
Cohesion: 0.16
Nodes (19): 5.1 Architecture & Modules, main(), auditCorpusQuality(), AuditIssue, AuditSeverity, calculateJaccardSimilarity(), computeCorpusFingerprint(), ConflictAuditReport (+11 more)

### Community 27 - "7. How to Run Validation and Tests"
Cohesion: 0.33
Nodes (6): 7. How to Run Validation and Tests, Build Production Bundle, Run Automated Test Suite, Run Knowledge Base Validation CLI, Validate a Specific File or Directory, Verify TypeScript Types

### Community 28 - "🔒 Security Policy"
Cohesion: 0.33
Nodes (5): Reporting a Vulnerability, Safe Handling of User Source Code & Credentials, 🔒 Security Policy, Supported Versions, What to Include in Your Report

### Community 29 - "9. Stage 4 Structured Debugging Response Engine"
Cohesion: 0.40
Nodes (5): 9.1 Architecture & Core Principles, 9.2 TypeScript Response Contract, 9.3 Usage Example, 9. Stage 4 Structured Debugging Response Engine, ResponseMode

### Community 30 - "📢 BugBuddy v0.1.0 Release Notes"
Cohesion: 0.17
Nodes (12): 1. The Bug Confession Booth (Altar of Penance), 2. ByteBuddy — Virtual Cyber-Golem Companion, 3. Interactive Multi-Turn Debugging Chat, 4. Grounded Multi-Language Knowledge Base (RAG), 5. Gamified Productivity Suite, 📢 BugBuddy v0.1.0 Release Notes, 🌟 Executive Summary, 🛠️ Getting Started (+4 more)

### Community 31 - "10.4 Actual Evaluation Benchmark Results"
Cohesion: 0.50
Nodes (4): 10.4 Actual Evaluation Benchmark Results, Per-Language Breakdown, Run 1: Raw Keyword Retrieval (No Language Filter Applied), Run 2: Language-Scoped Retrieval (Language Filter Applied)

### Community 32 - "1. Implemented Security Controls"
Cohesion: 0.18
Nodes (10): 1. Implemented Security Controls, 2. Residual Risks & Recommended Operator Practices, A. Client-Side Secret Redaction, B. Prohibition of Code Execution, 🛡️ BugBuddy v0.1.0 — Security & Privacy Review, C. Server-Side Secret Isolation, D. Denial of Service & Payload Size Boundary, E. Configurable Cross-Origin Resource Sharing (CORS) (+2 more)

### Community 33 - "🏛️ BugBuddy — Architecture Documentation & Visualization Workflow"
Cohesion: 0.22
Nodes (8): 1. Source-of-Truth Policy, 2.1 Research Summary, 2.2 Current Environment Status & Blocker Report, 2.3 Standalone Archify Generation Workflow (For Operators), 2. Archify Investigation & Integration Status, 3. Active Architecture Diagrams Inventory, 4. Maintenance & Validation Procedure, 🏛️ BugBuddy — Architecture Documentation & Visualization Workflow

### Community 34 - "BugBuddy — Product Requirements Document (PRD)"
Cohesion: 0.22
Nodes (9): 1. Executive Summary, 2. Problem Statement & Target Audience, 3. Product Vision & Principles, 4. MVP Scope & Functional Requirements, 5. Non-Functional Requirements (NFRs), BugBuddy — Product Requirements Document (PRD), Explicit Non-Goals (v0.1.0 MVP), Target Personas (+1 more)

### Community 35 - "Contributor Covenant Code of Conduct"
Cohesion: 0.25
Nodes (7): Attribution, Contributor Covenant Code of Conduct, Enforcement, Enforcement Responsibilities, Our Pledge, Our Standards, Scope

### Community 36 - "1. Intended Release Artifacts & Source Inventory"
Cohesion: 0.25
Nodes (7): 1. Intended Release Artifacts & Source Inventory, 2. Excluded Non-Release Artifacts, 3. Runtime Dependency Matrix, A. Root Application & Configuration, 📋 BugBuddy v0.1.0 — Release Manifest, C. Curated Knowledge Base (`knowledge/`), D. Automated Test Suite (`tests/`)

### Community 37 - "BugBuddy — Technical Requirements Document (TRD)"
Cohesion: 0.25
Nodes (8): 1. System Architecture Overview, 2.1 Health Check Endpoints, 2.2 AI Diagnosis Endpoint, 2. API Specifications & Data Contracts, 3. Knowledge Base & Hybrid Retrieval Engine, 4. AI Provider Abstraction & Fallback, 5. Security & Boundary Architecture, BugBuddy — Technical Requirements Document (TRD)

### Community 38 - "[0.1.0] - 2026-10-11 (Release Candidate)"
Cohesion: 0.29
Nodes (7): [0.1.0] - 2026-10-11 (Release Candidate), Added, Changelog, Limitations, Planned, Security, [Unreleased]

### Community 39 - "🤝 Contributing to BugBuddy"
Cohesion: 0.29
Nodes (6): 1. Ways to Contribute, 2. Development & Branch Workflow, 3. Knowledge Base Entry Standards, 4. Coding Standards, 5. Submitting Pull Requests, 🤝 Contributing to BugBuddy

### Community 40 - "Product Requirements Document"
Cohesion: 0.48
Nodes (4): Product Requirements Document, Developer Personas & Target Audience, Core TypeScript Data Models, Technical Architecture & System Design

### Community 41 - "🚀 BugBuddy v0.1.0 — Deployment Checklist"
Cohesion: 0.29
Nodes (6): 1. Pre-Deployment Configuration Verification, 2. Backend Web Service Deployment (`bugbuddy-backend`), 3. Frontend Static Site Deployment (`bugbuddy-frontend`), 4. Post-Deployment Smoke Verification, 5. Security Tightening & Rollback Ready, 🚀 BugBuddy v0.1.0 — Deployment Checklist

### Community 42 - "v0.1.0/CHANGELOG.md"
Cohesion: 0.33
Nodes (4): [0.1.0-rc1] - 2026-10-11, Added, BugBuddy v0.1.0 Release Changelog, Initial Release Candidate (v0.1.0-rc1)

### Community 43 - "⚠️ BugBuddy v0.1.0 — Known Limitations & Architectural Boundaries"
Cohesion: 0.33
Nodes (5): 1. Provider Credentials & Deterministic Fallback Mode, 2. State & Persistence Boundaries, 3. Runtime & Performance Considerations, 4. Scope Non-Goals for v0.1.0, ⚠️ BugBuddy v0.1.0 — Known Limitations & Architectural Boundaries

### Community 44 - "README.md"
Cohesion: 0.33
Nodes (4): 📦 BugBuddy Release Package — v0.1.0 (Release Candidate), 📋 Overview, 🗂️ Package Contents, 🚦 Release Status Policy

### Community 45 - "🚦 BugBuddy v0.1.0 — Release Checklist & Governance Gates"
Cohesion: 0.33
Nodes (5): 1. Entry Criteria (Release Candidate Eligibility), 2. Transition Gate (Owner Manual Approval), 3. Exit Criteria (Official Public Release Publication), 4. Failure Handling & Abort Criteria, 🚦 BugBuddy v0.1.0 — Release Checklist & Governance Gates

### Community 46 - "AI System Prompt & Coding Directives"
Cohesion: 0.40
Nodes (5): Codebase Integrity & Free Tooling Rules, Gamified Vocabulary Enforcement, AI System Prompt & Coding Directives, BugBuddy Core Overview, Minecraft Survival Metaphor

### Community 47 - "🧪 BugBuddy v0.1.0 — QA Audit & Verification Report"
Cohesion: 0.40
Nodes (4): 1. Automated Preflight Gate Summary, 2. Browser E2E Audit Results (Local Test: http://localhost:3000), 3. Deployed Production Testing Status, 🧪 BugBuddy v0.1.0 — QA Audit & Verification Report

### Community 48 - "Client State & Survival Engine"
Cohesion: 0.50
Nodes (4): Phase 2: Survival Mechanics & Mob Engine, Core Product Features & Game Loop, Client State & Survival Engine, Hearts, Hunger & XP Hotbar HUD

### Community 49 - "3. Canonical Metadata Schema"
Cohesion: 0.50
Nodes (4): 3. Canonical Metadata Schema, Supported Categories, Supported Difficulties, Supported Language Identifiers

## Knowledge Gaps
- **14 isolated node(s):** `tsx`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scanAndRedactSecrets()` connect `types/index.ts` to `1. Implemented Security Controls`, `BugBuddy — Technical Requirements Document (TRD)`, `[0.1.0] - 2026-10-11 (Release Candidate)`, `🤖 General Agent Working Directives`, `🤝 Contributing to BugBuddy`, `v0.1.0/CHANGELOG.md`, `App.tsx`, `🔒 Security Policy`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `KnowledgeSearchIndex` (e.g. with `Indexing and Searching via `KnowledgeSearchIndex`` and `5.1 Architecture & Modules`) actually correct?**
  _`KnowledgeSearchIndex` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `tsx`, `@types/node`, `@types/react` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09573412698412699 - nodes in this community are weakly interconnected._
- **Why does `5. Security & Boundary Architecture` connect `BugBuddy — Technical Requirements Document (TRD)` to `types/index.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `NormalizedKnowledgeRecord` (e.g. with `Normalized Knowledge Record` and `5.1 Architecture & Modules`) actually correct?**
  _`NormalizedKnowledgeRecord` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `search.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06593707250341997 - nodes in this community are weakly interconnected._