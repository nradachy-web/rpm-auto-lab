'use client';

import { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CarModel from './CarModel';
import SceneLoader from './SceneLoader';
import ServiceToggle, { type VisualizerService } from './ServiceToggle';
import Link from 'next/link';

// ─── Vehicle Types ─────────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Sedan', model: '/rpm-auto-lab/models/sedan.glb' },
  { id: 'sports', label: 'Sports Car', model: '/rpm-auto-lab/models/sports.glb' },
  { id: 'truck', label: 'Truck', model: '/rpm-auto-lab/models/truck.glb' },
] as const;

// ─── Service Icons (inline SVGs) ───────────────────────────────────────
function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84z" />
      <path d="m2 12 8.6 3.9a2 2 0 0 0 1.7.1L21 12" />
      <path d="m2 17 8.6 3.9a2 2 0 0 0 1.7.1L21 17" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function PaintbrushIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="m14.622 17.897-10.68-2.913" />
      <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" />
      <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" /><path d="M22 5h-4" />
    </svg>
  );
}

function DropletsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 14.1c1.44 0 2.6-1.19 2.6-2.64 0-.76-.37-1.47-1.11-2.08S12.73 7.89 12.56 7.1c-.19.94-.74 1.84-1.49 2.44S10 10.7 10 11.46c0 1.45 1.16 2.64 2.56 2.64z" />
      <path d="M17 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S17.29 6.75 17 5.3c-.29 1.45-1.14 2.84-2.29 3.76S13 11.1 13 12.25c0 2.22 1.8 4.05 4 4.05z" />
    </svg>
  );
}

// ─── Service Configuration ─────────────────────────────────────────────
const SERVICE_DEFS = [
  { id: 'ceramic-coating', name: 'Ceramic Coating', icon: <ShieldIcon />, price: 599 },
  { id: 'paint-protection-film', name: 'Paint Protection Film', icon: <LayersIcon />, price: 799 },
  { id: 'window-tint', name: 'Window Tint', icon: <SunIcon />, price: 249 },
  { id: 'vehicle-wraps', name: 'Vehicle Wraps', icon: <PaintbrushIcon />, price: 2499 },
  { id: 'paint-correction', name: 'Paint Correction', icon: <SparklesIcon />, price: 399 },
  { id: 'detailing', name: 'Detailing', icon: <DropletsIcon />, price: 149 },
];

// ─── 3D Scene ──────────────────────────────────────────────────────────
function Scene({
  modelPath,
  bodyColor,
  tintLevel,
  ceramicCoating,
  ppf,
  paintCorrection,
  detailing,
  wrapEnabled,
  tintEnabled,
}: {
  modelPath: string;
  bodyColor: string;
  tintLevel: number;
  ceramicCoating: boolean;
  ppf: boolean;
  paintCorrection: boolean;
  detailing: boolean;
  wrapEnabled: boolean;
  tintEnabled: boolean;
}) {
  return (
    <>
      {/* Lighting — studio setup */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[-10, 10, -5]}
        angle={0.4}
        penumbra={1}
        intensity={0.8}
        color="#c4d4ff"
      />
      <spotLight
        position={[0, 5, -15]}
        angle={0.5}
        penumbra={1}
        intensity={0.4}
        color="#ffd4c4"
      />

      {/* Environment map for reflections */}
      <Environment preset="city" />

      {/* The car */}
      <Suspense fallback={<SceneLoader />}>
        <CarModel
          modelPath={modelPath}
          bodyColor={bodyColor}
          tintLevel={tintLevel}
          ceramicCoating={ceramicCoating}
          ppf={ppf}
          paintCorrection={paintCorrection}
          detailing={detailing}
          wrapEnabled={wrapEnabled}
          tintEnabled={tintEnabled}
        />
      </Suspense>

      {/* Ground shadows */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.6}
        scale={20}
        blur={2.5}
        far={6}
        color="#000000"
      />

      {/* Ground plane — subtle dark reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.51, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Orbit controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={3}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function VehicleVisualizer() {
  const [vehicleType, setVehicleType] = useState<'sedan' | 'sports' | 'truck'>('sedan');
  const [services, setServices] = useState<Record<string, boolean>>({
    'ceramic-coating': false,
    'paint-protection-film': false,
    'window-tint': false,
    'vehicle-wraps': false,
    'paint-correction': false,
    'detailing': false,
  });
  const [wrapColor, setWrapColor] = useState('#dc2626');
  const [tintLevel, setTintLevel] = useState(20);

  const toggleService = useCallback((id: string) => {
    setServices((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const modelPath = VEHICLE_TYPES.find((v) => v.id === vehicleType)!.model;

  // Calculate estimated total
  const total = SERVICE_DEFS.reduce(
    (sum, s) => sum + (services[s.id] ? s.price : 0),
    0
  );

  // Build VisualizerService array for ServiceToggle
  const serviceList: VisualizerService[] = SERVICE_DEFS.map((s) => ({
    ...s,
    enabled: services[s.id],
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ── Left: 3D Canvas ── */}
      <div className="flex-1 lg:w-[65%] flex flex-col gap-4">
        {/* Vehicle type selector */}
        <div className="flex items-center gap-2">
          {VEHICLE_TYPES.map((v) => (
            <motion.button
              key={v.id}
              onClick={() => setVehicleType(v.id as 'sedan' | 'sports' | 'truck')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer',
                vehicleType === v.id
                  ? 'bg-rpm-red text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                  : 'bg-rpm-charcoal text-rpm-silver border border-rpm-gray/30 hover:border-rpm-silver/40 hover:text-rpm-white'
              )}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {v.label}
            </motion.button>
          ))}
        </div>

        {/* 3D Canvas */}
        <div className="relative w-full h-[500px] sm:h-[550px] lg:h-[600px] rounded-2xl overflow-hidden border border-rpm-gray/20 bg-[#0a0a0a]">
          <Canvas
            shadows
            camera={{ position: [5, 3, 7], fov: 45 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setClearColor('#0a0a0a');
              gl.toneMapping = 1; // ACESFilmicToneMapping
              gl.toneMappingExposure = 1.2;
            }}
          >
            <Scene
              modelPath={modelPath}
              bodyColor={wrapColor}
              tintLevel={tintLevel}
              ceramicCoating={services['ceramic-coating']}
              ppf={services['paint-protection-film']}
              paintCorrection={services['paint-correction']}
              detailing={services['detailing']}
              wrapEnabled={services['vehicle-wraps']}
              tintEnabled={services['window-tint']}
            />
          </Canvas>

          {/* Gradient overlay at bottom for blending */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />

          {/* Active services badges */}
          <AnimatePresence>
            {Object.entries(services).some(([, v]) => v) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-4 flex flex-wrap gap-2"
              >
                {SERVICE_DEFS.filter((s) => services[s.id]).map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-rpm-red/20 text-rpm-red border border-rpm-red/30 backdrop-blur-sm"
                  >
                    {s.name}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right: Service Panel ── */}
      <div className="lg:w-[35%] flex flex-col">
        <div className="rounded-2xl border border-rpm-gray/20 bg-rpm-charcoal/40 backdrop-blur-xl p-5 flex flex-col gap-3 h-full">
          {/* Panel header */}
          <div className="pb-3 border-b border-rpm-gray/20">
            <h3 className="text-lg font-bold text-rpm-white tracking-wide">Customize Services</h3>
            <p className="text-xs text-rpm-silver mt-1">Toggle services to see real-time changes on the 3D model</p>
          </div>

          {/* Service toggles */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 scrollbar-thin">
            {serviceList.map((service) => (
              <ServiceToggle
                key={service.id}
                service={service}
                onToggle={toggleService}
                tintLevel={tintLevel}
                onTintChange={setTintLevel}
                wrapColor={wrapColor}
                onWrapColorChange={setWrapColor}
              />
            ))}
          </div>

          {/* Estimated total */}
          <div className="pt-4 border-t border-rpm-gray/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-rpm-silver uppercase tracking-wider">Estimated Total</span>
              <motion.span
                key={total}
                initial={{ scale: 1.2, color: '#dc2626' }}
                animate={{ scale: 1, color: '#fafafa' }}
                className="text-2xl font-bold text-rpm-white"
              >
                ${total.toLocaleString()}
              </motion.span>
            </div>
            <span className="block text-[10px] text-rpm-silver/50 mb-3 text-center">
              Starting prices shown. Final quote based on vehicle size &amp; condition.
            </span>
            <Link
              href="/contact"
              className="block w-full text-center px-6 py-3.5 rounded-xl bg-rpm-red text-white font-semibold uppercase tracking-wider text-sm transition-all duration-300 hover:bg-rpm-red-dark glow-red-hover cursor-pointer"
            >
              Get This Package Quoted
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
