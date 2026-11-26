# Contributing to HyperXAgent

Thank you for contributing to `hyperxagent`!

## Ground Rules
1. Follow `AGENTS.md` strictly: zero `any`, zero hardcoded secrets, and keep all Markdown files under `130` lines (`references/` may hold longer specs).
2. Every agent in `.agents/agents/` must declare `name`, `description`, `subagent: true`, `tools`, and `owns` in YAML frontmatter.
3. Every skill in `.agents/skills/<name>/SKILL.md` must match its directory name in `name:` and include a trigger-focused `description:`.

## Before Opening a Pull Request
Run both deterministic checks locally:
```bash
bun run validate
bun run audit
```
Both commands must exit `0` with zero errors.
