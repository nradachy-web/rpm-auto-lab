#!/usr/bin/env python3
"""GLB mesh inspector — parses GLB JSON chunk to report mesh/material names.
Usage: python3 scripts/inspect-glb.py public/models/*.glb
"""
import json
import struct
import sys
from pathlib import Path


def read_glb(path: Path):
    with open(path, "rb") as f:
        magic, version, length = struct.unpack("<III", f.read(12))
        assert magic == 0x46546C67, f"Not a GLB: {path}"
        # First chunk = JSON
        chunk_length, chunk_type = struct.unpack("<II", f.read(8))
        assert chunk_type == 0x4E4F534A, f"First chunk is not JSON: {chunk_type:08x}"
        json_bytes = f.read(chunk_length)
    return json.loads(json_bytes)


def summarize(path: Path):
    print(f"\n==== {path.name} ({path.stat().st_size / 1024 / 1024:.2f} MB) ====")
    gltf = read_glb(path)

    meshes = gltf.get("meshes", [])
    materials = gltf.get("materials", [])
    nodes = gltf.get("nodes", [])

    print(f"Scenes: {len(gltf.get('scenes', []))}  Nodes: {len(nodes)}  Meshes: {len(meshes)}  Materials: {len(materials)}")

    print("\n-- Materials --")
    for i, mat in enumerate(materials):
        name = mat.get("name", "<unnamed>")
        pbr = mat.get("pbrMetallicRoughness", {})
        base = pbr.get("baseColorFactor", [1, 1, 1, 1])
        metal = pbr.get("metallicFactor", 1.0)
        rough = pbr.get("roughnessFactor", 1.0)
        alpha = mat.get("alphaMode", "OPAQUE")
        base_hex = "#{:02x}{:02x}{:02x}".format(int(base[0] * 255), int(base[1] * 255), int(base[2] * 255))
        print(f"  [{i:3}] {name:40s} color={base_hex} a={base[3]:.2f} metal={metal:.2f} rough={rough:.2f} alpha={alpha}")

    print("\n-- Mesh names (with material refs) --")
    # Build node name lookup by mesh index
    node_name_for_mesh = {}
    for n in nodes:
        if "mesh" in n:
            node_name_for_mesh.setdefault(n["mesh"], []).append(n.get("name", "<unnamed>"))

    for i, m in enumerate(meshes):
        name = m.get("name", "<unnamed>")
        prims = m.get("primitives", [])
        node_names = node_name_for_mesh.get(i, [])
        node_str = f" (nodes: {','.join(node_names[:3])}{'…' if len(node_names) > 3 else ''})" if node_names else ""
        print(f"  [{i:3}] mesh={name!r}{node_str} prims={len(prims)}")
        for j, p in enumerate(prims):
            mat_idx = p.get("material")
            mat_name = materials[mat_idx].get("name", f"#{mat_idx}") if mat_idx is not None and mat_idx < len(materials) else "<none>"
            print(f"        prim[{j}]: mat={mat_name}")

    # Distinct category candidates — scan all names for common tokens
    print("\n-- Name-based token heatmap (helps classifier override) --")
    BUCKETS = {
        "body":     ["body", "paint", "hood", "door", "roof", "bumper", "fender", "panel", "trunk", "quarter"],
        "glass":    ["glass", "window", "windshield"],
        "chrome":   ["chrome", "trim", "mirror", "grill", "handle", "emblem", "badge"],
        "wheel":    ["wheel", "rim", "brake", "caliper"],
        "tire":     ["tire", "tyre", "rubber"],
        "interior": ["seat", "interior", "dashboard", "steering"],
        "light":    ["headlight", "taillight", "light", "lamp"],
    }
    all_names = [m.get("name", "") for m in meshes] + [m.get("name", "") for m in materials]
    for bucket, tokens in BUCKETS.items():
        hits = []
        for name in all_names:
            low = name.lower()
            for t in tokens:
                if t in low:
                    hits.append(name)
                    break
        if hits:
            print(f"  {bucket}: {hits[:8]}{' …' if len(hits) > 8 else ''}")


def main():
    files = [Path(p) for p in sys.argv[1:]]
    if not files:
        files = sorted(Path("public/models").glob("*.glb"))
    for p in files:
        summarize(p)


if __name__ == "__main__":
    main()
