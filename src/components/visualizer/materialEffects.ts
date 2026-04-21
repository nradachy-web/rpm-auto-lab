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

// ── Window Tint: darkens selected glass zones. ─────────────────────────
// tintLevel is VLT % (5 = limo, 70 = light). Lower VLT → darker glass.
// Darkness = 1 - VLT/100, so VLT=5 → 0.95 dark, VLT=70 → 0.3 dark.
// Glass is always transparent; darker tint = higher opacity of the dark
// tint color. Previous version had the opacity formula inverted, so darker
// tints looked MORE see-through than lighter ones.
export function applyTint(
  glass: ClassifiedMesh[],
  tintLevel: number,
  zoneFilter: (zone: GlassZone) => boolean
): void {
  const darkness = Math.max(0, Math.min(1, 1 - tintLevel / 100));
  glass.forEach(({ material, glassZone }) => {
    if (!zoneFilter(glassZone)) return;
    const mat = material;
    const phys = mat as THREE.MeshPhysicalMaterial;
    // Base tint color: very dark, barely warmer at higher darkness
    const base = 0.02;
    mat.color.setRGB(base + 0.04 * (1 - darkness), base + 0.04 * (1 - darkness), base + 0.06 * (1 - darkness));
    mat.transparent = true;
    // Darker tint = MORE opaque. 0.35 at clear, 0.96 at limo.
    mat.opacity = 0.35 + darkness * 0.61;
    mat.side = THREE.DoubleSide;
    mat.depthWrite = false;
    mat.roughness = 0.04;
    mat.metalness = 0.0;
    mat.envMapIntensity = 1.2;
    if ("clearcoat" in mat) {
      phys.clearcoat = 1;
      phys.clearcoatRoughness = 0.02;
      phys.ior = 1.52;
      // Lighter tint lets more light through (higher transmission)
      phys.transmission = (1 - darkness) * 0.35;
    }
    mat.needsUpdate = true;
  });
}

// ── Zone highlight (subtle emissive rim on REAL materials) ─────────────
// Previous versions either drew wireframe edge lines (looked like CAD) or
// set emissive intensity so high the whole black M4 turned matte orange
// (see user screenshot 2026-04-20). Current rule: emissive at LOW
// intensity so dark-paint cars gain a warm hint rather than a color wash.
// No fallback — if the zone can't be isolated on this GLB (single-mesh
// body), we DON'T light the whole car, because that lies about coverage.
// The service badge + camera angle still communicate which zone is
// selected; the material's base effect (gloss boost, wrap color, etc.)
// confirms the service is active.
export function applyZoneHighlight(
  entries: ClassifiedMesh[],
  filter: (m: ClassifiedMesh) => boolean,
  color: number,
  intensity = 0.12
): void {
  const col = new THREE.Color(color);
  const seen = new Set<THREE.Material>();
  entries.forEach((entry) => {
    if (!filter(entry)) return;
    if (seen.has(entry.material)) return;
    seen.add(entry.material);
    entry.material.emissive.copy(col);
    entry.material.emissiveIntensity = intensity;
    entry.material.needsUpdate = true;
  });
}

// ── Master state + orchestrator ────────────────────────────────────────
// The configurator only visualizes the three services where a 3D preview
// adds real value: wraps (color + finish), PPF (coverage zones), and
// window tint (darkness + zone). Ceramic coating / paint correction /
// detailing are sold on the marketing pages, not here.
export interface EffectState {
  wrapActive: boolean;
  wrapColor: string;
  wrapFinish: FinishType;
  ppfActive: boolean;
  ppfPackage: string;
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
  // 1. Wrap sets color + finish on the body. Runs first so PPF clarity
  //    boost composes on top if both toggles are active.
  if (state.wrapActive) {
    applyWrap(result.body, state.wrapColor, state.wrapFinish);
  }
  // 2. PPF adds the clear film layer.
  if (state.ppfActive) {
    applyPPF(result.body);
  }
  // 3. Tint darkens the zoned glass directly.
  if (state.tintActive) {
    applyTint(result.glass, state.tintLevel, tintZoneFilter(state.tintZone));
  }

  // 4. PPF zone highlight — subtle red emissive on the covered body
  //    panels (if the classifier could isolate them on this GLB).
  if (state.ppfActive) {
    const f = ppfZoneFilter(state.ppfPackage);
    applyZoneHighlight(result.body, (m) => f(m.bodyZone), 0xff3d1f, 0.14);
  }
  void sceneRoot;
}
