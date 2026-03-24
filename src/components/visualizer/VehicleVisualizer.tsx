'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ServiceToggle, { type VisualizerService } from './ServiceToggle';
import Link from 'next/link';

// ─── NHTSA Vehicle API ─────────────────────────────────────────────────
interface NHTSAResult {
  MakeId?: number;
  MakeName?: string;
  Make_ID?: number;
  Make_Name?: string;
  Model_ID?: number;
  Model_Name?: string;
}

function useVehicleData() {
  const [years] = useState(() =>
    Array.from({ length: 30 }, (_, i) => 2026 - i)
  );
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!selectedYear) {
      setMakes([]);
      setSelectedMake('');
      setModels([]);
      setSelectedModel('');
      return;
    }
    setLoadingMakes(true);
    setSelectedMake('');
    setModels([]);
    setSelectedModel('');
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`
    )
      .then((r) => r.json())
      .then((data) => {
        const names: string[] = data.Results.map(
          (r: NHTSAResult) => r.MakeName ?? r.Make_Name ?? ''
        )
          .filter(Boolean)
          .sort();
        setMakes([...new Set(names)]);
      })
      .catch(() => setMakes([]))
      .finally(() => setLoadingMakes(false));
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMake) {
      setModels([]);
      setSelectedModel('');
      return;
    }
    setLoadingModels(true);
    setSelectedModel('');
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
        selectedMake
      )}/modelyear/${selectedYear}/vehicletype/car?format=json`
    )
      .then((r) => r.json())
      .then((data) => {
        const names: string[] = data.Results.map(
          (r: NHTSAResult) => r.Model_Name ?? ''
        )
          .filter(Boolean)
          .sort();
        setModels([...new Set(names)]);
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [selectedYear, selectedMake]);

  return {
    years,
    makes,
    models,
    selectedYear,
    selectedMake,
    selectedModel,
    setSelectedYear,
    setSelectedMake,
    setSelectedModel,
    loadingMakes,
    loadingModels,
  };
}

// ─── Service Icons (inline SVGs) ────────────────────────────────────────
const icons = {
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  layers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  sun: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  paintbrush: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  ),
  sparkles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  ),
  droplets: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 14.1c1.44 0 2.6-1.19 2.6-2.64 0-.76-.37-1.47-1.11-2.08-.74-.61-1.25-1.39-1.49-2.38-.24.99-.75 1.77-1.49 2.38-.74.61-1.11 1.32-1.11 2.08 0 1.45 1.16 2.64 2.6 2.64z" />
      <path d="M17 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S17.29 6.75 17 5.3c-.29 1.45-1.14 2.84-2.29 3.76S13 11.1 13 12.25c0 2.22 1.8 4.05 4 4.05z" />
    </svg>
  ),
};

// ─── Initial service state ──────────────────────────────────────────────
const defaultServices: VisualizerService[] = [
  { id: 'ceramic-coating', name: 'Ceramic Coating', icon: icons.shield, price: 599, enabled: false },
  { id: 'paint-protection-film', name: 'Paint Protection Film', icon: icons.layers, price: 799, enabled: false },
  { id: 'window-tint', name: 'Window Tint', icon: icons.sun, price: 249, enabled: false },
  { id: 'vehicle-wraps', name: 'Vehicle Wraps', icon: icons.paintbrush, price: 2499, enabled: false },
  { id: 'paint-correction', name: 'Paint Correction', icon: icons.sparkles, price: 399, enabled: false },
  { id: 'detailing', name: 'Detailing', icon: icons.droplets, price: 149, enabled: false },
];

// ─── Helper: lighten/darken hex color ─────────────────────────────────
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ─── Premium Car SVG ─────────────────────────────────────────────────
function CarSilhouette({
  bodyColor,
  windowOpacity,
  ceramicEnabled,
  ppfEnabled,
  paintCorrectionEnabled,
  detailingEnabled,
}: {
  bodyColor: string;
  windowOpacity: number;
  ceramicEnabled: boolean;
  ppfEnabled: boolean;
  paintCorrectionEnabled: boolean;
  detailingEnabled: boolean;
}) {
  const colorLight = adjustColor(bodyColor, 50);
  const colorDark = adjustColor(bodyColor, -40);
  const colorDarker = adjustColor(bodyColor, -70);
  const colorHighlight = adjustColor(bodyColor, 90);

  // Wheel spoke generation
  const renderSpokes = (cx: number, cy: number, prefix: string) => {
    const spokes = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const angle2 = ((i * 72 + 36) - 90) * (Math.PI / 180);
      const outerR = 30;
      const innerR = 11;
      const midR = 22;
      // Main spoke
      const ox = cx + Math.cos(angle) * outerR;
      const oy = cy + Math.sin(angle) * outerR;
      const ix = cx + Math.cos(angle) * innerR;
      const iy = cy + Math.sin(angle) * innerR;
      // Spoke sides
      const sideAngle1 = angle - 0.15;
      const sideAngle2 = angle + 0.15;
      const so1x = cx + Math.cos(sideAngle1) * outerR;
      const so1y = cy + Math.sin(sideAngle1) * outerR;
      const so2x = cx + Math.cos(sideAngle2) * outerR;
      const so2y = cy + Math.sin(sideAngle2) * outerR;
      const si1x = cx + Math.cos(sideAngle1) * innerR;
      const si1y = cy + Math.sin(sideAngle1) * innerR;
      const si2x = cx + Math.cos(sideAngle2) * innerR;
      const si2y = cy + Math.sin(sideAngle2) * innerR;
      spokes.push(
        <path
          key={`${prefix}-spoke-${i}`}
          d={`M ${si1x},${si1y} L ${so1x},${so1y} L ${so2x},${so2y} L ${si2x},${si2y} Z`}
          fill="#555"
          stroke="#666"
          strokeWidth="0.5"
        />
      );
      // Secondary thin spoke
      const mx = cx + Math.cos(angle2) * midR;
      const my = cy + Math.sin(angle2) * midR;
      const mix = cx + Math.cos(angle2) * innerR;
      const miy = cy + Math.sin(angle2) * innerR;
      spokes.push(
        <line
          key={`${prefix}-thin-${i}`}
          x1={mix} y1={miy} x2={mx} y2={my}
          stroke="#444"
          strokeWidth="1.5"
        />
      );
    }
    return spokes;
  };

  // Render a full wheel
  const renderWheel = (cx: number, cy: number, prefix: string) => (
    <g id={`${prefix}-wheel`}>
      {/* Wheel shadow */}
      <ellipse cx={cx} cy={cy + 38} rx={38} ry={6} fill="rgba(0,0,0,0.5)" />
      {/* Tire outer */}
      <circle cx={cx} cy={cy} r={42} fill="#111" />
      {/* Tire tread */}
      <circle cx={cx} cy={cy} r={42} fill="none" stroke="#1a1a1a" strokeWidth="2" />
      {/* Tire sidewall highlight */}
      <path
        d={`M ${cx - 40},${cy - 12} A 42,42 0 0,1 ${cx - 12},${cy - 40}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"
      />
      {/* Tire inner edge */}
      <circle cx={cx} cy={cy} r={35} fill="#0d0d0d" />
      {/* Rim outer ring */}
      <circle cx={cx} cy={cy} r={33} fill="url(#rimOuter)" stroke="#555" strokeWidth="0.5" />
      {/* Brake disc */}
      <circle cx={cx} cy={cy} r={22} fill="url(#brakeDisc)" />
      {/* Brake disc slots */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={`${prefix}-slot-${a}`}
            x1={cx + Math.cos(rad) * 12}
            y1={cy + Math.sin(rad) * 12}
            x2={cx + Math.cos(rad) * 20}
            y2={cy + Math.sin(rad) * 20}
            stroke="rgba(80,80,80,0.4)"
            strokeWidth="0.8"
          />
        );
      })}
      {/* Brake caliper */}
      <rect
        x={cx - 14} y={cy + 6} width={16} height={10} rx={2}
        fill="#cc0000" stroke="#990000" strokeWidth="0.5"
      />
      <text x={cx - 6} y={cy + 14} fontSize="5" fill="#ffcccc" fontWeight="bold" fontFamily="Arial">RPM</text>
      {/* Spokes */}
      {renderSpokes(cx, cy, prefix)}
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={8} fill="#333" stroke="#555" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={4} fill="#444" />
      <circle cx={cx} cy={cy} r={2} fill="#555" />
      {/* Rim lip shine */}
      <path
        d={`M ${cx - 32},${cy - 8} A 33,33 0 0,1 ${cx + 10},${cy - 32}`}
        fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"
      />
    </g>
  );

  return (
    <div className="relative w-full max-w-[900px] mx-auto">
      {/* Detailing glow aura */}
      <AnimatePresence>
        {detailingEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -inset-12 pointer-events-none"
          >
            <div
              className="w-full h-full rounded-[50%] blur-3xl"
              style={{
                background: `radial-gradient(ellipse at center, ${bodyColor}33 0%, transparent 70%)`,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-[50%] blur-[60px]"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 60%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 1200 500"
        className="w-full h-auto relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── Body Paint Gradient ── */}
          <linearGradient id="bodyPaint" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorLight} />
            <stop offset="35%" stopColor={bodyColor} />
            <stop offset="65%" stopColor={bodyColor} />
            <stop offset="100%" stopColor={colorDark} />
          </linearGradient>

          {/* ── Roof gradient (slightly lighter) ── */}
          <linearGradient id="roofPaint" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorHighlight} />
            <stop offset="40%" stopColor={colorLight} />
            <stop offset="100%" stopColor={bodyColor} />
          </linearGradient>

          {/* ── Specular highlight strip ── */}
          <linearGradient id="specularStrip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* ── Body reflection overlay ── */}
          <linearGradient id="bodyReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.25)" />
          </linearGradient>

          {/* ── Lower body shadow gradient ── */}
          <linearGradient id="lowerBodyShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bodyColor} />
            <stop offset="100%" stopColor={colorDarker} />
          </linearGradient>

          {/* ── Window gradients ── */}
          <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#2a3040" />
            <stop offset="50%" stopColor="#181c28" />
            <stop offset="100%" stopColor="#0e1018" />
          </linearGradient>

          <linearGradient id="windshieldGrad" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#3a4050" />
            <stop offset="40%" stopColor="#1e2230" />
            <stop offset="100%" stopColor="#10121a" />
          </linearGradient>

          {/* ── Window tint overlay ── */}
          <linearGradient id="windowTint" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>

          {/* ── Rim gradients ── */}
          <radialGradient id="rimOuter" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#6a6a6a" />
            <stop offset="40%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>

          <radialGradient id="brakeDisc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="60%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </radialGradient>

          {/* ── Headlight gradient ── */}
          <linearGradient id="headlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f4ff" />
            <stop offset="50%" stopColor="#d8e0f0" />
            <stop offset="100%" stopColor="#c0c8e0" />
          </linearGradient>

          {/* ── Taillight gradient ── */}
          <linearGradient id="taillightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff2020" />
            <stop offset="50%" stopColor="#cc0000" />
            <stop offset="100%" stopColor="#880000" />
          </linearGradient>

          {/* ── Headlight glow filter ── */}
          <filter id="headlightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* ── Taillight glow filter ── */}
          <filter id="taillightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* ── DRL glow ── */}
          <filter id="drlGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* ── Ground shadow ── */}
          <radialGradient id="groundShadow" cx="50%" cy="50%" rx="50%" ry="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* ── Reflective floor gradient ── */}
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* ── Ceramic coating shimmer ── */}
          <linearGradient id="ceramicShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="48%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="52%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            {ceramicEnabled && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-1.5 0;2.5 0"
                dur="2.8s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>

          {/* ── PPF protection pattern ── */}
          <pattern id="ppfDots" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="5" cy="5" r="0.6" fill="rgba(100,200,255,0.25)" />
          </pattern>

          {/* ── Car shadow filter ── */}
          <filter id="carShadow" x="-5%" y="-5%" width="110%" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dy="8" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Clip path for car reflection ── */}
          <clipPath id="reflectionClip">
            <rect x="100" y="395" width="1000" height="100" />
          </clipPath>
        </defs>

        {/* ═══════════════════════════════════════════════════════════════
            GROUND / ENVIRONMENT
        ═══════════════════════════════════════════════════════════════ */}

        {/* Reflective floor surface */}
        <rect x="50" y="388" width="1100" height="110" fill="url(#floorGrad)" />
        <line x1="100" y1="390" x2="1100" y2="390" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* Ground shadow */}
        <ellipse cx="600" cy="392" rx="420" ry="22" fill="url(#groundShadow)" />

        {/* ═══════════════════════════════════════════════════════════════
            MAIN CAR BODY
        ═══════════════════════════════════════════════════════════════ */}
        <g id="car-body" filter="url(#carShadow)">

          {/* ── Lower Body / Rocker Panel / Sills ── */}
          <motion.path
            id="lower-body"
            d={`
              M 180,350
              C 180,350 170,348 165,340
              L 150,320
              C 145,310 148,298 155,292
              L 200,280
              L 310,272
              C 320,271 325,275 325,275
              L 325,290
              C 325,296 330,300 336,300
              L 420,300
              C 426,300 430,296 430,290
              L 430,272
              L 510,268
              L 700,268
              L 770,272
              L 770,290
              C 770,296 774,300 780,300
              L 864,300
              C 870,300 875,296 875,290
              L 875,275
              C 875,275 880,271 890,272
              L 1000,280
              L 1045,292
              C 1052,298 1055,310 1050,320
              L 1035,340
              C 1030,348 1020,350 1020,350
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* ── Main Body Side Panel ── */}
          <motion.path
            id="body-side"
            d={`
              M 155,292
              L 130,270
              C 122,260 120,250 122,240
              L 130,220
              C 135,208 145,200 160,196
              L 260,178
              L 360,170
              L 440,168
              L 560,166
              L 720,168
              L 840,172
              L 940,180
              L 1020,192
              C 1040,196 1055,208 1060,220
              L 1078,250
              C 1082,260 1080,270 1072,280
              L 1045,292
              L 1000,280
              L 890,272
              L 770,272
              L 510,268
              L 430,272
              L 310,272
              L 200,280
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* Body paint gradient overlay */}
          <path
            id="body-gradient"
            d={`
              M 155,292
              L 130,270
              C 122,260 120,250 122,240
              L 130,220
              C 135,208 145,200 160,196
              L 260,178
              L 360,170
              L 440,168
              L 560,166
              L 720,168
              L 840,172
              L 940,180
              L 1020,192
              C 1040,196 1055,208 1060,220
              L 1078,250
              C 1082,260 1080,270 1072,280
              L 1045,292
              L 1000,280
              L 890,272
              L 770,272
              L 510,268
              L 430,272
              L 310,272
              L 200,280
              Z
            `}
            fill="url(#bodyReflection)"
          />

          {/* ── Character Line / Shoulder Line ── */}
          <path
            id="shoulder-line"
            d={`
              M 175,218
              C 200,212 350,198 500,194
              C 650,190 850,194 950,200
              C 1000,204 1040,210 1058,218
            `}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
          />

          {/* Specular highlight strip along shoulder */}
          <path
            id="specular"
            d={`
              M 175,204
              C 200,198 350,186 500,182
              C 650,178 850,182 950,188
              L 1050,196
              L 1058,218
              C 1000,210 850,198 700,196
              C 550,194 300,200 175,214
              Z
            `}
            fill="url(#specularStrip)"
          />

          {/* ── Hood Panel ── */}
          <motion.path
            id="hood"
            d={`
              M 780,172
              L 840,172
              L 940,180
              L 1020,192
              C 1040,196 1055,208 1060,220
              L 1065,232
              L 780,204
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
            opacity={0.97}
          />

          {/* Hood highlight */}
          <path
            d={`
              M 800,174
              L 900,180
              L 1000,190
              L 1040,202
              L 1050,216
              L 820,196
              Z
            `}
            fill="rgba(255,255,255,0.04)"
          />

          {/* ── Roof / Greenhouse ── */}
          <motion.path
            id="roof"
            d={`
              M 410,168
              L 440,108
              C 448,90 460,80 480,76
              L 560,68
              L 640,66
              L 720,68
              L 780,74
              C 800,78 810,88 816,100
              L 850,160
              C 854,168 850,172 842,172
              L 720,168
              L 560,166
              L 440,168
              L 414,170
              C 408,170 406,172 410,168
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* Roof gradient overlay */}
          <path
            d={`
              M 410,168
              L 440,108
              C 448,90 460,80 480,76
              L 560,68
              L 640,66
              L 720,68
              L 780,74
              C 800,78 810,88 816,100
              L 850,160
              C 854,168 850,172 842,172
              L 720,168
              L 560,166
              L 440,168
              L 414,170
              C 408,170 406,172 410,168
              Z
            `}
            fill="url(#bodyReflection)"
            opacity="0.6"
          />

          {/* ── Trunk Panel ── */}
          <motion.path
            id="trunk"
            d={`
              M 260,178
              L 360,170
              L 410,168
              L 420,192
              L 260,200
              L 200,208
              L 160,196
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
            opacity={0.95}
          />

          {/* ── Rear lip spoiler ── */}
          <motion.path
            id="rear-spoiler"
            d={`
              M 240,174
              L 260,178
              L 410,168
              L 414,166
              L 258,176
              L 236,172
              Z
            `}
            animate={{ fill: colorDark }}
            transition={{ duration: 0.5 }}
          />

          {/* ── Front lip spoiler ── */}
          <motion.path
            id="front-lip"
            d={`
              M 1040,288
              L 1078,262
              C 1085,256 1092,258 1088,266
              L 1060,292
              L 1045,296
              Z
            `}
            animate={{ fill: colorDarker }}
            transition={{ duration: 0.5 }}
          />

          {/* ── Side Skirt ── */}
          <motion.path
            id="side-skirt"
            d={`
              M 200,280
              L 310,272
              L 430,272
              L 510,268
              L 700,268
              L 770,272
              L 890,272
              L 1000,280
              L 1000,286
              L 890,278
              L 770,278
              L 700,274
              L 510,274
              L 430,278
              L 310,278
              L 200,286
              Z
            `}
            animate={{ fill: colorDarker }}
            transition={{ duration: 0.5 }}
          />

          {/* ── WINDOWS ── */}

          {/* Rear windshield */}
          <motion.path
            id="rear-window"
            d={`
              M 440,110
              L 416,164
              C 414,168 418,170 422,168
              L 490,166
              L 490,112
              C 490,102 478,98 470,100
              Z
            `}
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          {/* Rear side window */}
          <motion.path
            id="rear-side-window"
            d={`
              M 496,100
              L 570,72
              L 570,162
              L 496,164
              Z
            `}
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          {/* Front side window */}
          <motion.path
            id="front-side-window"
            d={`
              M 580,70
              L 700,68
              L 760,76
              C 774,80 780,86 784,94
              L 800,140
              L 800,162
              L 580,162
              Z
            `}
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          {/* Front windshield */}
          <motion.path
            id="windshield"
            d={`
              M 808,90
              C 812,84 818,82 826,82
              L 840,130
              L 848,158
              C 850,164 846,168 840,168
              L 808,166
              L 808,96
              Z
            `}
            fill="url(#windshieldGrad)"
            animate={{ opacity: Math.min(windowOpacity + 0.1, 1) }}
            transition={{ duration: 0.4 }}
          />

          {/* Windshield reflection streak */}
          <path
            d={`
              M 822,88
              L 836,136
              L 840,154
              L 834,152
              L 820,104
              Z
            `}
            fill="rgba(255,255,255,0.08)"
          />

          {/* ── Window tint overlays ── */}
          <motion.path
            d={`M 440,110 L 416,164 C 414,168 418,170 422,168 L 490,166 L 490,112 C 490,102 478,98 470,100 Z`}
            fill="black"
            animate={{ opacity: isFinite(windowOpacity) ? Math.max(0, 0.85 - windowOpacity) : 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.path
            d={`M 496,100 L 570,72 L 570,162 L 496,164 Z`}
            fill="black"
            animate={{ opacity: isFinite(windowOpacity) ? Math.max(0, 0.85 - windowOpacity) : 0 }}
            transition={{ duration: 0.4 }}
          />
          <motion.path
            d={`M 580,70 L 700,68 L 760,76 C 774,80 780,86 784,94 L 800,140 L 800,162 L 580,162 Z`}
            fill="black"
            animate={{ opacity: isFinite(windowOpacity) ? Math.max(0, 0.85 - windowOpacity) : 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* ── Pillars ── */}
          {/* A-pillar */}
          <motion.path
            d={`
              M 808,90 L 816,100 L 850,160 L 854,168
              L 842,172 L 838,168 L 800,166 L 808,96 Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* B-pillar */}
          <motion.rect
            x={572} y={70} width={8} height={96} rx={2}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* C-pillar */}
          <motion.path
            d={`
              M 488,100 L 496,100 L 496,166 L 488,166
              L 488,112 Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* Window chrome trim (top) */}
          <path
            d={`
              M 420,168
              L 440,108
              C 448,90 460,80 480,76
              L 560,68
              L 640,66
              L 720,68
              L 780,74
              C 800,78 810,88 816,100
              L 850,160
            `}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"
          />

          {/* ── Door Lines ── */}
          {/* Front door line */}
          <line x1="700" y1="168" x2="700" y2="272" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
          <line x1="701" y1="168" x2="701" y2="272" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

          {/* Rear door line */}
          <line x1="510" y1="166" x2="510" y2="268" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" />
          <line x1="511" y1="166" x2="511" y2="268" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

          {/* ── Door Handles ── */}
          <rect x="620" y="220" width="30" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
          <rect x="620" y="221" width="20" height="2" rx="1" fill="rgba(255,255,255,0.06)" />

          <rect x="455" y="222" width="30" height="5" rx="2.5" fill="rgba(255,255,255,0.1)" />
          <rect x="455" y="223" width="20" height="2" rx="1" fill="rgba(255,255,255,0.06)" />

          {/* ── Side Mirror ── */}
          <motion.path
            id="side-mirror"
            d={`
              M 848,170
              L 870,160
              L 878,164
              L 880,176
              L 870,180
              L 854,178
              Z
            `}
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />
          <path
            d="M 870,162 L 876,166 L 878,174 L 870,178 Z"
            fill="rgba(40,50,60,0.8)"
          />

          {/* ── HEADLIGHTS ── */}
          <g id="headlights" filter="url(#headlightGlow)">
            {/* Headlight housing */}
            <path
              d={`
                M 1040,200
                L 1072,198
                C 1082,198 1088,204 1088,210
                L 1088,240
                C 1088,248 1082,254 1072,254
                L 1040,252
                Z
              `}
              fill="#1a1a1a"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            {/* Headlight lens */}
            <path
              d={`
                M 1044,204
                L 1068,202
                C 1076,202 1082,207 1082,213
                L 1082,238
                C 1082,246 1076,250 1068,250
                L 1044,248
                Z
              `}
              fill="url(#headlightGrad)"
              opacity="0.9"
            />
            {/* LED DRL strip */}
            <path
              d="M 1046,208 L 1078,206"
              stroke="rgba(200,220,255,0.9)"
              strokeWidth="2"
              filter="url(#drlGlow)"
            />
            {/* Inner LED elements */}
            <rect x="1050" y="218" width="24" height="3" rx="1.5" fill="rgba(220,230,255,0.6)" />
            <rect x="1050" y="226" width="24" height="3" rx="1.5" fill="rgba(220,230,255,0.4)" />
            <rect x="1050" y="234" width="24" height="3" rx="1.5" fill="rgba(220,230,255,0.25)" />
          </g>

          {/* ── TAILLIGHTS ── */}
          <g id="taillights" filter="url(#taillightGlow)">
            {/* Taillight housing */}
            <path
              d={`
                M 160,200
                L 128,202
                C 118,204 114,210 114,218
                L 114,240
                C 114,250 120,256 130,256
                L 160,254
                Z
              `}
              fill="#1a0000"
              stroke="rgba(255,0,0,0.15)"
              strokeWidth="0.5"
            />
            {/* Taillight lens */}
            <path
              d={`
                M 156,204
                L 132,206
                C 122,208 118,214 118,222
                L 118,238
                C 118,246 122,250 132,250
                L 156,248
                Z
              `}
              fill="url(#taillightGrad)"
              opacity="0.85"
            />
            {/* LED strip effect */}
            <path d="M 154,210 L 124,212" stroke="#ff3030" strokeWidth="2.5" opacity="0.9" />
            <path d="M 154,222 L 122,224" stroke="#ff2020" strokeWidth="2" opacity="0.7" />
            <path d="M 154,234 L 122,236" stroke="#ff1010" strokeWidth="2" opacity="0.5" />
            {/* Connecting LED bar */}
            <path
              d="M 156,208 L 156,248"
              stroke="#ff2020"
              strokeWidth="3"
              opacity="0.8"
            />
          </g>

          {/* ── Front grille / intake ── */}
          <path
            d={`
              M 1058,230
              L 1080,226
              C 1086,226 1090,230 1090,236
              L 1090,260
              C 1090,268 1084,274 1076,274
              L 1050,276
              L 1044,260
              Z
            `}
            fill="#0a0a0a"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          {/* Grille mesh lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`grille-${i}`}
              x1={1052 + i * 2} y1={236 + i * 4}
              x2={1086 - i * 1} y2={234 + i * 4}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          ))}

          {/* ── Rear bumper / exhaust area ── */}
          <rect x="130" y="260" width="26" height="10" rx="3" fill="#111" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          {/* Exhaust tips */}
          <ellipse cx="140" cy="278" rx="8" ry="5" fill="#222" stroke="#444" strokeWidth="1" />
          <ellipse cx="140" cy="278" rx="5" ry="3" fill="#111" />
          <ellipse cx="158" cy="278" rx="8" ry="5" fill="#222" stroke="#444" strokeWidth="1" />
          <ellipse cx="158" cy="278" rx="5" ry="3" fill="#111" />

          {/* ── Fuel door ── */}
          <path
            d="M 340,196 L 356,194 L 358,206 L 342,208 Z"
            fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8"
          />
        </g>

        {/* ═══════════════════════════════════════════════════════════════
            WHEELS
        ═══════════════════════════════════════════════════════════════ */}
        {renderWheel(380, 308, 'rear')}
        {renderWheel(870, 308, 'front')}

        {/* ═══════════════════════════════════════════════════════════════
            SERVICE EFFECT OVERLAYS
        ═══════════════════════════════════════════════════════════════ */}

        {/* ── Ceramic Coating Shimmer ── */}
        <AnimatePresence>
          {ceramicEnabled && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Body shimmer */}
              <path
                d={`
                  M 155,292 L 130,270 C 122,260 120,250 122,240 L 130,220
                  C 135,208 145,200 160,196 L 260,178 L 360,170 L 440,168
                  L 560,166 L 720,168 L 840,172 L 940,180 L 1020,192
                  C 1040,196 1055,208 1060,220 L 1078,250
                  C 1082,260 1080,270 1072,280 L 1045,292
                  L 1000,280 L 890,272 L 770,272 L 510,268 L 430,272
                  L 310,272 L 200,280 Z
                `}
                fill="url(#ceramicShine)"
              />
              {/* Roof shimmer */}
              <path
                d={`
                  M 410,168 L 440,108 C 448,90 460,80 480,76
                  L 560,68 L 640,66 L 720,68 L 780,74
                  C 800,78 810,88 816,100 L 850,160
                  C 854,168 850,172 842,172 L 720,168
                  L 560,166 L 440,168 Z
                `}
                fill="url(#ceramicShine)"
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── PPF Protection Layer ── */}
        <AnimatePresence>
          {ppfEnabled && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Hood PPF zone */}
              <path
                d={`
                  M 780,172 L 840,172 L 940,180 L 1020,192
                  C 1040,196 1055,208 1060,220 L 1065,232
                  L 780,204 Z
                `}
                fill="url(#ppfDots)" opacity="0.6"
              />
              <path
                d={`
                  M 780,172 L 840,172 L 940,180 L 1020,192
                  C 1040,196 1055,208 1060,220 L 1065,232
                  L 780,204 Z
                `}
                fill="none" stroke="rgba(100,200,255,0.35)" strokeWidth="1.5" strokeDasharray="8 4"
              />

              {/* Front bumper PPF zone */}
              <path
                d={`
                  M 1040,200 L 1078,250 C 1082,260 1080,270 1072,280
                  L 1045,292 L 1000,280 L 890,272 L 875,275
                  L 875,260 L 1020,252 L 1040,240 Z
                `}
                fill="none" stroke="rgba(100,200,255,0.3)" strokeWidth="1.2" strokeDasharray="6 4"
              />
              <path
                d={`
                  M 1040,200 L 1078,250 C 1082,260 1080,270 1072,280
                  L 1045,292 L 1000,280 L 890,272 L 875,275
                  L 875,260 L 1020,252 L 1040,240 Z
                `}
                fill="url(#ppfDots)" opacity="0.4"
              />

              {/* Front fender PPF zone */}
              <path
                d={`
                  M 840,172 L 940,180 L 1000,190 L 1000,260
                  L 890,272 L 840,260 L 840,172 Z
                `}
                fill="none" stroke="rgba(100,200,255,0.25)" strokeWidth="1" strokeDasharray="5 4"
              />

              {/* Mirror PPF */}
              <path
                d="M 848,170 L 870,160 L 878,164 L 880,176 L 870,180 L 854,178 Z"
                fill="none" stroke="rgba(100,200,255,0.5)" strokeWidth="1.5" strokeDasharray="3 2"
              />

              {/* PPF labels */}
              <text x="940" y="210" fontSize="10" fill="rgba(100,200,255,0.5)" fontFamily="monospace" textAnchor="middle">PPF</text>
              <text x="980" y="268" fontSize="8" fill="rgba(100,200,255,0.4)" fontFamily="monospace" textAnchor="middle">PROTECTED</text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Paint Correction Sparkles ── */}
        <AnimatePresence>
          {paintCorrectionEnabled && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[
                { x: 300, y: 200, delay: 0 },
                { x: 500, y: 140, delay: 0.4 },
                { x: 700, y: 190, delay: 0.8 },
                { x: 900, y: 210, delay: 1.2 },
                { x: 450, y: 110, delay: 0.2 },
                { x: 600, y: 170, delay: 1.0 },
                { x: 800, y: 160, delay: 0.6 },
                { x: 350, y: 230, delay: 1.4 },
                { x: 650, y: 100, delay: 0.3 },
                { x: 950, y: 230, delay: 1.6 },
                { x: 550, y: 220, delay: 0.9 },
                { x: 750, y: 120, delay: 1.1 },
              ].map((spark, i) => (
                <motion.g
                  key={i}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.3, 1.2, 0.3],
                  }}
                  transition={{
                    duration: 1.8,
                    delay: spark.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ originX: `${spark.x}px`, originY: `${spark.y}px` }}
                >
                  <path
                    d={`M ${spark.x},${spark.y - 7} L ${spark.x + 2},${spark.y - 2} L ${spark.x + 7},${spark.y} L ${spark.x + 2},${spark.y + 2} L ${spark.x},${spark.y + 7} L ${spark.x - 2},${spark.y + 2} L ${spark.x - 7},${spark.y} L ${spark.x - 2},${spark.y - 2} Z`}
                    fill="white"
                    opacity="0.85"
                  />
                  {/* Secondary small sparkle */}
                  <circle cx={spark.x + 10} cy={spark.y - 5} r="1.5" fill="white" opacity="0.5" />
                </motion.g>
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════
            CAR REFLECTION (flipped, faded)
        ═══════════════════════════════════════════════════════════════ */}
        <g clipPath="url(#reflectionClip)" opacity="0.08">
          <g transform="translate(0, 780) scale(1, -1)">
            {/* Simplified reflection of the body */}
            <path
              d={`
                M 155,292 L 130,270 C 122,260 120,250 122,240 L 130,220
                C 135,208 145,200 160,196 L 260,178 L 360,170 L 440,168
                L 560,166 L 720,168 L 840,172 L 940,180 L 1020,192
                C 1040,196 1055,208 1060,220 L 1078,250
                C 1082,260 1080,270 1072,280 L 1045,292
                L 1000,280 L 890,272 L 770,272 L 510,268 L 430,272
                L 310,272 L 200,280 Z
              `}
              fill={bodyColor}
            />
            <path
              d={`
                M 180,350 C 180,350 170,348 165,340 L 150,320
                C 145,310 148,298 155,292 L 200,280 L 310,272
                C 320,271 325,275 325,275 L 325,290 C 325,296 330,300 336,300
                L 420,300 C 426,300 430,296 430,290 L 430,272 L 510,268
                L 700,268 L 770,272 L 770,290 C 770,296 774,300 780,300
                L 864,300 C 870,300 875,296 875,290 L 875,275
                C 875,275 880,271 890,272 L 1000,280 L 1045,292
                C 1052,298 1055,310 1050,320 L 1035,340
                C 1030,348 1020,350 1020,350 Z
              `}
              fill={bodyColor}
            />
            {/* Reflection roof */}
            <path
              d={`
                M 410,168 L 440,108 C 448,90 460,80 480,76
                L 560,68 L 640,66 L 720,68 L 780,74
                C 800,78 810,88 816,100 L 850,160
                C 854,168 850,172 842,172 L 720,168
                L 560,166 L 440,168 Z
              `}
              fill={bodyColor}
            />
          </g>
        </g>

        {/* Ground reflection line */}
        <line x1="180" y1="392" x2="1020" y2="392" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

// ─── Dropdown component ──────────────────────────────────────────────────
function Dropdown({
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | number)[];
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] uppercase tracking-widest text-rpm-silver mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className={cn(
            'w-full bg-rpm-charcoal border border-rpm-gray/40 rounded-lg px-3 py-2.5 text-sm text-rpm-white appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:border-rpm-red/50 focus:ring-1 focus:ring-rpm-red/20',
            (disabled || loading) && 'opacity-40 cursor-not-allowed'
          )}
        >
          <option value="">
            {loading ? 'Loading...' : `Select ${label}`}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-rpm-silver">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main Visualizer ─────────────────────────────────────────────────────
export default function VehicleVisualizer() {
  const vehicle = useVehicleData();
  const [services, setServices] = useState<VisualizerService[]>(defaultServices);
  const [tintLevel, setTintLevel] = useState(35);
  const [wrapColor, setWrapColor] = useState('#1a1a1a');
  const [showInstructions, setShowInstructions] = useState(true);

  const toggleService = useCallback((id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const isEnabled = useCallback(
    (id: string) => services.find((s) => s.id === id)?.enabled ?? false,
    [services]
  );

  // Calculate body color
  const bodyColor = isEnabled('vehicle-wraps') ? wrapColor : '#2a2a2a';

  // Calculate window opacity (1 = clear, lower = darker)
  const windowOpacity = isEnabled('window-tint')
    ? Math.max(0.08, 1 - tintLevel / 75)
    : 0.85;

  // Running total
  const total = useMemo(
    () => services.filter((s) => s.enabled).reduce((sum, s) => sum + s.price, 0),
    [services]
  );

  const enabledServiceIds = useMemo(
    () => services.filter((s) => s.enabled).map((s) => s.id),
    [services]
  );

  // Build quote URL
  const quoteUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (enabledServiceIds.length > 0) {
      params.set('services', enabledServiceIds.join(','));
    }
    if (vehicle.selectedYear && vehicle.selectedMake && vehicle.selectedModel) {
      params.set(
        'vehicle',
        `${vehicle.selectedYear} ${vehicle.selectedMake} ${vehicle.selectedModel}`
      );
    }
    const qs = params.toString();
    return qs ? `/contact?${qs}` : '/contact';
  }, [enabledServiceIds, vehicle.selectedYear, vehicle.selectedMake, vehicle.selectedModel]);

  // Auto-dismiss instructions
  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      {/* Instructions tooltip */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rpm-charcoal/80 border border-rpm-gray/30 text-sm text-rpm-silver backdrop-blur-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rpm-red">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Select your vehicle, toggle services, and customize to see the transformation
              <button
                onClick={() => setShowInstructions(false)}
                className="ml-1 text-rpm-silver/50 hover:text-rpm-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicle selection bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-8 p-4 rounded-2xl bg-rpm-dark/80 border border-rpm-gray/20 backdrop-blur-sm"
      >
        <Dropdown
          label="Year"
          value={vehicle.selectedYear}
          onChange={vehicle.setSelectedYear}
          options={vehicle.years}
        />
        <Dropdown
          label="Make"
          value={vehicle.selectedMake}
          onChange={vehicle.setSelectedMake}
          options={vehicle.makes}
          loading={vehicle.loadingMakes}
          disabled={!vehicle.selectedYear}
        />
        <Dropdown
          label="Model"
          value={vehicle.selectedModel}
          onChange={vehicle.setSelectedModel}
          options={vehicle.models}
          loading={vehicle.loadingModels}
          disabled={!vehicle.selectedMake}
        />
        {vehicle.selectedYear && vehicle.selectedMake && vehicle.selectedModel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-end"
          >
            <div className="px-4 py-2.5 rounded-lg bg-rpm-red/10 border border-rpm-red/20 text-sm text-rpm-white font-medium whitespace-nowrap">
              {vehicle.selectedYear} {vehicle.selectedMake} {vehicle.selectedModel}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main area: car + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Car display area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 min-w-0"
        >
          <div className="relative rounded-2xl bg-gradient-to-b from-rpm-dark/60 via-rpm-black to-rpm-dark/40 border border-rpm-gray/15 p-4 sm:p-8 overflow-hidden">
            {/* Ambient background based on body color */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 60% 50%, ${bodyColor} 0%, transparent 70%)`,
              }}
            />

            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.015]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />

            <div className="relative z-10 flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
              <CarSilhouette
                bodyColor={bodyColor}
                windowOpacity={windowOpacity}
                ceramicEnabled={isEnabled('ceramic-coating')}
                ppfEnabled={isEnabled('paint-protection-film')}
                paintCorrectionEnabled={isEnabled('paint-correction')}
                detailingEnabled={isEnabled('detailing')}
              />
            </div>

            {/* Active effects badges */}
            <div className="relative z-10 flex flex-wrap gap-2 justify-center mt-4">
              {services
                .filter((s) => s.enabled)
                .map((s) => (
                  <motion.span
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rpm-red/10 border border-rpm-red/25 text-[11px] text-rpm-red font-medium"
                  >
                    {s.icon}
                    {s.name}
                  </motion.span>
                ))}
            </div>
          </div>
        </motion.div>

        {/* Service toggles sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-[360px] flex-shrink-0"
        >
          <div className="rounded-2xl bg-rpm-dark/80 border border-rpm-gray/20 backdrop-blur-sm p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-rpm-white">
                Services
              </h3>
              <span className="text-[10px] text-rpm-silver uppercase tracking-wider">
                Toggle to preview
              </span>
            </div>

            {services.map((service) => (
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

            {/* Running total */}
            <div className="pt-3 mt-3 border-t border-rpm-gray/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-rpm-silver">Estimated Total</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.2, color: '#dc2626' }}
                  animate={{ scale: 1, color: '#fafafa' }}
                  className="text-2xl font-bold text-rpm-white"
                >
                  ${total.toLocaleString()}
                  <span className="text-xs text-rpm-silver font-normal ml-1">+</span>
                </motion.span>
              </div>

              {/* CTA button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={quoteUrl}
                  className={cn(
                    'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300',
                    enabledServiceIds.length > 0
                      ? 'bg-rpm-red text-white glow-red-hover border border-rpm-red/20 hover:bg-rpm-red-dark'
                      : 'bg-rpm-charcoal text-rpm-silver border border-rpm-gray/30 cursor-default'
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Get This Package Quoted
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
