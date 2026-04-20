#!/usr/bin/env python3
"""Generate Veo 3.1 image-to-video close-ups for each service page.

Sequentially submits + polls each job (Veo has a concurrent-request quota).
Skips any slug whose MP4 already exists in public/videos/services/.
"""
import os
import sys
import time
from pathlib import Path

from google import genai
from google.genai import types
from google.genai.errors import ClientError

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBp7v2zltZ8XHIJZXY_VbIIOS8u8Lnfqwg")
MODEL = "veo-3.1-generate-preview"
ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "services"
OUT_DIR = ROOT / "public" / "videos" / "services"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Known in-flight operation names from an earlier launch (before we hit 429).
# Listed first so we download those already-processing clips right away.
RESUME_OPS = {
    "ceramic-coating": "models/veo-3.1-generate-preview/operations/naq09j6gp754",
    "paint-protection-film": "models/veo-3.1-generate-preview/operations/k0jvvlvc4134",
    "window-tint": "models/veo-3.1-generate-preview/operations/buuxguw4miic",
}

JOBS = {
    "ceramic-coating": (
        "ceramic-coating.jpg",
        "Extreme macro close-up of crystal-clear water droplets beading tight "
        "on a flawless black ceramic-coated car hood. Camera slowly pushes in "
        "as droplets slide off in perfect spheres leaving zero residue. "
        "Mirror-like reflections of studio softboxes dance across the surface. "
        "Hyperrealistic, cinematic, razor-sharp 4K detail, shallow depth of field."
    ),
    "paint-protection-film": (
        "ppf.jpg",
        "Macro close-up of glossy car paint protected by clear PPF. A hairline "
        "scratch appears on the film, then slowly self-heals and vanishes as "
        "subtle warmth shimmers across the surface. Light catches the invisible "
        "protective layer. Cinematic studio lighting, hyperrealistic, 4K detail."
    ),
    "window-tint": (
        "window-tint.jpg",
        "Slow cinematic pan across a freshly installed ceramic window tint on "
        "a luxury sedan. The dark tinted glass reflects soft studio lights "
        "while interior stays cool and shadowed. Subtle highlight sweep reveals "
        "flawless install with no bubbles. Hyperrealistic, 4K detail."
    ),
    "vehicle-wraps": (
        "vehicle-wraps.jpg",
        "Macro pan across a premium satin vinyl vehicle wrap. The surface "
        "shifts color subtly as camera moves — deep metallic finish with fine "
        "texture grain visible. Light sweeps across the panel revealing "
        "flawless edges. Cinematic studio lighting, hyperrealistic, 4K."
    ),
    "paint-correction": (
        "paint-correction.jpg",
        "Macro close-up of a dual-action polisher pad spinning on deep black "
        "car paint. Swirl marks and holograms visibly disappear as the pad "
        "passes, leaving mirror-perfect gloss behind. Polishing compound "
        "smeared in arcs. Cinematic studio lighting, hyperrealistic, 4K detail."
    ),
    "detailing": (
        "detailing.jpg",
        "Slow macro shot of a clean microfiber towel gliding across freshly "
        "detailed glossy car paint. Dust and water spots vanish; the surface "
        "transitions to flawless showroom reflection. Soft studio lighting, "
        "cinematic, hyperrealistic, 4K detail."
    ),
    "windshield-protection": (
        "windshield-protection.jpg",
        "Extreme macro of rain hitting a hydrophobic-coated windshield. Each "
        "droplet instantly beads into a perfect sphere and rolls away, "
        "revealing crystal-clear glass. Water sheets off with no wipers. "
        "Cinematic rain light, hyperrealistic, 4K macro detail."
    ),
}


def mime_for(path: Path) -> str:
    return "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"


def wait_and_save(client, op, slug: str) -> bool:
    """Poll `op` until done, then download + save. Returns True on success."""
    ticks = 0
    while not op.done:
        time.sleep(10)
        ticks += 1
        try:
            op = client.operations.get(op)
        except Exception as e:
            print(f"    [poll-error {slug}]: {e}")
            continue
        if ticks % 6 == 0:
            print(f"    [{slug}] still running… ({ticks * 10}s)")
    err = getattr(op, "error", None)
    if err:
        print(f"  [FAIL] {slug}: {err}")
        return False
    try:
        video = op.response.generated_videos[0].video
        client.files.download(file=video)
        out_path = OUT_DIR / f"{slug}.mp4"
        video.save(str(out_path))
        mb = out_path.stat().st_size / (1024 * 1024)
        print(f"  [done]  {slug} -> {out_path.name} ({mb:.2f} MB)")
        return True
    except Exception as e:
        print(f"  [save-error] {slug}: {e}")
        return False


def submit_with_retry(client, slug: str, img_path: Path, prompt: str):
    with open(img_path, "rb") as f:
        img_bytes = f.read()
    attempt = 0
    while True:
        attempt += 1
        try:
            return client.models.generate_videos(
                model=MODEL,
                prompt=prompt,
                image=types.Image(image_bytes=img_bytes, mime_type=mime_for(img_path)),
                config=types.GenerateVideosConfig(
                    aspect_ratio="16:9",
                    number_of_videos=1,
                ),
            )
        except ClientError as e:
            if getattr(e, "status_code", None) == 429 and attempt < 10:
                wait = min(60 * attempt, 300)
                print(f"    [429 on {slug}] backoff {wait}s (attempt {attempt})")
                time.sleep(wait)
                continue
            raise


def main() -> int:
    client = genai.Client(api_key=API_KEY)

    # Phase 1: resume the three ops already in flight
    for slug, op_name in RESUME_OPS.items():
        out = OUT_DIR / f"{slug}.mp4"
        if out.exists():
            print(f"[skip] {slug}: already downloaded")
            continue
        print(f"[resume] {slug} -> {op_name}")
        try:
            op = client.operations.get({"name": op_name})
        except Exception as e:
            print(f"  [resume-error] {slug}: {e}")
            continue
        wait_and_save(client, op, slug)

    # Phase 2: submit remaining jobs sequentially
    for slug, (img_name, prompt) in JOBS.items():
        out = OUT_DIR / f"{slug}.mp4"
        if out.exists():
            continue
        img_path = IMG_DIR / img_name
        if not img_path.exists():
            print(f"[skip] {slug}: {img_path} missing")
            continue
        print(f"[submit] {slug}")
        try:
            op = submit_with_retry(client, slug, img_path, prompt)
        except Exception as e:
            print(f"  [submit-error] {slug}: {e}")
            continue
        print(f"  op: {op.name}")
        wait_and_save(client, op, slug)

    print("[gen] all jobs finished.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
