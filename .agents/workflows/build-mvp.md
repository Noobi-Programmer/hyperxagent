---
description: End-to-end 3-account parallel build pipeline from contract lock to adversarial QA gate.
---

# `/build-mvp` Workflow

## Phase 1: Contract Lock (Account 1 — `main`)
1. Invoke `@architect` to generate `plans/SPEC.md` and `src/types/contracts.ts`.
2. Run `bunx tsc --noEmit src/types/contracts.ts` to verify types compile cleanly.
3. Commit contracts to `main` and run `bash scripts/setup-worktrees.sh` (or rebase existing worktrees onto `main`).

## Phase 2: Parallel Swarm Execution (Accounts 2 & 3 Concurrently)
- **Window 2 (`../wt-account2-backend` on `feat/backend`):**
  Invoke `@backend-voice` to implement `src/lib/*` and `src/app/api/*` strictly against `src/types/contracts.ts`.
- **Window 3 (`../wt-account3-ui` on `feat/frontend`):**
  Invoke `@frontend-ui` to implement `src/components/*` and `src/app/page.tsx` strictly against `src/types/contracts.ts`.

## Phase 3: Integration & Adversarial QA Gate (Account 1 — `main`)
1. Merge `feat/backend` and `feat/frontend` into `main`.
2. Invoke `@qa-adversarial` to run `audit-static.mjs`, `bunx tsc --noEmit`, and the Playwright `390x844` mobile audit.
3. If any gate returns `FAIL`, route defects back to the owning worktree agent and re-verify.
