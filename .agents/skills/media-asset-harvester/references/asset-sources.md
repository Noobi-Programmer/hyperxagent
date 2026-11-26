# Zero-Auth Asset Sources & FFmpeg Normalization

## 1. PNGs, Stickers & Textures (`01_PNG_Textures`)
- **Iconify API:** `https://api.iconify.design/search?query={q}&limit=20` | Raw SVG: `https://api.iconify.design/{prefix}/{name}.svg`
- **Openverse API:** `https://api.openverse.org/v1/images/?q={q}&extension=svg` (send `User-Agent`)
- **Wikimedia Commons API:** `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={q}&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&format=json`
- **Noto Emoji (GitHub/CDN):** `https://fonts.gstatic.com/s/e/notoemoji/latest/{code}/512.webp`
- **TextureLabs:** `https://texturelabs.org/?s={q}` (DOM click → `<a download>`)
- **FFmpeg (WebP/SVG → PNG/ProRes4444):** `ffmpeg -i in.webp -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out.mov`

## 2. Stock Video, Green-Screen & Lottie (`02_Vids_GreenScreen_Lottie`)
- **Mixkit / Coverr:** `https://mixkit.co/free-stock-video/{q}/` | `https://coverr.co/s?q={q}` (`expect_download()`)
- **Pexels / Pixabay:** Prefer official free APIs; headless UI often hits Cloudflare.
- **CreatorSet / Vlipsy:** `https://creatorset.com/search?q={q}` | `https://vlipsy.com/search?q={q}`
- **LottieFiles / Lordicon:** `https://lottiefiles.com/free-animations/{q}` (sniff `.json` via `page.on("response")` checking `"v"` & `"layers"`)
- **FFmpeg (1080p30 CFR):** `ffmpeg -i in.mp4 -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 18 -pix_fmt yuv420p -an out.mp4`
- **FFmpeg (Green-Screen → Alpha):** `ffmpeg -i gs.mp4 -vf "chromakey=0x00FF00:0.18:0.08,format=yuva420p" -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out_alpha.mov`

## 3. Audio, BGM, SFX & Memes (`03_BGM_SFX_Memes`)
- **Myinstants:** `https://www.myinstants.com/en/search/?name={q}` (`button.small-button[onclick]` → `play\('([^']+\.mp3)'`)
- **Mixkit SFX / BigSoundBank / Chosic / Kenney:** `https://bigsoundbank.com/search?q={q}` | `https://www.chosic.com/free-music/all/?keyword={q}`
- **FFmpeg (-14 LUFS 48kHz WAV):** `ffmpeg -i in.mp3 -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -ac 2 -c:a pcm_s16le out.wav`

## 4. VFX Overlays (`04_VFX_Flashes_Electric`)
- **CinePacks Free / VashiVisuals / FX Elements / MyCreativeFX:** Use `Screen` or `Add` blend mode over black.
- **FFmpeg (Luma-to-Alpha):** `ffmpeg -i fx.mp4 -vf "colorkey=0x000000:0.12:0.20,format=yuva420p" -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le fx_alpha.mov`
