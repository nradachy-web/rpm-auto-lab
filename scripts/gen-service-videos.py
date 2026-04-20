#!/usr/bin/env python3
"""Generate cinematic 3-cut slow-mo videos for each service page.

For each service we produce three ~6s Veo clips (an "anchor" image-to-video
shot plus two text-to-video angles) and concatenate them into one MP4.
The result is a ~15-20s hero with real jump cuts, slow-motion feel, and
consistent color grade.

Concurrency: up to 3 Veo ops in flight (matches the rate-limit ceiling we
saw on the free/preview quota). Resumes intermediate clips already on disk
so failed runs can pick up without re-paying.
"""
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional, List, Dict, Tuple

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from imageio_ffmpeg import get_ffmpeg_exe

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBp7v2zltZ8XHIJZXY_VbIIOS8u8Lnfqwg")
MODEL = "veo-3.1-fast-generate-preview"  # Quality bucket exhausted; Fast is still 1080p
MAX_IN_FLIGHT = 3  # Veo preview quota tops out around here
ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "services"
CLIP_DIR = ROOT / "public" / "videos" / "services" / "clips"
OUT_DIR = ROOT / "public" / "videos" / "services"
CLIP_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Shared style locks the "look" across all 21 clips so jump-cuts feel like
# one coherent piece rather than random footage.
STYLE = (
    "Cinematic slow motion (120fps feel), shot on ARRI Alexa, anamorphic "
    "lens flares, shallow depth of field, moody detailing studio with "
    "polished concrete, teal-and-amber cinematic color grade, volumetric "
    "rim light, soft studio softboxes, subtle film grain, hyperrealistic "
    "4K macro detail. No text, no logos, no people's faces."
)

# Per service: (source_image_filename, [ (cut_id, use_image_as_start, prompt), ... ])
STORYBOARD: Dict[str, Tuple[str, List[Tuple[str, bool, str]]]] = {
    "ceramic-coating": ("ceramic-coating.jpg", [
        ("a", True,
         "Extreme macro push-in on water droplets beading perfectly tight on "
         "flawless black ceramic-coated paint; surface tension pulls them into "
         "mirror spheres that reflect studio softboxes. Almost imperceptible "
         f"motion. {STYLE}"),
        ("b", False,
         "Ultra-slow-motion extreme macro of a single water droplet splashing "
         "onto a glossy black ceramic-coated car hood; droplet forms a crown, "
         f"collapses, then settles as a flawless hydrophobic bead. {STYLE}"),
        ("c", False,
         "Slow dolly along the edge of a jet-black ceramic-coated hood as "
         "beaded water sheets off in mercury rivulets, leaving bone-dry paint "
         f"behind; a neon rim-light sweeps across the reflection. {STYLE}"),
    ]),
    "paint-protection-film": ("ppf.jpg", [
        ("a", True,
         "Macro of clear paint protection film on glossy car paint; a hairline "
         "scratch slowly appears across the film then closes and vanishes as "
         f"warm heat-haze ripples through it. {STYLE}"),
        ("b", False,
         "Slow-motion macro of a detailer's gloved hand sweeping a heat gun "
         "over clear PPF on a carbon-gray fender; visible heat waves shimmer "
         f"and the film bonds seam-invisibly. {STYLE}"),
        ("c", False,
         "Extreme macro on the tucked edge of a PPF wrap at a body-panel gap; "
         "light glints along the invisible seam as the camera slides past, "
         f"revealing a flawless factory-tight install. {STYLE}"),
    ]),
    "window-tint": ("window-tint.jpg", [
        ("a", True,
         "Slow cinematic dolly across a freshly ceramic-tinted luxury sedan "
         "window; studio softbox reflections glide across the dark glass, "
         f"interior shadowed and cool. {STYLE}"),
        ("b", False,
         "Macro slow-motion of a squeegee pressing dark ceramic window tint "
         "onto glass; water droplets squeeze out the trailing edge in slow "
         f"crystalline arcs, film bonding flawlessly. {STYLE}"),
        ("c", False,
         "Inside-the-car POV through a freshly tinted rear window; bright sun "
         "outside diffuses into a soft warm glow, UV visibly blocked, cabin "
         f"tranquil and dark. {STYLE}"),
    ]),
    "vehicle-wraps": ("vehicle-wraps.jpg", [
        ("a", True,
         "Macro pan across a premium satin metallic vinyl wrap panel; light "
         "sweeps along the surface revealing subtle flake texture and deep "
         f"color depth. {STYLE}"),
        ("b", False,
         "Slow-motion macro of a wrap installer's squeegee pressing satin "
         "vinyl onto a curved car fender; vinyl stretches and conforms "
         f"perfectly to the body line behind the blade. {STYLE}"),
        ("c", False,
         "Cinematic wide slow orbit around a fully wrapped exotic car in a "
         "dark studio; color-shifting wrap glows under rim lights, deep blacks "
         f"and moody accent glows. {STYLE}"),
    ]),
    "paint-correction": ("paint-correction.jpg", [
        ("a", True,
         "Extreme macro of a dual-action polisher pad spinning on deep black "
         "paint; polishing compound arcs in slow silken swirls, swirl marks "
         f"fading as the pad passes. {STYLE}"),
        ("b", False,
         "Ultra-slow-motion macro of a microfiber buffing pad meeting glossy "
         "black paint; compound foam arcs through the air, light catches "
         f"every particle. {STYLE}"),
        ("c", False,
         "Slow push-in on a black car hood: first half shows swirl marks and "
         "holograms under a searchlight, transitions to a mirror-perfect "
         f"reflection of a softbox overhead. {STYLE}"),
    ]),
    "detailing": ("detailing.jpg", [
        ("a", True,
         "Slow macro of a pristine microfiber towel gliding across a freshly "
         "sealed glossy panel; faint mist lifts away and a mirror streak-free "
         f"shine blooms behind the pass. {STYLE}"),
        ("b", False,
         "Slow-motion macro of foam cannon suds cascading down a jet-black "
         "car hood; suds swirl, drip, and reveal spotless paint beneath, "
         f"sunlight glinting on the foam. {STYLE}"),
        ("c", False,
         "Close-up of a gloved detailer applying wax in slow overlapping "
         "circles to glossy red paint; a halo of deeper gloss follows the "
         f"applicator pad. {STYLE}"),
    ]),
    "windshield-protection": ("windshield-protection.jpg", [
        ("a", True,
         "Extreme macro of rain droplets striking a hydrophobic-coated "
         "windshield; each bounces into a perfect sphere and beads tight, "
         f"water pearling off. {STYLE}"),
        ("b", False,
         "Ultra-slow-motion of heavy rain hitting a treated windshield; water "
         "sheets off in silver streams leaving crystal-clear glass behind, "
         f"wipers unnecessary. {STYLE}"),
        ("c", False,
         "Driver POV through a rain-soaked protected windshield at night; "
         "droplets scatter into beads that skate upward off the glass, neon "
         f"streetlights refracting through every bead. {STYLE}"),
    ]),
}


def mime_for(path: Path) -> str:
    return "image/jpeg" if path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"


def submit_with_retry(client, slug: str, cut: str, prompt: str, image_bytes: Optional[bytes], mime: str):
    attempt = 0
    while True:
        attempt += 1
        try:
            kwargs: dict = dict(
                model=MODEL,
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    aspect_ratio="16:9",
                    number_of_videos=1,
                ),
            )
            if image_bytes is not None:
                kwargs["image"] = types.Image(image_bytes=image_bytes, mime_type=mime)
            return client.models.generate_videos(**kwargs)
        except ClientError as e:
            if getattr(e, "status_code", None) == 429 and attempt < 15:
                wait = min(30 * attempt, 300)
                print(f"    [429 {slug}-{cut}] backoff {wait}s (try {attempt})")
                time.sleep(wait)
                continue
            raise


def wait_and_save(client, op, out_path: Path, label: str) -> bool:
    ticks = 0
    while not op.done:
        time.sleep(10)
        ticks += 1
        try:
            op = client.operations.get(op)
        except Exception as e:
            print(f"    [poll-err {label}]: {e}")
            continue
        if ticks % 9 == 0:
            print(f"    [{label}] {ticks * 10}s…")
    if getattr(op, "error", None):
        print(f"  [FAIL {label}] {op.error}")
        return False
    try:
        video = op.response.generated_videos[0].video
        client.files.download(file=video)
        video.save(str(out_path))
        mb = out_path.stat().st_size / (1024 * 1024)
        print(f"  [done] {label} -> {out_path.name} ({mb:.2f} MB)")
        return True
    except Exception as e:
        print(f"  [save-err {label}] {e}")
        return False


def make_clip(client, slug: str, img_path: Path, cut_id: str, use_image: bool, prompt: str) -> Optional[Path]:
    out = CLIP_DIR / f"{slug}-{cut_id}.mp4"
    if out.exists() and out.stat().st_size > 50_000:
        return out
    image_bytes = img_path.read_bytes() if use_image else None
    mime = mime_for(img_path) if use_image else ""
    label = f"{slug}-{cut_id}"
    print(f"[submit] {label}")
    try:
        op = submit_with_retry(client, slug, cut_id, prompt, image_bytes, mime)
    except Exception as e:
        print(f"  [submit-err {label}] {e}")
        return None
    if wait_and_save(client, op, out, label):
        return out
    return None


def concat_clips(slug: str, clip_paths: List[Path]) -> bool:
    """Lossless concat of Veo clips (same codec/res) using ffmpeg concat demuxer."""
    final = OUT_DIR / f"{slug}.mp4"
    list_file = CLIP_DIR / f"{slug}.concat.txt"
    list_file.write_text("".join(f"file '{p.resolve()}'\n" for p in clip_paths))
    ffmpeg = get_ffmpeg_exe()
    # Try stream-copy first (fastest, no quality loss). If codecs drift,
    # fall back to re-encode.
    cmd_copy = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c", "copy", "-movflags", "+faststart", str(final),
    ]
    r = subprocess.run(cmd_copy, capture_output=True, text=True)
    if r.returncode == 0 and final.exists() and final.stat().st_size > 50_000:
        print(f"  [concat] {slug} -> {final.name} (copy)")
        return True
    print(f"    [concat copy failed {slug}] {r.stderr.strip()}; re-encoding…")
    cmd_enc = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c:v", "libx264", "-preset", "slow", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", str(final),
    ]
    r = subprocess.run(cmd_enc, capture_output=True, text=True)
    if r.returncode == 0:
        print(f"  [concat] {slug} -> {final.name} (re-encoded)")
        return True
    print(f"  [concat FAIL {slug}] {r.stderr.strip()}")
    return False


def main() -> int:
    client = genai.Client(api_key=API_KEY)

    # Flatten all jobs; submit through a worker pool bounded by MAX_IN_FLIGHT.
    jobs = []
    for slug, (img_name, cuts) in STORYBOARD.items():
        img_path = IMG_DIR / img_name
        if not img_path.exists():
            print(f"[skip] {slug}: {img_path} missing")
            continue
        for cut_id, use_image, prompt in cuts:
            jobs.append((slug, img_path, cut_id, use_image, prompt))

    print(f"[gen] {len(jobs)} Veo jobs, up to {MAX_IN_FLIGHT} in flight.")
    with ThreadPoolExecutor(max_workers=MAX_IN_FLIGHT) as ex:
        futures = {ex.submit(make_clip, client, *j): j for j in jobs}
        for fut in as_completed(futures):
            j = futures[fut]
            try:
                fut.result()
            except Exception as e:
                print(f"  [worker-err {j[0]}-{j[2]}] {e}")

    # Concat per service
    fail = 0
    for slug, (_, cuts) in STORYBOARD.items():
        clip_paths = [CLIP_DIR / f"{slug}-{c[0]}.mp4" for c in cuts]
        missing = [p.name for p in clip_paths if not p.exists()]
        if missing:
            print(f"[skip concat] {slug}: missing {missing}")
            fail += 1
            continue
        if not concat_clips(slug, clip_paths):
            fail += 1

    print(f"[gen] complete. {len(STORYBOARD) - fail} concatenated, {fail} failed.")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
