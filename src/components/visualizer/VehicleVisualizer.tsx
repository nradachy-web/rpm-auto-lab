"use client";

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import TintSlider from "./TintSlider";
import VehiclePicker from "./VehiclePicker";
import { Studio } from "./Studio";
import { VehicleCar } from "./VehicleCar";
import { VEHICLES, getVehicleById } from "./vehicles";
import type { EffectState } from "./materialEffects";
import type { FinishType } from "./types";

// ─── Service catalog ─────────────────────────────────────────────────
const CONFIGURATOR_SERVICES = [
  { id: "ceramic-coating", name: "Ceramic Coating", price: 599, icon: "shield", description: "Mirror-like gloss & hydrophobic protection" },
  { id: "ppf", name: "Paint Protection Film", price: 799, icon: "layers", description: "Self-healing invisible armor" },
  { id: "window-tint", name: "Window Tint", price: 249, icon: "sun", description: "Ceramic tint for heat & UV rejection" },
  { id: "vehicle-wraps", name: "Vehicle Wraps", price: 2499, icon: "paintbrush", description: "Full color transformation" },
  { id: "paint-correction", name: "Paint Correction", price: 399, icon: "sparkles", description: "Swirl & scratch elimination" },
  { id: "detailing", name: "Full Detail", price: 149, icon: "droplets", description: "Interior & exterior restoration" },
] as const;

const PPF_PACKAGES = [
  { id: "partial-front", name: "Partial Front", desc: "Hood, bumper, fenders (24\")", price: 799 },
  { id: "full-front", name: "Full Front", desc: "Hood, full fenders, bumper, mirrors", price: 1499 },
  { id: "track-pack", name: "Track Package", desc: "Full front + rocker panels + A-pillars", price: 2299 },
  { id: "full-body", name: "Full Body", desc: "Every painted surface protected", price: 5499 },
] as const;

const CERAMIC_ZONES = [
  { id: "ceramic-front", name: "Front End", desc: "Hood, bumper, front fenders", price: 599 },
  { id: "ceramic-exterior", name: "Full Exterior", desc: "All painted exterior surfaces", price: 999 },
  { id: "ceramic-full", name: "Full Body + Wheels", desc: "Exterior + wheels + trim", price: 1499 },
  { id: "ceramic-ultimate", name: "Ultimate Package", desc: "Full body + interior leather + glass", price: 2499 },
] as const;

const TINT_ZONES = [
  { id: "front-sides", name: "Front Side Windows", desc: "Driver & passenger windows", price: 149 },
  { id: "rear-sides", name: "Rear Side Windows", desc: "Rear passenger windows", price: 129 },
  { id: "rear-windshield", name: "Rear Windshield", desc: "Back glass", price: 99 },
  { id: "windshield", name: "Windshield Strip", desc: "Visor strip / brow", price: 79 },
  { id: "full-vehicle", name: "Full Vehicle", desc: "All windows — best value", price: 349 },
] as const;

// ─── Mobile detection hook ──────────────────────────────────────────
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

// ─── Imperative camera animator — sets position on azimuth change, then
// hands control back to OrbitControls for user dragging. No per-frame fight.
function CameraDirector({
  distance,
  height,
  target,
  azimuth,
  onSettled,
}: {
  distance: number;
  height: number;
  target: [number, number, number];
  azimuth: number;
  onSettled?: (settled: boolean) => void;
}) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: { target: THREE.Vector3; update: () => void } | undefined;
  };
  const animFrom = useRef(new THREE.Vector3());
  const animTo = useRef(new THREE.Vector3());
  const animLookFrom = useRef(new THREE.Vector3());
  const animLookTo = useRef(new THREE.Vector3(...target));
  const animT = useRef(1); // 1 = settled, <1 = in progress
  const animDuration = useRef(0.9);

  // When any camera input changes, start a fresh animation
  useEffect(() => {
    animFrom.current.copy(camera.position);
    animLookFrom.current.copy(controls?.target ?? new THREE.Vector3(...target));
    const x = Math.sin(azimuth) * distance;
    const z = Math.cos(azimuth) * distance;
    animTo.current.set(x, height, z);
    animLookTo.current.set(...target);
    animT.current = 0;
    onSettled?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance, height, azimuth, target[0], target[1], target[2]]);

  useFrame((_, delta) => {
    if (animT.current >= 1) return;
    animT.current = Math.min(1, animT.current + delta / animDuration.current);
    const t = easeInOutCubic(animT.current);
    camera.position.lerpVectors(animFrom.current, animTo.current, t);
    if (controls?.target) {
      controls.target.lerpVectors(animLookFrom.current, animLookTo.current, t);
      controls.update();
    } else {
      const look = new THREE.Vector3().lerpVectors(animLookFrom.current, animLookTo.current, t);
      camera.lookAt(look);
    }
    if (animT.current >= 1) onSettled?.(true);
  });

  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function ResponsiveCameraConfig() {
  const { camera } = useThree();
  useEffect(() => {
    const updateFov = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = window.innerWidth < 1024 ? 45 : 36;
        camera.updateProjectionMatrix();
      }
    };
    updateFov();
    window.addEventListener("resize", updateFov);
    return () => window.removeEventListener("resize", updateFov);
  }, [camera]);
  return null;
}

// ─── Simple loader ──────────────────────────────────────────────────
function Loader() {
  return (
    <Html center>
      <div className="text-center select-none">
        <div className="relative w-14 h-14 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderTopColor: "#dc2626" }} />
          <div className="absolute inset-2 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderBottomColor: "#0066B1", animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="text-rpm-silver text-[11px] font-medium uppercase tracking-widest whitespace-nowrap">Loading Vehicle</p>
      </div>
    </Html>
  );
}

// ─── Service icons ──────────────────────────────────────────────────
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

// ─── Camera angle preset per service/zone ───────────────────────────
function getAzimuth(service: string, zone: string): number {
  // 0 rad = straight-on front, +x = rotate right (clockwise from above)
  switch (service) {
    case "ppf":
      if (zone === "partial-front") return 0.1; // near straight-on
      if (zone === "full-front") return 0.35;
      if (zone === "track-pack") return 1.1; // show side
      return 0.8; // full-body: 3/4 front
    case "ceramic-coating":
      if (zone === "ceramic-front") return 0.2;
      return 0.9; // 3/4 front
    case "window-tint":
      if (zone === "front-sides") return 1.4; // near side
      if (zone === "rear-sides") return 2.1; // rear 3/4
      if (zone === "rear-windshield") return Math.PI; // rear
      if (zone === "windshield") return 0;
      return 1.2; // full
    case "vehicle-wraps":
      return 0.85; // 3/4 hero
    case "paint-correction":
      return -0.9; // opposite 3/4 (show sides)
    case "detailing":
      return 2.4; // rear 3/4 opposite
    default:
      return 0.75; // default 3/4 front-right
  }
}

// ─── Main Visualizer ────────────────────────────────────────────────
export default function VehicleVisualizer() {
  const [vehicleId, setVehicleId] = useState<string>(VEHICLES[0].id);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [tintLevel, setTintLevel] = useState(35);
  const [wrapColor, setWrapColor] = useState("#1a1a1a");
  const [wrapFinish, setWrapFinish] = useState<FinishType>("matte");
  const [ppfPackage, setPpfPackage] = useState("full-front");
  const [ceramicZone, setCeramicZone] = useState("ceramic-exterior");
  const [tintZone, setTintZone] = useState("full-vehicle");
  const [lastActiveService, setLastActiveService] = useState<string>("default");
  const [isSettled, setIsSettled] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [mobileDrawerExpanded, setMobileDrawerExpanded] = useState(true);

  const isMobile = useIsMobile();
  const vehicle = useMemo(() => getVehicleById(vehicleId), [vehicleId]);

  // Rotate vehicle idly after 4s of no interaction
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeIdle = useCallback(() => {
    setAutoRotate(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAutoRotate(true), 5000);
  }, []);
  useEffect(() => {
    nudgeIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [nudgeIdle, activeServices, vehicleId, wrapColor, wrapFinish, tintLevel, ppfPackage, ceramicZone, tintZone]);

  // Compute azimuth from active service / zone
  const { azimuth, zoneKey } = useMemo(() => {
    const svc = lastActiveService;
    let zn = "default";
    if (svc === "ppf") zn = ppfPackage;
    else if (svc === "ceramic-coating") zn = ceramicZone;
    else if (svc === "window-tint") zn = tintZone;
    return { azimuth: getAzimuth(svc, zn), zoneKey: `${svc}:${zn}` };
  }, [lastActiveService, ppfPackage, ceramicZone, tintZone]);

  const handleSettled = useCallback((settled: boolean) => setIsSettled(settled), []);

  // Estimated total
  const estimatedTotal = useMemo(() => {
    let total = 0;
    CONFIGURATOR_SERVICES.forEach((s) => {
      if (!activeServices.has(s.id)) return;
      if (s.id === "ppf") total += PPF_PACKAGES.find((p) => p.id === ppfPackage)?.price ?? s.price;
      else if (s.id === "ceramic-coating") total += CERAMIC_ZONES.find((p) => p.id === ceramicZone)?.price ?? s.price;
      else if (s.id === "window-tint") total += TINT_ZONES.find((z) => z.id === tintZone)?.price ?? s.price;
      else total += s.price;
    });
    return total;
  }, [activeServices, ppfPackage, ceramicZone, tintZone]);

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

  const handleColorChange = useCallback((color: string, finish: FinishType) => {
    setWrapColor(color);
    setWrapFinish(finish);
  }, []);

  // Effect state for the 3D car
  const effectState: EffectState = useMemo(() => ({
    wrapActive: activeServices.has("vehicle-wraps"),
    wrapColor,
    wrapFinish,
    ceramicActive: activeServices.has("ceramic-coating"),
    ceramicZone,
    ppfActive: activeServices.has("ppf"),
    ppfPackage,
    paintCorrectionActive: activeServices.has("paint-correction"),
    detailActive: activeServices.has("detailing"),
    tintActive: activeServices.has("window-tint"),
    tintZone,
    tintLevel,
  }), [activeServices, wrapColor, wrapFinish, ceramicZone, ppfPackage, tintZone, tintLevel]);

  // Ambient service stats to show in an infotag
  const activeStats = useMemo(() => {
    switch (lastActiveService) {
      case "ceramic-coating":
        return ["9H Hardness", "5+ Year Durability", "Hydrophobic", "UV Protection"];
      case "ppf":
        return ["Self-Healing", "10yr Warranty", "Rock Chip Defense", "Optically Clear"];
      case "window-tint":
        return ["99% UV Rejection", "85% Heat Block", "No Signal Loss", "Lifetime Warranty"];
      case "vehicle-wraps":
        return ["500+ Colors", "3M Certified", "Fully Reversible", "5-7yr Lifespan"];
      case "paint-correction":
        return ["Multi-Stage Polish", "Swirl Removal", "Gloss Verified", "Paint-Safe"];
      case "detailing":
        return ["Hand Wash Only", "Full Interior", "Leather Treatment", "Engine Bay"];
      default:
        return [];
    }
  }, [lastActiveService]);

  return (
    <section id="configurator" className="relative overflow-hidden pb-24 lg:pb-20">
      {/* BMW M-stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 flex z-20">
        <div className="flex-1 bg-[#0066B1]" />
        <div className="flex-1 bg-[#1B1464]" />
        <div className="flex-1 bg-rpm-red" />
      </div>

      {/* Ambient radial glow backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rpm-red/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 lg:pt-16">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-3 text-[10px] font-bold uppercase tracking-[0.22em] rounded-full border border-rpm-red/30 bg-rpm-red/5 text-rpm-red">
              <span className="w-1.5 h-1.5 rounded-full bg-rpm-red animate-pulse" />
              3D Configurator
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-rpm-white tracking-tight leading-[1.05]">
              Build Your <span className="text-gradient-red">Dream Ride</span>
            </h2>
            <p className="mt-3 text-rpm-silver text-sm lg:text-base max-w-xl mx-auto">
              Pick your vehicle, toggle services, watch it transform. Drag to rotate.
            </p>
          </motion.div>
        </div>

        {/* Vehicle Picker */}
        <div className="mb-5 lg:mb-6">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-rpm-silver">
              Step 1 — Select Vehicle
            </span>
            <span className="text-[10px] text-rpm-silver/50">{VEHICLES.length} models</span>
          </div>
          <VehiclePicker vehicles={VEHICLES} selectedId={vehicleId} onSelect={setVehicleId} />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
          {/* 3D Canvas */}
          <div className="relative">
            <div
              className="relative rounded-2xl border border-rpm-gray/50 bg-rpm-dark overflow-hidden lens-vignette h-[62vh] min-h-[420px] lg:h-[680px]"
              style={{ touchAction: "none" }}
              onPointerDown={nudgeIdle}
              onWheel={nudgeIdle}
            >
              {/* M-stripe corner */}
              <div className="absolute top-0 left-0 w-20 h-1 flex z-10">
                <div className="flex-1 bg-[#0066B1]" />
                <div className="flex-1 bg-[#1B1464]" />
                <div className="flex-1 bg-rpm-red" />
              </div>

              {/* Vehicle name badge */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="bg-rpm-black/60 backdrop-blur-md border border-rpm-gray/40 rounded-lg px-3 py-1.5">
                  <div className="text-[8px] font-bold uppercase tracking-[0.22em] text-rpm-red leading-none">
                    {vehicle.year} • {vehicle.category.toUpperCase()}
                  </div>
                  <div className="text-sm font-black text-rpm-white mt-1 leading-none">
                    {vehicle.make} <span className="text-rpm-silver font-bold">{vehicle.model}</span>
                  </div>
                </div>
              </div>

              {/* Active services badges */}
              {activeServices.size > 0 && (
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 max-w-[50%] pointer-events-none">
                  {CONFIGURATOR_SERVICES.filter((s) => activeServices.has(s.id)).map((s) => (
                    <motion.span
                      key={s.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="px-2.5 py-1 rounded-full bg-rpm-red/20 border border-rpm-red/40 text-rpm-red text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap"
                    >
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              )}

              <Canvas
                key={vehicleId /* force re-mount on vehicle switch to avoid material bleed */}
                camera={{ position: [vehicle.cameraDistance, vehicle.cameraHeight, vehicle.cameraDistance], fov: 36, near: 0.1, far: 120 }}
                gl={{
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 1.15,
                  outputColorSpace: THREE.SRGBColorSpace,
                }}
                shadows
                style={{ background: "#0b0b0d", borderRadius: "1rem" }}
              >
                <ResponsiveCameraConfig />

                <Studio />

                <OrbitControls
                  enablePan={false}
                  enableZoom={false}
                  makeDefault
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2.1}
                  autoRotate={autoRotate && isSettled && activeServices.size === 0}
                  autoRotateSpeed={0.6}
                  enableDamping
                  dampingFactor={0.12}
                  target={new THREE.Vector3(...vehicle.cameraTarget)}
                />
                <CameraDirector
                  distance={vehicle.cameraDistance}
                  height={vehicle.cameraHeight}
                  target={vehicle.cameraTarget}
                  azimuth={azimuth}
                  onSettled={handleSettled}
                />

                <Suspense fallback={<Loader />}>
                  <VehicleCar vehicle={vehicle} effectState={effectState} />
                </Suspense>
              </Canvas>

              {/* Hint: drag to rotate */}
              <motion.div
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 4, duration: 1.5 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-rpm-black/70 backdrop-blur border border-rpm-gray/40 text-rpm-silver text-[10px] uppercase tracking-widest pointer-events-none"
              >
                Drag to rotate
              </motion.div>

              {/* Service infotag — only visible when settled and service active */}
              <AnimatePresence>
                {activeStats.length > 0 && isSettled && (
                  <motion.div
                    key={zoneKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="absolute bottom-4 left-4 z-10 pointer-events-none max-w-[65%]"
                  >
                    <div className="bg-rpm-black/80 backdrop-blur-md border border-rpm-red/25 rounded-lg px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.4)]">
                      <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-rpm-red mb-1 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-rpm-red animate-pulse" />
                        {CONFIGURATOR_SERVICES.find((s) => s.id === lastActiveService)?.name}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {activeStats.map((stat, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-rpm-red/70" />
                            <span className="text-[10px] text-rpm-white/85 font-medium whitespace-nowrap">{stat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Auto-rotate indicator */}
              {autoRotate && isSettled && activeServices.size === 0 && (
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 text-rpm-silver/60 text-[9px] uppercase tracking-[0.18em] pointer-events-none">
                  <span className="w-1 h-1 rounded-full bg-rpm-red animate-pulse" />
                  Auto-rotate
                </div>
              )}
            </div>
          </div>

          {/* Service Panel — desktop */}
          <div className="hidden lg:flex rounded-2xl border border-rpm-gray/50 bg-rpm-dark/80 backdrop-blur-xl p-6 flex-col max-h-[680px]">
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-rpm-silver">
                Step 2 — Customize Services
              </span>
              <h3 className="text-lg font-bold text-rpm-white mt-1">What are we protecting?</h3>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto -mr-2 pr-2">
              {CONFIGURATOR_SERVICES.map((service) => {
                const isActive = activeServices.has(service.id);
                return (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isActive={isActive}
                    onToggle={() => toggleService(service.id)}
                  >
                    {isActive && service.id === "ceramic-coating" && (
                      <ZoneList
                        label="Coverage Zone"
                        items={CERAMIC_ZONES}
                        selectedId={ceramicZone}
                        onSelect={setCeramicZone}
                      />
                    )}
                    {isActive && service.id === "ppf" && (
                      <ZoneList
                        label="Coverage Zone"
                        items={PPF_PACKAGES}
                        selectedId={ppfPackage}
                        onSelect={setPpfPackage}
                      />
                    )}
                    {isActive && service.id === "window-tint" && (
                      <div className="space-y-3">
                        <ZoneList
                          label="Window Zone"
                          items={TINT_ZONES}
                          selectedId={tintZone}
                          onSelect={setTintZone}
                        />
                        <TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} />
                      </div>
                    )}
                    {isActive && service.id === "vehicle-wraps" && (
                      <ColorPicker
                        selectedColor={wrapColor}
                        selectedFinish={wrapFinish}
                        onChange={handleColorChange}
                      />
                    )}
                  </ServiceRow>
                );
              })}
            </div>

            {/* Total + CTA */}
            <div className="mt-4 pt-4 border-t border-rpm-gray/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rpm-silver">Estimated Total</span>
                <motion.span
                  key={estimatedTotal}
                  initial={{ scale: 1.18, color: "#ef4444" }}
                  animate={{ scale: 1, color: estimatedTotal > 0 ? "#dc2626" : "#8a8a8a" }}
                  className="text-2xl font-black tabular-nums"
                >
                  ${estimatedTotal.toLocaleString()}
                  {estimatedTotal > 0 && <span className="text-sm font-medium">+</span>}
                </motion.span>
              </div>
              <p className="text-[10px] text-rpm-silver/60 mb-4">
                Starting prices. Final quote based on vehicle size &amp; condition.
              </p>
              <a
                href="/rpm-auto-lab/contact"
                className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.45)] hover:bg-rpm-red-dark"
              >
                Get This Package Quoted
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m7 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Attribution — CC-BY requires author credit for Sketchfab models */}
        <p className="mt-4 text-center text-[9px] text-rpm-silver/40 tracking-wide">
          Vehicle models: <a href="https://sketchfab.com/3d-models/tesla-model-3-596bbf266fce430181e6d0e2b1903364" target="_blank" rel="noopener noreferrer" className="underline hover:text-rpm-silver/60">Tesla Model 3</a> by ItsDiyor · <a href="https://sketchfab.com/3d-models/lamborghini-urus-2018-32964087f5d24c3e90482724ddfc2fef" target="_blank" rel="noopener noreferrer" className="underline hover:text-rpm-silver/60">Lamborghini Urus</a> by kirikom9000 · <a href="https://sketchfab.com/3d-models/tesla-cybertruck-936a6e7c4e6f46e1a3b270c93c8ea2ee" target="_blank" rel="noopener noreferrer" className="underline hover:text-rpm-silver/60">Cybertruck</a> by vasyl.yarmola — CC BY 4.0
        </p>
      </div>

      {/* ── Mobile Bottom Drawer ─────────────────────────────────── */}
      {isMobile && (
        <MobileDrawer
          services={CONFIGURATOR_SERVICES}
          activeServices={activeServices}
          toggleService={toggleService}
          ppfPackage={ppfPackage}
          setPpfPackage={setPpfPackage}
          ceramicZone={ceramicZone}
          setCeramicZone={setCeramicZone}
          tintZone={tintZone}
          setTintZone={setTintZone}
          tintLevel={tintLevel}
          setTintLevel={setTintLevel}
          wrapColor={wrapColor}
          wrapFinish={wrapFinish}
          onColorChange={handleColorChange}
          estimatedTotal={estimatedTotal}
          expanded={mobileDrawerExpanded}
          setExpanded={setMobileDrawerExpanded}
        />
      )}
    </section>
  );
}

// ─── Shared inner components ────────────────────────────────────────
interface ServiceRowProps {
  service: { id: string; name: string; price: number; icon: string; description: string };
  isActive: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

function ServiceRow({ service, isActive, onToggle, children }: ServiceRowProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer text-left",
          isActive
            ? "bg-rpm-red/10 border border-rpm-red/30"
            : "hover:bg-rpm-charcoal/50 border border-transparent"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
          isActive
            ? "bg-rpm-red/20 text-rpm-red shadow-[0_0_12px_rgba(220,38,38,0.3)]"
            : "bg-rpm-charcoal text-rpm-silver group-hover:text-rpm-white"
        )}>
          <ServiceIcon type={service.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-rpm-white">{service.name}</div>
          <div className="text-[11px] text-rpm-silver truncate">{service.description}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cn("text-sm font-bold transition-colors tabular-nums", isActive ? "text-rpm-red" : "text-rpm-silver")}>
            ${service.price}
          </div>
          <div className={cn("w-8 h-4 rounded-full mt-1 ml-auto transition-all duration-300 relative", isActive ? "bg-rpm-red shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-rpm-gray")}>
            <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300", isActive ? "left-[18px]" : "left-0.5")} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {children && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ZoneListProps {
  label: string;
  items: readonly { id: string; name: string; desc: string; price: number }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function ZoneList({ label, items, selectedId, onSelect }: ZoneListProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] uppercase tracking-[0.18em] text-rpm-silver">{label}</p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs cursor-pointer",
            selectedId === item.id
              ? "bg-rpm-red/10 border border-rpm-red/30 text-rpm-white"
              : "border border-rpm-gray/20 text-rpm-silver hover:border-rpm-gray/40"
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{item.name}</div>
            <div className="text-[10px] text-rpm-silver/60 truncate">{item.desc}</div>
          </div>
          <span className={cn(
            "font-bold text-sm tabular-nums flex-shrink-0 ml-2",
            selectedId === item.id ? "text-rpm-red" : "text-rpm-silver"
          )}>
            ${item.price.toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Mobile Drawer ──────────────────────────────────────────────────
interface MobileDrawerProps {
  services: typeof CONFIGURATOR_SERVICES;
  activeServices: Set<string>;
  toggleService: (id: string) => void;
  ppfPackage: string;
  setPpfPackage: (v: string) => void;
  ceramicZone: string;
  setCeramicZone: (v: string) => void;
  tintZone: string;
  setTintZone: (v: string) => void;
  tintLevel: number;
  setTintLevel: (v: number) => void;
  wrapColor: string;
  wrapFinish: FinishType;
  onColorChange: (c: string, f: FinishType) => void;
  estimatedTotal: number;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}

function MobileDrawer({
  services, activeServices, toggleService, ppfPackage, setPpfPackage, ceramicZone, setCeramicZone,
  tintZone, setTintZone, tintLevel, setTintLevel, wrapColor, wrapFinish, onColorChange, estimatedTotal,
  expanded, setExpanded,
}: MobileDrawerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-rpm-dark/96 backdrop-blur-xl border-t border-rpm-gray/60 safe-bottom">
      {/* Handle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col items-center pt-2 pb-1 cursor-pointer"
        aria-label={expanded ? "Collapse services" : "Expand services"}
      >
        <div className="w-10 h-1 rounded-full bg-rpm-silver/40 mb-1" />
        <span className="text-[9px] text-rpm-silver uppercase tracking-[0.22em]">
          {expanded ? "Tap to collapse" : "Tap for services"}
        </span>
      </button>

      {/* Collapsed: pill row + sticky total */}
      {!expanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-2">
            {services.map((service) => {
              const isActive = activeServices.has(service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-200 border whitespace-nowrap",
                    isActive
                      ? "bg-rpm-red/15 border-rpm-red/40 text-rpm-red"
                      : "bg-rpm-charcoal/60 border-rpm-gray/40 text-rpm-silver"
                  )}
                >
                  <ServiceIcon type={service.icon} className="w-3.5 h-3.5" />
                  {service.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-rpm-silver">Est Total</div>
              <motion.div
                key={estimatedTotal}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={cn("text-xl font-black tabular-nums", estimatedTotal > 0 ? "text-rpm-red" : "text-rpm-silver")}
              >
                ${estimatedTotal.toLocaleString()}{estimatedTotal > 0 && "+"}
              </motion.div>
            </div>
            <a
              href="/rpm-auto-lab/contact"
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-xs"
            >
              Get Quote
            </a>
          </div>
        </div>
      )}

      {/* Expanded: full service list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 max-h-[52vh] overflow-y-auto">
              <div className="space-y-1">
                {services.map((service) => {
                  const isActive = activeServices.has(service.id);
                  return (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      isActive={isActive}
                      onToggle={() => toggleService(service.id)}
                    >
                      {isActive && service.id === "ceramic-coating" && (
                        <ZoneList label="Coverage Zone" items={CERAMIC_ZONES} selectedId={ceramicZone} onSelect={setCeramicZone} />
                      )}
                      {isActive && service.id === "ppf" && (
                        <ZoneList label="Coverage Zone" items={PPF_PACKAGES} selectedId={ppfPackage} onSelect={setPpfPackage} />
                      )}
                      {isActive && service.id === "window-tint" && (
                        <div className="space-y-3">
                          <ZoneList label="Window Zone" items={TINT_ZONES} selectedId={tintZone} onSelect={setTintZone} />
                          <TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} />
                        </div>
                      )}
                      {isActive && service.id === "vehicle-wraps" && (
                        <ColorPicker selectedColor={wrapColor} selectedFinish={wrapFinish} onChange={onColorChange} />
                      )}
                    </ServiceRow>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-rpm-gray/50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.22em] text-rpm-silver">Est Total</div>
                  <motion.div
                    key={estimatedTotal}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={cn("text-2xl font-black tabular-nums", estimatedTotal > 0 ? "text-rpm-red" : "text-rpm-silver")}
                  >
                    ${estimatedTotal.toLocaleString()}{estimatedTotal > 0 && "+"}
                  </motion.div>
                </div>
                <a
                  href="/rpm-auto-lab/contact"
                  className="flex-1 max-w-[60%] flex items-center justify-center py-3 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-sm"
                >
                  Get This Package Quoted
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Preload all vehicle GLBs so switching is instant
VEHICLES.forEach((v) => useGLTF.preload(v.modelPath));
