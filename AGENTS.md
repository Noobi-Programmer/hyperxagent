# AGENTS.md — Global Engineering Constitution

## 1. Non-Negotiable Architecture Rules
- **Contract-First Execution:** No backend or frontend agent may write feature code until `architect` locks `plans/SPEC.md` and `src/types/contracts.ts`.
- **Strict File Ownership:** Agents modify ONLY files within their declared ownership globs. Cross-boundary edits require a contract amendment via `architect`.
- **Zero-Slop Mandate:** Never emit `TODO`, `FIXME`, placeholder comments, mock stubs in production routes, or `any` types (`: any`, `as any`, `<any>`).
- **Runtime & Tooling:** Prefer `bun` and `bunx` over `npm` and `npx`. Target Next.js App Router + TypeScript strict mode + Tailwind CSS.
- **Zero-Cost Infrastructure ($0 Tier):** Use only free-tier APIs, Antigravity's inbuilt browser, SQLite/in-memory stores, and the 3-key `geminiPool.ts` rotator.

## 2. Low-Credit Google AI Mode Search (`udm=50`) Rule
- **Automatic Delegation:** Whenever you need latest news/facts, current 2026 SDK/API docs, library release changes, or troubleshooting guidance after **2 failed fix attempts**, immediately invoke `@research-scout` (skill `google-ai-search`) using Antigravity's inbuilt `browser` subagent on `https://www.google.com/search?udm=50&hl=en&q=...`.
- **Credit Conservation:** Prefer a single `udm=50` browser lookup over multi-turn trial-and-error or paid search APIs. If the inbuilt browser hits a CAPTCHA or is unavailable, fall back to `search_web` or `context7`.

## 3. Parallel Worktree Partitioning (3 Google AI Pro Accounts)
- **Account 1 (`main`):** Runs `architect` and `qa-adversarial`. Owns `plans/*`, `src/types/*`, integration merges, and `390x844` mobile audits.
- **Account 2 (`../wt-account2-backend` on `feat/backend`):** Runs `backend-voice`. Owns `src/app/api/*` and `src/lib/*`.
- **Account 3 (`../wt-account3-ui` on `feat/frontend`):** Runs `frontend-ui`. Owns `src/app/page.tsx`, `src/app/layout.tsx`, and `src/components/*`.

## 4. Security & Resilience Standards
- Never hardcode API keys, bearer tokens, or `.env` values in source or markdown files.
- All external AI/API calls must implement `AbortController` timeouts (`<= 15000ms`), structured JSON error envelopes (`{ ok: false, error: { code, message } }`), and HTTP `429` key rotation via `geminiPool.ts`.
- Every interactive UI element must meet WCAG AA/AAA contrast (`>= 4.5:1`) and minimum `48x48px` touch targets on a `390x844` mobile viewport.

## 5. Harness Commands
- Validate harness structure & frontmatter: `bun run validate` (or `node scripts/validate-harness.mjs`)
- Run static security & type audit: `bun run audit` (or `node .agents/skills/adversarial-qa/scripts/audit-static.mjs`)
- Harvest & normalize NLE assets: `python .agents/skills/media-asset-harvester/scripts/asset_harvester.py --mode <iconify|openverse|myinstants|mixkit|lottie> --query "<term>"`
