# CLAUDE.md — HyperXAgent Instructions for Claude Code

Read and follow `AGENTS.md` as the primary engineering constitution for this repository.

## Quick Reference
- **Contract-First:** Lock `plans/SPEC.md` and `src/types/contracts.ts` before writing backend (`src/app/api/*`, `src/lib/*`) or frontend (`src/app/page.tsx`, `src/components/*`) code.
- **Skills & Agents:** Reusable role definitions live in `.agents/agents/` and progressive skills live in `.agents/skills/*/SKILL.md`.
- **Workflows:** See `.agents/workflows/build-mvp.md` and `.agents/workflows/deep-research.md`.
- **Validation:** Run `bun run validate` and `bun run audit` before completing any milestone.
- **Research Rule:** Use native web search, search MCPs, or `context7` MCP for research; use Playwright only on direct documentation or asset URLs.
