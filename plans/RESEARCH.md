# Sarvam AI 2026 Speech-to-Text & Text-to-Speech Research Brief

Verified via `docs.sarvam.ai` (`context7` MCP + web search).

## 1. Speech-to-Text (`POST https://api.sarvam.ai/speech-to-text`)
- **Auth Header:** `api-subscription-key: <SARVAM_API_KEY>`
- **Current Model:** `saaras:v4` (recommended default; supports 23 languages).
  - *Legacy / Deprecated:* `saaras:v3` is legacy; `saarika:v2.5` is deprecated (migrate to `saaras:v4` with `mode="transcribe"`).
- **Supported Target Codes:** `en-IN`, `hi-IN`, `ta-IN`, `kn-IN` (omit or `"unknown"` for auto-detection).
- **Duration Limits:** **30 seconds** max per synchronous REST call; Batch API supports up to **2 hours** per file; WebSocket supports real-time streaming.
- **Request (`multipart/form-data`):**
  - `file` (required): audio binary (`wav`, `webm`, `mp3`)
  - `model` (required): `"saaras:v4"`
  - `mode` (required): `"transcribe" | "translate" | "verbatim" | "translit" | "codemix"`
  - `language_code` (optional): `"en-IN" | "hi-IN" | "ta-IN" | "kn-IN"`
  - `keyterms` (optional): JSON array of up to 50 terms (64 chars max each, `saaras:v4` only)
- **Response JSON (`200`):**
  ```json
  {
    "request_id": "20260209_abc123",
    "transcript": "नमस्ते, आप कैसे हैं?",
    "timestamps": null,
    "diarized_transcript": null,
    "language_code": "hi-IN",
    "language_probability": 0.95
  }
  ```

## 2. Text-to-Speech (`POST https://api.sarvam.ai/text-to-speech`)
- **Models:**
  - `bulbul:v4-flash` — Latest model (200+ persona voices formatted `<name>_<lang>_<style>`, e.g., `simran_en_customer`, `ritu_hi_customer`; default `shubh_enhi_ads`).
  - `bulbul:v3` — Previous standard / API default if `model` omitted (30+ short speaker names; default `shubh`).
- **Limits & Sample Rates:** Up to **2,500 characters** per REST request; `speech_sample_rate` supports `8000`, `16000`, `22050` (default), `24000`, `32000`, `44100`, `48000` Hz (streaming caps at `24000`).
- **Request JSON:**
  ```json
  {
    "text": "Welcome to Sarvam AI!",
    "language_code": "en-IN",
    "model": "bulbul:v4-flash",
    "speaker": "simran_en_customer",
    "speech_sample_rate": 24000,
    "pace": 1.0,
    "output_audio_codec": "wav"
  }
  ```
- **Response JSON (`200`):** `{ "request_id": "...", "audios": ["<base64-encoded-audio>"] }`
- **Sources:** `https://docs.sarvam.ai/api/api-guides-tutorials/models/saaras`, `https://docs.sarvam.ai/api/api-guides-tutorials/models/bulbul`, `https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/rest-api`
