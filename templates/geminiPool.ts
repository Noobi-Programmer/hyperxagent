/**
 * 3-Key Round-Robin Gemini API Pool with automatic HTTP 429 failover.
 * Reads GEMINI_API_KEYS="key1,key2,key3" (or falls back to GEMINI_API_KEY).
 */

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiGenerateOptions {
  model?: string;
  contents: GeminiContent[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
  timeoutMs?: number;
}

export interface GeminiGenerateResult {
  text: string;
  keyIndex: number;
  model: string;
  attempts: number;
}

class GeminiKeyPool {
  private keys: string[];
  private cursor = 0;
  private cooldownUntil = new Map<number, number>();

  constructor(rawKeys?: string) {
    const source =
      rawKeys ??
      process.env.GEMINI_API_KEYS ??
      process.env.GEMINI_API_KEY ??
      "";
    this.keys = source
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  private getAvailableIndices(): number[] {
    if (this.keys.length === 0) {
      throw new Error(
        "GEMINI_POOL_NO_KEYS: Set GEMINI_API_KEYS with 1-3 comma-separated Google AI Studio keys."
      );
    }

    const now = Date.now();
    const order: number[] = [];
    for (let offset = 0; offset < this.keys.length; offset++) {
      const idx = (this.cursor + offset) % this.keys.length;
      const until = this.cooldownUntil.get(idx) ?? 0;
      if (now >= until) {
        order.push(idx);
      }
    }

    // Advance round-robin pointer for next call
    this.cursor = (this.cursor + 1) % this.keys.length;

    // If all keys are cooling down, return all in round-robin order so caller still attempts
    if (order.length === 0) {
      return this.keys.map((_, idx) => idx);
    }
    return order;
  }

  private markRateLimited(idx: number, retryAfterHeader: string | null): void {
    const seconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
    const backoffMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 15_000;
    this.cooldownUntil.set(idx, Date.now() + backoffMs);
  }

  public async generateContent(
    options: GeminiGenerateOptions
  ): Promise<GeminiGenerateResult> {
    const model = options.model ?? "gemini-2.5-flash";
    const timeoutMs = options.timeoutMs ?? 15_000;
    const candidateIndices = this.getAvailableIndices();
    let lastError: Error | null = null;
    let attempts = 0;

    for (const keyIndex of candidateIndices) {
      attempts++;
      const apiKey = this.keys[keyIndex];
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const payload: Record<string, unknown> = {
        contents: options.contents,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
          ...(options.responseMimeType
            ? { responseMimeType: options.responseMimeType }
            : {}),
        },
      };

      if (options.systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.status === 429) {
          this.markRateLimited(keyIndex, res.headers.get("retry-after"));
          lastError = new Error(
            `RESOURCE_EXHAUSTED (429) on GEMINI_API_KEYS[${keyIndex}]`
          );
          continue;
        }

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(
            `Gemini HTTP ${res.status} on key[${keyIndex}]: ${errBody.slice(0, 240)}`
          );
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };

        const text =
          data.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("") ?? "";

        if (!text) {
          throw new Error(`Empty candidate response on key[${keyIndex}]`);
        }

        return { text, keyIndex, model, attempts };
      } catch (err) {
        clearTimeout(timer);
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
          this.markRateLimited(keyIndex, null);
          continue;
        }
        // Failover on abort/network timeouts as well
        if (lastError.name === "AbortError") {
          continue;
        }
        throw lastError;
      }
    }

    throw (
      lastError ??
      new Error("GEMINI_POOL_EXHAUSTED: All configured API keys failed.")
    );
  }
}

export const geminiPool = new GeminiKeyPool();
