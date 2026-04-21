#!/usr/bin/env python3
"""Generate vehicle picker thumbnails via Gemini 3.1 flash image model.

Produces one JPEG per vehicle, landscape, studio lighting that matches the
configurator's dark moody vibe. Output -> public/images/vehicles/.
Uses gemini-3.1-flash-image-preview instead of Imagen because Imagen is
paid-tier only on this project.
"""
import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai.errors import ClientError

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set GEMINI_API_KEY env var before running.")
MODEL = "gemini-3.1-flash-image-preview"
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images" / "vehicles"
OUT_DIR.mkdir(parents=True, exist_ok=True)

STYLE_PREFIX = (
    "Cinematic studio product photography, 3/4 front view, dark reflective "
    "studio floor, moody dramatic lighting with teal and amber rim light, "
    "shot on ARRI, anamorphic, shallow depth of field, hyperrealistic. "
    "Pure black studio background. No text, no logos, no watermarks."
)

JOBS = {
    "bmw-m4": (
        f"{STYLE_PREFIX} 2024 BMW M4 Competition Coupe in frozen black, "
        "aggressive kidney grille lit by red rim light, forged wheels, "
        "carbon fiber accents."
    ),
    "tesla-model-3": (
        f"{STYLE_PREFIX} 2024 Tesla Model 3 Performance in pearl white, "
        "minimal sleek EV sedan silhouette, performance spoiler, dark gloss "
        "sport wheels, blue accent rim light."
    ),
    "lambo-urus": (
        f"{STYLE_PREFIX} 2024 Lamborghini Urus in satin gunmetal grey, "
        "aggressive SUV stance, signature Y-shape headlights lit, flared "
        "fenders, carbon ceramic brakes visible."
    ),
    "cybertruck": (
        f"{STYLE_PREFIX} 2024 Tesla Cybertruck in raw stainless steel, "
        "angular geometric body, exoskeleton, light bar on front, "
        "industrial futuristic silhouette."
    ),
}


def generate_one(client, slug: str, prompt: str, out_path: Path) -> bool:
    attempt = 0
    while attempt < 6:
        attempt += 1
        try:
            resp = client.models.generate_content(model=MODEL, contents=prompt)
        except ClientError as e:
            sc = getattr(e, "status_code", 0)
            if sc == 429 and attempt < 6:
                wait = 35 * attempt
                print(f"  [429 {slug}] backoff {wait}s (try {attempt})")
                time.sleep(wait)
                continue
            print(f"  [fail {slug}] {e}")
            return False
        parts = resp.candidates[0].content.parts if resp.candidates else []
        for p in parts:
            data = getattr(p, "inline_data", None)
            if data and data.data:
                out_path.write_bytes(data.data)
                kb = out_path.stat().st_size / 1024
                print(f"  [done] {out_path.name} ({kb:.0f} KB)")
                return True
        print(f"  [empty {slug}] no inline_data in response")
        return False
    return False


def main() -> int:
    client = genai.Client(api_key=API_KEY)
    for slug, prompt in JOBS.items():
        out = OUT_DIR / f"{slug}.jpg"
        if out.exists() and out.stat().st_size > 20_000:
            print(f"[skip] {slug}: already generated")
            continue
        print(f"[gen] {slug}")
        generate_one(client, slug, prompt, out)
        time.sleep(3)  # gentle spacing to avoid per-minute caps
    print("[gen] done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
