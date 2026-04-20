import * as THREE from "three";
import type { MeshRole, VehicleConfig, BodyZone, GlassZone } from "./types";

// Classification uses three signals (in order of authority):
//   1. Explicit per-vehicle overrides (classify.body, classify.glass, …)
//   2. Name heuristics (mesh + material name substrings)
//   3. Geometry/material heuristics (transparency, metalness, bbox position)
//
// This lets any GLB plug in cleanly: the auto-detector handles most cars,
// and per-vehicle overrides fix edge cases without forking the component.

const BODY_TOKENS = [
  "body", "paint", "shell", "chassis", "hood", "bonnet", "trunk", "boot",
  "bumper", "fender", "quarter", "door", "panel", "roof", "exterior",
  "tailpiece", "tail_", "_tail",
];
const GLASS_TOKENS = [
  "glass", "window", "windshield", "windscreen", "winshield", "winscreen",
  "tint", "headglass", "pane", "lens",
];
const CHROME_TOKENS = [
  "chrome", "trim", "mirror", "grill", "grille", "handle", "emblem",
  "badge", "logo", "molding", "rail",
];
const WHEEL_TOKENS = [
  "rim", "wheel", "alloy", "disc", "brake", "caliper", "rotor", "hub",
];
const TIRE_TOKENS = [
  "tire", "tyre", "rubber", "tread",
];
const INTERIOR_TOKENS = [
  "seat", "interior", "dashboard", "dash", "steering", "cabin",
  "alcntr", "leather", "fabric", "console",
];
const LIGHT_TOKENS = [
  "headlight", "taillight", "brakelight", "tail_light", "light_", "_light",
  "signal", "reflector", "lamp",
];

function hasToken(name: string, tokens: string[]): boolean {
  return tokens.some((t) => name.includes(t));
}

function hasOverrideMatch(name: string, patterns?: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => name.includes(p.toLowerCase()));
}

export interface ClassifiedMesh {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  role: MeshRole;
  bodyZone: BodyZone;
  glassZone: GlassZone;
}

export interface OriginalMaterialState {
  color: THREE.Color;
  roughness: number;
  metalness: number;
  opacity: number;
  transparent: boolean;
  emissive: THREE.Color;
  emissiveIntensity: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
}

export function snapshotMaterial(mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial): OriginalMaterialState {
  const phys = mat as THREE.MeshPhysicalMaterial;
  return {
    color: mat.color.clone(),
    roughness: mat.roughness,
    metalness: mat.metalness,
    opacity: mat.opacity,
    transparent: mat.transparent,
    emissive: mat.emissive?.clone() ?? new THREE.Color(0, 0, 0),
    emissiveIntensity: mat.emissiveIntensity ?? 0,
    envMapIntensity: mat.envMapIntensity ?? 1,
    clearcoat: phys.clearcoat ?? 0,
    clearcoatRoughness: phys.clearcoatRoughness ?? 0,
    transmission: phys.transmission ?? 0,
    thickness: phys.thickness ?? 0,
    ior: phys.ior ?? 1.5,
  };
}

export function restoreMaterial(
  mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  orig: OriginalMaterialState
): void {
  mat.color.copy(orig.color);
  mat.roughness = orig.roughness;
  mat.metalness = orig.metalness;
  mat.opacity = orig.opacity;
  mat.transparent = orig.transparent;
  mat.emissive?.copy(orig.emissive);
  mat.emissiveIntensity = orig.emissiveIntensity;
  mat.envMapIntensity = orig.envMapIntensity;
  const phys = mat as THREE.MeshPhysicalMaterial;
  if ("clearcoat" in mat) {
    phys.clearcoat = orig.clearcoat;
    phys.clearcoatRoughness = orig.clearcoatRoughness;
    phys.transmission = orig.transmission;
    phys.thickness = orig.thickness;
    phys.ior = orig.ior;
  }
  mat.needsUpdate = true;
}

// (Zone computation is inlined in classifyScene — it needs scene-wide
// context to normalize thresholds per-vehicle)

// Classify one mesh/material combination. Returns the role or "other".
export function classifyMesh(
  mesh: THREE.Mesh,
  mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  config?: VehicleConfig["classify"]
): MeshRole {
  const meshName = (mesh.name || "").toLowerCase();
  const matName = (mat.name || "").toLowerCase();
  const combined = `${meshName} ${matName}`;

  // 1. Explicit overrides win
  if (hasOverrideMatch(combined, config?.ignore)) return "other";
  if (hasOverrideMatch(combined, config?.glass)) return "glass";
  if (hasOverrideMatch(combined, config?.body)) return "body";
  if (hasOverrideMatch(combined, config?.chrome)) return "chrome";
  if (hasOverrideMatch(combined, config?.wheel)) return "wheel";
  if (hasOverrideMatch(combined, config?.tire)) return "tire";
  if (hasOverrideMatch(combined, config?.interior)) return "interior";
  if (hasOverrideMatch(combined, config?.light)) return "light";

  // 2. Name heuristics (order matters — glass catches transparency first,
  // interior MUST beat wheel so "steering wheel" isn't classified as rim)
  if (hasToken(combined, GLASS_TOKENS) || mat.transparent || (mat.opacity ?? 1) < 1) return "glass";
  if (hasToken(combined, INTERIOR_TOKENS)) return "interior";
  if (hasToken(combined, TIRE_TOKENS)) return "tire";
  if (hasToken(combined, WHEEL_TOKENS)) return "wheel";
  if (hasToken(combined, LIGHT_TOKENS)) return "light";
  if (hasToken(combined, CHROME_TOKENS)) return "chrome";
  if (hasToken(combined, BODY_TOKENS)) return "body";

  // 3. Material-based heuristics
  // Highly metallic + low roughness = chrome
  if (mat.metalness > 0.85 && mat.roughness < 0.18) return "chrome";
  // Painted body panels often have moderate metalness + low-mid roughness
  if (mat.metalness > 0.35 && mat.roughness < 0.5) return "body";
  // Nearly black + rough = rubber/tire/trim
  const lum = 0.299 * mat.color.r + 0.587 * mat.color.g + 0.114 * mat.color.b;
  if (lum < 0.08 && mat.roughness > 0.5) return "tire";

  return "other";
}

// Traverse a scene, classify every mesh/material, snapshot originals.
export interface ClassificationResult {
  body: ClassifiedMesh[];
  glass: ClassifiedMesh[];
  chrome: ClassifiedMesh[];
  wheel: ClassifiedMesh[];
  tire: ClassifiedMesh[];
  interior: ClassifiedMesh[];
  light: ClassifiedMesh[];
  other: ClassifiedMesh[];
  originals: Map<THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, OriginalMaterialState>;
}

export function classifyScene(scene: THREE.Object3D, config?: VehicleConfig["classify"]): ClassificationResult {
  const result: ClassificationResult = {
    body: [], glass: [], chrome: [], wheel: [], tire: [], interior: [], light: [], other: [],
    originals: new Map(),
  };

  // Ensure world matrices are up to date so per-mesh world bbox is accurate.
  // Without this, meshes with node-level transforms get miscategorized.
  scene.updateMatrixWorld(true);

  // First pass: compute overall scene bbox so we can normalize zone thresholds
  // per-vehicle (cars have different origins and sizes in source GLBs).
  const sceneBox = new THREE.Box3().setFromObject(scene);
  const sceneSize = new THREE.Vector3();
  sceneBox.getSize(sceneSize);
  const sceneCenter = new THREE.Vector3();
  sceneBox.getCenter(sceneCenter);
  // Use longest horizontal axis as "length" for zone ratios
  const lengthAxis: "x" | "z" = sceneSize.x > sceneSize.z ? "x" : "z";
  const lengthHalf = Math.max(sceneSize.x, sceneSize.z) / 2;

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;

    // Compute WORLD-space bbox for this mesh (respects node transforms)
    const worldBox = new THREE.Box3().setFromObject(child);
    if (worldBox.isEmpty()) worldBox.setFromBufferAttribute(child.geometry.attributes.position as THREE.BufferAttribute);
    const meshCenter = new THREE.Vector3();
    worldBox.getCenter(meshCenter);

    // Distance from scene center along the "length" axis, normalized to [-1,1]
    const lengthCoord = lengthAxis === "z" ? meshCenter.z - sceneCenter.z : meshCenter.x - sceneCenter.x;
    const frac = lengthHalf > 0.001 ? lengthCoord / lengthHalf : 0;

    // bodyZone thresholds in ratio-space (not absolute world units)
    let bodyZone: BodyZone = "side";
    if (frac > 0.25) bodyZone = "front";
    else if (frac < -0.25) bodyZone = "rear";

    // Glass zones — similar ratio logic
    let glassZone: GlassZone = "front-side";
    if (frac > 0.45) glassZone = "windshield";
    else if (frac > 0) glassZone = "front-side";
    else if (frac > -0.45) glassZone = "rear-side";
    else glassZone = "rear-windshield";

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
      const standard = mat as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

      // Snapshot original state once per material (materials can be shared across meshes)
      if (!result.originals.has(standard)) {
        result.originals.set(standard, snapshotMaterial(standard));
      }

      const role = classifyMesh(child, standard, config);
      const entry: ClassifiedMesh = { mesh: child, material: standard, role, bodyZone, glassZone };
      switch (role) {
        case "body": result.body.push(entry); break;
        case "glass": result.glass.push(entry); break;
        case "chrome": result.chrome.push(entry); break;
        case "wheel": result.wheel.push(entry); break;
        case "tire": result.tire.push(entry); break;
        case "interior": result.interior.push(entry); break;
        case "light": result.light.push(entry); break;
        default: result.other.push(entry);
      }
    });
  });

  return result;
}

export function restoreAll(result: ClassificationResult): void {
  result.originals.forEach((orig, mat) => restoreMaterial(mat, orig));
}
