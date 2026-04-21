#!/usr/bin/env python3
"""Generate vehicle picker thumbnails via Imagen 4.

Produces one JPEG per vehicle, 16:9, studio lighting that matches the
configurator's dark moody vibe. Output -> public/images/vehicles/.
"""
import os
import sys
from pathlib import Path

from google import genai
from google.genai import types
from google.genai.errors import ClientError

API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    raise SystemExit("Set GEMINI_API_KEY env var before running.")
MODEL = "imagen-4.0-generate-001"
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


def main() -> int:
    client = genai.Client(api_key=API_KEY)
    for slug, prompt in JOBS.items():
        out = OUT_DIR / f"{slug}.jpg"
        if out.exists() and out.stat().st_size > 20_000:
            print(f"[skip] {slug}: already generated")
            continue
        print(f"[gen] {slug}")
        try:
            resp = client.models.generate_images(
                model=MODEL,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                    output_mime_type="image/jpeg",
                ),
            )
        except ClientError as e:
            print(f"  [fail] {slug}: {e}")
            continue
        if not resp.generated_images:
            print(f"  [empty] {slug}")
            continue
        img = resp.generated_images[0].image
        out.write_bytes(img.image_bytes)
        mb = out.stat().st_size / 1024
        print(f"  [done] {out.name} ({mb:.0f} KB)")
    print("[gen] done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
