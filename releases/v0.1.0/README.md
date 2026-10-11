# 📦 BugBuddy Release Package — v0.1.0 (Release Candidate)

**Version:** `v0.1.0-rc1`  
**Status:** **RELEASE CANDIDATE (Pre-Deployment Verified)**  
**Verification Date:** October 11, 2026  
**Git Branch Target:** `main`  
**Deployment Target:** Render (Decoupled Static Site + Web Service)

---

## 📋 Overview

This directory contains the authoritative release documentation package for BugBuddy's first public hackathon MVP release candidate (`v0.1.0-rc1`).

All code, schemas, and test results in this package reflect the verified state of the local repository. Live production deployment on Render remains a deliberate, manually controlled action to be executed upon repository owner authorization.

---

## 🗂️ Package Contents

| Document | Purpose | Status |
| :--- | :--- | :---: |
| [`RELEASE_NOTES.md`](RELEASE_NOTES.md) | User-facing release announcement and highlights | Ready (RC) |
| [`RELEASE_MANIFEST.md`](RELEASE_MANIFEST.md) | File inventory and runtime dependency matrix | Certified |
| [`QA_REPORT.md`](QA_REPORT.md) | Local test, benchmark, build, and browser QA results | Verified (192/192 PASS) |
| [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) | Step-by-step checklist for configuring Render & DNS | Prepared |
| [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) | Code-verified architectural boundaries and constraints | Documented |
| [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md) | Secret isolation, redaction, and threat boundary review | Verified |
| [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) | Entry and exit gates for moving from RC to Published | Active |
| [`CHANGELOG.md`](CHANGELOG.md) | Version-specific delta referencing root CHANGELOG | Synchronized |

---

## 🚦 Release Status Policy

- **Current State**: `RELEASE CANDIDATE` (All 5 local preflight quality gates passed with zero errors).
- **Next Transition**: Transition to `RELEASED` will occur only after:
  1. Manual push of the candidate commit to `main`.
  2. Manual deployment of `bugbuddy-backend` and `bugbuddy-frontend` on Render.
  3. Live end-to-end smoke verification on public URLs.
