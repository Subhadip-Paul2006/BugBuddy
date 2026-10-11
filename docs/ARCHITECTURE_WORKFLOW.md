# 🏛️ BugBuddy — Architecture Documentation & Visualization Workflow

This document defines the architectural documentation policy, the Mermaid version-controlled standard, and the integration protocol for the external Archify visualization tool.

---

## 1. Source-of-Truth Policy

1. **Implementation Code is Primary**: All architecture diagrams, technical specifications, and API contracts derive directly from source code in `src/` and `knowledge/`.
2. **Mermaid Diagrams are the Repository Standard**:
   - Stored as declarative `.mmd` files in [`docs/architecture/diagrams/`](file:///d:/GHW_Challange01/docs/architecture/diagrams/).
   - Renderable directly inside GitHub, IDE Markdown previews, and documentation viewers without external binary dependencies.
   - Diffable in Git pull requests with zero binary churn.
3. **Synchronization Rule**: Any changes to backend endpoints, retrieval flows, or UI components must update the corresponding diagram in `docs/architecture/diagrams/`.

---

## 2. Archify Investigation & Integration Status

### 2.1 Research Summary
- **Tool**: Archify (`v3.0.1`, stable) by `tt-a1i/archify` ([https://github.com/tt-a1i/archify](https://github.com/tt-a1i/archify)).
- **Purpose**: Generates interactive, standalone HTML/SVG diagrams with path tracing, reach analysis, and keyboard exploration from typed JSON Intermediate Representations (IR).
- **Scope Boundary**: Archify is an **offline visualization and documentation generator**, not an in-app runtime dependency. It does not perform automated static code analysis on C/C++/Java/Python source files.

### 2.2 Current Environment Status & Blocker Report
- **Status**: **NOT INSTALLED LOCALLY (Reported Blocker)**
- **Evidence**:
  - `Get-Command archify`: Returned empty (command not found on host).
  - `npm list -g archify`: Returned empty.
  - `npm list archify`: Returned empty.
- **Epistemic Integrity Notice**: Per BugBuddy release safety guidelines, we truthfully report that Archify CLI is not present on the current host. No fabricated execution claims or mock HTML artifacts are committed. All architectural documentation is fully served by native, standard Mermaid diagrams.

### 2.3 Standalone Archify Generation Workflow (For Operators)
When the Archify CLI or repository is made available to an operator or CI runner, execute the following commands:

```bash
# 1. Environment diagnostic check
node archify/bin/archify.mjs doctor

# 2. Validate diagram JSON Intermediate Representation
node archify/bin/archify.mjs validate architecture docs/architecture/ir/system-architecture.json --quality showcase --json

# 3. Deliver standalone interactive HTML visualization
node archify/bin/archify.mjs finalize architecture docs/architecture/ir/system-architecture.json docs/architecture/archify-architecture.html --quality showcase --json
```

---

## 3. Active Architecture Diagrams Inventory

The following 8 Mermaid diagrams constitute the active system model:

| Diagram File | Category | Description |
| :--- | :--- | :--- |
| [`system-context.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/system-context.mmd) | System Context | End-to-end overview: Developer, Vite SPA, Node backend, KB, AI providers |
| [`application-architecture.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/application-architecture.mmd) | Component Architecture | 8 UI screens, client audio/storage services, router, orchestrator, dual search indexes |
| [`diagnosis-sequence.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/diagnosis-sequence.mmd) | Sequence Diagram | User confession flow: Redaction, backend dispatch, hybrid retrieval, AI/fallback, resolution |
| [`knowledge-retrieval.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/knowledge-retrieval.mmd) | Retrieval Pipeline | Ingestion, validation, BM25 keyword scoring, ONNX vector search, RRF fusion, provenance |
| [`deployment-architecture.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/deployment-architecture.mmd) | Cloud Infrastructure | Render Static Site + Web Service, CDN, health probes, CORS boundary, secret isolation |
| [`ci-release-workflow.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/ci-release-workflow.mmd) | Release Process | Local preflight gates, GitHub Actions CI matrix, manual approval, production deploy |
| [`bugbuddy-user-journey.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/bugbuddy-user-journey.mmd) | User Journey | Base Camp navigation, Confession Booth, JudgmentTerminal, XP gain, level up, Graveyard |
| [`release-lifecycle.mmd`](file:///d:/GHW_Challange01/docs/architecture/diagrams/release-lifecycle.mmd) | State Machine | Development -> Local Preflight -> Release Candidate -> CI -> Deployment -> v0.1.0 Release |

---

## 4. Maintenance & Validation Procedure

1. **Diagram Syntax Validation**: All diagrams use GitHub Flavored Markdown-compatible Mermaid syntax.
2. **Review on Pull Requests**: When adding or renaming services or endpoints, update the corresponding diagram in `docs/architecture/diagrams/`.
3. **No Circular Overwrites**: Documentation generators must never overwrite their source specification files.
