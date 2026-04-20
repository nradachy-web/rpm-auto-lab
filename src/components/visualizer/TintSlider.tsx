'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '5% Limo', value: 5 },
  { label: '20% Dark', value: 20 },
  { label: '35% Medium', value: 35 },
  { label: '50% Light', value: 50 },
] as const;

interface TintSliderProps {
  tintLevel: number;
  onTintChange: (level: number) => void;
}

export default function TintSlider({ tintLevel, onTintChange }: TintSliderProps) {
  // VLT % range 5-70 → darkness 0-1 (0=clear, 1=blackout)
  const darkness = 1 - (tintLevel - 5) / 65;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-rpm-silver">Tint Level</p>
        <span className="text-sm font-mono text-rpm-white font-semibold">{tintLevel}% VLT</span>
      </div>

      {/* Visual preview — simulated glass darkening */}
      <div className="relative h-10 rounded-lg overflow-hidden border border-rpm-gray/50">
        {/* Fake "outside" scene behind glass — sunset gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #0a1628 0%, #1e293b 35%, #dc2626 70%, #f59e0b 100%)",
          }}
        />
        {/* Subtle road + horizon line for realism */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        {/* Glass tint layer */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundColor: `rgba(10, 14, 22, ${0.25 + darkness * 0.7})`,
            backdropFilter: `blur(${darkness * 1.5}px)`,
          }}
          transition={{ duration: 0.25 }}
        />
        {/* VLT label overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[11px] font-mono font-bold text-white/90"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          >
            {tintLevel}% VLT {tintLevel <= 10 ? "— Limo" : tintLevel <= 25 ? "— Privacy" : tintLevel <= 40 ? "— Standard" : "— Light"}
          </span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={5}
        max={70}
        step={1}
        value={tintLevel}
        onChange={(e) => onTintChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-rpm-gray
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-rpm-red
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(220,38,38,0.5)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-shadow
          [&::-webkit-slider-thumb]:duration-200
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_14px_rgba(220,38,38,0.7)]
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-rpm-red
          [&::-moz-range-thumb]:border-none
          [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* Presets */}
      <div className="flex gap-1.5">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTintChange(preset.value)}
            className={cn(
              'flex-1 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer',
              tintLevel === preset.value
                ? 'bg-rpm-red/20 text-rpm-red border border-rpm-red/40'
                : 'bg-rpm-charcoal text-rpm-silver border border-rpm-gray/30 hover:border-rpm-silver/30'
            )}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
