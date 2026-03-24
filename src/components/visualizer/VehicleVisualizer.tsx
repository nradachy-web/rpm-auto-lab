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

// ─── Car SVG Silhouette ─────────────────────────────────────────────────
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
  return (
    <div className="relative w-full max-w-[700px] mx-auto">
      {/* Detailing glow aura */}
      <AnimatePresence>
        {detailingEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 -inset-x-8 -inset-y-8 pointer-events-none"
          >
            <div
              className="w-full h-full rounded-[50%] blur-2xl"
              style={{
                background: `radial-gradient(ellipse at center, ${bodyColor}22 0%, transparent 70%)`,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-[50%] blur-3xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 60%)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 800 350"
        className="w-full h-auto relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ceramic coating animated shimmer gradient */}
          <linearGradient id="ceramicShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            {ceramicEnabled && (
              <>
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-1 0;2 0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </>
            )}
          </linearGradient>

          {/* Window gradient */}
          <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0f0f1a" />
          </linearGradient>

          {/* Body reflection */}
          <linearGradient id="bodyReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>

          {/* Wheel gradient */}
          <radialGradient id="wheelGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#333" />
            <stop offset="60%" stopColor="#1a1a1a" />
            <stop offset="80%" stopColor="#111" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>

          {/* Rim detail */}
          <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#555" />
            <stop offset="40%" stopColor="#333" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>

          {/* PPF dash pattern */}
          <pattern id="ppfPattern" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="none" />
            <circle cx="4" cy="4" r="0.8" fill="rgba(255,255,255,0.3)" />
          </pattern>

          {/* Shadow filter */}
          <filter id="carShadow" x="-10%" y="-10%" width="120%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dy="12" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="400" cy="310" rx="320" ry="18" fill="rgba(0,0,0,0.3)" />

        {/* ── Main Car Body ── */}
        <g filter="url(#carShadow)">
          {/* Lower body */}
          <motion.path
            d="M 120,240
               L 120,210
               Q 120,190 140,188
               L 280,180
               L 300,178
               L 500,178
               L 520,180
               L 660,188
               Q 680,190 680,210
               L 680,240
               Q 680,258 665,260
               L 590,264
               L 540,266
               Q 520,266 520,260
               L 520,256
               Q 520,250 510,250
               L 290,250
               Q 280,250 280,256
               L 280,260
               Q 280,266 260,266
               L 210,264
               L 135,260
               Q 120,258 120,240 Z"
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          {/* Upper body / roof */}
          <motion.path
            d="M 240,180
               L 270,120
               Q 278,105 295,102
               L 380,96
               L 430,95
               L 490,98
               Q 510,100 518,108
               L 560,160
               L 565,168
               Q 568,174 560,178
               L 500,178
               L 300,178
               L 240,180 Z"
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          {/* Body reflection overlay */}
          <path
            d="M 120,240
               L 120,210
               Q 120,190 140,188
               L 280,180
               L 300,178
               L 500,178
               L 520,180
               L 660,188
               Q 680,190 680,210
               L 680,240
               Q 680,258 665,260
               L 590,264
               L 540,266
               Q 520,266 520,260
               L 520,256
               Q 520,250 510,250
               L 290,250
               Q 280,250 280,256
               L 280,260
               Q 280,266 260,266
               L 210,264
               L 135,260
               Q 120,258 120,240 Z"
            fill="url(#bodyReflection)"
          />

          {/* Roof reflection */}
          <path
            d="M 240,180
               L 270,120
               Q 278,105 295,102
               L 380,96
               L 430,95
               L 490,98
               Q 510,100 518,108
               L 560,160
               L 565,168
               Q 568,174 560,178
               L 500,178
               L 300,178
               L 240,180 Z"
            fill="url(#bodyReflection)"
          />

          {/* ── Windows ── */}
          {/* Front windshield */}
          <motion.path
            d="M 518,112
               L 555,165
               Q 558,170 552,174
               L 508,176
               L 508,176
               Q 502,176 502,170
               L 502,115
               Q 502,108 510,108 Z"
            fill="url(#windowGrad)"
            animate={{ opacity: 1 - (70 - Math.min(70, Math.max(5, 50))) / 100 * 0.6 }}
            transition={{ duration: 0.4 }}
          />
          {/* Window tint overlay on windshield */}
          <motion.path
            d="M 518,112
               L 555,165
               Q 558,170 552,174
               L 508,176
               L 508,176
               Q 502,176 502,170
               L 502,115
               Q 502,108 510,108 Z"
            fill="black"
            animate={{ opacity: 0.15 }}
            transition={{ duration: 0.4 }}
          />

          {/* Rear windshield */}
          <motion.path
            d="M 278,112
               L 248,165
               Q 245,170 250,174
               L 295,176
               Q 300,176 300,170
               L 300,115
               Q 300,108 292,108 Z"
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          {/* Side windows - passenger */}
          <motion.path
            d="M 305,108
               L 370,100
               L 370,172
               L 305,174
               Q 302,174 302,170
               L 302,112
               Q 302,108 305,108 Z"
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          <motion.path
            d="M 378,100
               L 440,98
               L 498,104
               Q 500,105 500,108
               L 500,170
               Q 500,174 496,174
               L 378,172 Z"
            fill="url(#windowGrad)"
            animate={{ opacity: windowOpacity }}
            transition={{ duration: 0.4 }}
          />

          {/* Window divider / B-pillar */}
          <motion.line
            x1="374" y1="100" x2="374" y2="174"
            stroke={bodyColor}
            strokeWidth="4"
            animate={{ stroke: bodyColor }}
            transition={{ duration: 0.5 }}
          />

          {/* ── Door line ── */}
          <motion.line
            x1="400" y1="178" x2="400" y2="252"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.5"
          />

          {/* ── Headlights ── */}
          <path
            d="M 660,198 Q 690,196 695,204 L 695,220 Q 690,228 660,226 Z"
            fill="#fff"
            opacity="0.85"
          />
          <path
            d="M 662,201 Q 686,199 689,205 L 689,218 Q 686,224 662,222 Z"
            fill="#e8e8ff"
            opacity="0.95"
          />
          {/* Headlight DRL accent */}
          <line x1="662" y1="204" x2="688" y2="203" stroke="rgba(200,220,255,0.8)" strokeWidth="1.5" />

          {/* ── Taillights ── */}
          <path
            d="M 140,198 Q 118,196 114,204 L 114,224 Q 118,230 140,228 Z"
            fill="#dc2626"
            opacity="0.9"
          />
          <path
            d="M 138,201 Q 122,199 119,205 L 119,222 Q 122,227 138,225 Z"
            fill="#ef4444"
            opacity="0.7"
          />

          {/* ── Side skirt line ── */}
          <line x1="160" y1="252" x2="640" y2="252" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

          {/* ── Door handle ── */}
          <rect x="440" y="210" width="24" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
          <rect x="330" y="210" width="24" height="4" rx="2" fill="rgba(255,255,255,0.1)" />

          {/* ── Side mirror ── */}
          <motion.path
            d="M 558,175 L 572,168 L 576,176 L 564,182 Z"
            animate={{ fill: bodyColor }}
            transition={{ duration: 0.5 }}
          />
        </g>

        {/* ── Wheels ── */}
        {/* Front wheel */}
        <g>
          <circle cx="565" cy="270" r="42" fill="#111" />
          <circle cx="565" cy="270" r="38" fill="url(#wheelGrad)" />
          <circle cx="565" cy="270" r="28" fill="url(#rimGrad)" />
          {/* Rim spokes */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
            <line
              key={`f-${angle}`}
              x1="565"
              y1="270"
              x2={565 + Math.cos((angle * Math.PI) / 180) * 26}
              y2={270 + Math.sin((angle * Math.PI) / 180) * 26}
              stroke="#444"
              strokeWidth="2.5"
            />
          ))}
          <circle cx="565" cy="270" r="8" fill="#222" />
          <circle cx="565" cy="270" r="5" fill="#333" />
          {/* Tire highlight */}
          <path d="M 533,252 Q 527,270 533,288" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        </g>

        {/* Rear wheel */}
        <g>
          <circle cx="235" cy="270" r="42" fill="#111" />
          <circle cx="235" cy="270" r="38" fill="url(#wheelGrad)" />
          <circle cx="235" cy="270" r="28" fill="url(#rimGrad)" />
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => (
            <line
              key={`r-${angle}`}
              x1="235"
              y1="270"
              x2={235 + Math.cos((angle * Math.PI) / 180) * 26}
              y2={270 + Math.sin((angle * Math.PI) / 180) * 26}
              stroke="#444"
              strokeWidth="2.5"
            />
          ))}
          <circle cx="235" cy="270" r="8" fill="#222" />
          <circle cx="235" cy="270" r="5" fill="#333" />
          <path d="M 203,252 Q 197,270 203,288" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        </g>

        {/* ── Ceramic Coating Shimmer Overlay ── */}
        <AnimatePresence>
          {ceramicEnabled && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Body shimmer */}
              <path
                d="M 120,240 L 120,210 Q 120,190 140,188 L 280,180 L 300,178 L 500,178 L 520,180 L 660,188 Q 680,190 680,210 L 680,240 Q 680,258 665,260 L 590,264 L 540,266 Q 520,266 520,260 L 520,256 Q 520,250 510,250 L 290,250 Q 280,250 280,256 L 280,260 Q 280,266 260,266 L 210,264 L 135,260 Q 120,258 120,240 Z"
                fill="url(#ceramicShine)"
              />
              {/* Roof shimmer */}
              <path
                d="M 240,180 L 270,120 Q 278,105 295,102 L 380,96 L 430,95 L 490,98 Q 510,100 518,108 L 560,160 L 565,168 Q 568,174 560,178 L 500,178 L 300,178 L 240,180 Z"
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
              {/* Hood area PPF outline */}
              <path
                d="M 520,180 L 660,188 Q 680,190 680,210 L 680,230 L 620,235 L 520,234 Z"
                fill="none"
                stroke="rgba(100,200,255,0.4)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              {/* Hood PPF pattern fill */}
              <path
                d="M 520,180 L 660,188 Q 680,190 680,210 L 680,230 L 620,235 L 520,234 Z"
                fill="url(#ppfPattern)"
                opacity="0.5"
              />
              {/* Front bumper PPF */}
              <path
                d="M 660,188 Q 680,190 680,210 L 680,240 Q 680,258 665,260 L 590,264 L 540,266 Q 530,266 530,258 L 530,234 L 620,235 L 660,232 Z"
                fill="none"
                stroke="rgba(100,200,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              {/* Mirror PPF */}
              <path
                d="M 558,175 L 572,168 L 576,176 L 564,182 Z"
                fill="none"
                stroke="rgba(100,200,255,0.5)"
                strokeWidth="2"
                strokeDasharray="3 2"
              />
              {/* PPF label */}
              <text x="610" y="215" fontSize="9" fill="rgba(100,200,255,0.6)" fontFamily="monospace" textAnchor="middle">PPF</text>
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
                { x: 350, y: 150, delay: 0 },
                { x: 500, y: 200, delay: 0.5 },
                { x: 250, y: 210, delay: 1.0 },
                { x: 600, y: 195, delay: 1.5 },
                { x: 420, y: 120, delay: 0.3 },
                { x: 180, y: 220, delay: 0.8 },
                { x: 550, y: 170, delay: 1.2 },
                { x: 320, y: 230, delay: 0.6 },
                { x: 470, y: 160, delay: 1.8 },
                { x: 380, y: 190, delay: 0.2 },
              ].map((spark, i) => (
                <motion.g
                  key={i}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: spark.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ originX: `${spark.x}px`, originY: `${spark.y}px` }}
                >
                  {/* 4-point star sparkle */}
                  <path
                    d={`M ${spark.x},${spark.y - 6} L ${spark.x + 2},${spark.y - 2} L ${spark.x + 6},${spark.y} L ${spark.x + 2},${spark.y + 2} L ${spark.x},${spark.y + 6} L ${spark.x - 2},${spark.y + 2} L ${spark.x - 6},${spark.y} L ${spark.x - 2},${spark.y - 2} Z`}
                    fill="white"
                    opacity="0.8"
                  />
                </motion.g>
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        {/* Ground reflection line */}
        <line x1="180" y1="308" x2="620" y2="308" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
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
    ? Math.max(0.1, 1 - tintLevel / 80)
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
          <div className="relative rounded-2xl bg-gradient-to-b from-rpm-dark/60 via-rpm-black to-rpm-dark/40 border border-rpm-gray/15 p-6 sm:p-10 overflow-hidden">
            {/* Ambient background based on body color */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 60%, ${bodyColor} 0%, transparent 70%)`,
              }}
            />

            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative z-10 flex items-center justify-center min-h-[280px] sm:min-h-[350px]">
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
          className="w-full lg:w-[340px] flex-shrink-0"
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
