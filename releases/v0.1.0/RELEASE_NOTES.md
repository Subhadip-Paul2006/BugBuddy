# 📢 BugBuddy v0.1.0 Release Notes

**Version:** `0.1.0-rc1`  
**Status:** Release Candidate  
**Date:** October 11, 2026  
**Tagline:** *"Your bugs are fixable. Your pet's disappointment is optional."*

---

## 🌟 Executive Summary

We are excited to announce the first Release Candidate of **BugBuddy (v0.1.0)**!

BugBuddy transforms debugging from a frustrating, isolated chore into an entertaining, gamified quest styled as a **Minecraft-Inspired Developer Survival World**. By combining brutally honest, satirical bug roasts with grounded root cause diagnoses, verified fixes, and an emotionally dynamic virtual pet, BugBuddy brings fun, accountability, and dopamine back to programming.

---

## 🚀 Key Features

### 1. The Bug Confession Booth (Altar of Penance)
- Submit code snippets, compiler dumps, or runtime errors across **6 first-class programming languages**: C, C++, Java, Python, JavaScript, and TypeScript.
- **Client-Side Secret Redaction**: Proprietary API keys (`sk-...`, `AIzaSy...`), JWTs, and passwords are automatically stripped before analysis.
- **JudgmentTerminal**: Delivers a sharp, humorous roast of your coding blunders, paired immediately with a technical root cause diagnosis, clean fix diff, and verification tests.
- **Truthful XP Progression**: Gain **+50 XP** and hear an 8-bit victory chime only when you explicitly verify and resolve the bug!

### 2. ByteBuddy — Virtual Cyber-Golem Companion
- Adopt an animated pixel pet who reacts in real-time to your coding productivity.
- **5 Dynamic Moods**: `HAPPY`, `NEUTRAL`, `DISAPPOINTED`, `DRAMATIC_DESPAIR`, and `VICTORIOUS`.
- **Pet Care Actions**: Feed ByteBuddy pixel snacks, pet him for heart particles, or play fetch to boost his happiness.
- **Retro Web Audio Synthesizer**: Procedural 8-bit sound effects for clicks, level-ups, error tones, and ambient chiptune tracks.

### 3. Interactive Multi-Turn Debugging Chat
- Continue conversations after your initial diagnosis with full context memory.
- **7 Contextual Action Chips**:
  - `[🐾 Simpler]`: Plain-English analogy without technical jargon.
  - `[👁 Deeper]`: Compiler internals, memory layouts, and language specs.
  - `[🧹 Minimal Diff]`: The absolute tightest 1–3 line surgical patch.
  - `[📖 Worked Example]`: Complete self-contained runnable script.
  - `[📜 More Tests]`: 3 edge-case test assertions to prevent regressions.
  - `[⚡ Explain Specific Line]`: Evaluation context for the failing line.
  - `[🔥 Roast Again]`: Another satirical jab at developer bad habits.

### 4. Grounded Multi-Language Knowledge Base (RAG)
- **60 Curated Records**: 10 deeply verified diagnostic records for each of the 6 languages.
- **Hybrid Retrieval Engine**: In-memory BM25 keyword matching fused with dense ONNX vector search (`Xenova/all-MiniLM-L6-v2`) via Reciprocal Rank Fusion (RRF).
- **Zero-Key Offline Fallback**: Fully functional out of the box with zero external API keys required.

### 5. Gamified Productivity Suite
- **Base Camp Dashboard**: Central hub displaying your developer level, current XP bar, streak campfire, and mood status.
- **Quest Board**: Daily quests and sprint goals offering bonus XP rewards.
- **Bug Graveyard**: Historical archive of slayed bugs with language filter badges and tombstone cards.
- **Knowledge Codex**: Browse and inspect all 60 curated knowledge records with official reference documentation links.
- **Accessibility & Settings**: Clean Sans-Serif font toggle, High Contrast mode, SFX/music volume toggles, and local storage purge.

---

## 💻 Supported Languages
- **C** (Memory leaks, null pointer dereferences, buffer overflows)
- **C++** (RAII violations, dangling string_views, circular shared_ptrs)
- **Java** (NullPointerExceptions, Arrays.asList mutation, equals/hashCode contracts)
- **Python** (Mutable default arguments, generator exhaustion, missing self)
- **JavaScript** (Event loop starvation, float precision, unhandled promise rejections)
- **TypeScript** (Readonly array mutation, union narrowing, excess property checks)

---

## 🛠️ Getting Started

```bash
# Clone and install
git clone https://github.com/Subhadip-Paul2006/BugBuddy.git
cd BugBuddy
npm install

# Start backend server
npm start

# Start frontend dev server
npm run dev
```

Visit `http://localhost:3000` to begin debugging!

---

## ⚠️ Known Limitations
- Cloud AI features require server-side `GEMINI_API_KEY` or `OPENAI_API_KEY`. Without keys, the system truthfully operates in Stage 4 deterministic fallback mode.
- Player stats, quests, and graveyard logs persist locally in the browser (`localStorage`) without multi-device cloud accounts.
- Cold-start delays (~1.5s) may occur on initial vector model initialization on low-memory instances.

---

## 🔒 Security & Privacy
- Code is **never executed or compiled** on the host machine.
- User code is sanitized client-side before transmission.
- Request payloads are limited to 64 KB.
- All AI provider secrets remain strictly server-side.
