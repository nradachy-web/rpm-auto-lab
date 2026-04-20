#!/usr/bin/env python3
"""Compute per-GLB bounding boxes by unioning all POSITION accessor min/max."""
import json, struct, sys
from pathlib import Path


def read_glb(path: Path):
    with open(path, "rb") as f:
        magic, version, length = struct.unpack("<III", f.read(12))
        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        json_bytes = f.read(chunk_length)
    return json.loads(json_bytes)


def compute_bbox(path: Path):
    gltf = read_glb(path)
    accessors = gltf.get("accessors", [])
    meshes = gltf.get("meshes", [])

    min_v = [float("inf")] * 3
    max_v = [float("-inf")] * 3
    for m in meshes:
        for p in m.get("primitives", []):
            attrs = p.get("attributes", {})
            pos_idx = attrs.get("POSITION")
            if pos_idx is None:
                continue
            acc = accessors[pos_idx]
            mn = acc.get("min")
            mx = acc.get("max")
            if mn and mx:
                for i in range(3):
                    min_v[i] = min(min_v[i], mn[i])
                    max_v[i] = max(max_v[i], mx[i])

    if not all(abs(v) < float("inf") for v in min_v + max_v):
        return None
    size = [max_v[i] - min_v[i] for i in range(3)]
    center = [(min_v[i] + max_v[i]) / 2 for i in range(3)]
    return {"min": min_v, "max": max_v, "size": size, "center": center, "longest": max(size)}


def main():
    files = [Path(p) for p in sys.argv[1:]] or sorted(Path("public/models").glob("*.glb"))
    for p in files:
        bb = compute_bbox(p)
        if bb is None:
            print(f"{p.name}: NO BBOX (geometry missing min/max)")
            continue
        print(f"\n{p.name}")
        print(f"  min:     [{bb['min'][0]:+8.2f}, {bb['min'][1]:+8.2f}, {bb['min'][2]:+8.2f}]")
        print(f"  max:     [{bb['max'][0]:+8.2f}, {bb['max'][1]:+8.2f}, {bb['max'][2]:+8.2f}]")
        print(f"  size:    [{bb['size'][0]:8.2f}, {bb['size'][1]:8.2f}, {bb['size'][2]:8.2f}]")
        print(f"  center:  [{bb['center'][0]:+8.2f}, {bb['center'][1]:+8.2f}, {bb['center'][2]:+8.2f}]")
        print(f"  longest axis: {bb['longest']:.2f}  → target_scale_for_4.6: {4.6 / bb['longest']:.4f}")


if __name__ == "__main__":
    main()
