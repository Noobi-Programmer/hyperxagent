# Sarvam AI REST Specifications (2026)

- **Authentication Header:** `api-subscription-key: ${process.env.SARVAM_API_KEY}`
- **Supported Language Codes:** `en-IN` (Indian English), `hi-IN` (Hindi), `ta-IN` (Tamil), `kn-IN` (Kannada)

## 1. Speech-to-Text (`POST https://api.sarvam.ai/speech-to-text`)
- **Content-Type:** `multipart/form-data` (max **30s** per synchronous REST request; use Batch API for up to 2h)
- **Fields:**
  - `file`: Audio binary (`wav`, `webm`, or `mp3`, 16kHz recommended)
  - `model`: `"saaras:v4"` (`saarika:v2.5` is deprecated)
  - `mode`: `"transcribe"` (`"transcribe" | "translate" | "verbatim" | "translit" | "codemix"`)
  - `language_code` (optional): `"en-IN" | "hi-IN" | "ta-IN" | "kn-IN"` (omit for auto-detect)
  - `keyterms` (optional): JSON-encoded array of up to 50 domain terms
- **Response JSON:**
  `{ "request_id": string, "transcript": string, "language_code": string | null, "language_probability": number | null, "timestamps": object | null, "diarized_transcript": object | null }`

## 2. Text-to-Speech (`POST https://api.sarvam.ai/text-to-speech`)
- **Content-Type:** `application/json` (max **2,500 chars** per request)
- **Body:**
  ```json
  {
    "text": "Text to synthesize (max 2500 chars)",
    "language_code": "ta-IN",
    "model": "bulbul:v4-flash",
    "speaker": "simran_en_customer",
    "speech_sample_rate": 24000,
    "pace": 1.0,
    "output_audio_codec": "wav"
  }
  ```
- **Model Notes:** Use `bulbul:v4-flash` (200+ `<name>_<lang>_<style>` personas, default `shubh_enhi_ads`) or `bulbul:v3` (classic short names like `shubh`, `ritu`).
- **Response JSON:** `{ "request_id": string, "audios": ["<base64-encoded-audio>"] }`
