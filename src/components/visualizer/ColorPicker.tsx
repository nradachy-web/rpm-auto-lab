'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ─── 3M 2080 Wrap Film Series ──────────────────────────────────────
const COLORS_3M = [
  // Gloss
  { name: 'Gloss Black', hex: '#0a0a0a', finish: 'Gloss' },
  { name: 'Gloss White', hex: '#f5f5f5', finish: 'Gloss' },
  { name: 'Gloss Hot Rod Red', hex: '#cc1a1a', finish: 'Gloss' },
  { name: 'Gloss Bright Orange', hex: '#e8590c', finish: 'Gloss' },
  { name: 'Gloss Bright Yellow', hex: '#eab308', finish: 'Gloss' },
  { name: 'Gloss Lucid Yellow', hex: '#fbbf24', finish: 'Gloss' },
  { name: 'Gloss Sky Blue', hex: '#38a3d6', finish: 'Gloss' },
  { name: 'Gloss Blue', hex: '#1d4ed8', finish: 'Gloss' },
  { name: 'Gloss Light Green', hex: '#4ade80', finish: 'Gloss' },
  { name: 'Gloss Storm Gray', hex: '#6b7280', finish: 'Gloss' },
  { name: 'Gloss Ivory', hex: '#f5f0e1', finish: 'Gloss' },
  { name: 'Gloss Sterling Silver', hex: '#a8a9ad', finish: 'Gloss' },
  { name: 'Gloss Midnight Blue', hex: '#141e3d', finish: 'Gloss' },
  { name: 'Cosmic Blue', hex: '#1e3a6e', finish: 'Gloss' },
  { name: 'Blue Fire', hex: '#0047ab', finish: 'Gloss' },
  { name: 'Dragon Fire Red', hex: '#8b1a1a', finish: 'Gloss' },
  { name: 'Fierce Fuchsia', hex: '#c026d3', finish: 'Gloss' },
  { name: 'Atomic Teal', hex: '#0d9488', finish: 'Gloss' },
  { name: 'Green Envy', hex: '#15803d', finish: 'Gloss' },
  { name: 'Liquid Copper', hex: '#b87333', finish: 'Gloss' },
  // High Gloss
  { name: 'HG Nardo Gray', hex: '#7c7f83', finish: 'High Gloss' },
  { name: 'HG Mantis Green', hex: '#16a34a', finish: 'High Gloss' },
  { name: 'HG Ruby Rosso', hex: '#991b1b', finish: 'High Gloss' },
  { name: 'HG Meteor Gray', hex: '#4b5058', finish: 'High Gloss' },
  { name: 'HG Blue Raspberry', hex: '#3b82f6', finish: 'High Gloss' },
  { name: 'HG Burnt Orange', hex: '#c2410c', finish: 'High Gloss' },
  // Satin
  { name: 'Satin Black', hex: '#171717', finish: 'Satin' },
  { name: 'Satin White', hex: '#eeeeee', finish: 'Satin' },
  { name: 'Satin Battleship Grey', hex: '#555d68', finish: 'Satin' },
  { name: 'Satin Komodo Green', hex: '#3d5c3a', finish: 'Satin' },
  { name: 'Satin Key West', hex: '#22d3ee', finish: 'Satin' },
  { name: 'Satin Lunar Blue', hex: '#1e3050', finish: 'Satin' },
  { name: 'Satin Vampire Red', hex: '#7f1d1d', finish: 'Satin' },
  { name: 'Satin Frozen Vanilla', hex: '#fef3c7', finish: 'Satin' },
  { name: 'Satin Thundercloud', hex: '#374151', finish: 'Satin' },
  // Matte
  { name: 'Matte Black', hex: '#1a1a1a', finish: 'Matte' },
  { name: 'Dead Matte Black', hex: '#0f0f0f', finish: 'Matte' },
  { name: 'Matte Red', hex: '#b91c1c', finish: 'Matte' },
  { name: 'Matte Military Green', hex: '#4d5c2e', finish: 'Matte' },
  { name: 'Matte Indigo', hex: '#312e81', finish: 'Matte' },
  { name: 'Matte Silver', hex: '#9ca3af', finish: 'Matte' },
  { name: 'Matte Dark Grey', hex: '#374151', finish: 'Matte' },
];

// ─── Avery Dennison SW900 Supreme Wrapping Film ────────────────────
const COLORS_AVERY = [
  { name: 'Gloss Black', hex: '#0a0a0a', finish: 'Gloss' },
  { name: 'Gloss White', hex: '#f5f5f5', finish: 'Gloss' },
  { name: 'Gloss Red', hex: '#dc2626', finish: 'Gloss' },
  { name: 'Gloss Cardinal Red', hex: '#991b1b', finish: 'Gloss' },
  { name: 'Gloss Carmine Red', hex: '#b91c1c', finish: 'Gloss' },
  { name: 'Gloss Orange', hex: '#ea580c', finish: 'Gloss' },
  { name: 'Gloss Dark Yellow', hex: '#ca8a04', finish: 'Gloss' },
  { name: 'Gloss Yellow', hex: '#eab308', finish: 'Gloss' },
  { name: 'Gloss Grass Green', hex: '#16a34a', finish: 'Gloss' },
  { name: 'Gloss Blue', hex: '#2563eb', finish: 'Gloss' },
  { name: 'Gloss Dark Blue', hex: '#1e3a8a', finish: 'Gloss' },
  { name: 'Gloss Indigo Blue', hex: '#3730a3', finish: 'Gloss' },
  { name: 'Gloss Light Blue', hex: '#60a5fa', finish: 'Gloss' },
  { name: 'Gloss Dark Grey', hex: '#374151', finish: 'Gloss' },
  { name: 'Gloss Rock Grey', hex: '#6b7280', finish: 'Gloss' },
  { name: 'Gloss Metallic Silver', hex: '#a8a9ad', finish: 'Metallic' },
  { name: 'Satin Black', hex: '#171717', finish: 'Satin' },
  { name: 'Satin White Pearl', hex: '#f0ebe0', finish: 'Satin' },
  { name: 'Satin Safari Gold', hex: '#a87e3e', finish: 'Satin' },
  { name: 'Satin Purple', hex: '#7c3aed', finish: 'Satin' },
  { name: 'Satin Silver', hex: '#9ca3af', finish: 'Metallic' },
  { name: 'Matte Black', hex: '#1a1a1a', finish: 'Matte' },
  { name: 'Matte Olive Green', hex: '#4d5c2e', finish: 'Matte' },
  { name: 'Matte Charcoal', hex: '#3f4548', finish: 'Matte' },
  { name: 'Matte Gunmetal', hex: '#4a5056', finish: 'Matte' },
  { name: 'White Pearl', hex: '#f5f0e8', finish: 'Pearl' },
  { name: 'Carbon Fiber Black', hex: '#1a1a1a', finish: 'Texture' },
];

// ─── Pure PPF Color Series ─────────────────────────────────────────
const COLORS_PURE_PPF = [
  // Gloss Solid Series
  { name: 'Black', hex: '#0a0a0a', finish: 'Gloss' },
  { name: 'White', hex: '#f5f5f5', finish: 'Gloss' },
  { name: 'Nardo Gray', hex: '#7c7f83', finish: 'Gloss' },
  { name: 'Bone Gray', hex: '#b0a89a', finish: 'Gloss' },
  { name: 'Miami Blue', hex: '#00a3d9', finish: 'Gloss' },
  { name: 'Basilisk Blue', hex: '#1e40af', finish: 'Gloss' },
  { name: 'Neptune Blue', hex: '#1d3d8a', finish: 'Gloss' },
  { name: 'Powder Blue', hex: '#8ec8e8', finish: 'Gloss' },
  { name: 'Crimson Red', hex: '#cc1a1a', finish: 'Gloss' },
  { name: 'Habanero Red', hex: '#b91c1c', finish: 'Gloss' },
  { name: 'Umbra Rosso', hex: '#7a1919', finish: 'Gloss' },
  { name: 'Solar Flare', hex: '#f59e0b', finish: 'Gloss' },
  { name: 'Olive Green', hex: '#556b2f', finish: 'Gloss' },
  { name: 'British Racing Green', hex: '#004225', finish: 'Gloss' },
  { name: 'Verde Antico', hex: '#2d5a3d', finish: 'Gloss' },
  { name: 'Iridescent Emerald', hex: '#047857', finish: 'Gloss' },
  { name: 'Viola', hex: '#6d28d9', finish: 'Gloss' },
  { name: 'Frozen Blue Met.', hex: '#4a8bb5', finish: 'Gloss' },
  // Matte Series
  { name: 'Matte Black', hex: '#111111', finish: 'Matte' },
  { name: 'Matte White', hex: '#e8e8e8', finish: 'Matte' },
  { name: 'Matte Smoke Gray', hex: '#52525b', finish: 'Matte' },
  { name: 'Moon Rock Blue', hex: '#5b7a8c', finish: 'Matte' },
  { name: 'Coyote Brown', hex: '#8b6f4e', finish: 'Matte' },
  // Color Flip
  { name: 'Cosmic Dust', hex: '#5b3a8c', finish: 'Color Flip' },
  { name: 'Winter Rose', hex: '#c084a8', finish: 'Color Flip' },
  { name: 'Psychedelic', hex: '#4338ca', finish: 'Color Flip' },
];

type BrandKey = '3m' | 'avery' | 'pureppf';

const BRANDS: { key: BrandKey; label: string; colors: typeof COLORS_3M }[] = [
  { key: '3m', label: '3M 2080', colors: COLORS_3M },
  { key: 'avery', label: 'Avery Dennison', colors: COLORS_AVERY },
  { key: 'pureppf', label: 'Pure PPF', colors: COLORS_PURE_PPF },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (hex: string) => void;
}

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [activeBrand, setActiveBrand] = useState<BrandKey>('3m');
  const brand = BRANDS.find((b) => b.key === activeBrand)!;

  return (
    <div className="space-y-3">
      {/* Brand tabs */}
      <div className="flex gap-1">
        {BRANDS.map((b) => (
          <button
            key={b.key}
            onClick={() => setActiveBrand(b.key)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all',
              activeBrand === b.key
                ? 'bg-rpm-red/15 text-rpm-red border border-rpm-red/30'
                : 'text-rpm-silver/60 hover:text-rpm-silver border border-transparent'
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-6 gap-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-none">
        {brand.colors.map((color) => {
          const isSelected = selectedColor === color.hex;
          const isLight = color.hex > '#cccccc';
          return (
            <motion.button
              key={`${brand.key}-${color.name}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onColorChange(color.hex)}
              className="group flex flex-col items-center gap-1"
              title={`${color.name} (${color.finish})`}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all duration-200',
                  isSelected
                    ? 'border-rpm-red shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-110'
                    : 'border-rpm-gray/40 hover:border-rpm-silver/60',
                  isLight && !isSelected && 'border-rpm-silver/30'
                )}
                style={{ backgroundColor: color.hex }}
              />
              <span
                className={cn(
                  'text-[7px] leading-tight text-center max-w-[48px] truncate transition-colors',
                  isSelected ? 'text-rpm-white' : 'text-rpm-silver/40 group-hover:text-rpm-silver/70'
                )}
              >
                {color.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom color */}
      <div className="flex items-center gap-2 pt-1 border-t border-rpm-gray/20">
        <label className="text-[9px] text-rpm-silver uppercase tracking-wider">Custom</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-5 h-5 rounded-full border border-rpm-gray cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
        />
        <span className="text-[9px] text-rpm-silver/60 font-mono">{selectedColor}</span>
      </div>
    </div>
  );
}
