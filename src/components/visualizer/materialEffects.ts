import * as THREE from "three";
import type { ClassificationResult, ClassifiedMesh } from "./meshClassifier";
import type { BodyZone, GlassZone, FinishType } from "./types";

// Material effect pipeline. Effects COMPOSE — they adjust properties relative
// to whatever the prior effect left, so "matte wrap + ceramic coating" gives
// matte-with-sheen (not a glossy override).
//
// Composition order (see applyEffects):
//   1. wrap sets baseline color + finish
//   2. paint correction smooths existing paint
//   3. ppf adds clear film layer
//   4. ceramic enhances reflectivity
//   5. detailing adds a "just-washed" sheen
//   6. tint applies to glass
//   7. zone outlines added as separate Object3D children

// ── Finish profiles for wrap baselines ────────────────────────────────
export function applyFinish(
  mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  finish: FinishType
): void {
  const phys = mat as THREE.MeshPhysicalMaterial;
  const isPhys = "clearcoat" in mat;
  switch (finish) {
    case "matte":
      mat.roughness = 0.92;
      mat.metalness = 0.02;
      mat.envMapIntensity = 0.3;
      if (isPhys) { phys.clearcoat = 0; phys.clearcoatRoughness = 1; }
      break;
    case "satin":
      mat.roughness = 0.5;
      mat.metalness = 0.2;
      mat.envMapIntensity = 0.75;
      if (isPhys) { phys.clearcoat = 0.35; phys.clearcoatRoughness = 0.3; }
      break;
    case "gloss":
      mat.roughness = 0.12;
      mat.metalness = 0.55;
      mat.envMapIntensity = 1.7;
      if (isPhys) { phys.clearcoat = 1.0; clamp(phys, "clearcoatRoughness", 0.06); }
      break;
    case "high-gloss":
      mat.roughness = 0.06;
      mat.metalness = 0.6;
      mat.envMapIntensity = 2.1;
      if (isPhys) { phys.clearcoat = 1.0; phys.clearcoatRoughness = 0.03; }
      break;
    case "metallic":
      mat.roughness = 0.22;
      mat.metalness = 0.92;
      mat.envMapIntensity = 1.9;
      if (isPhys) { phys.clearcoat = 0.85; phys.clearcoatRoughness = 0.12; }
      break;
    case "pearl":
      mat.roughness = 0.18;
      mat.metalness = 0.42;
      mat.envMapIntensity = 1.5;
      if (isPhys) { phys.clearcoat = 0.9; phys.clearcoatRoughness = 0.08; }
      break;
    case "color-flip":
      mat.roughness = 0.14;
      mat.metalness = 0.6;
      mat.envMapIntensity = 2.3;
      if (isPhys) { phys.clearcoat = 1; phys.clearcoatRoughness = 0.05; }
      break;
    case "texture":
      mat.roughness = 0.6;
      mat.metalness = 0.3;
      mat.envMapIntensity = 0.85;
      if (isPhys) { phys.clearcoat = 0.4; phys.clearcoatRoughness = 0.3; }
      break;
  }
  mat.needsUpdate = true;
}

function clamp(obj: Record<string, number | unknown>, key: string, min: number): void {
  const v = obj[key];
  if (typeof v === "number" && v < min) obj[key] = min;
}

// ── Wrap: set color + finish baseline. ─────────────────────────────────
export function applyWrap(
  bodies: ClassifiedMesh[],
  hex: string,
  finish: FinishType
): void {
  const color = new THREE.Color(hex);
  const applied = new Set<THREE.Material>();
  bodies.forEach(({ material }) => {
    if (applied.has(material)) return;
    applied.add(material);
    material.color.copy(color);
    applyFinish(material, finish);
  });
}

// ── Ceramic coating: enhance reflectivity WITHOUT destroying finish. ──
// Whole-body effect. Zone info is communicated via outline + camera angle.
export function applyCeramic(bodies: ClassifiedMesh[], chromes: ClassifiedMesh[], intense: boolean): void {
  const applied = new Set<THREE.Material>();
  bodies.forEach(({ material }) => {
    if (applied.has(material)) return;
    applied.add(material);
    const mat = material;
    const phys = mat as THREE.MeshPhysicalMaterial;
    // Drop roughness by 50% (matte stays matter-ish but gains sheen)
    mat.roughness = mat.roughness * 0.5;
    // Strong envMap boost — this is what makes ceramic "pop"
    mat.envMapIntensity = (mat.envMapIntensity ?? 1) * 2.5;
    if ("clearcoat" in mat) {
      // Ceramic adds a thin clear layer on top
      phys.clearcoat = Math.max(phys.clearcoat ?? 0, 0.9);
      phys.clearcoatRoughness = Math.min(phys.clearcoatRoughness ?? 1, 0.04);
    }
    // Very slight saturation pop — ceramic brings out paint color
    const hsl = { h: 0, s: 0, l: 0 };
    mat.color.getHSL(hsl);
    mat.color.setHSL(hsl.h, Math.min(hsl.s * 1.12, 1), Math.min(hsl.l * 1.05, 0.95));
    mat.needsUpdate = true;
  });
  if (intense) {
    const cApplied = new Set<THREE.Material>();
    chromes.forEach(({ material }) => {
      if (cApplied.has(material)) return;
      cApplied.add(material);
      material.roughness = material.roughness * 0.3;
      material.envMapIntensity = (material.envMapIntensity ?? 1) * 2;
      material.needsUpdate = true;
    });
  }
}

// ── PPF: thin clear film. Subtle clarity boost, tiny orange-peel. ──────
export function applyPPF(bodies: ClassifiedMesh[]): void {
  const applied = new Set<THREE.Material>();
  bodies.forEach(({ material }) => {
    if (applied.has(material)) return;
    applied.add(material);
    const mat = material;
    const phys = mat as THREE.MeshPhysicalMaterial;
    mat.envMapIntensity = (mat.envMapIntensity ?? 1) * 1.25;
    if ("clearcoat" in mat) {
      phys.clearcoat = Math.max(phys.clearcoat ?? 0, 0.8);
      phys.clearcoatRoughness = Math.min(phys.clearcoatRoughness ?? 1, 0.1);
    } else {
      mat.roughness = mat.roughness * 0.8;
    }
    mat.needsUpdate = true;
  });
}

// ── Paint Correction: remove swirl micro-haze. ─────────────────────────
export function applyPaintCorrection(bodies: ClassifiedMesh[]): void {
  const applied = new Set<THREE.Material>();
  bodies.forEach(({ material }) => {
    if (applied.has(material)) return;
    applied.add(material);
    material.roughness = material.roughness * 0.55;
    material.envMapIntensity = (material.envMapIntensity ?? 1) * 1.3;
    material.needsUpdate = true;
  });
}

// ── Full Detail: "freshly washed" — slight gloss + clean chrome. ───────
export function applyDetail(bodies: ClassifiedMesh[], chromes: ClassifiedMesh[]): void {
  const bApplied = new Set<THREE.Material>();
  bodies.forEach(({ material }) => {
    if (bApplied.has(material)) return;
    bApplied.add(material);
    material.roughness = material.roughness * 0.75;
    material.envMapIntensity = (material.envMapIntensity ?? 1) * 1.2;
    material.needsUpdate = true;
  });
  const cApplied = new Set<THREE.Material>();
  chromes.forEach(({ material }) => {
    if (cApplied.has(material)) return;
    cApplied.add(material);
    material.roughness = material.roughness * 0.4;
    material.envMapIntensity = (material.envMapIntensity ?? 1) * 1.5;
    material.needsUpdate = true;
  });
}

// ── Window Tint: darkens selected glass zones. ─────────────────────────
// tintLevel is VLT % (5 = limo, 70 = light). Lower = darker.
export function applyTint(
  glass: ClassifiedMesh[],
  tintLevel: number,
  zoneFilter: (zone: GlassZone) => boolean
): void {
  const t = 1 - tintLevel / 100;
  glass.forEach(({ material, glassZone }) => {
    if (!zoneFilter(glassZone)) return;
    const mat = material;
    const phys = mat as THREE.MeshPhysicalMaterial;
    mat.color.setRGB(0.05 + (1 - t) * 0.1, 0.05 + (1 - t) * 0.1, 0.07 + (1 - t) * 0.15);
    mat.transparent = true;
    mat.opacity = Math.max(0.98 - t * 0.58, 0.3);
    mat.side = THREE.DoubleSide;
    mat.depthWrite = false;
    mat.roughness = 0.04;
    mat.metalness = 0.0;
    mat.envMapIntensity = 1.2;
    if ("clearcoat" in mat) {
      phys.clearcoat = 1;
      phys.clearcoatRoughness = 0.02;
      phys.ior = 1.52;
      phys.transmission = Math.max(0.25 - t * 0.2, 0.02);
    }
    mat.needsUpdate = true;
  });
}

// ── Zone outline (visible red wireframe on selected meshes) ────────────
// This is what the user actually sees as "this zone is covered". Applied
// as a separate Object3D child of the mesh, tagged for cleanup.
const OUTLINE_USERDATA_KEY = "isZoneOutline";

export function addZoneOutline(
  scene: THREE.Object3D,
  entries: ClassifiedMesh[],
  filter: (m: ClassifiedMesh) => boolean,
  color: number = 0xff3b22
): void {
  const outlineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    depthTest: false, // always visible, even behind other parts
  });
  const seen = new Set<THREE.Mesh>();
  entries.forEach((entry) => {
    if (!filter(entry)) return;
    if (seen.has(entry.mesh)) return;
    seen.add(entry.mesh);
    const edges = new THREE.EdgesGeometry(entry.mesh.geometry, 25);
    const line = new THREE.LineSegments(edges, outlineMaterial);
    line.userData[OUTLINE_USERDATA_KEY] = true;
    line.renderOrder = 999;
    line.position.copy(entry.mesh.position);
    line.rotation.copy(entry.mesh.rotation);
    line.scale.copy(entry.mesh.scale);
    entry.mesh.parent?.add(line);
  });
  void scene; // scene-level cleanup handled by removeAllOutlines
}

export function removeAllOutlines(scene: THREE.Object3D): void {
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (child.userData[OUTLINE_USERDATA_KEY]) toRemove.push(child);
  });
  toRemove.forEach((obj) => {
    obj.parent?.remove(obj);
    // Dispose geometry to prevent leaks
    if ((obj as THREE.LineSegments).geometry) (obj as THREE.LineSegments).geometry.dispose();
  });
}

// ── Master state + orchestrator ────────────────────────────────────────
export interface EffectState {
  wrapActive: boolean;
  wrapColor: string;
  wrapFinish: FinishType;
  ceramicActive: boolean;
  ceramicZone: string;
  ppfActive: boolean;
  ppfPackage: string;
  paintCorrectionActive: boolean;
  detailActive: boolean;
  tintActive: boolean;
  tintZone: string;
  tintLevel: number;
}

export function ppfZoneFilter(pkg: string): (z: BodyZone) => boolean {
  switch (pkg) {
    case "partial-front":
    case "full-front": return (z) => z === "front";
    case "track-pack": return (z) => z === "front" || z === "side";
    case "full-body": return () => true;
    default: return () => false;
  }
}

export function ceramicZoneFilter(zone: string): (z: BodyZone) => boolean {
  switch (zone) {
    case "ceramic-front": return (z) => z === "front";
    case "ceramic-exterior":
    case "ceramic-full":
    case "ceramic-ultimate": return () => true;
    default: return () => false;
  }
}

export function tintZoneFilter(zone: string): (z: GlassZone) => boolean {
  switch (zone) {
    case "front-sides": return (z) => z === "front-side";
    case "rear-sides": return (z) => z === "rear-side";
    case "rear-windshield": return (z) => z === "rear-windshield";
    case "windshield": return (z) => z === "windshield";
    case "full-vehicle": return () => true;
    default: return () => false;
  }
}

export function applyEffects(
  result: ClassificationResult,
  state: EffectState,
  sceneRoot: THREE.Object3D
): void {
  // 1. Wrap sets the baseline — must run first so ceramic/PPF compose on top
  if (state.wrapActive) {
    applyWrap(result.body, state.wrapColor, state.wrapFinish);
  }
  // 2. Paint correction smooths existing paint
  if (state.paintCorrectionActive) {
    applyPaintCorrection(result.body);
  }
  // 3. PPF adds clear film
  if (state.ppfActive) {
    applyPPF(result.body);
  }
  // 4. Ceramic adds major reflectivity boost
  if (state.ceramicActive) {
    applyCeramic(
      result.body,
      result.chrome,
      state.ceramicZone === "ceramic-full" || state.ceramicZone === "ceramic-ultimate"
    );
  }
  // 5. Detail adds final "washed" sheen
  if (state.detailActive) {
    applyDetail(result.body, result.chrome);
  }
  // 6. Tint on glass (separate from body)
  if (state.tintActive) {
    applyTint(result.glass, state.tintLevel, tintZoneFilter(state.tintZone));
  }

  // 7. Zone outlines — visible red wireframe showing coverage
  removeAllOutlines(sceneRoot);
  if (state.ppfActive) {
    const f = ppfZoneFilter(state.ppfPackage);
    addZoneOutline(sceneRoot, result.body, (m) => f(m.bodyZone), 0xff3b22);
  }
  if (state.ceramicActive) {
    const f = ceramicZoneFilter(state.ceramicZone);
    addZoneOutline(sceneRoot, result.body, (m) => f(m.bodyZone), 0xff7a33);
  }
  if (state.tintActive) {
    const f = tintZoneFilter(state.tintZone);
    addZoneOutline(sceneRoot, result.glass, (m) => f(m.glassZone), 0x3aa7ff);
  }
}
