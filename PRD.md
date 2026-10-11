# BugBuddy — Product Requirements Document (PRD)

**Version:** 1.2.0 (Release Candidate v0.1.0)  
**Status:** Approved Specification  
**Canonical Document:** [docs/PRD.md](docs/PRD.md)  
**Technical Architecture:** [TRD.md](TRD.md) | [docs/TRD.md](docs/TRD.md)  
**UI/UX Specification:** [docs/UI_UX.md](docs/UI_UX.md)  
**Deployment Guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)  
**Release Directory:** [releases/v0.1.0/](releases/v0.1.0/)

---

## 1. Executive Summary

**BugBuddy** is a gamified, AI-powered debugging assistant and developer productivity companion styled as a **Minecraft-Inspired Developer Survival World**.

> *"Your bugs are fixable. Your pet's disappointment is optional."*

BugBuddy resolves the acute frustration and isolation of debugging through two synchronized subsystems:
1. **The Bug Confession Booth (Altar of Syntactic Penance)**: Developers submit buggy code or compiler errors across six languages (C, C++, Java, Python, JavaScript, TypeScript) and receive a humorous roast followed by a grounded root-cause diagnosis, verified code fix, and tests.
2. **The Procrastination Pet (Survival Base Companion)**: A virtual cyber-golem companion (ByteBuddy) whose emotional state responds directly to developer progress. Slaying bugs awards XP, levels up the player, and unlocks celebrations.

---

## 2. Problem Statement & Target Audience

### The Core Problem
- **Debugging Isolation**: Developers spend up to 50% of their working hours troubleshooting cryptic errors in total isolation.
- **The Procrastination Spiral**: Intimidating bugs prompt tab-switching to social media or videos, derailing development velocity.
- **Sycophantic Commercial AI**: Generic chatbots bury the actual root cause under patronizing pleasantries and fail to challenge bad coding patterns.
- **Zero Dopamine**: Traditional IDEs and issue trackers provide zero positive reinforcement for solving tough technical challenges.

### Target Personas
- **Novice Nora (CS Student / Bootcamper)**: Struggling with foundational memory errors (C pointer dereferences, Python mutable defaults) and needing compassionate, jargon-free explanations.
- **Procrastinating Pete (Junior / Mid Software Engineer)**: Easily distracted when encountering intimidating runtime crashes; needs gamified streaks, quests, and immediate visual progress.
- **Senior Sam (Lead Architect / Senior Engineer)**: Demands immediate, concise minimal diffs, compiler error explanations, and zero fluff.

---

## 3. Product Vision & Principles

1. **Gamified Accountability**: Transform bug-fixing into an active survival quest.
2. **Unvarnished Technical Truth**: Deliver sharp, sarcastic roasts that call out anti-patterns, paired immediately with rock-solid, production-grade solutions.
3. **Resilient Offline Fallback**: The app must remain 100% operational offline or when third-party cloud API keys are absent, using curated deterministic knowledge.
4. **Zero-Execution Safety**: User code is never compiled, eval'd, or executed on the host. Analysis is purely static and semantic.
5. **Privacy First**: Sensitive credentials (API keys, tokens, passwords) are scrubbed client-side before any diagnostic payload leaves the browser.

---

## 4. MVP Scope & Functional Requirements

| Requirement ID | Module | Status | Description |
| :--- | :--- | :---: | :--- |
| **FR-001** | Base Camp HUD | ✅ Complete | Pixel HUD with player level, XP bar, campfire streak, and 8-slot developer inventory. |
| **FR-002** | Confession Booth | ✅ Complete | Multi-language code editor supporting C, C++, Java, Python, JS, TS with sample snippets. |
| **FR-003** | Secret Redactor | ✅ Complete | Heuristic regex scanner stripping API keys, tokens, and credentials before transmission. |
| **FR-004** | JudgmentTerminal | ✅ Complete | Renders sarcastic roast, root cause analysis, fix diff, explanation, and tests. |
| **FR-005** | Truthful Verification | ✅ Complete | Explicit "Verify & Resolve Bug" action required to award +50 XP and archive to Graveyard. |
| **FR-006** | Debugging Chat | ✅ Complete | Multi-turn chat workbench with 7 action chips (Simpler, Deeper, Minimal Diff, etc.). |
| **FR-007** | Pet Habitat | ✅ Complete | Interactive pixel pet with 5 moods (`HAPPY`, `NEUTRAL`, `DISAPPOINTED`, `DRAMATIC_DESPAIR`, `VICTORIOUS`) and Feed/Pet/Play actions. |
| **FR-008** | Quest Board | ✅ Complete | Daily quests and sprint tasks with progress tracking and XP rewards. |
| **FR-009** | Bug Graveyard | ✅ Complete | Historical log of slayed bugs with language filters, category tags, and tombstones. |
| **FR-010** | Knowledge Codex | ✅ Complete | Searchable index of all 60 curated knowledge records with detail inspection modals. |
| **FR-011** | Settings Screen | ✅ Complete | Accessibility options (Clean Font, High Contrast), audio controls, and local data purge. |
| **FR-012** | AI Backend Service | ✅ Complete | Node.js HTTP server supporting Gemini, OpenAI, and Mock providers with 64KB limits. |

### Explicit Non-Goals (v0.1.0 MVP)
- Remote code execution or compiler sandboxes.
- Invasive browser surveillance or webcam tracking.
- Mandatory user accounts, passwords, or paid subscriptions.
- Multiplayer raids or boss fights (scheduled for Phase 4).

---

## 5. Non-Functional Requirements (NFRs)

- **Performance**: Static UI loads in < 1 second. Diagnostic responses render in < 1.5 seconds.
- **Accessibility**: Complies with WCAG 2.1 AA standards; high-contrast mode and clean sans-serif font toggle.
- **Reliability**: 100% uptime through client-side deterministic fallback when backend or external AI is offline.
- **Security**: 64 KB maximum payload limit on API requests; no API keys embedded in client bundles.

For the full detailed specification, consult the comprehensive [docs/PRD.md](docs/PRD.md).
