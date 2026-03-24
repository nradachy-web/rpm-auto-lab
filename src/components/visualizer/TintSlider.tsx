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
  // Convert tint percentage (5-70) to opacity (0.95 -> 0.3)
  const tintOpacity = 1 - tintLevel / 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-rpm-silver">Tint Level</p>
        <span className="text-sm font-mono text-rpm-white font-semibold">{tintLevel}%</span>
      </div>

      {/* Visual preview bar */}
      <div className="relative h-6 rounded-full overflow-hidden border border-rpm-gray/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-blue-100/10" />
        <motion.div
          className="absolute inset-0 bg-black rounded-full"
          animate={{ opacity: 1 - tintOpacity }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono text-white/70 mix-blend-difference">
            {tintLevel}% VLT
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
