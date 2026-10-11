/**
 * BugBuddy — Knowledge Base Integration Adapter
 * Specification: Prompt 03 Section 5 & docs/UI_UX.md
 * 
 * Provides a clean UI-facing boundary for knowledge retrieval.
 * 
 * INTEGRATION STATUS:
 * - Stage 2 (CLI Ingestion & Schema Validation) is complete in `src/knowledge/`.
 * - Stage 3 (In-Memory Browser Retrieval Engine) is currently under active development.
 * - This adapter detects whether the live search engine is available in the runtime.
 * - When unavailable, it provides clearly identified local demonstration results
 *   so the interactive Confession Booth UI can be exercised safely.
 */

import { CanonicalLanguage, ConfessionSubmission, ConfessionResult } from '../types';
import { KnowledgeSearchIndex } from '../knowledge/search';
import type { KnowledgeEntry } from '../knowledge/types';
import { buildDiagnosisResponse, DiagnosisResponse } from '../knowledge/response';
import type { AIDiagnosisResponse } from '../knowledge/ai/types';
import { scanAndRedactSecrets } from '../utils/secretRedactor';

import cCorpus from '../../knowledge/c.json';
import cppCorpus from '../../knowledge/cpp.json';
import javaCorpus from '../../knowledge/java.json';
import jsCorpus from '../../knowledge/javascript.json';
import pyCorpus from '../../knowledge/python.json';
import tsCorpus from '../../knowledge/typescript.json';

export const ALL_CORPUS_ENTRIES: KnowledgeEntry[] = [
  ...cCorpus,
  ...cppCorpus,
  ...javaCorpus,
  ...jsCorpus,
  ...pyCorpus,
  ...tsCorpus,
] as KnowledgeEntry[];

export const knowledgeIndex = new KnowledgeSearchIndex(ALL_CORPUS_ENTRIES);

export interface SampleSnippet {
  title: string;
  language: CanonicalLanguage;
  code: string;
  errorTrace: string;
  expectedBehavior: string;
  actualBehavior: string;
}

export const SAMPLE_SNIPPETS: Record<CanonicalLanguage, SampleSnippet> = {
  python: {
    title: 'Mutable Default Argument Accumulation',
    language: 'python',
    code: `def register_player_inventory(player_name, items=[]):
    """Registers a new player with starter tools."""
    items.append("Wooden Pickaxe")
    items.append("Torch")
    return {"player": player_name, "inventory": items}

alice = register_player_inventory("Alice")
bob = register_player_inventory("Bob")
print("Bob's inventory:", bob["inventory"])
# Bug: Bob unexpectedly gets Alice's pickaxe and torch too!`,
    errorTrace: `AssertionError: Expected 2 items for Bob, found 4 items: ['Wooden Pickaxe', 'Torch', 'Wooden Pickaxe', 'Torch']`,
    expectedBehavior: `Each new player receives an independent list containing exactly 2 starter items.`,
    actualBehavior: `Bob's inventory includes Alice's items because the default list is shared across calls.`,
  },

  javascript: {
    title: 'Async Array.prototype.forEach Execution Failure',
    language: 'javascript',
    code: `async function craftPlayerArmor(player, oreList) {
  console.log("Starting crafting queue for:", player.name);
  oreList.forEach(async (ore) => {
    const smelted = await smeltOre(ore);
    player.inventory.push(smelted);
  });
  console.log("Crafting finished! Items in pack:", player.inventory.length);
  return player.inventory;
}

// Bug: "Crafting finished!" fires before smelting promises resolve!`,
    errorTrace: `TypeError: Cannot read properties of undefined / UnhandledPromiseRejection: race condition in inventory synchronization`,
    expectedBehavior: `craftPlayerArmor waits for all ores to be smelted before logging and returning.`,
    actualBehavior: `Returns immediately with length 0 before async callbacks in forEach finish.`,
  },

  typescript: {
    title: 'TS2532: Object is Possibly Undefined',
    language: 'typescript',
    code: `interface QuestProgress {
  questId: string;
  stages?: { current: number; total: number };
}

function getCompletionRate(quest: QuestProgress): number {
  // Bug: Error TS2532: Object is possibly 'undefined'
  return (quest.stages.current / quest.stages.total) * 100;
}`,
    errorTrace: `Error TS2532: Object is possibly 'undefined'.
(quest.stages.current / quest.stages.total)
       ~~~~~~`,
    expectedBehavior: `Function calculates percentage safely or returns 0 when stages is not provided.`,
    actualBehavior: `TypeScript compilation fails with TS2532; crashes with TypeError at runtime if stages is omitted.`,
  },

  c: {
    title: 'Off-by-One Buffer Overflow (Stack Smash)',
    language: 'c',
    code: `#include <stdio.h>
#define BUFFER_SIZE 5

void log_block_coordinates(void) {
    char buffer[BUFFER_SIZE];
    // Bug: Loop writes past buffer bounds (index 5 into 5-byte array)
    for (int i = 0; i <= BUFFER_SIZE; i++) {
        buffer[i] = 'X';
    }
    printf("Buffer filled successfully.\\n");
}

int main(void) {
    log_block_coordinates();
    return 0;
}`,
    errorTrace: `*** stack smashing detected ***: terminated
Aborted (core dumped)`,
    expectedBehavior: `Buffer should store up to BUFFER_SIZE characters without violating stack boundary.`,
    actualBehavior: `Writing to index 5 corrupts stack canary and terminates process.`,
  },

  cpp: {
    title: 'Vector Iterator Invalidation During Mutation',
    language: 'cpp',
    code: `#include <vector>
#include <iostream>

void spawn_extra_mobs(std::vector<int>& mobs) {
    // Bug: push_back reallocates vector capacity, invalidating iterator!
    for (auto it = mobs.begin(); it != mobs.end(); ++it) {
        if (*it > 10) {
            mobs.push_back(*it * 2);
        }
    }
}

int main() {
    std::vector<int> mobs = {5, 12, 8};
    spawn_extra_mobs(mobs);
    return 0;
}`,
    errorTrace: `Segmentation fault (core dumped) / Infinite loop due to corrupted iterator traversal`,
    expectedBehavior: `Iterates over existing elements and adds doubled values for mobs exceeding level 10.`,
    actualBehavior: `push_back triggers vector memory reallocation, leaving 'it' pointing to deallocated memory.`,
  },

  java: {
    title: 'Auto-Unboxing NullPointerException',
    language: 'java',
    code: `import java.util.HashMap;
import java.util.Map;

public class ItemShop {
    private Map<String, Integer> prices = new HashMap<>();

    public int getDiscountedPrice(String itemId) {
        // Bug: Unboxing null Integer to primitive int throws NullPointerException!
        int price = prices.get(itemId);
        return price > 100 ? price - 20 : price;
    }
}`,
    errorTrace: `java.lang.NullPointerException: Cannot invoke "java.lang.Integer.intValue()" because the return value of "java.util.Map.get(Object)" is null
    at ItemShop.getDiscountedPrice(ItemShop.java:9)`,
    expectedBehavior: `Returns 0 or handles missing item IDs gracefully without crashing.`,
    actualBehavior: `Auto-unboxing calls intValue() on a null Integer returned by Map.get().`,
  },
};

const DEMO_KNOWLEDGE_RESULTS: Record<CanonicalLanguage, ConfessionResult> = {
  python: {
    id: 'DEMO-PY-001',
    title: 'Mutable Default Argument Accumulation',
    language: 'python',
    category: 'silly_mistake',
    difficulty: 'beginner',
    roast: "Ah, the immortal mutable default argument. You gave every player in the server the exact same communal backpack! Alice's wooden pickaxe is now Bob's family heirloom.",
    diagnosis: "Default argument expressions in Python are evaluated once when the function definition is executed, not at each call. When a mutable object (such as a list or dictionary) is used as a default, every call that omits the parameter mutates and shares that single persistent object.",
    symptoms: "Successive calls to register_player_inventory accumulate elements from preceding invocations. Independent caller instances inadvertently share mutated internal state.",
    debuggingSteps: [
      "1. Check function signature for mutable defaults like [] or {}.",
      "2. Change parameter default to `None` in the signature.",
      "3. Initialize `if items is None: items = []` inside the function body.",
      "4. Run unit tests verifying isolated invocations do not cross-contaminate state.",
    ],
    buggyCode: `def register_player_inventory(player_name, items=[]):
    items.append("Wooden Pickaxe")
    items.append("Torch")
    return {"player": player_name, "inventory": items}`,
    fixedCode: `def register_player_inventory(player_name, items=None):
    if items is None:
        items = []
    items.append("Wooden Pickaxe")
    items.append("Torch")
    return {"player": player_name, "inventory": items}`,
    whyItWorks: "Setting the default to None guarantees that every call omitting the argument enters the body and instantiates a brand new, private list instance in local frame memory.",
    tests: "pytest tests/test_inventory.py -k 'test_isolated_inventories' -v",
    sources: [
      {
        title: "Python Official Tutorial — Default Argument Values",
        url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },

  javascript: {
    id: 'DEMO-JS-001',
    title: 'Async Array.prototype.forEach Execution Failure',
    language: 'javascript',
    category: 'runtime_error',
    difficulty: 'intermediate',
    roast: "Using await inside Array.forEach is like ordering pizza, walking out of the restaurant 2 seconds later, and wondering why your plate is still empty. forEach does not await your promises!",
    diagnosis: "Array.prototype.forEach executes synchronous iteration over elements. When an async callback is supplied, forEach invokes each callback, receives a Promise, and discards it immediately without awaiting resolution.",
    symptoms: "The parent function logs completion and returns long before the asynchronous tasks resolve. Results appear missing or empty in subsequent logic.",
    debuggingSteps: [
      "1. Inspect async logic wrapped in Array.forEach, map, or filter.",
      "2. Replace forEach with a sequential `for...of` loop if order matters.",
      "3. Alternatively, use `Promise.all(oreList.map(async (ore) => ...))` for concurrent operations.",
      "4. Verify inventory length assertions pass after awaiting.",
    ],
    buggyCode: `async function craftPlayerArmor(player, oreList) {
  oreList.forEach(async (ore) => {
    const smelted = await smeltOre(ore);
    player.inventory.push(smelted);
  });
  return player.inventory;
}`,
    fixedCode: `async function craftPlayerArmor(player, oreList) {
  for (const ore of oreList) {
    const smelted = await smeltOre(ore);
    player.inventory.push(smelted);
  }
  return player.inventory;
}`,
    whyItWorks: "The `for...of` loop naturally cooperates with the async/await mechanism, pausing iteration at each step until the promise resolves.",
    tests: "npm test -- test/crafting.test.js",
    sources: [
      {
        title: "MDN Web Docs — Array.prototype.forEach (Promises)",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },

  typescript: {
    id: 'DEMO-TS-001',
    title: 'TS2532: Object is Possibly Undefined',
    language: 'typescript',
    category: 'type_compilation',
    difficulty: 'beginner',
    roast: "You marked the field as optional in the interface, and then immediately bullied TypeScript into pretending it always exists. The compiler remembers your broken promises.",
    diagnosis: "Strict null checking forbids dereferencing properties on types that include `undefined`. Because `stages` was declared with `?`, TypeScript forces explicit type narrowing before accessing nested properties.",
    symptoms: "Compiler rejection with TS2532 during type check, or runtime TypeError: Cannot read properties of undefined (reading 'current').",
    debuggingSteps: [
      "1. Check the interface declaration to confirm whether the field is optional.",
      "2. Add a truthiness guard check or use optional chaining with fallback (`quest.stages?.current ?? 0`).",
      "3. Handle the zero-division edge case when total is 0.",
    ],
    buggyCode: `function getCompletionRate(quest: QuestProgress): number {
  return (quest.stages.current / quest.stages.total) * 100;
}`,
    fixedCode: `function getCompletionRate(quest: QuestProgress): number {
  if (!quest.stages || quest.stages.total === 0) {
    return 0;
  }
  return (quest.stages.current / quest.stages.total) * 100;
}`,
    whyItWorks: "The explicit guard condition narrows the type of `quest.stages` from `QuestStages | undefined` to `QuestStages`, satisfying compiler safety and preventing runtime crashes.",
    tests: "npx tsc --noEmit",
    sources: [
      {
        title: "TypeScript Handbook — Narrowing and Truthiness",
        url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },

  c: {
    id: 'DEMO-C-001',
    title: 'Off-by-One Buffer Overflow (Stack Smash)',
    language: 'c',
    category: 'runtime_error',
    difficulty: 'intermediate',
    roast: "Writing to index 5 of a 5-element array? Classic stack-smash roulette! You just overwrote the return pointer and invited undefined behavior over for dinner.",
    diagnosis: "In C, arrays are zero-indexed. An array of size N has valid indices 0 through N-1. The loop condition `i <= BUFFER_SIZE` writes to index N, which is out of bounds on the call stack.",
    symptoms: "Terminated with *** stack smashing detected ***, segmentation fault, or corrupt local variables in the caller frame.",
    debuggingSteps: [
      "1. Inspect loop boundary conditions comparing `i < BUFFER_SIZE` vs `i <= BUFFER_SIZE`.",
      "2. Compile with AddressSanitizer (`-fsanitize=address`) and stack protection (`-fstack-protector-all`).",
      "3. Verify all array write offsets strictly adhere to `0 <= index < size`.",
    ],
    buggyCode: `char buffer[BUFFER_SIZE];
for (int i = 0; i <= BUFFER_SIZE; i++) {
    buffer[i] = 'X';
}`,
    fixedCode: `char buffer[BUFFER_SIZE];
for (int i = 0; i < BUFFER_SIZE; i++) {
    buffer[i] = 'X';
}`,
    whyItWorks: "Using strict inequality `i < BUFFER_SIZE` ensures the maximum written index is `BUFFER_SIZE - 1`, preserving adjacent stack canary bytes.",
    tests: "gcc -Wall -Wextra -fsanitize=address program.c -o program && ./program",
    sources: [
      {
        title: "C Reference — Arrays and Boundary Safety",
        url: "https://en.cppreference.com/w/c/language/array",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },

  cpp: {
    id: 'DEMO-CPP-001',
    title: 'Vector Iterator Invalidation During Mutation',
    language: 'cpp',
    category: 'runtime_error',
    difficulty: 'advanced',
    roast: "Mutating a vector while iterating over it? That's the C++ equivalent of sawing off the tree branch you're sitting on. The vector reallocated and left your iterator stranded in the abyss.",
    diagnosis: "Calling push_back on a std::vector may exceed current capacity, triggering reallocation of the underlying buffer to a new memory address. When this occurs, all existing iterators, pointers, and references are permanently invalidated.",
    symptoms: "Crashing with SIGSEGV, infinite iteration loops, or reading junk values from deallocated heap memory.",
    debuggingSteps: [
      "1. Identify loop bodies that call push_back, insert, or erase on the iterated container.",
      "2. Accumulate new items into a secondary vector and append with insert() after the loop.",
      "3. Or use index-based iteration with reserve() if capacity is known in advance.",
    ],
    buggyCode: `for (auto it = mobs.begin(); it != mobs.end(); ++it) {
    if (*it > 10) {
        mobs.push_back(*it * 2);
    }
}`,
    fixedCode: `std::vector<int> to_add;
for (const auto& mob : mobs) {
    if (mob > 10) {
        to_add.push_back(mob * 2);
    }
}
mobs.insert(mobs.end(), to_add.begin(), to_add.end());`,
    whyItWorks: "Decoupling read iteration from vector mutation guarantees the source container's capacity and memory address remain unchanged throughout traversal.",
    tests: "clang++ -std=c++17 -fsanitize=address test.cpp -o test && ./test",
    sources: [
      {
        title: "cppreference.com — std::vector::push_back Iterator Invalidation",
        url: "https://en.cppreference.com/w/cpp/container/vector/push_back",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },

  java: {
    id: 'DEMO-JAVA-001',
    title: 'Auto-Unboxing NullPointerException',
    language: 'java',
    category: 'runtime_error',
    difficulty: 'beginner',
    roast: "Auto-unboxing a null Integer? Java's billion-dollar mistake strikes again. You tried to unwrap an empty Christmas present and got a NullPointerException instead of a pony.",
    diagnosis: "Map.get(key) returns null when the key does not exist. Assigning the boxed Integer return value directly to a primitive `int` triggers an implicit call to `Integer.intValue()`. Calling an instance method on null throws a NullPointerException.",
    symptoms: "java.lang.NullPointerException thrown on the assignment statement when querying missing keys.",
    debuggingSteps: [
      "1. Inspect primitive variable assignments from boxed collections.",
      "2. Use Map.getOrDefault(key, 0) or check `Integer price = prices.get(key); if (price != null)`.",
      "3. Add unit tests for non-existent item queries.",
    ],
    buggyCode: `int price = prices.get(itemId);
return price > 100 ? price - 20 : price;`,
    fixedCode: `Integer price = prices.get(itemId);
if (price == null) {
    return 0;
}
return price > 100 ? price - 20 : price;`,
    whyItWorks: "Holding the result in a boxed Integer enables a safe null check prior to unboxing or primitive arithmetic operations.",
    tests: "mvn test -Dtest=ItemShopTest",
    sources: [
      {
        title: "Java Language Specification — Unboxing Conversion (§5.1.8)",
        url: "https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html#jls-5.1.8",
      },
    ],
    isDemo: true,
    demoDisclaimer: "⚠️ DEMO FALLBACK RESULT — Stage 3 Knowledge Engine Integration Pending. This diagnosis is a simulated demonstration for interface testing.",
    timestamp: new Date().toISOString(),
  },
};

/**
 * Builds a composite diagnostic keyword query from submission inputs.
 * Prioritizes high-signal error traces and diagnostic observations
 * while pulling salient tokens from code without transmitting or logging secrets.
 */
export function buildSearchQuery(submission: ConfessionSubmission): string {
  const parts: string[] = [];

  // Error trace carries highest diagnostic specificity
  if (submission.errorTrace && submission.errorTrace.trim()) {
    parts.push(submission.errorTrace.trim());
  }

  // User-provided actual vs expected behavior
  if (submission.actualBehavior && submission.actualBehavior.trim()) {
    parts.push(submission.actualBehavior.trim());
  }
  if (submission.expectedBehavior && submission.expectedBehavior.trim()) {
    parts.push(submission.expectedBehavior.trim());
  }

  // Code snippet (comments, function signatures, identifiers)
  if (submission.code && submission.code.trim()) {
    parts.push(submission.code.trim());
  }

  return parts.join(' ').trim();
}

/**
 * Accessor for explicit demonstration examples.
 * Clearly marked with isDemo: true and demo disclaimer.
 */
export function getDemoKnowledgeResult(language: CanonicalLanguage): ConfessionResult {
  const demoResult = DEMO_KNOWLEDGE_RESULTS[language];
  return {
    ...demoResult,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safely dispatches a diagnosis request to the server-side AI endpoint.
 * Keeps all API keys strictly on the server and enforces payload size boundaries.
 */
export async function requestBackendDiagnosis(
  submission: ConfessionSubmission,
  tone: 'mild' | 'spicy' | 'savage' = 'spicy'
): Promise<AIDiagnosisResponse | null> {
  const sanitized = scanAndRedactSecrets(submission.code || '');
  const payload = {
    language: submission.language,
    code: sanitized.redactedCode,
    errorMessage: submission.errorTrace,
    question: submission.actualBehavior,
    expectedBehavior: submission.expectedBehavior,
    actualBehavior: submission.actualBehavior,
    tone,
  };

  // Determine potential endpoints (Vite proxy /api/diagnose or direct backend port 3001)
  const candidateUrls: string[] = [];
  const rawApiBase = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE_URL : undefined;
  if (rawApiBase && typeof rawApiBase === 'string' && rawApiBase.trim().length > 0) {
    const cleanedBase = rawApiBase.trim().replace(/\/+$/, '');
    candidateUrls.push(`${cleanedBase}/api/diagnose`);
  }
  candidateUrls.push('/api/diagnose');
  candidateUrls.push('http://localhost:3001/api/diagnose');

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data: AIDiagnosisResponse = await res.json();
        return data;
      }

      // If client payload error (400, 413) returned from server
      if (res.status === 400 || res.status === 413) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server rejected request with HTTP ${res.status}`);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Server rejected') || err.message.includes('Payload Too Large') || err.message.includes('Invalid or missing language'))) {
        throw err;
      }
      // Otherwise continue to next candidate URL or return null for offline fallback
    }
  }

  return null;
}

/**
 * Public Knowledge Adapter
 * Queries BugBuddy's backend AI diagnosis endpoint if accessible, and seamlessly
 * falls back to BugBuddy's local Stage 3/4 deterministic engine when offline.
 * When a match is found, returns genuine knowledge guidance with authentic citations.
 * When no match is found, honestly returns isNoMatch: true with result: null.
 */
export async function searchKnowledge(
  submission: ConfessionSubmission,
  tone: 'mild' | 'spicy' | 'savage' = 'spicy'
): Promise<{ result: ConfessionResult | null; isNoMatch: boolean; rawResponse?: any; error?: string }> {
  const trimmed = submission.code ? submission.code.trim() : '';
  if (!trimmed) {
    return { result: null, isNoMatch: true };
  }

  // If user typed an intentional no-match test string
  if (
    trimmed.toLowerCase().includes('no-match-test') ||
    trimmed.toLowerCase().includes('xyzunsupported')
  ) {
    return { result: null, isNoMatch: true };
  }

  // 1. Attempt Server-Side AI / Hybrid Diagnosis
  try {
    const aiResponse = await requestBackendDiagnosis(submission, tone);
    if (aiResponse) {
      // Check if server returned a no-match response
      if (aiResponse.isGrounded === false && aiResponse.citedRecordIds.length === 0 && !aiResponse.suggestedFix?.fixedExample) {
        return { result: null, isNoMatch: true, rawResponse: aiResponse };
      }

      const primaryRecordId = aiResponse.citedRecordIds[0] || (aiResponse.usedFallback ? 'FALLBACK-KB' : 'AI-GROUNDED');

      const result: ConfessionResult = {
        id: primaryRecordId,
        title: aiResponse.summary,
        language: submission.language,
        category: aiResponse.citedSources[0]?.category || 'logic_error',
        difficulty: 'intermediate',
        roast: aiResponse.roast,
        diagnosis: aiResponse.codeExplanation || aiResponse.summary,
        symptoms: submission.errorTrace || 'Identified via code analysis and pattern matching.',
        debuggingSteps: [
          aiResponse.probableRootCause,
          aiResponse.suggestedFix?.explanation || 'Apply verified pattern fix.',
          ...(aiResponse.verificationTests || []),
        ],
        buggyCode: aiResponse.suggestedFix?.buggyExample || submission.code,
        fixedCode: aiResponse.suggestedFix?.fixedExample || submission.code,
        whyItWorks: aiResponse.whyItWorks,
        tests: aiResponse.verificationTests?.join('\n') || '',
        sources: aiResponse.citedSources.map((s) => ({
          title: s.title || s.recordTitle,
          url: s.url,
          recordId: s.recordId,
          recordTitle: s.recordTitle,
          language: s.language,
          category: s.category,
          isPrimary: s.isPrimary,
        })),
        isDemo: false,
        timestamp: new Date().toISOString(),
        responseMode: aiResponse.isGrounded ? 'DIRECT_MATCH' : 'NO_MATCH',
        matchedKnowledgeIds: aiResponse.citedRecordIds,
        attributedSources: aiResponse.citedSources.map((s) => ({
          title: s.title || s.recordTitle,
          url: s.url,
          recordId: s.recordId,
          recordTitle: s.recordTitle,
          language: s.language,
          category: s.category,
          isPrimary: s.isPrimary,
        })),
        limitations: aiResponse.limitations,
        rootCause: aiResponse.probableRootCause,
        suggestedFixExplanation: aiResponse.suggestedFix?.explanation,
        isGrounded: aiResponse.isGrounded,
        providerId: aiResponse.providerId,
        modelId: aiResponse.modelId,
        executionTimeMs: aiResponse.executionTimeMs,
        usedFallback: aiResponse.usedFallback,
        minimalDiff: aiResponse.suggestedFix?.minimalDiff,
      };

      return { result, isNoMatch: false, rawResponse: aiResponse };
    }
  } catch (err: any) {
    if (err?.message && (err.message.includes('Server rejected') || err.message.includes('Payload') || err.message.includes('Invalid or missing language'))) {
      throw err;
    }
    // Network or server offline; proceed to in-memory deterministic fallback
  }

  // 2. Deterministic In-Memory Fallback Engine (Stage 4)
  const query = buildSearchQuery(submission);
  if (!query) {
    return { result: null, isNoMatch: true };
  }

  const searchResults = knowledgeIndex.search(query, {
    filter: { language: submission.language },
    limit: 5,
    minScore: 0.8,
  });

  const diagnosisResponse = buildDiagnosisResponse(searchResults, {
    userContext: {
      language: submission.language,
      code: submission.code,
      errorMessage: submission.errorTrace,
      expectedBehavior: submission.expectedBehavior,
      actualBehavior: submission.actualBehavior,
    },
    requireStrictLanguageMatch: true,
    minRelevanceScore: 0.8,
  });

  if (
    diagnosisResponse.responseMode === 'NO_MATCH' ||
    !diagnosisResponse.suggestedFix ||
    diagnosisResponse.matchedKnowledgeIds.length === 0
  ) {
    return { result: null, isNoMatch: true, rawResponse: diagnosisResponse };
  }

  const primaryRecordId = diagnosisResponse.matchedKnowledgeIds[0];

  const result: ConfessionResult = {
    id: primaryRecordId,
    title: diagnosisResponse.title,
    language: (diagnosisResponse.language === 'unknown' ? submission.language : diagnosisResponse.language) as CanonicalLanguage,
    category: diagnosisResponse.category,
    difficulty: diagnosisResponse.difficulty || 'intermediate',
    roast: diagnosisResponse.roast,
    diagnosis: diagnosisResponse.rootCause || diagnosisResponse.summary,
    symptoms: diagnosisResponse.symptoms,
    debuggingSteps: diagnosisResponse.debuggingSteps,
    buggyCode: diagnosisResponse.suggestedFix.buggyExample,
    fixedCode: diagnosisResponse.suggestedFix.fixedExample,
    whyItWorks: diagnosisResponse.whyItWorks,
    tests: diagnosisResponse.verificationTests,
    sources: diagnosisResponse.attributedSources.map((s) => ({
      title: s.title || s.recordTitle,
      url: s.url,
      recordId: s.recordId,
      recordTitle: s.recordTitle,
      language: s.language,
      category: s.category,
      isPrimary: s.isPrimary,
    })),
    isDemo: false,
    timestamp: diagnosisResponse.timestamp,
    responseMode: diagnosisResponse.responseMode,
    matchedKnowledgeIds: diagnosisResponse.matchedKnowledgeIds,
    attributedSources: diagnosisResponse.attributedSources.map((s) => ({
      title: s.title || s.recordTitle,
      url: s.url,
      recordId: s.recordId,
      recordTitle: s.recordTitle,
      language: s.language,
      category: s.category,
      isPrimary: s.isPrimary,
    })),
    limitations: [
      ...diagnosisResponse.limitations,
      'Backend AI diagnosis server unreachable; served via client-side in-memory Stage 4 engine.',
    ],
    rootCause: diagnosisResponse.rootCause,
    suggestedFixExplanation: diagnosisResponse.suggestedFix.explanation,
    isGrounded: true,
    providerId: 'deterministic-fallback',
    modelId: 'in-memory-bm25-engine',
    usedFallback: true,
  };

  return { result, isNoMatch: false, rawResponse: diagnosisResponse };
}

/**
 * Directly queries the knowledge index and constructs a full Stage 4 DiagnosisResponse.
 */
export async function diagnoseSubmission(
  submission: ConfessionSubmission
): Promise<DiagnosisResponse> {
  const query = buildSearchQuery(submission);
  const searchResults = knowledgeIndex.search(query, {
    filter: { language: submission.language },
    limit: 5,
    minScore: 0.8,
  });

  return buildDiagnosisResponse(searchResults, {
    userContext: {
      language: submission.language,
      code: submission.code,
      errorMessage: submission.errorTrace,
      expectedBehavior: submission.expectedBehavior,
      actualBehavior: submission.actualBehavior,
    },
    requireStrictLanguageMatch: true,
    minRelevanceScore: 0.8,
  });
}
