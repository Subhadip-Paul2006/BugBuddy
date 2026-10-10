# ⚡ MANDATORY TOKEN MINIMIZATION WITH GRAPHIFY (Active on EVERY Prompt)

This repository contains a pre-built deterministic knowledge graph at `graphify-out/graph.json` with 28+ nodes, community structure, and cross-file relationships.

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
