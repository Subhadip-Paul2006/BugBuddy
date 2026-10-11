# 🔒 Security Policy

## Supported Versions

Only the latest release candidate / minor release on the `main` branch receives active security updates:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `0.1.x` | ✅ | Active Development / Release Candidate |
| `< 0.1.0` | ❌ | Historical Prototype |

---

## Reporting a Vulnerability

We take the security of BugBuddy seriously. If you discover a security vulnerability or credential handling defect:

1. **Do NOT open a public GitHub issue.**
2. Report the vulnerability privately via **[GitHub Security Advisories](https://github.com/Subhadip-Paul2006/BugBuddy/security/advisories/new)** on the repository.
3. If Security Advisories are not accessible, contact the repository maintainer directly through their GitHub profile.

### What to Include in Your Report
- A clear description of the vulnerability.
- Steps to reproduce the issue (proof-of-concept code or payload).
- The potential impact and attack vector.
- Any suggested fixes or remediations.

---

## Safe Handling of User Source Code & Credentials

- **Client-Side Secret Redaction**: BugBuddy executes `scanAndRedactSecrets()` in the browser before sending any code to diagnostic endpoints. Common API key formats (`sk-...`, `AIzaSy...`, JWTs, Basic Auth) are automatically scrubbed.
- **No Code Execution**: BugBuddy analyzes code strictly via static pattern matching, BM25 indexing, and LLM reasoning. Code is **never compiled, executed, or eval'd** on the host server.
- **Server-Only Credentials**: AI provider API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) must never be prefixed with `VITE_` or exposed to client bundles. They reside exclusively on the backend service.
- **Payload Limits**: The backend enforces a strict **64 KB request payload limit** and drops oversized requests immediately (HTTP 413) to protect against denial-of-service attempts.
