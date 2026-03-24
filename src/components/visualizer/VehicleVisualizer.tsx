"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ColorPicker from "./ColorPicker";
import TintSlider from "./TintSlider";

// ─── Sketchfab Models ────────────────────────────────────────────────
const VEHICLES = [
  {
    id: "bmw-m4",
    label: "BMW M4",
    uid: "d3f07b471d9f4a2c9a2acf79d88a3645",
  },
  {
    id: "bmw-m3-e92",
    label: "BMW M3 E92",
    uid: "c35a14d811b042d792a6da69381f7f80",
  },
  {
    id: "bmw-m4-csl",
    label: "BMW M4 CSL",
    uid: "26d05968e63b4fc28205cbb9abb0ea41",
  },
];

// ─── Services ────────────────────────────────────────────────────────
const CONFIGURATOR_SERVICES = [
  { id: "ceramic-coating", name: "Ceramic Coating", price: 599, icon: "shield", description: "Mirror-like gloss & hydrophobic protection" },
  { id: "ppf", name: "Paint Protection Film", price: 799, icon: "layers", description: "Self-healing invisible armor" },
  { id: "window-tint", name: "Window Tint", price: 249, icon: "sun", description: "Ceramic tint for heat & UV rejection" },
  { id: "vehicle-wraps", name: "Vehicle Wraps", price: 2499, icon: "paintbrush", description: "Full color transformation" },
  { id: "paint-correction", name: "Paint Correction", price: 399, icon: "sparkles", description: "Swirl & scratch elimination" },
  { id: "detailing", name: "Full Detail", price: 149, icon: "droplets", description: "Interior & exterior restoration" },
];

// ─── Helpers ─────────────────────────────────────────────────────────
function hexToRgb01(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function isBodyMaterial(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("body") || n.includes("paint") || n.includes("car") ||
    n.includes("exterior") || n.includes("metal") || n.includes("hood") ||
    n.includes("fender") || n.includes("bumper") || n.includes("door") ||
    n.includes("panel") || n.includes("trunk") || n.includes("roof");
}

function isGlassMaterial(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("glass") || n.includes("window") || n.includes("windshield") || n.includes("tint");
}

// ─── Service Icon ────────────────────────────────────────────────────
function ServiceIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("w-5 h-5", className);
  const props = { className: cls, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 };
  switch (type) {
    case "shield": return <svg {...props}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>;
    case "layers": return <svg {...props}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84z" /><path d="m2 12 8.6 3.9a2 2 0 0 0 1.7.1L21 12" /><path d="m2 17 8.6 3.9a2 2 0 0 0 1.7.1L21 17" /></svg>;
    case "sun": return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>;
    case "paintbrush": return <svg {...props}><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" /><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" /><path d="M14.5 17.5 4.5 15" /></svg>;
    case "sparkles": return <svg {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4M19 17v4M3 5h4M17 19h4" /></svg>;
    case "droplets": return <svg {...props}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" /><path d="M12.56 14.69c1.56 0 2.83-1.3 2.83-2.88 0-.82-.4-1.6-1.21-2.26-.78-.63-1.37-1.39-1.62-2.25-.22 1.02-.8 2.01-1.62 2.66-.4.32-.72.7-.93 1.13" /></svg>;
    default: return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SketchfabAPI = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SketchfabMaterial = any;

// ─── Main Component ──────────────────────────────────────────────────
export default function VehicleVisualizer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<SketchfabAPI>(null);
  const materialsRef = useRef<SketchfabMaterial[]>([]);
  const originalMaterialsRef = useRef<SketchfabMaterial[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [tintLevel, setTintLevel] = useState(35);
  const [wrapColor, setWrapColor] = useState("#1a1a1a");
  const [viewerReady, setViewerReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const estimatedTotal = CONFIGURATOR_SERVICES.filter((s) =>
    activeServices.has(s.id)
  ).reduce((sum, s) => sum + s.price, 0);

  const toggleService = useCallback((id: string) => {
    setActiveServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Initialize Sketchfab Viewer API ─────────────────────────────
  useEffect(() => {
    setViewerReady(false);
    setLoading(true);
    apiRef.current = null;
    materialsRef.current = [];
    originalMaterialsRef.current = [];

    // Load Sketchfab Viewer API script
    const scriptId = "sketchfab-viewer-api";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initViewer = () => {
      if (!iframeRef.current || !(window as SketchfabAPI).Sketchfab) return;

      const client = new (window as SketchfabAPI).Sketchfab(iframeRef.current);
      client.init(selectedVehicle.uid, {
        success: (api: SketchfabAPI) => {
          api.start();
          api.addEventListener("viewerready", () => {
            apiRef.current = api;

            // Stop any animations on the model
            api.getAnimations((err: Error, animations: { name: string }[]) => {
              if (!err && animations && animations.length > 0) {
                api.pause();
                api.seekTo(0);
              }
            });

            // Get and store materials for modification
            api.getMaterialList((err: Error, materials: SketchfabMaterial[]) => {
              if (!err && materials) {
                materialsRef.current = materials;
                // Deep clone originals for reset
                originalMaterialsRef.current = JSON.parse(JSON.stringify(materials));
              }
            });

            // Set dark background
            api.setBackground({ color: [0.04, 0.04, 0.04] });

            setViewerReady(true);
            setLoading(false);
          });
        },
        error: () => {
          console.error("Sketchfab viewer failed to load");
          setLoading(false);
        },
        // Hide ALL Sketchfab UI
        autostart: 1,
        autospin: 0,
        annotations_visible: 0,
        ui_animations: 0,
        ui_annotations: 0,
        ui_ar: 0,
        ui_color: "dc2626",
        ui_fadeout: 0,
        ui_fullscreen: 0,
        ui_general_controls: 0,
        ui_help: 0,
        ui_hint: 0,
        ui_infos: 0,
        ui_inspector: 0,
        ui_loading: 0,
        ui_settings: 0,
        ui_stop: 0,
        ui_theatre: 0,
        ui_vr: 0,
        ui_watermark: 0,
        ui_watermark_link: 0,
        transparent: 0,
        camera: 0,
        preload: 1,
        dnt: 1,
      });
    };

    if (script) {
      initViewer();
    } else {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
      script.onload = initViewer;
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.stop();
        apiRef.current = null;
      }
    };
  }, [selectedVehicle.uid]);

  // ─── Apply service effects to materials ──────────────────────────
  useEffect(() => {
    const api = apiRef.current;
    const materials = materialsRef.current;
    const originals = originalMaterialsRef.current;
    if (!api || !materials.length || !originals.length) return;

    materials.forEach((mat: SketchfabMaterial, idx: number) => {
      const original = originals[idx];
      if (!mat || !original) return;

      const name = mat.name || "";
      const isBody = isBodyMaterial(name);
      const isGlass = isGlassMaterial(name);

      // Reset to original values first
      if (mat.channels?.AlbedoPBR?.color) {
        mat.channels.AlbedoPBR.color = [...(original.channels?.AlbedoPBR?.color || [1, 1, 1])];
      }
      if (mat.channels?.RoughnessPBR) {
        mat.channels.RoughnessPBR.factor = original.channels?.RoughnessPBR?.factor ?? 0.5;
      }
      if (mat.channels?.MetalnessPBR) {
        mat.channels.MetalnessPBR.factor = original.channels?.MetalnessPBR?.factor ?? 0;
      }
      if (mat.channels?.Opacity) {
        mat.channels.Opacity.factor = original.channels?.Opacity?.factor ?? 1;
      }

      // Apply service modifications
      if (isBody) {
        // Vehicle Wraps - change body color
        if (activeServices.has("vehicle-wraps") && mat.channels?.AlbedoPBR) {
          mat.channels.AlbedoPBR.color = hexToRgb01(wrapColor);
        }
        // Ceramic Coating - ultra glossy
        if (activeServices.has("ceramic-coating")) {
          if (mat.channels?.RoughnessPBR) mat.channels.RoughnessPBR.factor = 0.03;
          if (mat.channels?.MetalnessPBR) mat.channels.MetalnessPBR.factor = 0.85;
        }
        // Paint Correction - smoother surface
        if (activeServices.has("paint-correction")) {
          if (mat.channels?.RoughnessPBR) {
            mat.channels.RoughnessPBR.factor = Math.min(
              mat.channels.RoughnessPBR.factor,
              0.15
            );
          }
        }
        // Detailing - slight boost
        if (activeServices.has("detailing")) {
          if (mat.channels?.RoughnessPBR) {
            mat.channels.RoughnessPBR.factor = Math.max(
              mat.channels.RoughnessPBR.factor - 0.1,
              0.02
            );
          }
        }
        // PPF - slight clearcoat look (boost metalness slightly)
        if (activeServices.has("ppf")) {
          if (mat.channels?.MetalnessPBR) {
            mat.channels.MetalnessPBR.factor = Math.max(
              mat.channels.MetalnessPBR.factor,
              0.5
            );
          }
        }
      }

      if (isGlass) {
        // Window Tint - darken glass
        if (activeServices.has("window-tint")) {
          const darkness = 1 - (tintLevel / 100);
          if (mat.channels?.Opacity) mat.channels.Opacity.factor = darkness;
          if (mat.channels?.AlbedoPBR?.color) {
            mat.channels.AlbedoPBR.color = [darkness * 0.3, darkness * 0.3, darkness * 0.35];
          }
        }
      }

      api.setMaterial(mat);
    });
  }, [activeServices, wrapColor, tintLevel, viewerReady]);

  return (
    <section id="configurator" className="relative py-20 overflow-hidden">
      {/* BMW M-stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-[#0066B1]" />
        <div className="flex-1 bg-[#1B1464]" />
        <div className="flex-1 bg-rpm-red" />
      </div>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rpm-red/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
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
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-rpm-white tracking-tight">
              Build Your <span className="text-gradient-red">Dream Ride</span>
            </h2>
            <p className="mt-3 text-rpm-silver text-lg max-w-xl mx-auto">
              Rotate, zoom, and customize. Toggle services to see real-time changes on the 3D model.
            </p>
          </motion.div>
        </div>

        {/* Vehicle Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVehicle(v)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border",
                selectedVehicle.id === v.id
                  ? "bg-rpm-red text-white border-rpm-red shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  : "bg-rpm-charcoal text-rpm-silver border-rpm-gray hover:border-rpm-silver/50 hover:text-rpm-white"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* 3D Viewer */}
          <div className="relative rounded-2xl overflow-hidden border border-rpm-gray/50 bg-rpm-dark">
            {/* M-stripe corner */}
            <div className="absolute top-0 left-0 w-24 h-1 flex z-10 rounded-br overflow-hidden">
              <div className="flex-1 bg-[#0066B1]" />
              <div className="flex-1 bg-[#1B1464]" />
              <div className="flex-1 bg-rpm-red" />
            </div>

            {/* Loading overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-rpm-dark"
                >
                  <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderTopColor: "#dc2626" }} />
                      <div className="absolute inset-2 rounded-full border-2 border-rpm-gray animate-spin" style={{ borderBottomColor: "#0066B1", animationDirection: "reverse", animationDuration: "1.5s" }} />
                    </div>
                    <p className="text-rpm-silver text-sm font-medium">Loading 3D Model...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sketchfab iframe — controlled via Viewer API, NOT embed URL params */}
            <div className="aspect-[16/9] w-full">
              <iframe
                ref={iframeRef}
                key={selectedVehicle.uid}
                title={selectedVehicle.label}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; xr-spatial-tracking"
              />
            </div>

            {/* Interaction hint */}
            {viewerReady && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 5, duration: 1.5 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-rpm-dark/80 backdrop-blur border border-rpm-gray/50 text-rpm-silver text-xs"
              >
                Click &amp; drag to rotate &bull; Scroll to zoom
              </motion.div>
            )}

            {/* Active service badges */}
            {activeServices.size > 0 && (
              <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-1.5 max-w-[200px] justify-end">
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

          {/* Service Panel */}
          <div className="rounded-2xl border border-rpm-gray/50 bg-rpm-dark/80 backdrop-blur-xl p-6 flex flex-col">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-rpm-white">Customize Services</h3>
              <p className="text-xs text-rpm-silver mt-1">
                Toggle services to see real-time changes on the model
              </p>
              {!viewerReady && (
                <p className="text-[10px] text-rpm-orange mt-1 animate-pulse">
                  Waiting for 3D model to load...
                </p>
              )}
            </div>

            <div className="flex-1 space-y-1">
              {CONFIGURATOR_SERVICES.map((service) => {
                const isActive = activeServices.has(service.id);
                return (
                  <div key={service.id}>
                    <button
                      onClick={() => toggleService(service.id)}
                      disabled={!viewerReady}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                        isActive
                          ? "bg-rpm-red/10 border border-rpm-red/30"
                          : "hover:bg-rpm-charcoal/50 border border-transparent",
                        !viewerReady && "opacity-50 cursor-not-allowed"
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
                        <div className={cn(
                          "text-sm font-bold transition-colors",
                          isActive ? "text-rpm-red" : "text-rpm-silver"
                        )}>
                          ${service.price}
                        </div>
                        <div className={cn(
                          "w-8 h-4 rounded-full mt-1 ml-auto transition-all duration-300 relative",
                          isActive ? "bg-rpm-red shadow-[0_0_8px_rgba(220,38,38,0.5)]" : "bg-rpm-gray"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                            isActive ? "left-[18px]" : "left-0.5"
                          )} />
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isActive && service.id === "window-tint" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-1">
                            <TintSlider tintLevel={tintLevel} onTintChange={setTintLevel} />
                          </div>
                        </motion.div>
                      )}
                      {isActive && service.id === "vehicle-wraps" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-1">
                            <ColorPicker selectedColor={wrapColor} onColorChange={setWrapColor} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Price Total */}
            <div className="mt-4 pt-4 border-t border-rpm-gray/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rpm-silver">Estimated Total</span>
                <motion.span
                  key={estimatedTotal}
                  initial={{ scale: 1.2, color: "#ef4444" }}
                  animate={{ scale: 1, color: estimatedTotal > 0 ? "#dc2626" : "#8a8a8a" }}
                  className="text-2xl font-black"
                >
                  ${estimatedTotal.toLocaleString()}
                  {estimatedTotal > 0 && <span className="text-sm font-medium">+</span>}
                </motion.span>
              </div>
              <p className="text-[10px] text-rpm-silver/60 mb-4">
                Starting prices shown. Final quote based on vehicle size &amp; condition.
              </p>
              <a
                href="/rpm-auto-lab/contact"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-rpm-red text-white font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:bg-rpm-red-dark"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Get This Package Quoted
              </a>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-rpm-silver/30">
          3D models by their respective artists on Sketchfab (CC-BY)
        </p>
      </div>
    </section>
  );
}
