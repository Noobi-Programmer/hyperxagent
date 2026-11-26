---
name: adversarial-qa
description: Runs deterministic static secret/type audits, TypeScript checks, and Playwright 390x844 mobile layout/accessibility gates.
---

# Adversarial QA Skill

## Gate Sequence
1. **Static Audit:** Run `bun run .agents/skills/adversarial-qa/scripts/audit-static.mjs <target-repo>`. Must exit `0`.
2. **Type Check:** Run `bunx tsc --noEmit`. Must exit `0` with zero warnings/errors.
3. **Runtime Mobile Audit (`390x844`):**
   - Start app server and open `http://localhost:3000` in Playwright (`390x844`).
   - Verify `document.documentElement.scrollWidth <= window.innerWidth`.
   - Verify zero `console.error` and zero `pageerror` events.
   - Verify all visible buttons satisfy `rect.width >= 44 && rect.height >= 44`.
   - Test primary API endpoint with malformed JSON to confirm graceful `400` (`ok: false`) instead of `500`.
4. **Verdict Report:** Output a concise checklist table with `PASS` or `FAIL` per gate.
