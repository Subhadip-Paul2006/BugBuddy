/**
 * BugBuddy — Client-Side Secret Redaction Utility
 * Specification: Prompt 03 Section 4 & docs/UI_UX.md
 * 
 * Heuristically identifies common accidental credentials, API keys, tokens,
 * passwords, and private key blocks before code leaves the user's workspace.
 * 
 * IMPORTANT SAFETY RULES:
 * 1. Preserves original editor content for the user.
 * 2. Generates a separately sanitized redacted copy.
 * 3. Never logs raw secret-bearing code to the browser console.
 * 4. All scanning runs locally in the browser with zero network transmission.
 */

import { SecretDetection, SecretScanResult } from '../types';

interface RedactionRule {
  type: SecretDetection['type'];
  label: string;
  pattern: RegExp;
  replacer: (match: string, ...groups: any[]) => string;
}

const REDACTION_RULES: RedactionRule[] = [
  // 1. Private Key Blocks (RSA, EC, OPENSSH, PGP)
  {
    type: 'private_key',
    label: 'Private Key Block',
    pattern: /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+|PGP\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+|EC\s+|OPENSSH\s+|PGP\s+)?PRIVATE\s+KEY-----/gi,
    replacer: () => '[REDACTED_PRIVATE_KEY_BLOCK]',
  },

  // 2. JWT-like Tokens (Header.Payload.Signature)
  {
    type: 'jwt',
    label: 'JSON Web Token (JWT)',
    pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    replacer: () => '[REDACTED_JWT_TOKEN]',
  },

  // 3. Authorization Bearer Header Tokens
  {
    type: 'bearer_token',
    label: 'Authorization Bearer Token',
    pattern: /(Bearer\s+)[a-zA-Z0-9_\-\.]{15,}/gi,
    replacer: (_match, prefix) => `${prefix}[REDACTED_BEARER_TOKEN]`,
  },

  // 4. Well-Known API Keys (OpenAI, AWS, GitHub)
  {
    type: 'api_key',
    label: 'OpenAI Secret Key',
    pattern: /\bsk-[a-zA-Z0-9]{20,}\b/g,
    replacer: () => '[REDACTED_OPENAI_KEY]',
  },
  {
    type: 'api_key',
    label: 'AWS Access Key ID',
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    replacer: () => '[REDACTED_AWS_ACCESS_KEY]',
  },
  {
    type: 'api_key',
    label: 'GitHub Personal Access Token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g,
    replacer: () => '[REDACTED_GITHUB_TOKEN]',
  },

  // 5. Explicit API Key and Secret Assignments (e.g. api_key = "...", secret = '...')
  {
    type: 'generic_secret',
    label: 'API Key / Secret Assignment',
    pattern: /((?:api[_-]?key|api[_-]?secret|auth[_-]?token|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'])(?!(?:\[REDACTED_))([^"'\r\n]{12,})(["'])/gi,
    replacer: (_match, prefix, _secret, suffix) => `${prefix}[REDACTED_API_SECRET]${suffix}`,
  },

  // 6. Password & Database Credential Assignments (e.g. password = "...", db_pass = '...')
  {
    type: 'password',
    label: 'Password Assignment',
    pattern: /((?:password|passwd|db_pass|user_pass|app_password)\s*[:=]\s*["'])(?!(?:\[REDACTED_))([^"'\r\n]{4,})(["'])/gi,
    replacer: (_match, prefix, _password, suffix) => `${prefix}[REDACTED_PASSWORD]${suffix}`,
  },
];

/**
 * Scans code for sensitive tokens and generates a sanitized copy.
 * Does NOT log any scanned text to console.
 */
export function scanAndRedactSecrets(code: string): SecretScanResult {
  if (!code || typeof code !== 'string') {
    return {
      hasSecrets: false,
      detections: [],
      redactedCode: code || '',
      warningMessage: '',
    };
  }

  const lines = code.split('\n');
  const detections: SecretDetection[] = [];
  let redactedCode = code;

  // Run each rule to identify matches and sanitize code
  for (const rule of REDACTION_RULES) {
    // Reset regex index if global
    rule.pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    const testPattern = new RegExp(rule.pattern.source, rule.pattern.flags);

    while ((match = testPattern.exec(code)) !== null) {
      // Find line number where match begins
      const matchIndex = match.index;
      let charAccumulator = 0;
      let matchedLine = 1;

      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1; // including newline
        if (charAccumulator + lineLen > matchIndex) {
          matchedLine = i + 1;
          break;
        }
        charAccumulator += lineLen;
      }

      // Avoid adding duplicate detections on the exact same line and type
      const exists = detections.some(
        (d) => d.line === matchedLine && d.type === rule.type
      );

      if (!exists) {
        detections.push({
          type: rule.type,
          label: rule.label,
          line: matchedLine,
          matchPattern: rule.label,
        });
      }

      // Prevent zero-width match infinite loops
      if (testPattern.lastIndex === match.index) {
        testPattern.lastIndex++;
      }
    }

    // Apply redaction transformation
    redactedCode = redactedCode.replace(rule.pattern, rule.replacer as any);
  }

  const hasSecrets = detections.length > 0;
  const warningMessage = hasSecrets
    ? `⚠️ HEURISTIC SECRET DETECTION: Found ${detections.length} likely sensitive token(s) (e.g. ${detections
        .map((d) => `${d.label} on line ${d.line}`)
        .slice(0, 3)
        .join(', ')}). A sanitized redacted copy has been prepared. Note: Heuristic detection cannot guarantee all secrets are identified — review code carefully before sharing.`
    : '';

  return {
    hasSecrets,
    detections,
    redactedCode,
    warningMessage,
  };
}
