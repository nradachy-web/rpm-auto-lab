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

// ─── Camera angles per service ──────────────────────────────────────
// Car center is at Y≈1.0 (model is raised). All targets aim at car center.
// All cameras at ~8 unit distance to ensure the FULL car is always visible.
const CAR_CENTER_Y = 1.0;
const CAMERA_POSITIONS: Record<string, {
  position: [number, number, number];
  target: [number, number, number];
  stats: string[];
}> = {
  default: {
    position: [6, 3, 6],
    target: [0, CAR_CENTER_Y, 0],
    stats: [],
  },
  "ceramic-coating": {
    // Front 3/4 — see glossy body panels
    position: [5, 2.5, 6.5],
    target: [0, CAR_CENTER_Y, 0],
    stats: ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"],
  },
  ppf: {
    // Front view — hood, bumper, fenders
    position: [1.5, 2.5, 8],
    target: [0, CAR_CENTER_Y - 0.2, 0],
    stats: ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"],
  },
  "window-tint": {
    // Side profile — windows
    position: [8, 2.5, 0.5],
    target: [0, CAR_CENTER_Y, 0],
    stats: ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"],
  },
  "vehicle-wraps": {
    // Wide 3/4 — full color appreciation
    position: [5.5, 3, 6],
    target: [0, CAR_CENTER_Y - 0.1, 0],
    stats: ["500+ Colors", "3M Certified", "Fully Reversible", "5-7yr Lifespan"],
  },
  "paint-correction": {
    // Opposite 3/4
    position: [-4.5, 2.5, 6],
    target: [0, CAR_CENTER_Y, 0],
    stats: ["Multi-Stage Polish", "Swirl Removal", "Gloss Verified", "Paint-Safe"],
  },
  detailing: {
    // Rear 3/4
    position: [5.5, 2.5, -5],
    target: [0, CAR_CENTER_Y, 0],
    stats: ["Hand Wash Only", "Full Interior", "Leather Treatment", "Engine Bay"],
  },
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

// ─── Car Model Component ─────────────────────────────────────────────
function CarModel({
  activeServices,
  wrapColor,
  tintLevel,
}: {
  activeServices: Set<string>;
  wrapColor: string;
  tintLevel: number;
}) {
  const { scene } = useGLTF("/rpm-auto-lab/models/bmw-m4.glb");
  const modelRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Categorize materials on first load
  const materialCategories = useMemo(() => {
    const body: THREE.MeshStandardMaterial[] = [];
    const glass: THREE.MeshStandardMaterial[] = [];
    const chrome: THREE.MeshStandardMaterial[] = [];
    const other: THREE.MeshStandardMaterial[] = [];
    const originals = new Map<THREE.MeshStandardMaterial, { color: THREE.Color; roughness: number; metalness: number; opacity: number }>();

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) return;
          if (originals.has(mat)) return;

          // Store original values
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
            glass.push(mat);
          } else if (combined.includes("692") || combined.includes("body") || combined.includes("paint")) {
            body.push(mat);
          } else if (mat.metalness > 0.8 && mat.roughness < 0.2) {
            chrome.push(mat);
          } else if (mat.roughness < 0.3 && !combined.includes("tire") && !combined.includes("rubber")) {
            body.push(mat);
          } else {
            other.push(mat);
          }
        });
      }
    });

    return { body, glass, chrome, other, originals };
  }, [clonedScene]);

  // Apply service effects
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
      mat.needsUpdate = true;
    });

    // Vehicle Wraps — change body color
    if (activeServices.has("vehicle-wraps")) {
      body.forEach((mat) => {
        mat.color.set(wrapColor);
        mat.needsUpdate = true;
      });
    }

    // Ceramic Coating — dramatic wet-look mirror finish
    if (activeServices.has("ceramic-coating")) {
      body.forEach((mat) => {
        mat.roughness = 0.01;
        mat.metalness = 0.95;
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        mat.color.setHSL(hsl.h, Math.min(hsl.s * 1.3, 1), hsl.l * 1.1);
        mat.envMapIntensity = 2.5;
        mat.needsUpdate = true;
      });
      chrome.forEach((mat) => {
        mat.roughness = 0.0;
        mat.envMapIntensity = 3;
        mat.needsUpdate = true;
      });
    }

    // Paint Correction — smooth surface
    if (activeServices.has("paint-correction")) {
      body.forEach((mat) => {
        mat.roughness = Math.min(mat.roughness, 0.1);
        mat.needsUpdate = true;
      });
    }

    // Detailing — subtle quality boost
    if (activeServices.has("detailing")) {
      body.forEach((mat) => {
        mat.roughness = Math.max(mat.roughness - 0.05, 0.01);
        mat.needsUpdate = true;
      });
    }

    // PPF — slight clearcoat boost
    if (activeServices.has("ppf")) {
      body.forEach((mat) => {
        mat.metalness = Math.max(mat.metalness, 0.6);
        mat.roughness = Math.min(mat.roughness, 0.15);
        mat.needsUpdate = true;
      });
    }

    // Window Tint — darken ALL glass progressively
    if (activeServices.has("window-tint")) {
      glass.forEach((mat) => {
        const t = tintLevel / 100;
        mat.color.set(new THREE.Color(t * 0.08, t * 0.08, t * 0.08));
        mat.opacity = 0.99 - t * 0.58;
        mat.transparent = true;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        if (mat.map) {
          mat.map = null;
        }
        mat.needsUpdate = true;
      });
    }
  }, [activeServices, wrapColor, tintLevel, materialCategories]);

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

// ─── Subtle dark floor — no distracting glare ──────────────────────
function ShopFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color="#080808"
        roughness={0.6}
        metalness={0.1}
        envMapIntensity={0.15}
      />
    </mesh>
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
  const [lastActiveService, setLastActiveService] = useState<string>("default");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);
  const orbitRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isMobile = useIsMobile();

  // Responsive camera positions (further back on mobile)
  const cameraPositions = useMobileCameraPositions(CAMERA_POSITIONS);

  const estimatedTotal = CONFIGURATOR_SERVICES.filter((s) =>
    activeServices.has(s.id)
  ).reduce((sum, s) => sum + s.price, 0);

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

  const cameraTarget = cameraPositions[lastActiveService] || cameraPositions.default;

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
              className="relative rounded-2xl border border-rpm-gray/50 bg-rpm-dark h-[350px] lg:h-[600px]"
              style={{ touchAction: "none" }}
            >
              <div className="absolute top-0 left-0 w-24 h-1 flex z-10 rounded-br overflow-hidden">
                <div className="flex-1 bg-[#0066B1]" />
                <div className="flex-1 bg-[#1B1464]" />
                <div className="flex-1 bg-rpm-red" />
              </div>

              <Canvas
                camera={{ position: [6, 3, 6], fov: 40, near: 0.1, far: 100 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
                style={{ background: "#111111", borderRadius: "1rem" }}
              >
                {/* Responsive FOV adjustment */}
                <ResponsiveCameraConfig />

                {/* Shop/showroom lighting — bright overhead + warm fills */}
                <ambientLight intensity={0.6} color="#f0f0f0" />
                <spotLight position={[0, 10, 0]} angle={0.8} penumbra={1} intensity={2.5} color="#ffffff" castShadow />
                <spotLight position={[6, 6, 6]} angle={0.5} penumbra={0.8} intensity={1.5} color="#fff5e6" />
                <spotLight position={[-5, 5, -4]} angle={0.5} penumbra={1} intensity={1} color="#e0e8ff" />
                <spotLight position={[0, 4, -8]} angle={0.4} penumbra={0.6} intensity={1.2} color="#ffffff" />

                <Environment preset="warehouse" />

                {/* Dark floor + ground shadow */}
                <ShopFloor />
                <ContactShadows position={[0, 0.02, 0]} opacity={0.25} scale={20} blur={2} far={8} color="#000000" />

                <AnimatedCamera
                  targetPos={cameraTarget.position}
                  targetLookAt={cameraTarget.target}
                  onAnimating={handleAnimating}
                />

                <OrbitControls
                  ref={orbitRef}
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.05}
                  minDistance={2}
                  maxDistance={12}
                  maxPolarAngle={Math.PI / 2.1}
                  minPolarAngle={0.2}
                />

                <Suspense fallback={<Loader />}>
                  <CarModel
                    activeServices={activeServices}
                    wrapColor={wrapColor}
                    tintLevel={tintLevel}
                  />

                </Suspense>
              </Canvas>

              {/* Interaction hint */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 5, duration: 1.5 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-rpm-dark/80 backdrop-blur border border-rpm-gray/50 text-rpm-silver text-xs pointer-events-none"
              >
                Click &amp; drag to rotate &bull; Scroll to zoom
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
                      {isActive && service.id === "window-tint" && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 pt-1"><TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} /></div>
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
