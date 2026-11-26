---
name: contract-architect
description: Generates locked API contracts in src/types/contracts.ts and architecture specs in plans/SPEC.md before parallel agent work.
---

# Contract Architect Skill

## Procedure
1. Read `references/schema-rules.md` before drafting types.
2. Decompose the feature request into:
   - **Domain Entities:** Immutable TypeScript interfaces with explicit union literals.
   - **API Routes:** Every route must specify HTTP method, path, request schema, and `ApiResponse<TData>`.
   - **Failure Modes:** Enumerate error codes (`INVALID_INPUT`, `UPSTREAM_TIMEOUT`, `RATE_LIMITED`, `INTERNAL_ERROR`).
3. Write `src/types/contracts.ts` first, then write `plans/SPEC.md` referencing exact type names from `contracts.ts`.
4. Verify zero TypeScript syntax errors using `bunx tsc --noEmit src/types/contracts.ts`.
