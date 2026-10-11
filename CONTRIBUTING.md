# 🤝 Contributing to BugBuddy

Thank you for your interest in contributing to BugBuddy! We welcome contributions from developers of all experience levels.

---

## 1. Ways to Contribute

1. **Knowledge Base Records**: Add verified common compiler traps, memory leaks, and syntax gotchas to `knowledge/*.json`.
2. **Bug Fixes & Engine Improvements**: Enhance error classification, heuristic pattern matching, or response assembling.
3. **UI / UX Polish**: Improve pixel-art components, accessibility (WCAG AA), or retro sound effects in `src/components/`.
4. **Documentation**: Clarify tutorials, add worked debugging examples, or improve API documentation.

---

## 2. Development & Branch Workflow

1. **Fork & Branch**:
   - Fork the repository to your GitHub account.
   - Create a feature branch with a descriptive name:
     ```bash
     git checkout -b feat/add-python-asyncio-knowledge
     ```
2. **Local Preflight Verification**:
   - Ensure all quality gates pass locally before opening a Pull Request:
     ```bash
     npm run validate:knowledge  # Schema & record check
     npm test                    # All 192 unit tests
     npm run evaluate:retrieval  # Benchmark accuracy
     npm run build               # TypeScript compilation & Vite bundle
     ```
3. **Commit Messages**:
   - We recommend Conventional Commits:
     - `feat:` New features or UI components
     - `fix:` Bug fixes or diagnostic corrections
     - `docs:` Documentation improvements
     - `test:` Adding or updating tests
     - `refactor:` Code restructuring without functional changes

---

## 3. Knowledge Base Entry Standards

When adding entries to `knowledge/{language}.json`:
- Follow the schema defined in `src/knowledge/schema.ts`.
- Every entry must include:
  - Unique `id` prefixed with language code (e.g., `py-mutable-default-argument`).
  - Clear `title`, `category`, and `severity`.
  - Canonical `buggyExample` and verified `fixedExample`.
  - Grounded `explanation` detailing why the fix works.
  - At least one authoritative documentation `source` with official URL.
- Run `npm run validate:knowledge` to verify syntax and check for duplicate IDs.

---

## 4. Coding Standards

- **TypeScript Strictness**: No implicit `any`. Always specify types for props, states, and return signatures.
- **Design System Conformance**: Use CSS variables from `src/styles/pixel-ui.css` (`--bb-surface-base`, `--bb-color-emerald`, etc.). Do not introduce arbitrary ad-hoc inline hex codes.
- **No Direct Code Execution**: BugBuddy analyzes code statically; never introduce libraries or mechanisms that execute user code.
- **Client-Side Secret Redaction**: Ensure any new user-input paths pass through `scanAndRedactSecrets()`.

---

## 5. Submitting Pull Requests

- Keep PRs focused on a single concern.
- Describe the changes clearly and link related issues.
- Confirm that all preflight commands (`npm test`, `npm run build`, `npm run validate:knowledge`) pass.
- Maintainers will review your PR and provide constructive feedback.
