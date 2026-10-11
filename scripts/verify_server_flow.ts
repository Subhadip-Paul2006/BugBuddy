/**
 * BugBuddy — Backend AI Server & UI Flow Verification Script
 *
 * Starts the server, dispatches live HTTP POST requests, tests error boundaries,
 * verifies response schema, and cleanly shuts down the server.
 */

import server from '../src/server/index';
import { searchKnowledge } from '../src/services/knowledgeService';

async function verifyServerFlow() {
  console.log('=== BugBuddy Backend AI Server & UI Flow Verification ===\n');

  // Server is already listening on PORT 3001 from imported module
  await new Promise((resolve) => setTimeout(resolve, 500));

  const BASE_URL = 'http://localhost:3001';

  try {
    // 1. Health check
    console.log('1. Testing GET /health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`- Health Status: ${healthRes.status} (ok: ${healthRes.ok})`);
    console.log(`- Response: ${JSON.stringify(healthData)}`);
    if (!healthRes.ok || healthData.status !== 'ok') {
      throw new Error('Health check failed!');
    }

    // 2. Live POST /api/diagnose
    console.log('\n2. Testing POST /api/diagnose with Python Mutable Default Argument...');
    const diagnosisRes = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        code: 'def append_item(x, l=[]):\n    l.append(x)\n    return l\nprint(append_item(1))\nprint(append_item(2))',
        errorMessage: 'List accumulates items across separate invocations',
        tone: 'spicy',
      }),
    });

    console.log(`- HTTP Status: ${diagnosisRes.status} (ok: ${diagnosisRes.ok})`);
    const diagnosisData = await diagnosisRes.json();
    console.log(`- Provider ID: ${diagnosisData.providerId}`);
    console.log(`- Model ID: ${diagnosisData.modelId}`);
    console.log(`- Fallback Used: ${diagnosisData.usedFallback ? 'YES' : 'NO'}`);
    console.log(`- Is Grounded: ${diagnosisData.isGrounded ? 'YES' : 'NO'}`);
    console.log(`- Summary: ${diagnosisData.summary}`);
    console.log(`- Cited Record IDs: ${JSON.stringify(diagnosisData.citedRecordIds)}`);
    console.log(`- Cited Sources Count: ${diagnosisData.citedSources.length}`);
    console.log(`- Suggested Fix Buggy: ${Boolean(diagnosisData.suggestedFix?.buggyExample)}`);
    console.log(`- Suggested Fix Fixed: ${Boolean(diagnosisData.suggestedFix?.fixedExample)}`);
    console.log(`- Verification Tests: ${diagnosisData.verificationTests?.length || 0} assertions`);
    console.log(`- Limitations Count: ${diagnosisData.limitations?.length || 0}`);

    if (!diagnosisRes.ok || !diagnosisData.summary || !diagnosisData.isGrounded) {
      throw new Error('Live diagnosis request failed or ungrounded!');
    }

    // 3. UI searchKnowledge integration with running server
    console.log('\n3. Testing frontend searchKnowledge() reaching live backend server...');
    const { result, isNoMatch } = await searchKnowledge({
      language: 'python',
      code: 'def append_item(x, l=[]):\n    l.append(x)\n    return l',
    });

    console.log(`- isNoMatch: ${isNoMatch}`);
    console.log(`- Result ID: ${result?.id}`);
    console.log(`- Result Title: ${result?.title}`);
    console.log(`- Provider ID: ${result?.providerId}`);
    console.log(`- Used Fallback: ${result?.usedFallback}`);
    console.log(`- Sources: ${result?.sources?.length} sources`);

    if (isNoMatch || !result) {
      throw new Error('searchKnowledge failed to parse backend response!');
    }

    // 4. Test Error Boundary: 400 Bad Request (Missing code)
    console.log('\n4. Testing 400 Bad Request (Empty code)...');
    const emptyRes = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        code: '   ',
      }),
    });
    const emptyData = await emptyRes.json();
    console.log(`- Empty Code Status: ${emptyRes.status} (Expected: 400)`);
    console.log(`- Error Message: "${emptyData.error}"`);
    if (emptyRes.status !== 400) {
      throw new Error('Expected 400 for empty code!');
    }

    // 5. Test Error Boundary: 413 Payload Too Large (>64KB)
    console.log('\n5. Testing 413 Payload Too Large (>64KB)...');
    const largeCode = '// A'.repeat(35000); // ~70KB
    const largeRes = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: largeCode,
      }),
    });
    const largeData = await largeRes.json();
    console.log(`- Large Payload Status: ${largeRes.status} (Expected: 413)`);
    console.log(`- Error Message: "${largeData.error}"`);
    if (largeRes.status !== 413) {
      throw new Error('Expected 413 for oversized payload!');
    }

    console.log('\n[PASS] All backend server endpoints and UI integration flows verified successfully!');
  } finally {
    server.close();
  }
}

verifyServerFlow();
