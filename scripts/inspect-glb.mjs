#!/usr/bin/env node
// GLB mesh inspector — prints mesh names, material names, bboxes, transparency.
// Usage: node scripts/inspect-glb.mjs public/models/bmw-m4.glb [more.glb...]
//
// Used to author the `classify` overrides for each vehicle in vehicles.ts.

import { NodeIO } from "@gltf-transform/core";
import { readFileSync } from "fs";
import path from "path";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log("Usage: node scripts/inspect-glb.mjs <file.glb> [file2.glb ...]");
  process.exit(1);
}

const io = new NodeIO();

for (const file of files) {
  console.log(`\n==== ${file} ====`);
  const abs = path.resolve(file);
  const buf = readFileSync(abs);
  console.log(`File size: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  try {
    const doc = await io.readBinary(new Uint8Array(buf));
    const root = doc.getRoot();

    console.log(`\n-- Scene overview --`);
    console.log(`Scenes: ${root.listScenes().length}`);
    console.log(`Nodes:  ${root.listNodes().length}`);
    console.log(`Meshes: ${root.listMeshes().length}`);
    console.log(`Mats:   ${root.listMaterials().length}`);

    console.log(`\n-- Materials --`);
    const materials = root.listMaterials();
    materials.forEach((m, i) => {
      const base = m.getBaseColorFactor();
      const metal = m.getMetallicFactor();
      const rough = m.getRoughnessFactor();
      const alpha = m.getAlphaMode();
      const baseHex = `#${Math.round(base[0] * 255).toString(16).padStart(2, "0")}${Math.round(base[1] * 255).toString(16).padStart(2, "0")}${Math.round(base[2] * 255).toString(16).padStart(2, "0")}`;
      console.log(
        `  [${i.toString().padStart(2)}] name="${m.getName() || "<unnamed>"}" color=${baseHex} a=${base[3].toFixed(2)} metal=${metal.toFixed(2)} rough=${rough.toFixed(2)} alpha=${alpha}`
      );
    });

    console.log(`\n-- Meshes (with primitive count & material refs) --`);
    root.listMeshes().forEach((m, i) => {
      const prims = m.listPrimitives();
      console.log(`  [${i.toString().padStart(3)}] name="${m.getName() || "<unnamed>"}" prims=${prims.length}`);
      prims.forEach((p, j) => {
        const mat = p.getMaterial();
        const pos = p.getAttribute("POSITION");
        const verts = pos ? pos.getCount() : 0;
        const mname = mat ? mat.getName() || `material#${materials.indexOf(mat)}` : "<no material>";
        console.log(`        prim[${j}]: mat="${mname}" verts=${verts}`);
      });
    });

    console.log(`\n-- Scene bounding box (approx, from nodes) --`);
    const scene = root.getDefaultScene() || root.listScenes()[0];
    if (scene) {
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      scene.listChildren().forEach((n) => {
        walkNode(n, (node) => {
          const t = node.getTranslation();
          for (let i = 0; i < 3; i++) {
            if (t[i] < min[i]) min[i] = t[i];
            if (t[i] > max[i]) max[i] = t[i];
          }
        });
      });
      if (isFinite(min[0])) {
        console.log(`  node translations range: min=[${min.map((v) => v.toFixed(2)).join(", ")}] max=[${max.map((v) => v.toFixed(2)).join(", ")}]`);
      } else {
        console.log(`  (no node translations found — use Three.js Box3 at runtime)`);
      }
    }
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
  }
}

function walkNode(node, fn) {
  fn(node);
  node.listChildren().forEach((c) => walkNode(c, fn));
}
