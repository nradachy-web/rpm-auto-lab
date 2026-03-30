"use client";

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center, useGLTF, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import ColorPicker from "./ColorPicker";
import TintSlider from "./TintSlider";

// ─── Services ────────────────────────────────────────────────────────
const CONFIGURATOR_SERVICES = [
  { id: "ceramic-coating", name: "Ceramic Coating", price: 599, icon: "shield", description: "Mirror-like gloss & hydrophobic protection" },
  { id: "ppf", name: "Paint Protection Film", price: 799, icon: "layers", description: "Self-healing invisible armor" },
  { id: "window-tint", name: "Window Tint", price: 249, icon: "sun", description: "Ceramic tint for heat & UV rejection" },
  { id: "vehicle-wraps", name: "Vehicle Wraps", price: 2499, icon: "paintbrush", description: "Full color transformation" },
  { id: "paint-correction", name: "Paint Correction", price: 399, icon: "sparkles", description: "Swirl & scratch elimination" },
  { id: "detailing", name: "Full Detail", price: 149, icon: "droplets", description: "Interior & exterior restoration" },
];

// ─── Coverage zones for PPF & Ceramic ───────────────────────────────
const PPF_PACKAGES = [
  { id: "partial-front", name: "Partial Front", desc: "Hood, bumper, fenders (24\")", price: 799 },
  { id: "full-front", name: "Full Front", desc: "Hood, full fenders, bumper, mirrors", price: 1499 },
  { id: "track-pack", name: "Track Package", desc: "Full front + rocker panels + A-pillars", price: 2299 },
  { id: "full-body", name: "Full Body", desc: "Every painted surface protected", price: 5499 },
];

const CERAMIC_ZONES = [
  { id: "ceramic-front", name: "Front End", desc: "Hood, bumper, front fenders", price: 599 },
  { id: "ceramic-exterior", name: "Full Exterior", desc: "All painted exterior surfaces", price: 999 },
  { id: "ceramic-full", name: "Full Body + Wheels", desc: "Exterior + wheels + trim", price: 1499 },
  { id: "ceramic-ultimate", name: "Ultimate Package", desc: "Full body + interior leather + glass", price: 2499 },
];

const TINT_ZONES = [
  { id: "front-sides", name: "Front Side Windows", desc: "Driver & passenger windows", price: 149 },
  { id: "rear-sides", name: "Rear Side Windows", desc: "Rear passenger windows", price: 129 },
  { id: "rear-windshield", name: "Rear Windshield", desc: "Back glass", price: 99 },
  { id: "windshield", name: "Windshield Strip", desc: "Visor strip / brow", price: 79 },
  { id: "full-vehicle", name: "Full Vehicle", desc: "All windows — best value", price: 349 },
];

// ─── Camera angles — per service AND per sub-zone ───────────────────
const CAR_CENTER_Y = 1.0;
type CamPos = { position: [number, number, number]; target: [number, number, number]; stats: string[] };
const CAMERA_POSITIONS: Record<string, CamPos> = {
  default: { position: [6, 3, 6], target: [0, CAR_CENTER_Y, 0], stats: [] },
  // Service-level defaults
  "ceramic-coating": { position: [5, 2.5, 6.5], target: [0, CAR_CENTER_Y, 0], stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"] },
  ppf: { position: [1.5, 2.5, 8], target: [0, CAR_CENTER_Y - 0.2, 0], stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"] },
  "window-tint": { position: [8, 2.5, 0.5], target: [0, CAR_CENTER_Y, 0], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
  "vehicle-wraps": { position: [5.5, 3, 6], target: [0, CAR_CENTER_Y - 0.1, 0], stats: ["500+ Colors", "3M Certified", "Fully Reversible", "5-7yr Lifespan"] },
  "paint-correction": { position: [-4.5, 2.5, 6], target: [0, CAR_CENTER_Y, 0], stats: ["Multi-Stage Polish", "Swirl Removal", "Gloss Verified", "Paint-Safe"] },
  detailing: { position: [5.5, 2.5, -5], target: [0, CAR_CENTER_Y, 0], stats: ["Hand Wash Only", "Full Interior", "Leather Treatment", "Engine Bay"] },
  // PPF sub-zones
  "ppf:partial-front": { position: [1, 2.5, 8], target: [0, CAR_CENTER_Y - 0.2, 1], stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"] },
  "ppf:full-front": { position: [3, 2.5, 7], target: [0, CAR_CENTER_Y, 0.5], stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"] },
  "ppf:track-pack": { position: [7, 2, 3], target: [0, CAR_CENTER_Y - 0.2, 0], stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"] },
  "ppf:full-body": { position: [5.5, 3, 6], target: [0, CAR_CENTER_Y, 0], stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"] },
  // Ceramic sub-zones
  "ceramic:ceramic-front": { position: [1.5, 2.5, 7.5], target: [0, CAR_CENTER_Y - 0.1, 1], stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"] },
  "ceramic:ceramic-exterior": { position: [5, 2.5, 6.5], target: [0, CAR_CENTER_Y, 0], stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"] },
  "ceramic:ceramic-full": { position: [5.5, 3, 6], target: [0, CAR_CENTER_Y, 0], stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"] },
  "ceramic:ceramic-ultimate": { position: [6, 3, 5], target: [0, CAR_CENTER_Y, 0], stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"] },
  // Tint sub-zones
  "tint:front-sides": { position: [7, 2.2, 2], target: [0, CAR_CENTER_Y + 0.2, 0.5], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
  "tint:rear-sides": { position: [7, 2.2, -2], target: [0, CAR_CENTER_Y + 0.2, -0.5], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
  "tint:rear-windshield": { position: [3, 2.5, -7], target: [0, CAR_CENTER_Y, -1], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
  "tint:windshield": { position: [1, 2.5, 8], target: [0, CAR_CENTER_Y + 0.3, 1], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
  "tint:full-vehicle": { position: [7, 2.5, 1], target: [0, CAR_CENTER_Y, 0], stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"] },
};

// Scale camera positions further back on mobile
function useMobileCameraPositions(basePositions: typeof CAMERA_POSITIONS) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return useMemo(() => {
    if (!isMobile) return basePositions;
    const scaled: Record<string, { position: [number, number, number]; target: [number, number, number]; stats: string[] }> = {};
    for (const [key, val] of Object.entries(basePositions)) {
      scaled[key] = {
        position: [val.position[0] * 1.25, val.position[1] * 1.1, val.position[2] * 1.25],
        target: val.target,
        stats: val.stats,
      };
    }
    return scaled;
  }, [isMobile, basePositions]);
}

// ─── Hook for mobile detection ──────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Animated Camera ─────────────────────────────────────────────────
function AnimatedCamera({
  targetPos,
  targetLookAt,
  onAnimating,
}: {
  targetPos: [number, number, number];
  targetLookAt: [number, number, number];
  onAnimating?: (animating: boolean) => void;
}) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0.5, 0));
  const targetVec = useRef(new THREE.Vector3(...targetPos));
  const targetLookAtVec = useRef(new THREE.Vector3(...targetLookAt));
  const settleTimer = useRef(0);
  const wasAnimating = useRef(false);

  // Update targets when props change
  useEffect(() => {
    targetVec.current.set(...targetPos);
    targetLookAtVec.current.set(...targetLookAt);
    settleTimer.current = 0;
    wasAnimating.current = true;
    onAnimating?.(true);
  }, [targetPos, targetLookAt, onAnimating]);

  useFrame((_, delta) => {
    // Faster lerp for snappy camera transitions
    camera.position.lerp(targetVec.current, 0.06);
    currentLookAt.current.lerp(targetLookAtVec.current, 0.06);
    camera.lookAt(currentLookAt.current);

    // Check if settled (close enough to target)
    if (wasAnimating.current) {
      const dist = camera.position.distanceTo(targetVec.current);
      if (dist < 0.05) {
        settleTimer.current += delta;
        if (settleTimer.current > 0.5) {
          wasAnimating.current = false;
          onAnimating?.(false);
        }
      }
    }
  });

  return null;
}

// ─── Responsive Camera Config ────────────────────────────────────────
function ResponsiveCameraConfig() {
  const { camera } = useThree();

  useEffect(() => {
    const updateFov = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = window.innerWidth < 1024 ? 48 : 40;
        camera.updateProjectionMatrix();
      }
    };
    updateFov();
    window.addEventListener("resize", updateFov);
    return () => window.removeEventListener("resize", updateFov);
  }, [camera]);

  return null;
}

// ─── Zone types for position-based classification ───────────────────
type BodyZone = "front" | "side" | "rear" | "top";
type GlassZone = "windshield" | "front-side" | "rear-side" | "rear-windshield";

interface ZonedMaterial {
  mat: THREE.MeshStandardMaterial;
  bodyZone: BodyZone;
}
interface ZonedGlass {
  mat: THREE.MeshStandardMaterial;
  glassZone: GlassZone;
}

// ─── Car Model Component ─────────────────────────────────────────────
function CarModel({
  activeServices,
  wrapColor,
  tintLevel,
  ppfPackage,
  ceramicZone,
  tintZone,
}: {
  activeServices: Set<string>;
  wrapColor: string;
  tintLevel: number;
  ppfPackage: string;
  ceramicZone: string;
  tintZone: string;
}) {
  const { scene } = useGLTF("/rpm-auto-lab/models/bmw-m4.glb");
  const modelRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Categorize materials by type AND position zone
  const materialCategories = useMemo(() => {
    const body: ZonedMaterial[] = [];
    const glass: ZonedGlass[] = [];
    const chrome: THREE.MeshStandardMaterial[] = [];
    const other: THREE.MeshStandardMaterial[] = [];
    const originals = new Map<THREE.MeshStandardMaterial, { color: THREE.Color; roughness: number; metalness: number; opacity: number }>();

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Compute world-space bounding box for zone classification
        child.geometry.computeBoundingBox();
        const bb = child.geometry.boundingBox;
        const centerZ = bb ? (bb.min.z + bb.max.z) / 2 : 0;
        const centerY = bb ? (bb.min.y + bb.max.y) / 2 : 0;
        const centerX = bb ? Math.abs((bb.min.x + bb.max.x) / 2) : 0;

        // Determine body zone by position
        let bodyZone: BodyZone = "side";
        if (centerZ > 1.0) bodyZone = "front";
        else if (centerZ < -1.0) bodyZone = "rear";
        else if (centerY > 1.2) bodyZone = "top";

        // Determine glass zone
        let glassZone: GlassZone = "front-side";
        if (centerZ > 1.5) glassZone = "windshield";
        else if (centerZ > 0) glassZone = "front-side";
        else if (centerZ > -1.5) glassZone = "rear-side";
        else glassZone = "rear-windshield";

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
          if (originals.has(mat)) return;

          originals.set(mat, {
            color: mat.color.clone(),
            roughness: mat.roughness,
            metalness: mat.metalness,
            opacity: mat.opacity,
          });

          const meshName = (child.name || "").toLowerCase();
          const matName = (mat.name || "").toLowerCase();
          const combined = meshName + " " + matName;

          const isBlendMaterial = combined.includes("699") || combined.includes("775") || combined.includes("718");
          if (mat.transparent || mat.opacity < 1 || isBlendMaterial || combined.includes("glass") || combined.includes("window") || combined.includes("windshield")) {
            glass.push({ mat, glassZone });
          } else if (combined.includes("692") || combined.includes("body") || combined.includes("paint")) {
            body.push({ mat, bodyZone });
          } else if (mat.metalness > 0.8 && mat.roughness < 0.2) {
            chrome.push(mat);
          } else if (mat.roughness < 0.3 && !combined.includes("tire") && !combined.includes("rubber")) {
            body.push({ mat, bodyZone });
          } else {
            other.push(mat);
          }
        });
      }
    });

    return { body, glass, chrome, other, originals };
  }, [clonedScene]);

  // Helper: check if a body zone should get PPF based on selected package
  const isPpfZone = useCallback((zone: BodyZone): boolean => {
    switch (ppfPackage) {
      case "partial-front": return zone === "front";
      case "full-front": return zone === "front";
      case "track-pack": return zone === "front" || zone === "side";
      case "full-body": return true;
      default: return false;
    }
  }, [ppfPackage]);

  // Helper: check if a body zone should get Ceramic based on selected zone
  const isCeramicZone = useCallback((zone: BodyZone): boolean => {
    switch (ceramicZone) {
      case "ceramic-front": return zone === "front";
      case "ceramic-exterior": return true; // all exterior
      case "ceramic-full": return true;
      case "ceramic-ultimate": return true;
      default: return false;
    }
  }, [ceramicZone]);

  // Helper: check if a glass zone should get tint based on selected zone
  const isTintZone = useCallback((zone: GlassZone): boolean => {
    switch (tintZone) {
      case "front-sides": return zone === "front-side";
      case "rear-sides": return zone === "rear-side";
      case "rear-windshield": return zone === "rear-windshield";
      case "windshield": return zone === "windshield";
      case "full-vehicle": return true;
      default: return false;
    }
  }, [tintZone]);

  // Apply service effects with zone awareness
  useEffect(() => {
    const { body, glass, chrome, originals } = materialCategories;

    // Reset all to originals first
    originals.forEach((orig, mat) => {
      mat.color.copy(orig.color);
      mat.roughness = orig.roughness;
      mat.metalness = orig.metalness;
      mat.opacity = orig.opacity;
      mat.transparent = orig.opacity < 1;
      mat.envMapIntensity = 1;
      mat.emissive = new THREE.Color(0, 0, 0);
      mat.emissiveIntensity = 0;
      mat.needsUpdate = true;
    });

    // Vehicle Wraps — change body color (all panels)
    if (activeServices.has("vehicle-wraps")) {
      body.forEach(({ mat }) => {
        mat.color.set(wrapColor);
        mat.needsUpdate = true;
      });
    }

    // Ceramic Coating — zone-aware with RED GLOW on selected areas
    if (activeServices.has("ceramic-coating")) {
      body.forEach(({ mat, bodyZone }) => {
        if (isCeramicZone(bodyZone)) {
          // Selected zone: wet mirror finish + red emissive highlight
          mat.roughness = 0.005;
          mat.metalness = 0.98;
          mat.envMapIntensity = 4.0;
          mat.emissive = new THREE.Color("#dc2626");
          mat.emissiveIntensity = 0.35; // visible red highlight on selected zone
          const hsl = { h: 0, s: 0, l: 0 };
          mat.color.getHSL(hsl);
          mat.color.setHSL(hsl.h, Math.min(hsl.s * 1.5, 1), Math.min(hsl.l * 1.25, 0.9));
        }
        mat.needsUpdate = true;
      });
      if (ceramicZone === "ceramic-full" || ceramicZone === "ceramic-ultimate") {
        chrome.forEach((mat) => {
          mat.roughness = 0.0;
          mat.metalness = 1.0;
          mat.envMapIntensity = 5;
          mat.emissive = new THREE.Color("#dc2626");
          mat.emissiveIntensity = 0.3;
          mat.needsUpdate = true;
        });
      }
    }

    // PPF — zone-aware with RED GLOW on protected areas
    if (activeServices.has("ppf")) {
      body.forEach(({ mat, bodyZone }) => {
        if (isPpfZone(bodyZone)) {
          // Protected zone: sheen + red emissive to clearly show coverage
          mat.metalness = Math.max(mat.metalness, 0.75);
          mat.roughness = Math.min(mat.roughness, 0.06);
          mat.envMapIntensity = 3.0;
          mat.emissive = new THREE.Color("#dc2626");
          mat.emissiveIntensity = 0.4; // bright red highlight for PPF zones
          const hsl = { h: 0, s: 0, l: 0 };
          mat.color.getHSL(hsl);
          mat.color.setHSL(hsl.h, hsl.s * 0.9, Math.min(hsl.l * 1.08, 0.8));
        }
        mat.needsUpdate = true;
      });
    }

    // Paint Correction
    if (activeServices.has("paint-correction")) {
      body.forEach(({ mat }) => {
        mat.roughness = Math.min(mat.roughness * 0.3, 0.08);
        mat.envMapIntensity = 2.0;
        mat.needsUpdate = true;
      });
    }

    // Full Detail — "freshly washed" look
    if (activeServices.has("detailing")) {
      body.forEach(({ mat }) => {
        mat.roughness = Math.max(mat.roughness * 0.5, 0.02);
        mat.envMapIntensity = 2.5;
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        mat.color.setHSL(hsl.h, Math.min(hsl.s * 1.2, 1), Math.min(hsl.l * 1.15, 0.85));
        mat.needsUpdate = true;
      });
      chrome.forEach((mat) => {
        mat.roughness = Math.max(mat.roughness * 0.3, 0);
        mat.envMapIntensity = 3;
        mat.needsUpdate = true;
      });
    }

    // Window Tint — ONLY darken selected glass + red emissive highlight
    if (activeServices.has("window-tint")) {
      glass.forEach(({ mat, glassZone }) => {
        if (isTintZone(glassZone)) {
          const t = tintLevel / 100;
          mat.color.set(new THREE.Color(t * 0.08, t * 0.08, t * 0.08));
          mat.opacity = 0.99 - t * 0.58;
          mat.transparent = true;
          mat.depthWrite = false;
          mat.side = THREE.DoubleSide;
          mat.emissive = new THREE.Color("#dc2626");
          mat.emissiveIntensity = 0.3; // visible red on selected glass
          if (mat.map) mat.map = null;
        }
        mat.needsUpdate = true;
      });
    }
  }, [activeServices, wrapColor, tintLevel, ppfPackage, tintZone, ceramicZone, materialCategories, isPpfZone, isCeramicZone, isTintZone]);

  return (
    <group position={[0, 1.0, 0]}>
      <Center disableY>
        <group ref={modelRef}>
          <primitive object={clonedScene} scale={1.2} />
        </group>
      </Center>
    </group>
  );
}

// ─── Polyaspartic Epoxy Floor ────────────────────────────────────────
function ShopFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial
        color="#18181b"
        roughness={0.2}
        metalness={0.35}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

// ─── Hexagonal LED Light Panel ──────────────────────────────────────
function HexLight({ position, size = 0.55 }: { position: [number, number, number]; size?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[size, 6]} />
      <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
    </mesh>
  );
}

// ─── Grid of hex lights on the ceiling ──────────────────────────────
function HexLightGrid() {
  const lights: [number, number, number][] = [];
  const rows = 5;
  const cols = 7;
  const spacingX = 1.4;
  const spacingZ = 1.2;
  const height = 6;

  for (let r = -Math.floor(rows / 2); r <= Math.floor(rows / 2); r++) {
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      const offset = r % 2 === 0 ? 0 : spacingX * 0.5;
      lights.push([c * spacingX + offset, height, r * spacingZ]);
    }
  }

  return (
    <group>
      {lights.map((pos, i) => (
        <HexLight key={i} position={pos} />
      ))}
      {/* Ceiling plane behind the hex lights */}
      <mesh position={[0, height + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      {/* Key overhead light casting down through the hex grid */}
      <pointLight position={[0, height - 0.5, 0]} intensity={3} color="#f5f5f0" distance={15} decay={2} />
      <pointLight position={[2, height - 0.5, 2]} intensity={1.5} color="#f0f0ff" distance={12} decay={2} />
      <pointLight position={[-2, height - 0.5, -1]} intensity={1.5} color="#fff5f0" distance={12} decay={2} />
    </group>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────
function Loader() {
  return (
    <Html center>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderTopColor: "#dc2626" }} />
          <div className="absolute inset-2 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderBottomColor: "#0066B1", animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="text-rpm-silver text-sm font-medium whitespace-nowrap">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

// ─── Service Icon ────────────────────────────────────────────────────
function ServiceIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("w-5 h-5", className);
  const p = { className: cls, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 };
  switch (type) {
    case "shield": return <svg {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>;
    case "layers": return <svg {...p}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84z" /><path d="m2 12 8.6 3.9a2 2 0 0 0 1.7.1L21 12" /><path d="m2 17 8.6 3.9a2 2 0 0 0 1.7.1L21 17" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>;
    case "paintbrush": return <svg {...p}><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" /><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" /></svg>;
    case "sparkles": return <svg {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4M19 17v4M3 5h4M17 19h4" /></svg>;
    case "droplets": return <svg {...p}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" /></svg>;
    default: return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────────
export default function VehicleVisualizer() {
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [tintLevel, setTintLevel] = useState(35);
  const [wrapColor, setWrapColor] = useState("#1a1a1a");
  const [ppfPackage, setPpfPackage] = useState("full-front");
  const [ceramicZone, setCeramicZone] = useState("ceramic-exterior");
  const [tintZone, setTintZone] = useState("full-vehicle");
  const [lastActiveService, setLastActiveService] = useState<string>("default");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isMobile = useIsMobile();

  // Responsive camera positions (further back on mobile)
  const cameraPositions = useMobileCameraPositions(CAMERA_POSITIONS);

  // Calculate total with actual package prices
  const estimatedTotal = CONFIGURATOR_SERVICES.filter((s) =>
    activeServices.has(s.id)
  ).reduce((sum, s) => {
    if (s.id === "ppf") return sum + (PPF_PACKAGES.find((p) => p.id === ppfPackage)?.price ?? s.price);
    if (s.id === "ceramic-coating") return sum + (CERAMIC_ZONES.find((p) => p.id === ceramicZone)?.price ?? s.price);
    if (s.id === "window-tint") return sum + (TINT_ZONES.find((z) => z.id === tintZone)?.price ?? s.price);
    return sum + s.price;
  }, 0);

  // Stable callback ref for animation state
  const handleAnimating = useCallback((animating: boolean) => {
    setIsAnimating(animating);
  }, []);

  // Disable OrbitControls during camera animation
  useEffect(() => {
    if (orbitRef.current) {
      // When animating, disable orbit controls so they don't fight
      (orbitRef.current as unknown as { enabled: boolean }).enabled = !isAnimating;
    }
  }, [isAnimating]);

  const toggleService = useCallback((id: string) => {
    setActiveServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        const remaining = Array.from(next);
        setLastActiveService(remaining.length > 0 ? remaining[remaining.length - 1] : "default");
      } else {
        next.add(id);
        setLastActiveService(id);
      }
      return next;
    });
  }, []);

  // Camera targets sub-zones when available
  const cameraKey = useMemo(() => {
    if (lastActiveService === "ppf" && activeServices.has("ppf")) return `ppf:${ppfPackage}`;
    if (lastActiveService === "ceramic-coating" && activeServices.has("ceramic-coating")) return `ceramic:${ceramicZone}`;
    if (lastActiveService === "window-tint" && activeServices.has("window-tint")) return `tint:${tintZone}`;
    return lastActiveService;
  }, [lastActiveService, activeServices, ppfPackage, ceramicZone, tintZone]);
  const cameraTarget = cameraPositions[cameraKey] || cameraPositions[lastActiveService] || cameraPositions.default;

  return (
    <section id="configurator" className="relative py-10 lg:py-20 overflow-hidden">
      {/* BMW M-stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#0066B1]" />
        <div className="flex-1 bg-[#1B1464]" />
        <div className="flex-1 bg-rpm-red" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rpm-red/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-[0.2em] rounded-full border border-rpm-red/30 bg-rpm-red/5 text-rpm-red">
              <span className="w-1.5 h-1.5 rounded-full bg-rpm-red animate-pulse" />
              3D Configurator
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-rpm-white tracking-tight">
              Build Your <span className="text-gradient-red">Dream Ride</span>
            </h2>
            <p className="mt-3 text-rpm-silver text-base lg:text-lg max-w-xl mx-auto">
              Toggle services to see real-time changes. Camera auto-focuses on each modification.
            </p>
          </motion.div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
          {/* 3D Canvas — relative container for mobile overlay */}
          <div className="relative">
            <div
              className="relative rounded-2xl border border-rpm-gray/50 bg-rpm-dark h-[350px] lg:h-[600px] lens-vignette"
              style={{ touchAction: "none" }}
            >
              <div className="absolute top-0 left-0 w-24 h-1 flex z-10 rounded-br overflow-hidden">
                <div className="flex-1 bg-[#0066B1]" />
                <div className="flex-1 bg-[#1B1464]" />
                <div className="flex-1 bg-rpm-red" />
              </div>

              <Canvas
                camera={{ position: [6, 3, 6], fov: 40, near: 0.1, far: 100 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 2.8 }}
                style={{ background: "#161618", borderRadius: "1rem" }}
              >
                {/* Responsive FOV adjustment */}
                <ResponsiveCameraConfig />

                {/* Bright ambient — well-lit shop feel */}
                <ambientLight intensity={0.8} color="#f5f5ff" />

                {/* Key spotlight — strong overhead front */}
                <spotLight position={[3, 8, 5]} angle={0.6} penumbra={0.8} intensity={6} color="#ffffff" castShadow />
                {/* Fill — brighter for less contrast */}
                <spotLight position={[-5, 6, -2]} angle={0.6} penumbra={1} intensity={4} color="#e8ecff" />
                {/* Rim light — defines the edges */}
                <spotLight position={[0, 5, -7]} angle={0.5} penumbra={0.8} intensity={3.5} color="#fff8f0" />
                {/* Front fill for face illumination */}
                <spotLight position={[0, 3, 8]} angle={0.7} penumbra={1} intensity={2} color="#ffffff" />
                {/* Under-car fill to prevent black underside */}
                <pointLight position={[0, 0.5, 0]} intensity={1} color="#ffffff" distance={8} />

                {/* Custom studio environment — bright panels that reflect on the car */}
                <Environment resolution={512} background={false}>
                  {/* Main overhead panel — creates the big clean reflection on hood/roof */}
                  <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[12, 8]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  {/* Secondary overhead panels — hex-like arrangement */}
                  <mesh position={[-3, 7.5, -2]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.5, 6]} />
                    <meshBasicMaterial color="#f8f8ff" />
                  </mesh>
                  <mesh position={[3, 7.5, -2]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.5, 6]} />
                    <meshBasicMaterial color="#f8f8ff" />
                  </mesh>
                  <mesh position={[0, 7.5, 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.5, 6]} />
                    <meshBasicMaterial color="#f8f8ff" />
                  </mesh>
                  {/* Right wall — medium gray for fill reflection */}
                  <mesh position={[8, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[14, 8]} />
                    <meshBasicMaterial color="#2a2a2a" />
                  </mesh>
                  {/* Left wall — brighter for asymmetric interest */}
                  <mesh position={[-8, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[14, 8]} />
                    <meshBasicMaterial color="#333333" />
                  </mesh>
                  {/* Back wall — medium */}
                  <mesh position={[0, 3, -8]}>
                    <planeGeometry args={[16, 8]} />
                    <meshBasicMaterial color="#1e1e1e" />
                  </mesh>
                  {/* Front — slightly brighter than before */}
                  <mesh position={[0, 3, 8]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[16, 8]} />
                    <meshBasicMaterial color="#151515" />
                  </mesh>
                  {/* Floor — lighter epoxy reflection */}
                  <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[20, 20]} />
                    <meshBasicMaterial color="#141416" />
                  </mesh>
                </Environment>

                {/* Physical hex LED light grid — visible in scene */}
                <HexLightGrid />

                {/* Polished epoxy floor */}
                <ShopFloor />
                <ContactShadows position={[0, 0.02, 0]} opacity={0.15} scale={20} blur={2.5} far={8} color="#000000" />

                <AnimatedCamera
                  targetPos={cameraTarget.position}
                  targetLookAt={cameraTarget.target}
                  onAnimating={handleAnimating}
                />

                {/* No OrbitControls — camera is curated per service, not user-controlled */}

                <Suspense fallback={<Loader />}>
                  <CarModel
                    activeServices={activeServices}
                    wrapColor={wrapColor}
                    tintLevel={tintLevel}
                    ppfPackage={ppfPackage}
                    ceramicZone={ceramicZone}
                    tintZone={tintZone}
                  />

                </Suspense>
              </Canvas>

              {/* Interaction hint */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 6, duration: 1.5 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-rpm-dark/80 backdrop-blur border border-rpm-gray/50 text-rpm-silver text-xs pointer-events-none"
              >
                Toggle services to see the car transform
              </motion.div>

              {/* ── Service Infotag — only shows when camera settles ── */}
              <AnimatePresence>
                {cameraTarget.stats.length > 0 && !isAnimating && (
                  <motion.div
                    key={lastActiveService}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="absolute bottom-4 left-4 z-10 pointer-events-none"
                  >
                    <div className="bg-rpm-dark/85 backdrop-blur-md border border-rpm-red/20 rounded-lg px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                      <div className="text-[8px] font-bold uppercase tracking-[0.15em] text-rpm-red mb-1">
                        {CONFIGURATOR_SERVICES.find((s) => s.id === lastActiveService)?.name}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {cameraTarget.stats.map((stat, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-rpm-red" />
                            <span className="text-[10px] text-rpm-white/80 font-medium whitespace-nowrap">{stat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active service badges */}
              {activeServices.size > 0 && (
                <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 max-w-[200px] justify-end pointer-events-none">
                  {CONFIGURATOR_SERVICES.filter((s) => activeServices.has(s.id)).map((s) => (
                    <motion.span
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2.5 py-1 rounded-full bg-rpm-red/20 border border-rpm-red/40 text-rpm-red text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                    >
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Mobile Bottom Sheet Overlay ── */}
            {isMobile && (
              <div className="absolute bottom-0 left-0 right-0 z-20">
                {/* Toggle handle */}
                <button
                  onClick={() => setMobileSheetOpen((o) => !o)}
                  className="mx-auto flex flex-col items-center w-full pt-2 pb-1"
                >
                  <div className="w-10 h-1 rounded-full bg-rpm-silver/40 mb-1" />
                  <span className="text-[10px] text-rpm-silver uppercase tracking-wider">
                    {mobileSheetOpen ? "Hide Services" : "Show Services"}
                  </span>
                </button>

                <AnimatePresence>
                  {mobileSheetOpen && (
                    <motion.div
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 60, opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="bg-rpm-dark/95 backdrop-blur-xl border-t border-rpm-gray/50 rounded-t-2xl px-3 pb-3 pt-2"
                    >
                      {/* Horizontal scrollable service pills */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                        {CONFIGURATOR_SERVICES.map((service) => {
                          const isActive = activeServices.has(service.id);
                          return (
                            <button
                              key={service.id}
                              onClick={() => toggleService(service.id)}
                              className={cn(
                                "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap",
                                isActive
                                  ? "bg-rpm-red/15 border-rpm-red/40 text-rpm-red"
                                  : "bg-rpm-charcoal/60 border-rpm-gray/40 text-rpm-silver"
                              )}
                            >
                              <ServiceIcon type={service.icon} className="w-3.5 h-3.5" />
                              {service.name}
                              <span className={cn("font-bold", isActive ? "text-rpm-red" : "text-rpm-silver/70")}>${service.price}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Inline sub-controls for window tint / wraps on mobile */}
                      <AnimatePresence>
                        {activeServices.has("window-tint") && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-2 pb-1"><TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} /></div>
                          </motion.div>
                        )}
                        {activeServices.has("vehicle-wraps") && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-2 pb-1"><ColorPicker selectedColor={wrapColor} onColorChange={setWrapColor} /></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Service Panel — desktop only (hidden on mobile, shown as overlay above) */}
          <div className="hidden lg:flex rounded-2xl border border-rpm-gray/50 bg-rpm-dark/80 backdrop-blur-xl p-6 flex-col">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-rpm-white">Customize Services</h3>
              <p className="text-xs text-rpm-silver mt-1">Toggle services — camera auto-focuses on each area</p>
            </div>

            <div className="flex-1 space-y-1">
              {CONFIGURATOR_SERVICES.map((service) => {
                const isActive = activeServices.has(service.id);
                return (
                  <div key={service.id}>
                    <button
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        isActive
                          ? "bg-rpm-red/10 border border-rpm-red/30"
                          : "hover:bg-rpm-charcoal/50 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                        isActive
                          ? "bg-rpm-red/20 text-rpm-red shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                          : "bg-rpm-charcoal text-rpm-silver group-hover:text-rpm-white"
                      )}>
                        <ServiceIcon type={service.icon} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-rpm-white">{service.name}</div>
                        <div className="text-[11px] text-rpm-silver">{service.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-sm font-bold transition-colors", isActive ? "text-rpm-red" : "text-rpm-silver")}>
                          ${service.price}
                        </div>
                        <div className={cn("w-8 h-4 rounded-full mt-1 ml-auto transition-all duration-300 relative", isActive ? "bg-rpm-red shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-rpm-gray")}>
                          <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300", isActive ? "left-[18px]" : "left-0.5")} />
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isActive && service.id === "ceramic-coating" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 pt-2 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-widest text-rpm-silver mb-1">Coverage Zone</p>
                            {CERAMIC_ZONES.map((zone) => (
                              <button
                                key={zone.id}
                                onClick={() => setCeramicZone(zone.id)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs",
                                  ceramicZone === zone.id
                                    ? "bg-rpm-red/10 border border-rpm-red/30 text-rpm-white"
                                    : "border border-rpm-gray/20 text-rpm-silver hover:border-rpm-gray/40"
                                )}
                              >
                                <div>
                                  <div className="font-semibold">{zone.name}</div>
                                  <div className="text-[10px] text-rpm-silver/60">{zone.desc}</div>
                                </div>
                                <span className={cn("font-bold text-sm", ceramicZone === zone.id ? "text-rpm-red" : "text-rpm-silver")}>${zone.price.toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {isActive && service.id === "ppf" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 pt-2 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-widest text-rpm-silver mb-1">Coverage Zone</p>
                            {PPF_PACKAGES.map((pkg) => (
                              <button
                                key={pkg.id}
                                onClick={() => setPpfPackage(pkg.id)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs",
                                  ppfPackage === pkg.id
                                    ? "bg-rpm-red/10 border border-rpm-red/30 text-rpm-white"
                                    : "border border-rpm-gray/20 text-rpm-silver hover:border-rpm-gray/40"
                                )}
                              >
                                <div>
                                  <div className="font-semibold">{pkg.name}</div>
                                  <div className="text-[10px] text-rpm-silver/60">{pkg.desc}</div>
                                </div>
                                <span className={cn("font-bold text-sm", ppfPackage === pkg.id ? "text-rpm-red" : "text-rpm-silver")}>${pkg.price.toLocaleString()}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {isActive && service.id === "window-tint" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 pt-2 space-y-3">
                            {/* Zone selector */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] uppercase tracking-widest text-rpm-silver">Window Zone</p>
                              {TINT_ZONES.map((zone) => (
                                <button
                                  key={zone.id}
                                  onClick={() => setTintZone(zone.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs",
                                    tintZone === zone.id
                                      ? "bg-rpm-red/10 border border-rpm-red/30 text-rpm-white"
                                      : "border border-rpm-gray/20 text-rpm-silver hover:border-rpm-gray/40"
                                  )}
                                >
                                  <div>
                                    <div className="font-semibold">{zone.name}</div>
                                    <div className="text-[10px] text-rpm-silver/60">{zone.desc}</div>
                                  </div>
                                  <span className={cn("font-bold text-sm", tintZone === zone.id ? "text-rpm-red" : "text-rpm-silver")}>${zone.price}</span>
                                </button>
                              ))}
                            </div>
                            {/* Tint darkness slider */}
                            <TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} />
                          </div>
                        </motion.div>
                      )}
                      {isActive && service.id === "vehicle-wraps" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 pt-1"><ColorPicker selectedColor={wrapColor} onColorChange={setWrapColor} /></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Total — desktop */}
            <div className="mt-4 pt-4 border-t border-rpm-gray/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rpm-silver">Estimated Total</span>
                <motion.span key={estimatedTotal} initial={{ scale: 1.2, color: "#ef4444" }} animate={{ scale: 1, color: estimatedTotal > 0 ? "#dc2626" : "#8a8a8a" }} className="text-2xl font-black">
                  ${estimatedTotal.toLocaleString()}{estimatedTotal > 0 && <span className="text-sm font-medium">+</span>}
                </motion.span>
              </div>
              <p className="text-[10px] text-rpm-silver/60 mb-4">Starting prices. Final quote based on vehicle size &amp; condition.</p>
              <a href="/rpm-auto-lab/contact" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-rpm-red-dark">
                Get This Package Quoted
              </a>
            </div>
          </div>
        </div>

        {/* ── Mobile Sticky Total + CTA ── */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-rpm-dark/95 backdrop-blur-xl border-t border-rpm-gray/50 px-4 py-3 safe-bottom">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rpm-silver">Estimated Total</span>
              <motion.span key={estimatedTotal} initial={{ scale: 1.2, color: "#ef4444" }} animate={{ scale: 1, color: estimatedTotal > 0 ? "#dc2626" : "#8a8a8a" }} className="text-xl font-black">
                ${estimatedTotal.toLocaleString()}{estimatedTotal > 0 && <span className="text-sm font-medium">+</span>}
              </motion.span>
            </div>
            <a href="/rpm-auto-lab/contact" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-rpm-red-dark">
              Get This Package Quoted
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// Preload the model
useGLTF.preload("/rpm-auto-lab/models/bmw-m4.glb");
