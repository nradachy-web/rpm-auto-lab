'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { FinishType, WrapColor } from './types';

// ─── 3M 2080 Wrap Film Series ──────────────────────────────────────
const COLORS_3M: Omit<WrapColor, 'brand'>[] = [
  // Gloss
  { name: 'Gloss Black', hex: '#0a0a0a', finish: 'gloss' },
  { name: 'Gloss White', hex: '#f5f5f5', finish: 'gloss' },
  { name: 'Gloss Hot Rod Red', hex: '#cc1a1a', finish: 'gloss' },
  { name: 'Gloss Bright Orange', hex: '#e8590c', finish: 'gloss' },
  { name: 'Gloss Bright Yellow', hex: '#eab308', finish: 'gloss' },
  { name: 'Gloss Lucid Yellow', hex: '#fbbf24', finish: 'gloss' },
  { name: 'Gloss Sky Blue', hex: '#38a3d6', finish: 'gloss' },
  { name: 'Gloss Blue', hex: '#1d4ed8', finish: 'gloss' },
  { name: 'Gloss Light Green', hex: '#4ade80', finish: 'gloss' },
  { name: 'Gloss Storm Gray', hex: '#6b7280', finish: 'gloss' },
  { name: 'Gloss Ivory', hex: '#f5f0e1', finish: 'gloss' },
  { name: 'Gloss Sterling Silver', hex: '#a8a9ad', finish: 'metallic' },
  { name: 'Gloss Midnight Blue', hex: '#141e3d', finish: 'gloss' },
  { name: 'Cosmic Blue', hex: '#1e3a6e', finish: 'gloss' },
  { name: 'Blue Fire', hex: '#0047ab', finish: 'gloss' },
  { name: 'Dragon Fire Red', hex: '#8b1a1a', finish: 'gloss' },
  { name: 'Fierce Fuchsia', hex: '#c026d3', finish: 'gloss' },
  { name: 'Atomic Teal', hex: '#0d9488', finish: 'gloss' },
  { name: 'Green Envy', hex: '#15803d', finish: 'gloss' },
  { name: 'Liquid Copper', hex: '#b87333', finish: 'metallic' },
  // High Gloss
  { name: 'HG Nardo Gray', hex: '#7c7f83', finish: 'high-gloss' },
  { name: 'HG Mantis Green', hex: '#16a34a', finish: 'high-gloss' },
  { name: 'HG Ruby Rosso', hex: '#991b1b', finish: 'high-gloss' },
  { name: 'HG Meteor Gray', hex: '#4b5058', finish: 'high-gloss' },
  { name: 'HG Blue Raspberry', hex: '#3b82f6', finish: 'high-gloss' },
  { name: 'HG Burnt Orange', hex: '#c2410c', finish: 'high-gloss' },
  // Satin
  { name: 'Satin Black', hex: '#171717', finish: 'satin' },
  { name: 'Satin White', hex: '#eeeeee', finish: 'satin' },
  { name: 'Satin Battleship Grey', hex: '#555d68', finish: 'satin' },
  { name: 'Satin Komodo Green', hex: '#3d5c3a', finish: 'satin' },
  { name: 'Satin Key West', hex: '#22d3ee', finish: 'satin' },
  { name: 'Satin Lunar Blue', hex: '#1e3050', finish: 'satin' },
  { name: 'Satin Vampire Red', hex: '#7f1d1d', finish: 'satin' },
  { name: 'Satin Frozen Vanilla', hex: '#fef3c7', finish: 'satin' },
  { name: 'Satin Thundercloud', hex: '#374151', finish: 'satin' },
  // Matte
  { name: 'Matte Black', hex: '#1a1a1a', finish: 'matte' },
  { name: 'Dead Matte Black', hex: '#0f0f0f', finish: 'matte' },
  { name: 'Matte Red', hex: '#b91c1c', finish: 'matte' },
  { name: 'Matte Military Green', hex: '#4d5c2e', finish: 'matte' },
  { name: 'Matte Indigo', hex: '#312e81', finish: 'matte' },
  { name: 'Matte Silver', hex: '#9ca3af', finish: 'matte' },
  { name: 'Matte Dark Grey', hex: '#374151', finish: 'matte' },
];

// ─── Avery Dennison SW900 Supreme Wrapping Film ────────────────────
const COLORS_AVERY: Omit<WrapColor, 'brand'>[] = [
  { name: 'Gloss Black', hex: '#0a0a0a', finish: 'gloss' },
  { name: 'Gloss White', hex: '#f5f5f5', finish: 'gloss' },
  { name: 'Gloss Red', hex: '#dc2626', finish: 'gloss' },
  { name: 'Gloss Cardinal Red', hex: '#991b1b', finish: 'gloss' },
  { name: 'Gloss Carmine Red', hex: '#b91c1c', finish: 'gloss' },
  { name: 'Gloss Orange', hex: '#ea580c', finish: 'gloss' },
  { name: 'Gloss Dark Yellow', hex: '#ca8a04', finish: 'gloss' },
  { name: 'Gloss Yellow', hex: '#eab308', finish: 'gloss' },
  { name: 'Gloss Grass Green', hex: '#16a34a', finish: 'gloss' },
  { name: 'Gloss Blue', hex: '#2563eb', finish: 'gloss' },
  { name: 'Gloss Dark Blue', hex: '#1e3a8a', finish: 'gloss' },
  { name: 'Gloss Indigo Blue', hex: '#3730a3', finish: 'gloss' },
  { name: 'Gloss Light Blue', hex: '#60a5fa', finish: 'gloss' },
  { name: 'Gloss Dark Grey', hex: '#374151', finish: 'gloss' },
  { name: 'Gloss Rock Grey', hex: '#6b7280', finish: 'gloss' },
  { name: 'Gloss Metallic Silver', hex: '#a8a9ad', finish: 'metallic' },
  { name: 'Satin Black', hex: '#171717', finish: 'satin' },
  { name: 'Satin White Pearl', hex: '#f0ebe0', finish: 'pearl' },
  { name: 'Satin Safari Gold', hex: '#a87e3e', finish: 'satin' },
  { name: 'Satin Purple', hex: '#7c3aed', finish: 'satin' },
  { name: 'Satin Silver', hex: '#9ca3af', finish: 'metallic' },
  { name: 'Matte Black', hex: '#1a1a1a', finish: 'matte' },
  { name: 'Matte Olive Green', hex: '#4d5c2e', finish: 'matte' },
  { name: 'Matte Charcoal', hex: '#3f4548', finish: 'matte' },
  { name: 'Matte Gunmetal', hex: '#4a5056', finish: 'matte' },
  { name: 'White Pearl', hex: '#f5f0e8', finish: 'pearl' },
  { name: 'Carbon Fiber Black', hex: '#1a1a1a', finish: 'texture' },
];

// ─── Pure PPF Color Series ─────────────────────────────────────────
const COLORS_PURE_PPF: Omit<WrapColor, 'brand'>[] = [
  // Gloss Solid Series
  { name: 'Black', hex: '#0a0a0a', finish: 'gloss' },
  { name: 'White', hex: '#f5f5f5', finish: 'gloss' },
  { name: 'Nardo Gray', hex: '#7c7f83', finish: 'gloss' },
  { name: 'Bone Gray', hex: '#b0a89a', finish: 'gloss' },
  { name: 'Miami Blue', hex: '#00a3d9', finish: 'gloss' },
  { name: 'Basilisk Blue', hex: '#1e40af', finish: 'gloss' },
  { name: 'Neptune Blue', hex: '#1d3d8a', finish: 'gloss' },
  { name: 'Powder Blue', hex: '#8ec8e8', finish: 'gloss' },
  { name: 'Crimson Red', hex: '#cc1a1a', finish: 'gloss' },
  { name: 'Habanero Red', hex: '#b91c1c', finish: 'gloss' },
  { name: 'Umbra Rosso', hex: '#7a1919', finish: 'gloss' },
  { name: 'Solar Flare', hex: '#f59e0b', finish: 'gloss' },
  { name: 'Olive Green', hex: '#556b2f', finish: 'gloss' },
  { name: 'British Racing Green', hex: '#004225', finish: 'gloss' },
  { name: 'Verde Antico', hex: '#2d5a3d', finish: 'gloss' },
  { name: 'Iridescent Emerald', hex: '#047857', finish: 'color-flip' },
  { name: 'Viola', hex: '#6d28d9', finish: 'gloss' },
  { name: 'Frozen Blue Met.', hex: '#4a8bb5', finish: 'metallic' },
  // Matte Series
  { name: 'Matte Black', hex: '#111111', finish: 'matte' },
  { name: 'Matte White', hex: '#e8e8e8', finish: 'matte' },
  { name: 'Matte Smoke Gray', hex: '#52525b', finish: 'matte' },
  { name: 'Moon Rock Blue', hex: '#5b7a8c', finish: 'matte' },
  { name: 'Coyote Brown', hex: '#8b6f4e', finish: 'matte' },
  // Color Flip
  { name: 'Cosmic Dust', hex: '#5b3a8c', finish: 'color-flip' },
  { name: 'Winter Rose', hex: '#c084a8', finish: 'color-flip' },
  { name: 'Psychedelic', hex: '#4338ca', finish: 'color-flip' },
];

type BrandKey = '3m' | 'avery' | 'pureppf';

const BRANDS: { key: BrandKey; label: string; colors: Omit<WrapColor, 'brand'>[] }[] = [
  { key: '3m', label: '3M 2080', colors: COLORS_3M },
  { key: 'avery', label: 'Avery Dennison', colors: COLORS_AVERY },
  { key: 'pureppf', label: 'Pure PPF', colors: COLORS_PURE_PPF },
];

type FinishFilter = 'all' | 'gloss' | 'satin' | 'matte' | 'metallic' | 'special';

const FINISH_GROUPS: { key: FinishFilter; label: string; finishes: FinishType[] }[] = [
  { key: 'all', label: 'All', finishes: [] },
  { key: 'gloss', label: 'Gloss', finishes: ['gloss', 'high-gloss'] },
  { key: 'satin', label: 'Satin', finishes: ['satin'] },
  { key: 'matte', label: 'Matte', finishes: ['matte'] },
  { key: 'metallic', label: 'Metallic', finishes: ['metallic', 'pearl'] },
  { key: 'special', label: 'Specialty', finishes: ['color-flip', 'texture'] },
];

export interface ColorPickerProps {
  selectedColor: string;
  selectedFinish: FinishType;
  onChange: (color: string, finish: FinishType) => void;
}

export default function ColorPicker({ selectedColor, selectedFinish, onChange }: ColorPickerProps) {
  const [activeBrand, setActiveBrand] = useState<BrandKey>('3m');
  const [finishFilter, setFinishFilter] = useState<FinishFilter>('all');
  const brand = BRANDS.find((b) => b.key === activeBrand)!;

  const visible = useMemo(() => {
    if (finishFilter === 'all') return brand.colors;
    const group = FINISH_GROUPS.find((g) => g.key === finishFilter);
    if (!group) return brand.colors;
    return brand.colors.filter((c) => group.finishes.includes(c.finish));
  }, [brand, finishFilter]);

  return (
    <div className="space-y-3">
      {/* Brand tabs */}
      <div className="flex gap-1 flex-wrap">
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

      {/* Finish filter */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
        {FINISH_GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setFinishFilter(g.key)}
            className={cn(
              'flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider transition-all border',
              finishFilter === g.key
                ? 'bg-rpm-white/10 text-rpm-white border-rpm-white/20'
                : 'bg-transparent text-rpm-silver/60 border-rpm-gray/30 hover:text-rpm-silver'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
        {visible.map((color) => {
          const isSelected = selectedColor === color.hex && selectedFinish === color.finish;
          const isLight = color.hex.toUpperCase() > '#CCCCCC';
          const finishRing = finishStyles(color.finish);
          return (
            <motion.button
              key={`${brand.key}-${color.name}-${color.finish}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(color.hex, color.finish)}
              className="group flex flex-col items-center gap-1"
              title={`${color.name} — ${capitalize(color.finish)}`}
            >
              <div className="relative">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-200 border-2',
                    isSelected
                      ? 'border-rpm-red shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-110'
                      : 'border-rpm-gray/40 hover:border-rpm-silver/60',
                    isLight && !isSelected && 'border-rpm-silver/30'
                  )}
                  style={{ backgroundColor: color.hex, ...finishRing }}
                />
                {/* Finish indicator — tiny dot in corner */}
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-rpm-dark text-[6px] font-black leading-[10px] text-center uppercase',
                    finishDotClass(color.finish)
                  )}
                >
                  {finishAbbr(color.finish)}
                </span>
              </div>
              <span
                className={cn(
                  'text-[7px] leading-tight text-center max-w-[52px] truncate transition-colors',
                  isSelected ? 'text-rpm-white' : 'text-rpm-silver/50 group-hover:text-rpm-silver/70'
                )}
              >
                {color.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Finish selector for custom color */}
      <div className="flex items-center gap-2 pt-2 border-t border-rpm-gray/20">
        <label className="text-[9px] text-rpm-silver uppercase tracking-wider whitespace-nowrap">Custom</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onChange(e.target.value, selectedFinish)}
          className="w-5 h-5 rounded-full border border-rpm-gray cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
        />
        <select
          value={selectedFinish}
          onChange={(e) => onChange(selectedColor, e.target.value as FinishType)}
          className="flex-1 bg-rpm-charcoal border border-rpm-gray/40 rounded-md px-2 py-1 text-[10px] text-rpm-silver focus:border-rpm-red/40 focus:outline-none"
        >
          <option value="gloss">Gloss</option>
          <option value="high-gloss">High Gloss</option>
          <option value="satin">Satin</option>
          <option value="matte">Matte</option>
          <option value="metallic">Metallic</option>
          <option value="pearl">Pearl</option>
          <option value="color-flip">Color Flip</option>
          <option value="texture">Texture</option>
        </select>
        <span className="text-[9px] text-rpm-silver/60 font-mono">{selectedColor}</span>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');
}

// Subtle CSS overlay to visually hint at finish type on the swatch
function finishStyles(finish: FinishType): React.CSSProperties {
  switch (finish) {
    case 'matte':
      return { boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' };
    case 'satin':
      return { boxShadow: 'inset 0 -4px 6px rgba(255,255,255,0.15), inset 0 2px 3px rgba(0,0,0,0.2)' };
    case 'gloss':
    case 'high-gloss':
      return { boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 4px rgba(0,0,0,0.2)' };
    case 'metallic':
    case 'pearl':
      return { boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 4px rgba(0,0,0,0.25)' };
    case 'color-flip':
      return { boxShadow: 'inset 0 3px 5px rgba(147,51,234,0.3), inset 0 -3px 5px rgba(234,51,120,0.2)' };
    case 'texture':
      return { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' };
    default:
      return {};
  }
}

function finishAbbr(finish: FinishType): string {
  const map: Record<FinishType, string> = {
    'gloss': 'G',
    'high-gloss': 'H',
    'satin': 'S',
    'matte': 'M',
    'metallic': 'E',
    'pearl': 'P',
    'color-flip': 'F',
    'texture': 'T',
  };
  return map[finish] || '';
}

function finishDotClass(finish: FinishType): string {
  switch (finish) {
    case 'matte':
      return 'bg-neutral-800 text-neutral-300';
    case 'satin':
      return 'bg-neutral-500 text-neutral-100';
    case 'gloss':
    case 'high-gloss':
      return 'bg-gradient-to-br from-white to-neutral-400 text-neutral-800';
    case 'metallic':
    case 'pearl':
      return 'bg-gradient-to-br from-slate-200 to-slate-500 text-slate-800';
    case 'color-flip':
      return 'bg-gradient-to-br from-purple-400 to-pink-400 text-white';
    case 'texture':
      return 'bg-neutral-700 text-neutral-200';
    default:
      return 'bg-neutral-600 text-white';
  }
}
