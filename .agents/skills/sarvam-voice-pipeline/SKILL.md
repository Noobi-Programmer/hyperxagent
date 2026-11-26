---
name: sarvam-voice-pipeline
description: Implements low-latency multilingual Speech-to-Text and Text-to-Speech pipelines using Sarvam AI REST endpoints with fallback handling.
---

# Sarvam Voice Pipeline Skill

## Procedure
1. Read `references/sarvam-api-specs.md` for exact endpoints, headers, and supported Indian language codes.
2. Implement server-side wrappers in `src/lib/sarvam.ts` (never expose `SARVAM_API_KEY` to client bundles).
3. Enforce:
   - Audio payload size guard (`<= 5 MB` per chunk) and MIME validation (`audio/wav`, `audio/webm`, `audio/mpeg`).
   - `AbortController` timeout of `12000ms` per request.
   - Clean error mapping into `ApiErrorCode` (`RATE_LIMITED` on `429`, `UPSTREAM_TIMEOUT` on abort, `UPSTREAM_ERROR` on `5xx`).
4. Pair STT output with `geminiPool.generateContent()` for structured clinical/domain reasoning before calling TTS.
