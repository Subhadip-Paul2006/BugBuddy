/**
 * BugBuddy — Server-Side AI Diagnosis Endpoint Router
 * 
 * Provides a secure server-side HTTP handler for `/api/debug/ai-diagnose`:
 * - Keeps API keys strictly on the server.
 * - Enforces payload size limits (max 64KB).
 * - Sanitizes errors and never logs code or secrets.
 * - Provides graceful fallback to deterministic response engine.
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { ingestKnowledgeDirectory } from '../knowledge/ingest';
import { KnowledgeSearchIndex } from '../knowledge/search';
import {
  LocalTransformersEmbeddingAdapter,
  VectorSearchIndex,
  HybridSearchEngine,
} from '../knowledge';
import { AIDebugOrchestrator } from '../knowledge/ai/orchestrator';
import { UserSubmissionContext } from '../knowledge/ai/types';
import { defaultAIProviderRegistry } from '../knowledge/ai/registry';
import { CanonicalLanguage } from '../types';

let cachedOrchestrator: AIDebugOrchestrator | null = null;

async function getOrchestrator(): Promise<AIDebugOrchestrator> {
  if (cachedOrchestrator) return cachedOrchestrator;

  const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
  const ingest = await ingestKnowledgeDirectory(knowledgeDir, { strict: false });
  const bm25 = new KnowledgeSearchIndex(ingest.records);

  const localAdapter = new LocalTransformersEmbeddingAdapter();
  const vectorIndex = new VectorSearchIndex(localAdapter);
  // Asynchronously index vector corpus if model is available
  localAdapter.isAvailable().then(async (avail) => {
    if (avail) {
      await vectorIndex.indexAll(ingest.records);
    }
  }).catch(() => {});

  const hybridEngine = new HybridSearchEngine(bm25, vectorIndex);
  cachedOrchestrator = new AIDebugOrchestrator(hybridEngine, defaultAIProviderRegistry);
  return cachedOrchestrator;
}

const SUPPORTED_LANGUAGES: Set<string> = new Set([
  'c',
  'cpp',
  'java',
  'python',
  'javascript',
  'typescript',
]);

const MAX_PAYLOAD_BYTES = 65536; // 64 KB

function resolveCorsOrigin(reqOrigin?: string): string {
  const allowed = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS;
  if (!allowed || allowed === '*') {
    return '*';
  }
  if (!reqOrigin) {
    return '*';
  }
  const origins = allowed.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins.includes(reqOrigin) || origins.includes('*')) {
    return reqOrigin;
  }
  return origins[0] || '*';
}

export async function handleAIDiagnosisRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const allowOrigin = resolveCorsOrigin(reqOrigin);

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (allowOrigin !== '*') {
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  // Read request body with strict size limit
  let body = '';
  let bytesReceived = 0;

  try {
    for await (const chunk of req) {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_PAYLOAD_BYTES) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload Too Large. Max size is 64KB.' }));
        return;
      }
      body += chunk;
    }
  } catch (err: any) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error reading request body.' }));
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (err: any) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
    return;
  }

  // Validate required fields
  const language = (payload.language || '').toLowerCase().trim();
  const code = payload.code;

  if (!language || !SUPPORTED_LANGUAGES.has(language)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `Invalid or missing language '${language}'. Supported languages: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`,
    }));
    return;
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or empty code snippet in submission.' }));
    return;
  }

  const submission: UserSubmissionContext = {
    language: language as CanonicalLanguage,
    code,
    errorMessage: payload.errorMessage,
    question: payload.question,
    expectedBehavior: payload.expectedBehavior,
    actualBehavior: payload.actualBehavior,
  };

  try {
    const orchestrator = await getOrchestrator();
    const result = await orchestrator.diagnose(submission, {
      providerId: payload.providerId,
      retrievalMode: payload.retrievalMode,
      tone: payload.tone,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err: any) {
    // Return sanitized error without internal trace or secrets
    const sanitizedMsg = (err?.message || 'Internal diagnosis error.').replace(/(sk-[a-zA-Z0-9_-]{10,})/g, '[REDACTED]');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: sanitizedMsg,
      code: err?.code || 'SERVER_ERROR',
    }));
  }
}
