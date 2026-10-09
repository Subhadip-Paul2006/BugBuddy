# Implementation Phases Roadmap (PHASES.md)

## Project: BugBuddy
**Document Version:** 1.1.0  
**Status:** Approved  
**Author:** Senior Software Architect & Product Manager  
**Reference Link:** [README.md](../README.md) | [PRD.md](PRD.md) | [TRD.md](TRD.md) | [AI_INSTRUCTIONS.md](../AI_INSTRUCTIONS.md)

---

## Roadmap Overview

BugBuddy is delivered through five sequential, test-gated phases. Each phase is self-contained, builds upon verified prior deliverables, and maintains an executable, testable state at every step.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      Sequential Delivery Pipeline                      │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│   Phase 0   │   Phase 1   │   Phase 2   │   Phase 3   │    Phase 4     │
│ Baseline &  │   UI Shell  │  Confession │ Interactive │ Integration,   │
│ Arch Specs  │    & Pet    │   Engine    │ AI/RAG Chat │ E2E & Release  │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

---

## Phase 0 — Documentation and Architecture Baseline

- **Objective**: Establish complete, consistent, and validated product requirements, engineering architecture, Archify-modeled system diagrams, language registry designs, and agent operational guidelines.
- **Deliverables**:
  - `README.md`: Project landing page, tech stack specification, and documentation directory.
  - `docs/PRD.md`: Behavioral product requirements, user personas, functional and non-functional requirements.
  - `docs/TRD.md`: Engineering specifications, component architecture, schemas, and traceability matrix.
  - `AI_INSTRUCTIONS.md`: Strict agent guidelines and sarcastic persona rules.
  - `docs/PHASES.md`: Sequential delivery roadmap with explicit acceptance gates.
- **Dependencies**: None.
- **Acceptance Criteria**:
  - All five required documents exist in the workspace and link correctly to one another using GitHub-compatible relative paths.
  - Explicit first-class support defined for C, C++, Java, Python, JavaScript, and TypeScript.
  - Error classification defined for all 8 required categories.
  - Sarcastic tone guidelines and forbidden pleasantries clearly defined.
- **Testing Requirements**:
  - Markdown syntax and internal link validation across all documents.
  - Mermaid diagram syntax validation.
- **Definition of Done**:
  - All documents approved and baseline committed to the repository without open architectural ambiguities.

---

## Phase 1 — UI Foundation and Virtual Pet

- **Objective**: Construct the responsive application shell, dark-mode design system, interactive Procrastination Pet visualizer, task management board, deterministic mood state machine, XP progression, and browser persistence.
- **Deliverables**:
  - Vite + React 18 + TypeScript project foundation.
  - Vanilla CSS design tokens (`src/styles/tokens.css`, `src/styles/theme.css`) with glassmorphic cards and dark palette.
  - `PetStage` component with animated SVG pet avatar supporting 5 moods (`ECSTATIC`, `HAPPY`, `NEUTRAL`, `DISAPPOINTED`, `DRAMATIC_DESPAIR`).
  - Deterministic `PetStateMachine` implementing polynomial XP formula and mood transitions.
  - `TaskBoard` component supporting task creation, countdown timers, snooze actions, and completion checkboxes.
  - `StorageService` implementing local persistence via `IndexedDB` / `localStorage` with JSON export/import.
- **Dependencies**: Phase 0 baseline.
- **Acceptance Criteria**:
  - User can create tasks with countdown timers, trigger snoozes, and observe deterministic pet mood drops.
  - Completing a task awards XP, updates the level bar, and triggers a happy celebration animation.
  - Reloading the browser preserves tasks, pet level, XP, and mood.
- **Testing Requirements**:
  - Unit tests for `PetStateMachine` (XP calculations, level thresholds, mood transitions).
  - Component tests for `PetStage` and `TaskBoard`.
- **Definition of Done**:
  - UI renders cleanly on desktop and mobile viewports with zero console errors and 100% passing state machine tests.

---

## Phase 2 — Bug Confession and Debugging Engine

- **Objective**: Build the Confession Booth input interface, language adapter registry, client secret redactor, error classification engine, sarcastic roast generator, and offline mock provider.
- **Deliverables**:
  - `ConfessionInputBox` with syntax input, character counter (20k max), and language picker.
  - `SecretRedactor` scanning and redacting API keys, JWTs, and passwords.
  - `LanguageRegistry` and concrete `ILanguageAdapter` implementations for C, C++, Java, Python, JavaScript, and TypeScript.
  - `ErrorClassifier` categorizing submissions into the 8 defined error categories.
  - `OfflineMockProvider` providing 50+ rich sarcastic roasts, diagnoses, diffs, and test suggestions.
  - `DiagnosticCard` displaying roasts, category badges, code diffs, and verification steps.
- **Dependencies**: Phase 1 UI shell.
- **Acceptance Criteria**:
  - Pasting code with an API key automatically redacts the credential and triggers a warning banner.
  - Submissions in any of the 6 languages are correctly identified and processed.
  - Nonsensical submissions receive a brief roast, an explanation of missing info, and a targeted question.
  - Difficult/ambiguous errors acknowledge uncertainty and suggest diagnostic tests rather than inventing root causes.
  - Zero-key offline mode functions seamlessly without external network requests.
- **Testing Requirements**:
  - Unit tests for all 6 language adapters (detection heuristics, hint matching, test templates).
  - Unit tests for `SecretRedactor` regexes.
  - Contract validation verifying mock responses against `DebugResponse` schema.
- **Definition of Done**:
  - A user can confess bugs in all 6 languages and receive structured diagnoses and roasts offline.

---

## Phase 3 — Interactive AI and RAG Chat

- **Objective**: Implement multi-turn conversational context, curated knowledge-base retrieval (RAG), one-click interactive action buttons, live cloud AI provider adapters (Gemini, OpenAI, Anthropic), and automated fallback cascades.
- **Deliverables**:
  - `ILLMProvider` interface and adapters for Google Gemini, OpenAI, Anthropic, and Mock.
  - Provider configuration modal allowing users to enter optional personal API keys.
  - In-memory curated knowledge base and BM25/cosine similarity retriever for official language docs.
  - `InteractiveActionBar` supporting one-click triggers: *Simpler*, *Deeper*, *Minimal Fix*, *Worked Example*, *More Tests*, *Explain Line*, *Another Roast*.
  - Multi-turn conversation state manager preserving chat history.
  - Prompt injection defense delimiters isolating untrusted user code.
- **Dependencies**: Phase 2 debugging pipeline.
- **Acceptance Criteria**:
  - Clicking any action button generates a contextual follow-up adhering to the active persona.
  - Retrieved documentation is cited with valid source titles and canonical URLs.
  - If a cloud API key fails, times out (15s), or hits rate limits, the system automatically falls back to `OfflineMockProvider` without crashing.
- **Testing Requirements**:
  - Unit tests for RAG retriever ranking and threshold filtering.
  - Provider fallback integration tests simulating API timeouts and HTTP 429 errors.
  - Security tests verifying prompt boundary escaping.
- **Definition of Done**:
  - Multi-turn interactive debugging works with both live AI providers and offline mock fallback.

---

## Phase 4 — Integration, Testing, and Release

- **Objective**: Execute end-to-end user journey validation, accessibility compliance, performance profiling, cross-browser verification, and static production deployment.
- **Deliverables**:
  - End-to-end test suite using Playwright covering core user journeys (Confession, Procrastination, Deep-dive).
  - WCAG 2.1 AA accessibility audit and fixes (`aria-live` regions, keyboard focus navigation).
  - Responsive design polish for mobile, tablet, and desktop viewports.
  - Production build configuration and static deployment pipeline (Vercel / Netlify / GitHub Pages).
  - Finalized release documentation and user manual.
- **Dependencies**: Phases 1, 2, and 3.
- **Acceptance Criteria**:
  - All automated unit, component, and E2E tests pass in CI.
  - Lighthouse scores: Performance > 90, Accessibility > 95, Best Practices > 95.
  - First Contentful Paint < 1.2s; bundle size < 180 KB gzipped.
  - Complete user journeys execute without layout breaks on desktop and mobile viewports.
- **Testing Requirements**:
  - Full Playwright E2E test suite.
  - Axe-core accessibility automated scanner.
- **Definition of Done**:
  - Application deployed to static production host with 100% passing tests and verified zero-key functionality.
