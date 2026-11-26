# Schema & Contract Rules (`src/types/contracts.ts`)

1. **Standard Response Envelope (Mandatory on all `/api/*` routes):**
   ```ts
   export type ApiErrorCode =
     | "INVALID_INPUT"
     | "RATE_LIMITED"
     | "UPSTREAM_TIMEOUT"
     | "UPSTREAM_ERROR"
     | "INTERNAL_ERROR";

   export type ApiResponse<T> =
     | { ok: true; data: T; meta?: { latencyMs: number; keyIndex?: number } }
     | { ok: false; error: { code: ApiErrorCode; message: string; retryable: boolean } };
   ```

2. **No Implicit `any` or `unknown` Leakage:** Every request and response payload must be a named `interface` or discriminated `type`.
3. **ISO-8601 Timestamps & String IDs:** Represent dates as ISO strings (`createdAt: string`) over JSON boundaries to prevent serialization drift between server and client.
4. **Language Codes:** Use BCP-47 / Sarvam canonical codes (`"en-IN" | "hi-IN" | "ta-IN" | "kn-IN"`).
