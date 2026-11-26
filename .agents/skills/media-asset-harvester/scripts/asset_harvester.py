#!/usr/bin/env python3
"""
Zero-login, watermark-free media asset harvester and FFmpeg NLE normalizer.
Supports direct JSON APIs (Iconify, Openverse) and Playwright scraping
(Myinstants, Mixkit expect_download, LottieFiles network XHR interception).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

SUBDIRS = {
    "png": "01_PNG_Textures",
    "vid": "02_Vids_GreenScreen_Lottie",
    "aud": "03_BGM_SFX_Memes",
    "vfx": "04_VFX_Flashes_Electric",
}


def ensure_dirs(root: Path) -> dict[str, Path]:
    paths: dict[str, Path] = {}
    for key, name in SUBDIRS.items():
        p = root / name
        p.mkdir(parents=True, exist_ok=True)
        paths[key] = p
    return paths


def sanitize_slug(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", value).strip("_") or "asset"


def normalize_audio_to_wav(src: Path, dst: Path) -> bool:
    if not shutil.which("ffmpeg"):
        print(f"[WARN] ffmpeg not found; skipping WAV conversion for {src.name}")
        return False
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-af",
            "loudnorm=I=-14:TP=-1.5:LRA=11",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(dst),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return True


def fetch_iconify(query: str, out_dir: Path, limit: int = 3) -> list[Path]:
    url = f"https://api.iconify.design/search?query={urllib.parse.quote(query)}&limit={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": "hyperxagent-harvester/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    saved: list[Path] = []
    for icon in data.get("icons", [])[:limit]:
        if ":" not in icon:
            continue
        prefix, name = icon.split(":", 1)
        svg_url = f"https://api.iconify.design/{urllib.parse.quote(prefix)}/{urllib.parse.quote(name)}.svg"
        svg_req = urllib.request.Request(svg_url, headers={"User-Agent": "hyperxagent-harvester/1.0"})
        with urllib.request.urlopen(svg_req, timeout=15) as svg_resp:
            dest = out_dir / f"{sanitize_slug(prefix)}_{sanitize_slug(name)}.svg"
            dest.write_bytes(svg_resp.read())
            saved.append(dest)
            print(f"[OK] Iconify -> {dest}")
    return saved


def fetch_openverse(query: str, out_dir: Path, limit: int = 3) -> list[Path]:
    url = f"https://api.openverse.org/v1/images/?q={urllib.parse.quote(query)}&page_size={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": "hyperxagent-harvester/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    saved: list[Path] = []
    for idx, item in enumerate(data.get("results", [])[:limit]):
        asset_url = item.get("url")
        if not asset_url:
            continue
        ext = Path(urllib.parse.urlparse(asset_url).path).suffix or ".png"
        dest = out_dir / f"{sanitize_slug(query)}_{idx}{ext}"
        try:
            asset_req = urllib.request.Request(asset_url, headers={"User-Agent": "hyperxagent-harvester/1.0"})
            with urllib.request.urlopen(asset_req, timeout=15) as asset_resp:
                dest.write_bytes(asset_resp.read())
                saved.append(dest)
                print(f"[OK] Openverse -> {dest}")
        except Exception as exc:
            print(f"[WARN] Failed Openverse asset {asset_url}: {exc}")
    return saved


async def scrape_myinstants(page, query: str, out_dir: Path, limit: int = 3, convert_wav: bool = True) -> None:
    encoded = urllib.parse.quote_plus(query)
    await page.goto(f"https://www.myinstants.com/en/search/?name={encoded}", wait_until="domcontentloaded")
    onclicks = await page.locator("button.small-button[onclick]").evaluate_all(
        f"els => els.slice(0, {limit}).map(e => e.getAttribute('onclick'))"
    )
    slug = sanitize_slug(query)
    for idx, attr in enumerate(onclicks):
        match = re.search(r"play\('([^']+\.mp3)'", attr or "")
        if not match:
            continue
        raw_path = match.group(1)
        mp3_url = f"https://www.myinstants.com{raw_path}" if raw_path.startswith("/") else raw_path
        resp = await page.request.get(mp3_url)
        raw_mp3 = out_dir / f"{slug}_{idx}.mp3"
        raw_mp3.write_bytes(await resp.body())
        print(f"[OK] Myinstants MP3 -> {raw_mp3}")
        if convert_wav:
            wav_path = out_dir / f"{slug}_{idx}_nle.wav"
            if normalize_audio_to_wav(raw_mp3, wav_path):
                print(f"[OK] Normalized WAV -> {wav_path}")


async def scrape_mixkit_download(page, url: str, out_dir: Path) -> None:
    await page.goto(url, wait_until="domcontentloaded")
    btn = page.locator("a[download], button:has-text('Download')").first
    async with page.expect_download(timeout=15000) as dl_info:
        await btn.click()
    dl = await dl_info.value
    dest = out_dir / dl.suggested_filename
    await dl.save_as(dest)
    print(f"[OK] Mixkit download -> {dest}")


async def sniff_lottie_json(page, url: str, name: str, out_dir: Path, limit: int = 3) -> None:
    captured: list[dict] = []

    async def on_response(res) -> None:
        ctype = res.headers.get("content-type") or ""
        if ".json" in res.url or "application/json" in ctype:
            try:
                body = await res.json()
                if isinstance(body, dict) and "v" in body and "layers" in body:
                    captured.append(body)
            except Exception:
                pass

    page.on("response", on_response)
    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
    await page.wait_for_timeout(5000)
    page.remove_listener("response", on_response)
    slug = sanitize_slug(name)
    for idx, payload in enumerate(captured[:limit]):
        dest = out_dir / f"{slug}_{idx}.json"
        dest.write_text(json.dumps(payload), encoding="utf-8")
        print(f"[OK] Lottie JSON -> {dest}")


async def run_playwright_mode(args: argparse.Namespace, dirs: dict[str, Path]) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency 'playwright'. Install it with:\n"
            "  pip install playwright && playwright install chromium"
        ) from exc

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True, viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        try:
            if args.mode == "myinstants":
                await scrape_myinstants(page, args.query, dirs["aud"], args.limit, not args.no_ffmpeg)
            elif args.mode == "mixkit":
                target = args.url or f"https://mixkit.co/free-sound-effects/{urllib.parse.quote(args.query)}/"
                await scrape_mixkit_download(page, target, dirs["aud"])
            elif args.mode == "lottie":
                target = args.url or f"https://lottiefiles.com/free-animations/{urllib.parse.quote(args.query)}"
                await sniff_lottie_json(page, target, args.query, dirs["vid"], args.limit)
        finally:
            await browser.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Harvest & normalize free NLE editing assets.")
    parser.add_argument(
        "--mode",
        choices=["iconify", "openverse", "myinstants", "mixkit", "lottie"],
        required=True,
        help="Asset source mode to run.",
    )
    parser.add_argument("--query", default="bolt", help="Search keyword.")
    parser.add_argument("--url", default="", help="Optional direct URL for mixkit/lottie modes.")
    parser.add_argument("--out-dir", default="assets_nle", help="Root output directory.")
    parser.add_argument("--limit", type=int, default=3, help="Max assets to fetch.")
    parser.add_argument("--no-ffmpeg", action="store_true", help="Skip FFmpeg normalization.")
    args = parser.parse_args()

    dirs = ensure_dirs(Path(args.out_dir))
    if args.mode == "iconify":
        fetch_iconify(args.query, dirs["png"], args.limit)
    elif args.mode == "openverse":
        fetch_openverse(args.query, dirs["png"], args.limit)
    else:
        asyncio.run(run_playwright_mode(args, dirs))


if __name__ == "__main__":
    main()
