/**
 * BugBuddy — Backend AI Diagnosis HTTP Server
 * 
 * Standalone server process providing secure server-side AI provider integration.
 * Usage:
 *   npx tsx src/server/index.ts
 */

import { createServer } from 'node:http';
import { handleAIDiagnosisRequest } from './aiRouter';

// Safely load server environment variables from .env if running on supported runtime
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Graceful no-op if .env does not exist
  }
}

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/debug/ai-diagnose' || url.pathname === '/api/diagnose') {
    await handleAIDiagnosisRequest(req, res);
    return;
  }

  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'bugbuddy-ai-backend',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'production',
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not Found: ${url.pathname}` }));
});

server.listen(PORT, HOST, () => {
  console.log(`[BugBuddy AI Server] Listening on http://${HOST}:${PORT}`);
  console.log(`[BugBuddy AI Server] AI Diagnosis endpoint: http://${HOST}:${PORT}/api/diagnose`);
});

export default server;
