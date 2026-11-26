---
name: media-asset-harvester
description: Searches, downloads, and FFmpeg-normalizes zero-login, watermark-free video editing assets (PNG/textures, stock video/Lottie, BGM/SFX/memes, VFX overlays) using Playwright and direct APIs.
---

# Media Asset Harvester Skill

## Output Folder Layout
- `01_PNG_Textures/` — Transparent PNGs, SVGs, stickers, paper/grunge textures
- `02_Vids_GreenScreen_Lottie/` — 1080p CFR stock video, green-screen clips, Lottie `.json`
- `03_BGM_SFX_Memes/` — `-14 LUFS` 48kHz stereo WAV audio & meme sounds
- `04_VFX_Flashes_Electric/` — Screen/Add or ProRes 4444 alpha VFX overlays

## Procedure
1. Read `references/asset-sources.md` for exact search URLs, API endpoints, and FFmpeg commands.
2. Prefer zero-auth JSON APIs (`Iconify`, `Openverse`, `Wikimedia Commons`) before launching headless Chromium.
3. Use `scripts/asset_harvester.py` to test or execute scraping layers in order:
   - **Static HTML + MP3 regex:** `python .agents/skills/media-asset-harvester/scripts/asset_harvester.py --mode myinstants --query "vine boom"`
   - **DOM `expect_download`:** `--mode mixkit --url "https://mixkit.co/free-sound-effects/whoosh/"`
   - **Network XHR JSON sniff:** `--mode lottie --url "https://lottiefiles.com/free-animations/lightning"`
   - **Zero-auth APIs:** `--mode iconify --query "bolt"` or `--mode openverse --query "paper texture"`
4. Stop immediately if any site presents a CAPTCHA or login wall; never attempt to bypass bot checks.
