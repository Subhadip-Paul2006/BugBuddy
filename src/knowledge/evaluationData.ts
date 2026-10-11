/**
 * BugBuddy Knowledge Base — Retrieval Evaluation Dataset
 * 
 * Provides an independent, deterministic benchmark suite of realistic developer queries
 * across all six supported languages (C, C++, Java, Python, JavaScript, TypeScript).
 * 
 * Ground truth IDs strictly reference verified entries in the 60-record corpus.
 */

import { CanonicalLanguage, CanonicalCategory } from './types';

export interface EvaluationCase {
  /** Stable test-case identifier */
  id: string;
  /** Realistic developer query (error message, symptom, concept, or loose description) */
  query: string;
  /** Expected target programming language (optional for unsupported/out-of-scope queries) */
  expectedLanguage?: CanonicalLanguage;
  /**
   * Expected relevant knowledge record IDs from the 60-record corpus.
   * The first element is the primary intended match.
   */
  expectedRecordIds: string[];
  /** Optional category filter for testing filtered retrieval */
  expectedCategory?: CanonicalCategory;
  /** Query difficulty / specificity style */
  queryType: 'exact_error' | 'symptom' | 'concept' | 'loose_wording' | 'paraphrase' | 'ambiguous' | 'unsupported';
  /** True if query is intentionally outside the supported corpus scope */
  isUnsupported?: boolean;
  /** Human-readable explanation of why this match is expected */
  explanation: string;
}

export const RETRIEVAL_EVALUATION_DATASET: EvaluationCase[] = [
  // ==========================================
  // C (5 cases)
  // ==========================================
  {
    id: 'eval-c-01',
    query: 'Segmentation fault dereferencing NULL pointer in C function',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-null-ptr-dereference'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects NULL pointer dereference leading to SIGSEGV on invalid memory access.',
  },
  {
    id: 'eval-c-02',
    query: 'strcpy buffer overflow writing past destination buffer',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-buffer-overflow-strcpy'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects unsafe bounded string copy causing stack/buffer overrun.',
  },
  {
    id: 'eval-c-03',
    query: 'pointer returning address of local stack variable escaping function scope',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-dangling-pointer-stack-escape'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects returning pointers to local stack frames causing dangling pointer references.',
  },
  {
    id: 'eval-c-04',
    query: 'malloc memory leak without calling free heap allocation',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-memory-leak-malloc-no-free'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects allocated dynamic heap memory never released via free().',
  },
  {
    id: 'eval-c-05',
    query: 'printf %s string format specifier mismatch crash undefined behavior',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-format-string-specifier-mismatch'],
    expectedCategory: 'type_compilation',
    queryType: 'loose_wording',
    explanation: 'Detects mismatched format specifiers in printf variadic arguments.',
  },

  // ==========================================
  // C++ (5 cases)
  // ==========================================
  {
    id: 'eval-cpp-01',
    query: 'vector erase iterator invalidation inside for loop crash',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-iterator-invalidation-erase'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects iterating over std::vector while erasing elements without reassigning the iterator.',
  },
  {
    id: 'eval-cpp-02',
    query: 'derived class derived object sliced by value passing base class',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-object-slicing-by-value'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects object slicing when passing polymorphic types by value instead of reference/pointer.',
  },
  {
    id: 'eval-cpp-03',
    query: 'base class missing virtual destructor undefined behavior deleting derived pointer',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-missing-virtual-destructor'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects polymorphic deletion through base class pointer missing virtual destructor.',
  },
  {
    id: 'eval-cpp-04',
    query: 'shared_ptr circular reference memory leak cyclic strong count',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-shared-ptr-circular-reference'],
    expectedCategory: 'runtime_error',
    queryType: 'symptom',
    explanation: 'Detects std::shared_ptr cycles preventing destructor invocation, fixable with std::weak_ptr.',
  },
  {
    id: 'eval-cpp-05',
    query: 'std::string_view dangling reference to temporary std::string out of scope',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-dangling-string-view'],
    expectedCategory: 'runtime_error',
    queryType: 'loose_wording',
    explanation: 'Detects non-owning string_view referencing a destroyed temporary string.',
  },

  // ==========================================
  // Java (5 cases)
  // ==========================================
  {
    id: 'eval-java-01',
    query: 'NullPointerException unboxing Boolean or Integer wrapper null',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-null-pointer-unboxed-primitive'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects automatic unboxing of null wrapper types producing NullPointerException.',
  },
  {
    id: 'eval-java-02',
    query: 'java.util.ConcurrentModificationException modifying list in enhanced for loop',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-concurrent-modification-iteration'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects structural modification of collection during active iterator traversal.',
  },
  {
    id: 'eval-java-03',
    query: 'String comparison using == instead of .equals() reference equality',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-string-equality-double-equals'],
    expectedCategory: 'silly_mistake',
    queryType: 'concept',
    explanation: 'Detects comparing String references with == rather than value comparison with equals().',
  },
  {
    id: 'eval-java-04',
    query: 'broken equals hashCode contract HashSet contains returns false for equal object',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-broken-equals-hashcode-contract'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects overriding equals() without overriding hashCode(), breaking hash-based collections.',
  },
  {
    id: 'eval-java-05',
    query: 'FileInputStream unclosed stream resource leak try-with-resources',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-unclosed-io-resource-leak'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects unclosed I/O streams that exhaust file descriptors, resolved with try-with-resources.',
  },

  // ==========================================
  // Python (5 cases)
  // ==========================================
  {
    id: 'eval-py-01',
    query: 'mutable default argument list shared across function calls in Python',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-mutable-default-argument'],
    expectedCategory: 'silly_mistake',
    queryType: 'concept',
    explanation: 'Detects function def with [] or {} default argument mutated between calls.',
  },
  {
    id: 'eval-py-02',
    query: 'UnboundLocalError: local variable referenced before assignment scope global',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-unbound-local-error-scope'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects assigning to variable in local scope after referencing it, shadowing outer binding.',
  },
  {
    id: 'eval-py-03',
    query: 'modifying list while iterating removing items skips elements in Python',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-list-mutation-during-iteration'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects removing items from a list during iteration modifying the internal index cursor.',
  },
  {
    id: 'eval-py-04',
    query: 'copy.copy shallow copy modifying nested dictionary alters original',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-shallow-copy-nested-mutation'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects copy.copy creating shallow duplicate where nested collections share references.',
  },
  {
    id: 'eval-py-05',
    query: 'TypeError: can only concatenate str (not "int") to str',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-string-int-concat-type-error'],
    expectedCategory: 'type_compilation',
    queryType: 'exact_error',
    explanation: 'Detects attempting to concatenate string and integer directly without str() conversion.',
  },

  // ==========================================
  // JavaScript (5 cases)
  // ==========================================
  {
    id: 'eval-js-01',
    query: 'forEach async await not waiting promises sequential concurrency',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-async-for-each-concurrency'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects Array.prototype.forEach ignoring promises returned by async callbacks.',
  },
  {
    id: 'eval-js-02',
    query: '0.1 + 0.2 === 0.3 returns false floating point IEEE 754 precision',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-floating-point-math-equality'],
    expectedCategory: 'silly_mistake',
    queryType: 'concept',
    explanation: 'Detects floating point rounding anomalies in IEEE 754 representation.',
  },
  {
    id: 'eval-js-03',
    query: 'Cannot read property of undefined unbound callback lost this context',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-lost-this-unbound-callback'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects class method passed as callback losing its this binding.',
  },
  {
    id: 'eval-js-04',
    query: 'loose equality coercion false == [] true == 1 type traps',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-loose-equality-coercion-traps'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects subtle implicit type coercions with == instead of ===.',
  },
  {
    id: 'eval-js-05',
    query: 'var closure loop asynchronous setTimeout logs 5 five times hoisting',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-var-closure-loop-hoisting'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects var loop variable binding shared across all callback closures instead of block-scoped let.',
  },

  // ==========================================
  // TypeScript (5 cases)
  // ==========================================
  {
    id: 'eval-ts-01',
    query: 'Object literal may only specify known properties excess property checks',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-excess-property-checks-type-mismatch'],
    expectedCategory: 'type_compilation',
    queryType: 'exact_error',
    explanation: 'Detects TypeScript excess property checking on freshly created object literals.',
  },
  {
    id: 'eval-ts-02',
    query: 'using any disables type safety runtime TypeError escape hatch',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-unsound-any-escape-hatch'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects unsound use of any type defeating compile-time safety.',
  },
  {
    id: 'eval-ts-03',
    query: 'discriminated union type narrowing failure missing discriminant field',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-discriminated-union-narrowing-failure'],
    expectedCategory: 'type_compilation',
    queryType: 'concept',
    explanation: 'Detects failure to properly narrow discriminated union with literal tag.',
  },
  {
    id: 'eval-ts-04',
    query: 'optional chaining with non-null assertion undefined is not a function ?. !',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-optional-chaining-undefined-non-null-param'],
    expectedCategory: 'type_compilation',
    queryType: 'symptom',
    explanation: 'Detects combining optional chaining with non-null assertion operator leading to runtime undefined crash.',
  },
  {
    id: 'eval-ts-05',
    query: 'Property does not exist on type Index signature undefined access TypeScript',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-index-signature-undefined-access'],
    expectedCategory: 'logic_error',
    queryType: 'loose_wording',
    explanation: 'Detects dynamic index signature access yielding potentially undefined values under noUncheckedIndexedAccess.',
  },
];

/**
 * Stage 8 Independent Held-Out Evaluation Dataset
 * Contains 30 challenging, real-world evaluation cases kept separate from tuning queries:
 * - 24 test cases spanning all six supported languages (exact errors, paraphrases, symptoms, ambiguous queries)
 * - 6 unsupported / out-of-domain queries to rigorously test honest no-match boundaries.
 */
export const HELD_OUT_EVALUATION_DATASET: EvaluationCase[] = [
  // --- C (4 cases) ---
  {
    id: 'heldout-c-01',
    query: 'SIGSEGV on line 12 while accessing struct member via ptr',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-null-ptr-dereference'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects NULL pointer dereference when accessing struct fields through unallocated or NULL pointer.',
  },
  {
    id: 'heldout-c-02',
    query: 'free(): double free detected in tcache 2',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-double-free'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects glibc allocator abort caused by calling free twice on the same heap allocation pointer.',
  },
  {
    id: 'heldout-c-03',
    query: 'printing char array outputs garbage characters at the end of the string',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-missing-null-terminator'],
    expectedCategory: 'runtime_error',
    queryType: 'symptom',
    explanation: 'Detects string printing functions continuing past buffer end due to missing null terminator byte.',
  },
  {
    id: 'heldout-c-04',
    query: 'subroutine returns pointer pointing to stack frame of finished function',
    expectedLanguage: 'c',
    expectedRecordIds: ['c-dangling-pointer-stack-escape'],
    expectedCategory: 'logic_error',
    queryType: 'paraphrase',
    explanation: 'Detects escaping addresses of local stack variables resulting in undefined behavior.',
  },

  // --- C++ (4 cases) ---
  {
    id: 'heldout-cxx-01',
    query: 'segmentation fault during erase while looping over std::vector',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-iterator-invalidation-erase'],
    expectedCategory: 'runtime_error',
    queryType: 'symptom',
    explanation: 'Detects iterator invalidation caused by erasing vector elements during loop iteration.',
  },
  {
    id: 'heldout-cxx-02',
    query: 'two std::shared_ptr objects holding each other prevent destructor from ever running',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-shared-ptr-circular-reference'],
    expectedCategory: 'runtime_error',
    queryType: 'concept',
    explanation: 'Detects circular reference memory leaks between shared_ptr instances needing weak_ptr.',
  },
  {
    id: 'heldout-cxx-03',
    query: 'subclass destructor is never called when deleting derived instance through base pointer',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-missing-virtual-destructor'],
    expectedCategory: 'runtime_error',
    queryType: 'paraphrase',
    explanation: 'Detects undefined behavior from missing virtual destructor on polymorphic base classes.',
  },
  {
    id: 'heldout-cxx-04',
    query: 'std::string_view dangling reference to temporary std::string created in expression',
    expectedLanguage: 'cpp',
    expectedRecordIds: ['cpp-dangling-string-view'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects string_view binding to temporary rvalue std::string destroyed at full-expression end.',
  },

  // --- Java (4 cases) ---
  {
    id: 'heldout-java-01',
    query: 'java.lang.NullPointerException when unboxing null java.lang.Integer to int primitive',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-null-pointer-unboxed-primitive'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects automatic unboxing of null wrapper types into primitives throwing NPE.',
  },
  {
    id: 'heldout-java-02',
    query: 'java.lang.UnsupportedOperationException when calling add() on list returned from Arrays.asList()',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-arraylist-unsupported-as-list-add'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects mutating fixed-size List returned by Arrays.asList throwing UnsupportedOperationException.',
  },
  {
    id: 'heldout-java-03',
    query: 'HashSet allows duplicate objects because equals was implemented but hashCode was forgotten',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-broken-equals-hashcode-contract'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects violating equals/hashCode contract causing hash bucket mismatches in hash-based collections.',
  },
  {
    id: 'heldout-java-04',
    query: 'java.util.ConcurrentModificationException thrown when removing item during enhanced for loop',
    expectedLanguage: 'java',
    expectedRecordIds: ['java-concurrent-modification-iteration'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects structural modification of collection during active iteration without using Iterator.remove().',
  },

  // --- JavaScript (4 cases) ---
  {
    id: 'heldout-js-01',
    query: '0.1 + 0.2 === 0.3 evaluates to false in conditional',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-floating-point-math-equality'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects IEEE 754 floating-point binary representation precision issues in arithmetic comparisons.',
  },
  {
    id: 'heldout-js-02',
    query: 'Uncaught TypeError: Cannot read properties of undefined reading this in event listener callback',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-lost-this-unbound-callback'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects unbound method passed as callback losing execution context this binding.',
  },
  {
    id: 'heldout-js-03',
    query: 'async await inside Array.prototype.forEach does not wait for promises before continuing',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-async-for-each-concurrency'],
    expectedCategory: 'logic_error',
    queryType: 'paraphrase',
    explanation: 'Detects forEach ignoring returned Promises from async callbacks rather than using for...of or Promise.all.',
  },
  {
    id: 'heldout-js-04',
    query: 'Array.sort() puts [10, 2, 5] into [10, 2, 5] instead of ascending numeric order',
    expectedLanguage: 'javascript',
    expectedRecordIds: ['js-array-sort-numeric-lexicographical'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects default lexicographical string sorting of numbers when compareFn is omitted.',
  },

  // --- Python (4 cases) ---
  {
    id: 'heldout-py-01',
    query: 'UnboundLocalError: local variable referenced before assignment inside function with outer scope',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-unbound-local-error-scope'],
    expectedCategory: 'runtime_error',
    queryType: 'exact_error',
    explanation: 'Detects assigning to a variable inside local scope causing Python to treat it as local before assignment.',
  },
  {
    id: 'heldout-py-02',
    query: 'generator object is exhausted after first iteration loop and returns empty on second loop',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-generator-exhaustion-reuse'],
    expectedCategory: 'logic_error',
    queryType: 'symptom',
    explanation: 'Detects single-pass generators producing no values when iterated a second time.',
  },
  {
    id: 'heldout-py-03',
    query: 'TypeError: can only concatenate str (not "int") to str',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-string-int-concat-type-error'],
    expectedCategory: 'type_compilation',
    queryType: 'exact_error',
    explanation: 'Detects explicit type conversion requirement when concatenating strings and numbers in Python.',
  },
  {
    id: 'heldout-py-04',
    query: 'mutating sublist inside copied list affects original list because copy was shallow',
    expectedLanguage: 'python',
    expectedRecordIds: ['py-shallow-copy-nested-mutation'],
    expectedCategory: 'logic_error',
    queryType: 'concept',
    explanation: 'Detects shallow copying of compound objects maintaining references to nested mutable objects.',
  },

  // --- TypeScript (4 cases) ---
  {
    id: 'heldout-ts-01',
    query: "Property 'push' does not exist on type 'readonly string[]'",
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-readonly-array-mutation-attempt'],
    expectedCategory: 'type_compilation',
    queryType: 'exact_error',
    explanation: 'Detects attempted mutation on immutable ReadonlyArray types.',
  },
  {
    id: 'heldout-ts-02',
    query: "Type 'any' disables type checking allowing invalid method call to crash at runtime",
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-unsound-any-escape-hatch'],
    expectedCategory: 'type_compilation',
    queryType: 'concept',
    explanation: 'Detects unsound use of any bypassing type safety checks and propagating runtime errors.',
  },
  {
    id: 'heldout-ts-03',
    query: 'Object literal may only specify known properties and excess property check fails on object assignment',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-excess-property-checks-type-mismatch'],
    expectedCategory: 'type_compilation',
    queryType: 'exact_error',
    explanation: 'Detects excess property checks triggering on direct object literal assignments.',
  },
  {
    id: 'heldout-ts-04',
    query: 'reverse mapping in numeric enum allows unexpected number values at runtime',
    expectedLanguage: 'typescript',
    expectedRecordIds: ['ts-enum-reverse-mapping-numeric-runtime-pitfall'],
    expectedCategory: 'logic_error',
    queryType: 'paraphrase',
    explanation: 'Detects runtime pitfalls and reverse mapping behaviors of TypeScript numeric enums.',
  },

  // --- Unsupported / Out-of-Domain Queries (6 cases) ---
  {
    id: 'heldout-unsupported-01',
    query: 'Rust compiler error E0502 cannot borrow x as mutable because it is also borrowed as immutable',
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Out-of-domain Rust borrow checker error; system must honestly report no match.',
  },
  {
    id: 'heldout-unsupported-02',
    query: 'Haskell parse error on input in monad transformer do block',
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Out-of-domain Haskell monad syntax error; system must honestly report no match.',
  },
  {
    id: 'heldout-unsupported-03',
    query: 'PostgreSQL deadlock detected process 12435 waiting for ExclusiveLock on relation accounts',
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Out-of-domain SQL database transaction deadlock; system must honestly report no match.',
  },
  {
    id: 'heldout-unsupported-04',
    query: 'Swift fatal error: Unexpectedly found nil while unwrapping an Optional value in viewWillAppear',
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Out-of-domain Swift iOS crash; system must honestly report no match.',
  },
  {
    id: 'heldout-unsupported-05',
    query: "Ruby Gem::LoadError: Specified 'sqlite3' for database adapter, but the gem is not loaded",
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Out-of-domain Ruby on Rails bundler error; system must honestly report no match.',
  },
  {
    id: 'heldout-unsupported-06',
    query: 'How to bake a decadent chocolate fudge cake in an air fryer with cocoa powder',
    expectedRecordIds: [],
    queryType: 'unsupported',
    isUnsupported: true,
    explanation: 'Completely irrelevant non-technical query; system must honestly report no match.',
  },
];

