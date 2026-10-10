# BugBuddy UI/UX Specification: Minecraft-Inspired Isometric Pixel World
**The Living Developer Survival Base**

**Document ID:** `BUGBUDDY-UI-UX-SPEC-V2`  
**Document Version:** `2.0.0`  
**Status:** Approved Master Specification  
**Lead Roles:** Senior Game UI/UX Designer, Pixel-Art Art Director, Frontend Architect, Design Systems Engineer  
**Reference Index:** [README.md](../README.md) | [docs/PRD.md](PRD.md) | [docs/TRD.md](TRD.md) | [docs/PHASES.md](PHASES.md) | [AI_INSTRUCTIONS.md](../AI_INSTRUCTIONS.md) | [docs/DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md)

---

## 1. Executive Summary & Creative Direction

### 1.1 The Metaphor: The Developer's Isometric Survival Base
Software engineering is a survival adventure. Developers journey into dark, chaotic codebases filled with lurking syntax creeps, volatile memory leaks, and ferocious stack traces. When overwhelmed by a cryptic runtime failure, the developer retreats to their **Survival Base**—BugBuddy.

BugBuddy is **not** a generic corporate SaaS dashboard decorated with square corners and muted greens. It is an **authentic, living isometric pixel-art game environment** combined with an ergonomic, high-performance developer workspace. It captures the tactile charm, voxel block geometry, and satisfying progression of classic block-building survival games (inspired by Minecraft's visual grammar) while maintaining 100% utility, speed, and code readability.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BUGBUDDY CORE ISOMETRIC METAPHOR                               │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ Game Element             │ Developer Reality Equivalent                                │
├──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Isometric Base Camp      │ Central Habitual Dashboard & Productivity Campfire          │
│ The Hearth Companion     │ "ByteBuddy" — Virtual Pixel Companion & Sarcastic Mentor    │
│ The Altar of Penance     │ Bug Confession Booth (Multi-Language Code Input & Redaction)│
│ Crafting Terminal        │ Interactive Multi-Turn Debugging Chat Workspace             │
│ Notice & Quest Board     │ Daily Coding Quests, Sprint Tasks & Timer Milestones        │
│ The Bug Graveyard        │ Historical Bug Archive, Post-Mortems & Resolution Shelf     │
│ The Explorer's Codex     │ Grounded Knowledge Base (RAG Documentation & Language Specs)│
│ Control Chest            │ Settings Panel (Themes, Pixel Fonts, Audio, Local API Keys) │
│ Hostile Mobs             │ Bugs: Creepers (Syntax), Skeletons (Types), Endermen (Leaks)│
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 1.2 Strict Art Direction Invariants
To maintain distinct game-world immersion without degrading developer ergonomics:
1. **Deliberately Visible Square Pixels**: All icons, character sprites, block textures, and UI borders adhere to integer-scaled pixel art (`image-rendering: pixelated`).
2. **Chunky Block Geometry**: UI panels feature 3-level voxel bevels (light highlight on top/left, deep shadow on bottom/right) simulating sculpted stone, dirt, and wood slabs.
3. **No Corporate SaaS Compromises**: Strictly **NO** generic glassmorphism, pastel gradients, floating pill cards, glossy 3D blobs, or generic vector illustrations.
4. **Code Readability Supremacy**: Source code, error stack traces, and detailed technical diagnoses are **never** rendered in pixel fonts. The display pixel fonts (`Press Start 2P`, `Silkscreen`, `VT323`) are reserved for headers, HUD statistics, and labels; code blocks use crisp monospace (`JetBrains Mono`), and body text uses legible system typography (`Inter`).
5. **Legally Clean Assets**: All art, textures, and sprites are original or open-source under permissive licenses (CC0/SIL OFL). No proprietary Minecraft skins, logos, or copyrighted Mojang assets are used.

---

## 2. Isometric World & Camera Direction

### 2.1 Geometric Perspective & Grid Mathematics
The main visual centerpiece is a **2.5D Isometric World** rendered with a classic 2:1 dimetric projection ratio (often referred to as game isometric).

```text
       Isometric Tile Projection (2:1 Ratio)
                 (0, 0)
                   /\
                  /  \
     (-1, 0)     /    \     (0, 1)
          \     / Tile \     /
           \   /  Top   \   /
            \ /          \ /
             V------------V
             |            |
  Tile Left  | Block Body |  Tile Right
    Face     |   Depth    |    Face
             |            |
             \            /
              \          /
               \        /
                \      /
                 V----V
```

- **Base Tile Dimensions**:
  - Tile Width ($W$): `64px`
  - Tile Height ($H$): `32px` ($W / 2$)
  - Vertical Block Height ($D$): `16px` (extruded block thickness)
- **Coordinate Transformation Matrix**:
  To convert 3D grid coordinates $(x, y, z)$ into 2D screen coordinates $(S_x, S_y)$:
  $$S_x = (x - y) \times \frac{W}{2} + \text{Origin}_x$$
  $$S_y = (x + y) \times \frac{H}{2} - (z \times D) + \text{Origin}_y$$
- **Depth Sorting Order (Z-Indexing)**:
  Sprites and terrain blocks are rendered back-to-front using depth metric:
  $$\text{Depth} = x + y + (z \times 2)$$

### 2.2 Voxel Palette & Surface Treatments
The world terrain is constructed from 7 distinct voxel types:

| Block Type | Top Face Hex | Light Face Hex (Left) | Dark Face Hex (Right) | Texture Motif |
| :--- | :--- | :--- | :--- | :--- |
| **Grass Block** | `#5B8C32` (Lush Green) | `#4A7328` | `#395A1E` | Pixelated grass fringe hanging over dirt edge |
| **Dirt Layer** | `#866043` (Rich Loam) | `#6E4E36` | `#563C2A` | Rough 2×2 square loam pebble speckles |
| **Chiseled Stone**| `#7F8287` (Granite Grey)| `#6B6D71` | `#57585C` | Inset mortar grooves with chipped stone bevels |
| **Oak Wood Planks**| `#A27848` (Warm Timber)| `#87643B` | `#6C4F2E` | Horizontal wood grain stripes with nail studs |
| **Obsidian** | `#261B3D` (Deep Purple) | `#1D142E` | `#140E20` | Subtle blue-magenta reflective crystalline shards |
| **Water / River** | `#2E72B8` (Azure Stream)| `#255D96` | `#1C4774` | Animated 2-frame 50% opacity undulating wave ripples |
| **Redstone Ore** | `#3A3A3C` (Stone Base) | `#2E2E30` | `#222224` | Glowing ruby crimson speckles (`#E53935`) |

### 2.3 Lighting, Shading & Depth Rules
1. **Directional Sun/Key Light**: Originates from the top-left (North-West) of the isometric space.
   - Top Face: 100% illumination (unshaded diffuse).
   - Left Face: 80% illumination (gentle half-tone shadow).
   - Right Face: 60% illumination (deep ambient occlusion shadow).
2. **Point Light (Campfire & Lanterns)**: The campfire in Base Camp casts dynamic warm amber illumination (`#F1C40F`, `#E67E22`) over adjacent tiles within a 3-block radius with subtle 2-frame flicker.
3. **Drop Shadows**: Characters and floating items cast a semi-transparent, pixelated 2D elliptical shadow (`rgba(0, 0, 0, 0.45)`) directly onto the block surface below.

### 2.4 World Framing & Viewport Hierarchy
The isometric world serves as an atmospheric diorama framed within the web app:
- **Desktop (>1024px)**:
  - Top: Fixed Game HUD (`56px` height).
  - Left: Developer Inventory Hotbar (`240px` width, collapsible to `64px`).
  - Center: Living Isometric Base Camp Stage (`420px` height) with interactive pet, campfire, and animated terrain, transitioning seamlessly into docked workspace panels below.
  - Right: Companion Status & Quest Drawer (`360px` width).
- **Tablet (768px–1024px)**:
  - Inventory collapses to icon-only hotbar (`64px`).
  - The isometric stage scales proportionally (integer pixel scaling).
  - Right panel collapses to an overlay drawer.
- **Mobile (<768px)**:
  - Stage renders as a focused 320×180px diorama centered on the pet.
  - UI collapses to single-column tabbed navigation with bottom game hotbar (`56px`).

---

## 3. The BugBuddy Virtual Companion: "ByteBuddy"

### 3.1 Creature Concept & Voxel Anatomy
The virtual pet, **ByteBuddy**, is an original cyber-golem creature inhabiting the developer's base camp. It is part mischievous bug, part sturdy blocky automaton.

```text
                 ByteBuddy Front/Isometric Blueprint
                          [ Antenna Orb ]  <- Pulses with XP / state
                                 ||
                          ┌──────────────┐
                          │  ■        ■  │ <- 2x2 Square Pixel Eyes
                          │   ┌──────┐   │ <- Expressive Mouth Block
                          │   └──────┘   │
                          └──────┬───────┘
                                 │
                          ┌──────┴───────┐
             [Left Arm]   │  [Heart Orb] │   [Right Arm / Tool]
             ┌────────┐   │  Core Chest  │   ┌────────┐
             │  4x6   │   └──────┬───────┘   │  4x6   │ (Holds Iron Wrench
             └────────┘          │           └────────┘  or Wooden Sword)
                          ┌──────┴───────┐
                          │  6x4   6x4   │ <- Sturdy Stubby Voxel Legs
                          └──────────────┘
```

- **Proportions**:
  - Head: `16×16×16px` cubic voxel head.
  - Eyes: `2×2px` square pixel pupils that blink, widen, or squint.
  - Body: `12×12×14px` torso with glowing emerald chest core.
  - Limbs: `4×4×6px` blocky arms and stubby `6×4×4px` legs.
  - Antenna: Single top antenna with a floating voxel crystal that changes color with pet mood.
- **Palette**: Slate iron body (`#4B5263`), emerald core (`#2ECC71`), warm gold eye accents (`#F1C40F`), and weathered stone joints (`#2E3440`).

### 3.2 Five Core Mood States & Sprite Specifications

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        BYTEBUDDY EMOTIONAL STATE TAXONOMY                              │
├───────────────────┬───────────────┬───────────────┬────────────────────────────────────┤
│ Mood State        │ Visual Sprite │ Animation     │ Dialogue & Trigger                 │
├───────────────────┼───────────────┼───────────────┼────────────────────────────────────┤
│ 1. ECSTATIC       │ 🌟 Glowing    │ 4-frame jump, │ "Three bugs squashed in a row!     │
│                   │ Emerald Crown │ gold sparkles │ Did you secretly become senior?"   │
│                   │ Wide eyes (o_o│ (120ms/frame) │ [Trigger: 3 bugs fixed in sprint]  │
├───────────────────┼───────────────┼───────────────┼────────────────────────────────────┤
│ 2. HAPPY          │ 😊 Warm Amber │ 2-frame bounce│ "Another syntax error slayed.      │
│                   │ Campfire sit  │ tail wag      │ The base campfire burns bright."   │
│                   │ Curved eyes   │ (250ms/frame) │ [Trigger: Bug resolved (+50 XP)]   │
├───────────────────┼───────────────┼───────────────┼────────────────────────────────────┤
│ 3. NEUTRAL        │ 😐 Attentive  │ Slow 2px chest│ "Code compiles. Tests are quiet.   │
│                   │ Iron Wrench   │ breathing,    │ What disaster are we causing next?"│
│                   │ Blink (3s)    │ (500ms/frame) │ [Trigger: Fresh session start]     │
├───────────────────┼───────────────┼───────────────┼────────────────────────────────────┤
│ 4. DISAPPOINTED   │ 😒 Slumped    │ Drooping ears,│ "I have watched paint dry faster   │
│                   │ Grey antenna  │ puff of smoke │ than this pull request."           │
│                   │ Half-slit eyes│ (400ms/frame) │ [Trigger: Timer expired / snoozed] │
├───────────────────┼───────────────┼───────────────┼────────────────────────────────────┤
│ 5. DRAMATIC_      │ 🌧️ Collapsed  │ Face-down slab│ "I am entering the void.           │
│    DESPAIR        │ Void raincloud│ twitching leg │ Even TypeScript couldn't save us." │
│                   │ X_X eyes      │ (300ms/frame) │ [Trigger: 3+ snoozes / crash]      │
└───────────────────┴───────────────┴───────────────┴────────────────────────────────────┘
```

### 3.3 Animation Engine & Reduced Motion Rules
- **Frame Rate**: Retro 4 FPS (250ms per frame) to 8 FPS (125ms per frame) using CSS `steps()` timing functions for an authentic retro feel:
  ```css
  animation: bytebuddy-bounce 1s steps(4) infinite;
  ```
- **Reduced Motion Fallback (`prefers-reduced-motion: reduce`)**:
  - Suppresses all jumping, hopping, floating particles, and camera shakes.
  - Replaces animated sprite sequences with single static expressive pose matching the active mood.
  - Retains speech bubbles and text-based dialogue updates without motion.

---

## 4. Main Screens Specification

### Screen A: Base Camp / Main Dashboard
The initial landing experience that grounds the developer in their survival base.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [TOP GAME HUD: DEV-PLAYER (LVL 3) | 519/800 XP [████████░░░░] | 🔥 4-DAY STREAK | [⚙️ SETTINGS]]        │
├───────────────┬────────────────────────────────────────────────────────┬───────────────────────────────┤
│ [INVENTORY]   │ [ISOMETRIC BASE CAMP DIORAMA]                          │ [PET & SPRINT COMPACT PANEL]  │
│               │ ┌────────────────────────────────────────────────────┐ │                               │
│ [🏕️] Base Camp│ │  /\                                                │ │ 🐾 BYTEBUDDY STATUS           │
│ [⚔️] Confess   │ │ /  \       [ByteBuddy (HAPPY)]                    │ │ Mood: HAPPY (Level 3)         │
│ [💬] Chat     │ │/    \      🔥 Campfire   🪵 Oak Log Bench          │ │ "Base secure. No crashes."   │
│ [📜] Quests   │ │\    /     🌱 Grass Voxel Terrain                   │ │                               │
│ [🐾] Habitat  │ │ \  /                                               │ │ 📜 DAILY QUEST OBJECTIVE      │
│ [🪦] History  │ │  \/                                                │ │ Fix 1 C++ Pointer Bug [1/2]   │
│ [📖] Codex    │ └────────────────────────────────────────────────────┘ │ Reward: +75 XP                │
│ [⚙️] Settings  │ ┌────────────────────────────────────────────────────┐ │                               │
│               │ │ ⚔️ PRIMARY ACTIONS HOTBAR                          │ │ ⏱️ ACTIVE SPRINT TIMER       │
│               │ │ [🗡️ CONFESS A BUG (C, C++, Java, Py, JS, TS)]      │ │ Task: Refactor Token Auth     │
│               │ │ [💬 RESUME CHAT]      [📜 VIEW QUEST BOARD]        │ │ Remaining: 24:18 [⏸️] [💤]   │
│               │ └────────────────────────────────────────────────────┘ │                               │
│               │ ┌─────────────────────────┬──────────────────────────┐ │ 🏆 RECENT ACHIEVEMENTS        │
│               │ │ 🪦 RECENT BUG POSTS     │ 📋 ACTIVE SPRINT TASKS   │ │ • NullPointer Conqueror (+50) │
│               │ │ • NullPointer (Java)    │ [x] Fix CORS in server   │ │ • 4-Day Streak Ember (+100)   │
│               │ │ • Segfault (C)          │ [ ] Check TS generics    │ │                               │
│               │ └─────────────────────────┴──────────────────────────┘ │                               │
└───────────────┴────────────────────────────────────────────────────────┴───────────────────────────────┘
```

- **Focal Point**: Central 2.5D diorama showing ByteBuddy resting by the campfire, with smoke particles rising in pixel steps.
- **Direct Actions**:
  - Large beveled emerald button `🗡️ CONFESS A BUG` triggers immediate transition to Screen B.
  - Stone hotbar buttons to resume last debugging conversation or open the quest board.
- **Live Widgets**: Recent bug resolutions and daily tasks with inline checkboxes triggering floating XP particles upon completion.

---

### Screen B: Bug Confession Booth
The sacred workstation where developers confess their code sins and receive instant diagnostics and humorous roasts.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚔️ THE BUG CONFESSION BOOTH — ALTAR OF SYNTACTIC PENANCE                                               │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [SELECT TARGET LANGUAGE]                                                                               │
│ [ C ] [ C++ ] [ Java ] [ Python ] [ JavaScript ] [ TypeScript ]  [⚡ AUTO-DETECT: C++]                 │
├────────────────────────────────────────────────────────┬───────────────────────────────────────────────┤
│ [CODE PENANCE INPUT]                                   │ [COMPILER TANTRUM / ERROR TRACE (OPTIONAL)]   │
│ ┌────────────────────────────────────────────────────┐ │ ┌───────────────────────────────────────────┐ │
│ │ 1 #include <iostream>                              │ │ │ g++ -Wall -O2 test.cpp                    │ │
│ │ 2 int main() {                                     │ │ │ Segmentation fault: 11 (core dumped)        │ │
│ │ 3     int* ptr = nullptr;                          │ │ │                                           │ │
│ │ 4     std::cout << *ptr << std::endl;              │ │ │                                           │ │
│ │ 5     return 0;                                    │ │ │                                           │ │
│ │ 6 }                                                │ │ │                                           │ │
│ └────────────────────────────────────────────────────┘ │ └───────────────────────────────────────────┘ │
│ Characters: 128 / 20,000 [🧹 CLEAR] [📋 PASTE DEMO]    │ Context: Nullptr dereference in main()        │
├────────────────────────────────────────────────────────┴───────────────────────────────────────────────┤
│ 🛡️ CLIENT SECRET SCANNER: [ACTIVE — API keys, JWTs, and passwords scrubbed locally before transmission]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                       [🔥 CONFESS BUG & RECEIVE SACRED ROAST (CTRL + ENTER)]                           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Monaco/CodeMirror Integration**: Monospace high-contrast editor with syntax highlighting, line numbers, and indentation guides. Pixel fonts are strictly avoided in code text.
- **Language Selector Hotbar**: 6 stone slab buttons with language badges. Active selection has an illuminated gold bevel.
- **Client-Side Secret Shield**: Live scanning banner verifying that API tokens, credentials, and passwords never leave the browser unmasked.
- **Diagnostic Result Card (The Judgment)**:
  - **The Roast**: Bold satirical roast from ByteBuddy.
  - **Root Cause & Classification**: Categorized tag (e.g., `[Null Dereference]`, `[Memory Management]`).
  - **Minimal Code Diff**: Unified or split diff with green addition / red deletion blocks and 1-click copy.
  - **Reproducible Test Command**: Shell command to verify fix (e.g., `g++ -fsanitize=address ...`).
  - **Codex Citations**: Grounded links to official documentation (ISO C++, MDN, Oracle Java).

---

### Screen C: Interactive Debugging Chat
A multi-turn collaborative terminal workstation where the developer and ByteBuddy work through complex problems together.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 💬 DEBUGGING WORKBENCH: MULTI-TURN SPRINT CHAT                                                         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Session #104: C++ Nullptr Dereference]  [Language: C++]  [Status: Diagnosed]  [🗑️ Clear] [➕ New]       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🧑‍💻 USER:                                                                          10:42 AM        │ │
│ │ My code crashed with Segfault 11 when accessing *ptr.                                              │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 🐛 BYTEBUDDY:                                                                      10:42 AM        │ │
│ │ 🔥 "You dereferenced nullptr with astonishing optimism. Did you expect the RAM to invent memory?"   │ │
│ │                                                                                                    │ │
│ │ 🔍 Diagnosis: Line 4 evaluated *ptr where ptr == nullptr (address 0x0). Unmapped page fault.       │ │
│ │ 🛠️ Minimal Fix: Guard access with `if (ptr != nullptr)`.                                          │ │
│ │                                                                                                    │ │
│ │ ⚡ Contextual Follow-Up Actions:                                                                   │ │
│ │ [🐣 Simpler] [🔬 Deeper Mechanics] [✂️ Minimal Diff] [🧪 More Tests] [📍 Explain Line 4] [🔥 Roast]│ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────────────────┬─────────────┐ │
│ │ Type your follow-up inquiry or paste modified code...                                │ [⚔️ SEND]   │ │
│ └──────────────────────────────────────────────────────────────────────────────────────┴─────────────┘ │
│ [📎 Attach Code] [🧪 Generate Edge Cases] [✅ Mark Bug Resolved (+50 XP)]                              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Clear Separation of Messages**: User entries are styled in dark stone slabs with right alignment; ByteBuddy entries feature the companion's pixel avatar, sarcastic quote styling, and structured diff blocks.
- **7 Contextual Action Chips**:
  1. `🐣 Simpler Explanation` — Re-explains without technical jargon.
  2. `🔬 Deeper Technical Breakdown` — Explains kernel virtual memory, page tables, or bytecode.
  3. `✂️ Minimal Diff` — Tightest 1-3 line fix.
  4. `📦 Worked Example` — Complete self-contained runnable file.
  5. `🧪 More Debugging Tests` — 3 edge-case unit assertions.
  6. `📍 Explain Line X` — Deep-dive into specific line evaluations.
  7. `🔥 Roast Me Again` — Fresh satirical roast targeting developer bad habits.

---

### Screen D: Virtual Pet Habitat / Sanctuary
A full-screen interactive diorama dedicated to observing ByteBuddy's environment, mood history, and achievements.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🐾 BYTEBUDDY SANCTUARY & HABITAT                                                [🔍 ZOOM: 1x | 2x]     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                 [ISOMETRIC VOXEL HABITAT]                                          │ │
│ │                                                                                                    │ │
│ │                 🌱 Grass Terraces        🪵 Crafting Table       💧 Animated River Stream          │ │
│ │                       \                     /                         /                            │ │
│ │                        \     [ByteBuddy]   /                         /                             │ │
│ │                         \         🔥      /                         /                              │ │
│ │                          \    Campfire   /                         /                               │ │
│ │                           \             /                         /                                │ │
│ │                            \___________/                         /                                 │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────┬────────────────────────────────────────────────────────────────┤
│ 📊 PET WELLNESS & STATS               │ 🏆 UNLOCKED SURVIVAL TROPHIES                                  │
│ • Current Mood: HAPPY                 │ 🌟 [First Penance] Confessed initial bug (+50 XP)              │
│ • Happiness Level: 84 / 100           │ ⚔️ [Memory Slayer] Fixed 5 C/C++ memory errors (+150 XP)       │
│ • Survival Streak: 4 Days             │ 🛡️ [Secret Shield] Masked 10 secrets locally (+100 XP)         │
│ • Favorite Food: Coffee Voxel (+10)   │ 👑 [Senior Breakpoint] Reached Level 5 (+500 XP)               │
│ [☕ Feed Coffee Block] [🎾 Play Fetch]│ [🔒 Ender Dragon Slayer] Defeat final complex bug (Locked)     │
└───────────────────────────────────────┴────────────────────────────────────────────────────────────────┘
```

- **Interactive Habitat**: Users can click the habitat to cause ByteBuddy to walk over, perform cheerful hops, or interact with items (like the crafting bench).
- **Pet Care Actions**: Safe, fun gamification elements (e.g. feeding virtual coffee beans to boost pet cheerfulness without invasive real-world tracking).

---

### Screen E: Quest Board
A Minecraft-style wooden bulletin board displaying daily coding quests, active sprint tasks, and countdown timers.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📜 SURVIVAL QUEST BOARD & SPRINT TASKS                                           [RESETS IN: 14H 22M]  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🎯 DAILY CODING QUESTS                                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 📌 Quest 1: Confess any C or C++ Pointer Bug                                    Reward: +50 XP     │ │
│ │    Status: [████████████████████] 1/1 Completed                                [CLAIMED ✅]        │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 📌 Quest 2: Request a 'More Debugging Tests' follow-up in Chat                   Reward: +30 XP     │ │
│ │    Status: [░░░░░░░░░░░░░░░░░░░░] 0/1 In Progress                              [INCOMPLETE]        │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 📌 Quest 3: Complete a Sprint Task before timer expires                         Reward: +75 XP     │ │
│ │    Status: [██████████░░░░░░░░░░] 1/2 In Progress                              [INCOMPLETE]        │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📋 ACTIVE SPRINT TASKS                                                           [➕ ADD SPRINT TASK] │
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [ ] 1. Refactor async token refresh in auth service                      [⏱️ 18:42] [💤 SNOOZE]    │ │
│ │ [ ] 2. Fix TS2322 type mismatch in user profile interface               [⏱️ 45:00] [💤 SNOOZE]    │ │
│ │ [x] 3. Fix off-by-one loop index in Python data loader (Done)           [+100 XP CLAIMED ✅]       │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Parchment Styling**: Pinned paper cards with pixelated push-pins on an oak plank background.
- **Task Countdown Timers**: Monospace digital timer with redstone flashing animation when less than 5 minutes remain.

---

### Screen F: Bug Graveyard / Session History
An archive presented as labeled dungeon chests and gravestones commemorating resolved code defects.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🪦 THE BUG GRAVEYARD — ARCHIVE OF RESOLVED POST-MORTEMS                           [FILTER: ALL LANGS ▼]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 🪦 Gravestone #104: Nullptr Dereference in Vector Search                     Language: [ C++ ]     │ │
│ │    Slayed: Oct 10, 2026 | XP Awarded: +50 XP | Status: RESOLVED              [📖 VIEW POST-MORTEM] │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 🪦 Gravestone #103: ConcurrentModificationException in Event Bus            Language: [ Java ]    │ │
│ │    Slayed: Oct 09, 2026 | XP Awarded: +75 XP | Status: RESOLVED              [📖 VIEW POST-MORTEM] │ │
│ ├────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ 🪦 Gravestone #102: Unhandled Promise Rejection in Auth Flow                 Language: [ TS ]      │ │
│ │    Slayed: Oct 08, 2026 | XP Awarded: +50 XP | Status: RESOLVED              [📖 VIEW POST-MORTEM] │ │
│ └────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Tombstone Cards**: Chiseled granite slabs showing bug title, language chip, resolution date, and instant re-open button.

---

### Screen G: Knowledge Codex (Explorer's Library)
An explorer's enchanted tome presenting curated language specifications, memory model references, and standard library guides.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📖 THE KNOWLEDGE CODEX — EXPLORER'S LIBRARY                                   [🔍 SEARCH CODEX: Ctrl+K]│
├──────────────────────────────┬─────────────────────────────────────────────────────────────────────────┤
│ 📚 TOPIC CATEGORIES          │ 📜 DOCUMENTATION ENTRY: C++20 MEMORY MODELS                             │
│ • [ C & C++ Memory Models ]  │ ┌─────────────────────────────────────────────────────────────────────┐ │
│ • [ Java Concurrency & GC ]  │ │ Source: ISO/IEC 14882:2020 Standard for Programming Language C++     │ │
│ • [ Python GIL & AsyncIO ]   │ │ Section 6.7.2: Object and Memory Locations                           │ │
│ • [ TS Type Narrowing ]      │ │                                                                     │ │
│ • [ Linux Signals & SIGSEGV ]│ │ "Every byte in memory has a unique address. Two objects with        │ │
│ • [ Common Exploit Patterns ]│ │  overlapping lifetimes either have distinct addresses or one is    │ │
│                              │ │  a subobject of the other."                                         │ │
│                              │ │                                                                     │ │
│                              │ │ Canonical Citation: https://en.cppreference.com/w/cpp/language/memory│ │
│                              │ └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┴─────────────────────────────────────────────────────────────────────────┘
```

- **Two-Column Explorer**: Left navigation listing language topic indexes; right page showing exact citations with canonical external links.
- **Epistemic Honesty Badge**: Clarifies when citations come from static curated indexes versus synthesized LLM reasoning.

---

### Screen H: In-World Settings Panel
An in-world stone control panel allowing developers to tailor their experience.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ SURVIVAL BASE SETTINGS                                                               [✖️ CLOSE (Esc)]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🎮 GAME & VISUAL PREFERENCES                                                                           │
│ • Pixel Font Mode:        [🔘 ENABLED (Press Start 2P)]  [⚪ DISABLED (Use System Fonts)]               │
│ • Isometric Stage Visual: [🔘 2.5D CANVAS WORLD]        [⚪ LOW-POWER STATIC BANNER]                   │
│ • Reduced Motion:         [⚪ OFF]                      [🔘 ON (Respect prefers-reduced-motion)]       │
│ • High-Contrast Mode:     [⚪ STANDARD]                 [🔘 WCAG AAA HIGH CONTRAST]                    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🎵 AUDIO & SFX PREFERENCES                                                                             │
│ • Retro 8-Bit Chiptune SFX:[🔘 MUTED (Default)]          [⚪ ENABLED (-12dB Soft Click/Level Up)]       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔑 AI PROVIDER RUNTIME CONFIGURATION (Stored in memory/sessionStorage only - Never compiled into app) │
│ • Active Provider: [🔘 Local Mock (Free / Offline)]  [⚪ Google Gemini]  [⚪ Anthropic]  [⚪ OpenAI]    │
│ • Personal API Key: [••••••••••••••••••••••••••••••••••••••••] [👁️ SHOW] [🧹 CLEAR KEY]                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Functional Controls**: Immediate client-side toggles for fonts, canvas rendering, audio, and high-contrast modes.
- **Safe Key Architecture**: Explicit disclosure that API keys are kept strictly in session memory and never transmitted to telemetry servers.

---

## 5. Design System Tokens & Typography

### 5.1 CSS Custom Properties Token Map

```css
:root {
  /* Surface Ground & Canvas (Deepslate Voxel Palette) */
  --bb-surface-void: #0D0E11;          /* Outer void background */
  --bb-surface-base: #14161B;          /* Main application deepslate base */
  --bb-surface-panel: #1E2128;         /* Chiseled stone panel background */
  --bb-surface-slab: #272B34;          /* Elevated stone slab surface */
  --bb-surface-inset: #111216;         /* Inset inventory slot cavity */
  
  /* Voxel Terrain Material Accents */
  --bb-mat-grass-top: #5B8C32;         /* Lush voxel grass top */
  --bb-mat-grass-side: #4A7328;        /* Grass fringe */
  --bb-mat-dirt: #866043;              /* Loam soil */
  --bb-mat-stone: #7F8287;             /* Granite slab */
  --bb-mat-planks: #A27848;            /* Oak timber */
  --bb-mat-obsidian: #261B3D;          /* Deep altar obsidian */
  --bb-mat-water: #2E72B8;             /* River stream */
  
  /* Functional Game Accent Colors */
  --bb-color-emerald: #2ECC71;         /* Success, primary CTA, active navigation */
  --bb-color-emerald-shadow: #1E8449;  /* Emerald bottom bevel */
  --bb-color-emerald-glow: rgba(46, 204, 113, 0.25);
  
  --bb-color-redstone: #E53935;        /* Compiler error, crash alert, confess CTA */
  --bb-color-redstone-shadow: #922B21; /* Redstone bottom bevel */
  --bb-color-redstone-glow: rgba(229, 57, 53, 0.3);
  
  --bb-color-gold: #F1C40F;            /* XP orbs, star ratings, campfire embers */
  --bb-color-gold-shadow: #B7950B;     /* Gold bottom bevel */
  --bb-color-gold-glow: rgba(241, 196, 15, 0.3);
  
  --bb-color-diamond: #3498DB;         /* Codex citations, info alerts, C++/TS chips */
  --bb-color-diamond-shadow: #1F618D;  /* Diamond bottom bevel */

  /* Text & Legibility Colors */
  --bb-text-primary: #F0F2F5;          /* Crisp high-contrast reading text (11.8:1) */
  --bb-text-secondary: #9DA3AE;        /* Slate gray secondary text (6.2:1) */
  --bb-text-muted: #656C78;            /* Code line numbers, subtle hints */
  --bb-text-gold: #F7DC6F;             /* Game stats, player level, streak counter */
  --bb-text-code-green: #58D68D;       /* Terminal output and diff additions */
  --bb-text-code-red: #EC7063;         /* Diff deletions and compiler panics */

  /* Block Border & Bevel Tokens */
  --bb-border-subtle: #2D323E;         /* Outer panel separator */
  --bb-border-bevel-light: #3D4353;    /* Top/Left light reflection */
  --bb-border-bevel-dark: #0A0B0E;     /* Bottom/Right shadow bevel */
  --bb-border-width: 2px;
  --bb-border-bevel-size: 3px;

  /* Typography Stacks */
  --bb-font-pixel-display: 'Press Start 2P', 'Silkscreen', monospace;
  --bb-font-pixel-sub: 'VT323', monospace;
  --bb-font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --bb-font-code: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  /* Sizing & Spacing Scale (8px Grid Alignment) */
  --bb-space-2xs: 2px;
  --bb-space-xs: 4px;
  --bb-space-sm: 8px;
  --bb-space-md: 16px;
  --bb-space-lg: 24px;
  --bb-space-xl: 32px;
  --bb-space-2xl: 48px;
}
```

### 5.2 Blocky Bevel Utility Classes
Authentic voxel panels without images using pure CSS layered shadows:

```css
/* Tactile Chiseled Stone Slab Panel */
.bb-panel-slab {
  background: var(--bb-surface-panel);
  border: var(--bb-border-width) solid var(--bb-border-subtle);
  box-shadow: 
    inset 2px 2px 0px 0px var(--bb-border-bevel-light),
    inset -2px -2px 0px 0px var(--bb-border-bevel-dark),
    0px 4px 0px 0px var(--bb-surface-void);
  border-radius: 0px; /* Strict 0px radius for voxel geometry */
}

/* Inset Inventory Slot */
.bb-inventory-slot {
  background: var(--bb-surface-inset);
  border: 2px solid var(--bb-border-subtle);
  box-shadow: 
    inset 2px 2px 0px 0px var(--bb-border-bevel-dark),
    inset -2px -2px 0px 0px var(--bb-border-bevel-light);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 3D Beveled Emerald Game Button */
.bb-btn-emerald {
  background: var(--bb-color-emerald);
  color: #0A2E16;
  font-family: var(--bb-font-pixel-display);
  font-size: 11px;
  padding: 10px 18px;
  border: none;
  cursor: pointer;
  box-shadow: 
    inset 2px 2px 0px 0px rgba(255, 255, 255, 0.4),
    inset -2px -2px 0px 0px var(--bb-color-emerald-shadow),
    0px 4px 0px 0px var(--bb-surface-void);
  transition: transform 60ms linear, box-shadow 60ms linear;
}

.bb-btn-emerald:hover {
  filter: brightness(1.08);
  box-shadow: 
    inset 2px 2px 0px 0px rgba(255, 255, 255, 0.6),
    inset -2px -2px 0px 0px var(--bb-color-emerald-shadow),
    0px 5px 0px 0px var(--bb-surface-void);
}

.bb-btn-emerald:active {
  transform: translateY(3px);
  box-shadow: 
    inset 2px 2px 0px 0px rgba(0, 0, 0, 0.4),
    inset -2px -2px 0px 0px rgba(255, 255, 255, 0.2),
    0px 1px 0px 0px var(--bb-surface-void);
}
```

---

## 6. Technical Architecture & Engine Trade-Offs

### 6.1 Architectural Trade-Off Analysis

| Approach | Visual Quality & Game Feel | Text Legibility & Accessibility | Performance & Bundle Size | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **A. Full 3D Engine (Three.js / Babylon)** | ⭐⭐⭐⭐⭐ High 3D fidelity, dynamic shadows | ⭐⭐ Poor HTML text integration, heavy canvas | ❌ Heavy (600KB+ bundle), mobile GPU drain | **Rejected**: Overkill for a developer tool |
| **B. Pure CSS Isometric (DOM divs)** | ⭐⭐⭐ Decent block cards | ⭐⭐⭐⭐⭐ Native HTML accessibility | ⭐⭐⭐ Heavy DOM overhead for 100+ terrain blocks | **Rejected for terrain**: Sluggish on complex scenes |
| **C. Hybrid Engine (HTML5 2D Canvas + DOM UI)**| ⭐⭐⭐⭐⭐ Authentic pixel art & 4 FPS sprites | ⭐⭐⭐⭐⭐ 100% native DOM for code, forms & chat | ⭐⭐⭐⭐⭐ Featherweight (<15KB code), 60 FPS | **SELECTED ARCHITECTURE** |

### 6.2 The Hybrid Architecture (Selected)
- **Layer 1: The Isometric 2D Canvas (`<IsometricWorldCanvas />`)**:
  - Renders the 2.5D diorama (terrain blocks, campfire, ByteBuddy sprite, smoke/ember particles).
  - Internal fixed coordinate space (e.g., `800×450px`), scaled via CSS with `image-rendering: pixelated`.
  - Zero third-party gaming dependencies; implemented with vanilla HTML5 Canvas 2D API (`ctx.drawImage`, `ctx.fillRect`).
- **Layer 2: Accessible DOM Application Shell**:
  - All interactive UI panels, code editors, chat threads, buttons, forms, and dialogs are standard semantic HTML elements (`<button>`, `<textarea>`, `<dialog>`, `<nav>`).
  - Screen readers have direct access to text content; developers can highlight and copy code with standard OS mouse/keyboard events.

---

## 7. Knowledge-Base Agent Integration Assumptions

To ensure that the UI agent and the independent knowledge-base agent integrate seamlessly without data collisions:

### 7.1 Expected Knowledge-Base Contracts (TypeScript Interfaces)

```typescript
// 1. Grounded Source Citation
export interface CodexCitation {
  id: string;
  title: string;
  category: 'standard' | 'security' | 'compiler_spec' | 'manual';
  language: 'c' | 'cpp' | 'java' | 'python' | 'javascript' | 'typescript' | 'general';
  excerpt: string;
  sourceUrl: string;
  confidenceScore: number; // 0.0 to 1.0 (threshold >= 0.65 for display)
}

// 2. Structured Diagnostic Payload
export interface DiagnosisVerdict {
  sessionId: string;
  timestamp: string;
  roast: string;
  category: string;
  language: string;
  confidence: 'High' | 'Medium' | 'Low';
  rootCause: string;
  stepsToFix: string[];
  codeDiff: {
    beforeSnippet: string;
    afterSnippet: string;
    language: string;
  };
  reproducibleTest: {
    command: string;
    description: string;
  };
  citations: CodexCitation[];
}

// 3. Knowledge Codex Topic Query
export interface CodexTopicEntry {
  topicId: string;
  title: string;
  language: string;
  summary: string;
  keyRules: string[];
  citations: CodexCitation[];
}
```

### 7.2 UI Boundary Guarantees
- The UI layer will **never** attempt to execute code remotely.
- If a query to the knowledge base returns zero citations, the UI gracefully falls back to the `[No Grounded Sources Found]` honest disclosure badge without crashing.

---

## 8. Implementation Sequence & Next Steps

### Phase 1 Frontend Deliverables (Prompt 02 Roadmap):
1. **Design Tokens & Global Styles (`src/styles/tokens.css`, `theme.css`)**:
   - Install CSS custom properties for surfaces, voxel materials, and block bevels.
   - Configure `@font-face` for pixel display fonts and JetBrains Mono.
2. **Accessible Core Components (`src/components/ui/`)**:
   - `<GameHUD />`: XP progress, player title, and audio/theme switches.
   - `<DeveloperInventory />`: Sidebar hotbar with desktop collapse and mobile drawer.
   - `<ButtonPixel />`, `<PanelSlab />`, `<InventorySlot />`.
3. **The Isometric Canvas Stage (`src/components/world/IsometricWorld.tsx`)**:
   - 2D canvas terrain renderer (grass, dirt, stone, campfire).
   - ByteBuddy sprite animator supporting 5 mood states and idle loops.
4. **The Bug Confession Booth (`src/components/booth/ConfessionBooth.tsx`)**:
   - Dual-pane code editor + terminal error input.
   - Client-side secret scanner filter.
   - Structured Roast & Diff card renderer.
5. **Interactive Debug Chat (`src/components/chat/DebugChat.tsx`)**:
   - Thread list with user/companion speech bubbles.
   - 7 follow-up action buttons triggering structured prompts.
6. **Quest Board & History (`src/components/quests/`, `src/components/history/`)**:
   - Task timer countdown with snooze.
   - Gravestone post-mortem archive.

---
*End of UI/UX Specification V2 — BugBuddy Minecraft-Inspired Isometric Pixel World*
