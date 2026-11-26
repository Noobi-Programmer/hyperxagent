---
description: Execute zero-cost background web research via Google AI Mode (udm=50) and save a verified brief.
---

# `/deep-research` Workflow

1. Invoke `@research-scout` with the user's research question or API specification query.
2. `@research-scout` executes `google-ai-search` via headless Playwright (`udm=50`) and cross-checks documentation via `context7`.
3. Write the synthesized findings, verified endpoint schemas, and source URLs into `plans/RESEARCH.md` (or return inline if read-only mode is requested).
