---
name: google-ai-search
description: Low-credit web research via Antigravity's inbuilt browser using Google AI Mode (udm=50). Use whenever live search results, latest news or facts, 2026 API documentation, or troubleshooting guidance when stuck are needed.
---

# Google AI Mode Search Skill (Inbuilt Browser `udm=50`)

## When to Trigger Automatically
- Queries requiring current news, live facts, pricing, or post-cutoff 2026 documentation.
- Resolving build errors, SDK breaking changes, or runtime bugs after 2 failed attempts.
- Verifying REST endpoints, headers, and payload schemas before coding.

## Execution Order
1. **Primary (`udm=50` Direct URL Navigation):**
   - Never click or type into Google's search input box.
   - Pass concise queries (`<= 120` chars; split multi-part questions into 2 queries) directly via URL:
     `https://www.google.com/search?udm=50&hl=en&q=${encodeURIComponent(query)}`
2. **Capture Synthesized Overview & Citations:** Wait for the AI Mode response stream to finish rendering, then extract the synthesized answer and cited source URLs.
3. **Immediate Fallback on `BOT_CHECK_DETECTED` / CAPTCHA:**
   - If the browser subagent returns `BOT_CHECK_DETECTED` or a CAPTCHA, stop browser automation immediately without attempting to bypass it, and do NOT stall—immediately fall back to `search_web` and `context7` in the same turn to complete the answer.
4. **Output Format:** Return concise, actionable findings with exact code/endpoint specs and source URLs.
