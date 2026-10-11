# 🚦 BugBuddy v0.1.0 — Release Checklist & Governance Gates

This checklist defines the formal quality gates required to transition BugBuddy from a Release Candidate (`v0.1.0-rc1`) to an official public release (`v0.1.0`).

---

## 1. Entry Criteria (Release Candidate Eligibility)

All entry criteria must be certified **PASS** before packaging the release:

- [x] **Zero TypeScript Errors**: `tsc` passes cleanly on all source files.
- [x] **Production Bundle**: `vite build` bundles `dist/` in under 3 seconds.
- [x] **Full Test Suite Passing**: All 192 unit and integration tests pass with 0 failures (`npm test`).
- [x] **Knowledge Base Validated**: All 60 records across 6 languages validate with 0 schema errors (`npm run validate:knowledge`).
- [x] **Retrieval Benchmarking Verified**: BM25 & Hybrid RRF benchmarks pass (`npm run evaluate:retrieval`).
- [x] **Local Semantic Embeddings Verified**: ONNX Transformers.js executes cleanly (`npm run verify:stage6`).
- [x] **Documentation Synchronized**: Root and release documentation agree with actual implementation code.
- [x] **Secret Audit Verified**: Zero API keys or `.env` files staged or committed.

---

## 2. Transition Gate (Owner Manual Approval)

- [ ] **Code Review**: Repository owner reviews staged release preparation commit.
- [ ] **Git Push**: Commit safely pushed to `main` on GitHub remote.
- [ ] **CI Pass**: GitHub Actions workflow completes successfully on `main`.

---

## 3. Exit Criteria (Official Public Release Publication)

Only after the following live operational steps are confirmed:

- [ ] **Render Backend Deployed**: `bugbuddy-backend` shows active status on Render.
- [ ] **Health Endpoint Probed**: `curl -f https://<BACKEND-URL>/health` returns HTTP 200.
- [ ] **Render Frontend Deployed**: `bugbuddy-frontend` shows active status with SPA rewrite rule.
- [ ] **Live Browser E2E Smoke Test**:
  - [ ] Confession Booth successfully diagnoses sample code.
  - [ ] Roast, diagnosis, code fix diff, and citations appear.
  - [ ] "Verify & Resolve Bug" awards +50 XP and updates profile.
  - [ ] Debugging Chat responds to multi-turn queries.
- [ ] **Git Tag Created**: Release tag `v0.1.0` created and pushed manually by owner.
- [ ] **GitHub Release Published**: Release notes published on GitHub repository.

---

## 4. Failure Handling & Abort Criteria

If any of the following occur during deployment:
- Backend fails health check probe -> Halt deployment, inspect logs, redeploy with fix or roll back.
- Frontend displays CORS error -> Verify backend `CORS_ORIGIN` matches deployed frontend domain.
- Fatal runtime exception in browser -> Roll back frontend static deploy to previous commit.
