import test, { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { scanAndRedactSecrets } from '../src/utils/secretRedactor';
import {
  SAMPLE_SNIPPETS,
  searchKnowledge,
  getDemoKnowledgeResult,
  ALL_CORPUS_ENTRIES,
  knowledgeIndex,
} from '../src/services/knowledgeService';
import { CanonicalLanguage } from '../src/types';

describe('Bug Confession Booth — Client-Side Secret Redaction Suite', () => {
  it('1. should detect and redact OpenAI API keys', () => {
    const input = 'const apiKey = "sk-abcdef1234567890abcdef1234567890";\nfetchModel(apiKey);';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.detections.length >= 1);
    assert.equal(result.detections[0].type, 'api_key');
    assert.ok(result.redactedCode.includes('[REDACTED_OPENAI_KEY]'));
    assert.ok(!result.redactedCode.includes('sk-abcdef1234567890'));
    // Original input must remain unaltered
    assert.ok(input.includes('sk-abcdef1234567890'));
  });

  it('2. should detect and redact AWS Access Keys', () => {
    const input = 'export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE";';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.redactedCode.includes('[REDACTED_AWS_ACCESS_KEY]'));
    assert.ok(!result.redactedCode.includes('AKIAIOSFODNN7EXAMPLE'));
  });

  it('3. should detect and redact GitHub Personal Access Tokens', () => {
    const input = 'const ghToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234";';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.redactedCode.includes('[REDACTED_GITHUB_TOKEN]'));
  });

  it('4. should detect and redact JWT-like tokens', () => {
    const input = 'const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozG4B_example_sig";';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.detections.some((d) => d.type === 'jwt'));
    assert.ok(result.redactedCode.includes('[REDACTED_JWT_TOKEN]'));
  });

  it('5. should detect and redact Authorization Bearer credentials', () => {
    const input = 'headers["Authorization"] = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz";';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.redactedCode.includes('[REDACTED_BEARER_TOKEN]') || result.redactedCode.includes('[REDACTED_JWT_TOKEN]'));
  });

  it('6. should detect and redact password assignments', () => {
    const input = 'const db_config = { password: "SuperSecretPassword123!", user: "admin" };';
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.detections.some((d) => d.type === 'password'));
    assert.ok(result.redactedCode.includes('[REDACTED_PASSWORD]'));
    assert.ok(!result.redactedCode.includes('SuperSecretPassword123!'));
  });

  it('7. should detect and redact PEM Private Key blocks', () => {
    const input = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3XYZ...
FAKEPRIVATEKEYDATA...
-----END RSA PRIVATE KEY-----`;
    const result = scanAndRedactSecrets(input);

    assert.equal(result.hasSecrets, true);
    assert.ok(result.detections.some((d) => d.type === 'private_key'));
    assert.ok(result.redactedCode.includes('[REDACTED_PRIVATE_KEY_BLOCK]'));
  });

  it('8. should return clean scan result with no false positives for ordinary code', () => {
    const cleanCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;
    const result = scanAndRedactSecrets(cleanCode);

    assert.equal(result.hasSecrets, false);
    assert.equal(result.detections.length, 0);
    assert.equal(result.redactedCode, cleanCode);
    assert.equal(result.warningMessage, '');
  });
});

describe('Bug Confession Booth — Knowledge Adapter & Retrieval Suite', () => {
  const supportedLangs: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];

  it('9. should provide verified sample bug snippets for all 6 project languages', () => {
    for (const lang of supportedLangs) {
      const sample = SAMPLE_SNIPPETS[lang];
      assert.ok(sample, `Missing sample snippet for language ${lang}`);
      assert.equal(sample.language, lang);
      assert.ok(sample.code.length > 20, `Sample code too short for ${lang}`);
      assert.ok(sample.title.length > 5, `Missing title for ${lang}`);
    }
  });

  it('10. should retrieve genuine curated knowledge entry with isDemo=false for each supported language sample', async () => {
    for (const lang of supportedLangs) {
      const sample = SAMPLE_SNIPPETS[lang];
      const { result, isNoMatch } = await searchKnowledge({
        code: sample.code,
        language: lang,
        errorTrace: sample.errorTrace,
        expectedBehavior: sample.expectedBehavior,
        actualBehavior: sample.actualBehavior,
      });

      assert.equal(isNoMatch, false, `Expected match for sample of ${lang}`);
      assert.ok(result, `Expected result object for ${lang}`);
      assert.equal(result!.language, lang);
      assert.equal(result!.isDemo, false, `Result must be genuine curated knowledge with isDemo=false`);
      assert.ok(result!.id.length > 0, `Record ID missing for ${lang}`);
      assert.ok(result!.roast.length > 10, `Roast missing for ${lang}`);
      assert.ok(result!.buggyCode.length > 5, `Buggy code missing for ${lang}`);
      assert.ok(result!.fixedCode.length > 5, `Fixed code missing for ${lang}`);
      assert.ok(result!.tests.length > 5, `Tests missing for ${lang}`);
      assert.ok(result!.sources.length >= 1, `Sources missing for ${lang}`);
      assert.ok(result!.sources[0].url.startsWith('http'), `Source URL must be valid HTTP/HTTPS for ${lang}`);
    }
  });

  it('11. should preserve original source URLs and knowledge IDs from curated records', async () => {
    const pySample = SAMPLE_SNIPPETS.python;
    const { result, isNoMatch } = await searchKnowledge({
      code: pySample.code,
      language: 'python',
      errorTrace: pySample.errorTrace,
    });

    assert.equal(isNoMatch, false);
    assert.ok(result);
    assert.equal(result!.id, 'py-mutable-default-argument');
    assert.ok(result!.sources.length >= 1);
    assert.ok(result!.sources.every((s) => typeof s.url === 'string' && s.url.startsWith('https://')));
  });

  it('12. should strictly enforce language filtering and prevent cross-language match', async () => {
    // A Python-specific code snippet searched under Java must not match a Python record
    const { result, isNoMatch } = await searchKnowledge({
      code: 'def register_player_inventory(player_name, items=[]): items.append("torch")',
      language: 'java',
    });

    if (result) {
      assert.equal(result.language, 'java', 'Returned record must match requested language strictly');
      assert.notEqual(result.language, 'python');
    } else {
      assert.equal(isNoMatch, true, 'Correctly returned isNoMatch when no java record matches python code');
    }
  });

  it('13. should return isNoMatch=true for unrecognized test input without inventing diagnosis', async () => {
    const { result, isNoMatch } = await searchKnowledge({
      code: 'xyzunsupported random nonsense code snippet that matches nothing',
      language: 'python',
    });

    assert.equal(isNoMatch, true);
    assert.equal(result, null);
  });

  it('14. should return isNoMatch=true for empty or whitespace-only code', async () => {
    const { result, isNoMatch } = await searchKnowledge({
      code: '   \n  \t  ',
      language: 'python',
    });

    assert.equal(isNoMatch, true);
    assert.equal(result, null);
  });

  it('15. should label demo fallback records with isDemo=true when querying demo helper', () => {
    for (const lang of supportedLangs) {
      const demoResult = getDemoKnowledgeResult(lang);
      assert.ok(demoResult);
      assert.equal(demoResult.isDemo, true);
      assert.ok(demoResult.demoDisclaimer?.includes('DEMO'));
      assert.equal(demoResult.language, lang);
    }
  });

  it('16. should verify compatibility with the full 60-record corpus across all 6 languages', () => {
    assert.equal(ALL_CORPUS_ENTRIES.length, 60, 'Corpus must contain exactly 60 entries (10 per language)');
    assert.equal(knowledgeIndex.size(), 60, 'Knowledge index must contain all 60 records');
  });
});

describe('Bug Confession Booth — Original Pixel-Art Emblems Suite (Prompt 04)', () => {
  const supportedLangs: CanonicalLanguage[] = ['c', 'cpp', 'java', 'python', 'javascript', 'typescript'];

  it('12. should render crisp SVG pixel emblems for all 6 supported languages', async () => {
    // Dynamic import to avoid SSR bundling side effects
    const React = await import('react');
    const ReactDOMServer = await import('react-dom/server');
    const { LanguagePixelLogo } = await import('../src/components/common/LanguagePixelLogo');

    for (const lang of supportedLangs) {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(LanguagePixelLogo, { language: lang, size: 24 })
      );

      assert.ok(html.includes('shape-rendering="crispEdges"'), `Missing crispEdges in ${lang}`);
      assert.ok(html.includes(`bb-pixel-emblem--${lang}`), `Missing CSS class for ${lang}`);
      assert.ok(html.includes('viewBox="0 0 16 16"'), `Missing 16x16 viewBox for ${lang}`);
      assert.ok(html.includes('<rect'), `Emblem for ${lang} must be built from square pixel rects`);
      assert.ok(!html.includes('undefined'), `Emblem contains undefined attributes for ${lang}`);
    }
  });

  it('13. should provide accessible labels and titles on each emblem', async () => {
    const React = await import('react');
    const ReactDOMServer = await import('react-dom/server');
    const { LanguagePixelLogo } = await import('../src/components/common/LanguagePixelLogo');

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(LanguagePixelLogo, { language: 'python', size: 20 })
    );

    assert.ok(html.includes('role="img"'));
    assert.ok(html.includes('aria-label="PYTHON pixel emblem"'));
    assert.ok(html.includes('<title>PYTHON pixel emblem</title>'));
  });
});

