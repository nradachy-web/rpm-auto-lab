'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const WRAP_COLORS = [
  { name: 'Satin Black', hex: '#1a1a1a' },
  { name: 'Gloss Black', hex: '#0a0a0a' },
  { name: 'Matte Gray', hex: '#4a4a4a' },
  { name: 'Satin Red', hex: '#b91c1c' },
  { name: 'Gloss Red', hex: '#dc2626' },
  { name: 'Matte Blue', hex: '#1e40af' },
  { name: 'Satin Blue', hex: '#2563eb' },
  { name: 'Midnight Purple', hex: '#4c1d95' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Pearl White', hex: '#f5f5f4' },
  { name: 'Nardo Gray', hex: '#6b7280' },
  { name: 'Racing Yellow', hex: '#eab308' },
  { name: 'Burnt Orange', hex: '#ea580c' },
] as const;

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (hex: string) => void;
}

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-rpm-silver">Wrap Color</p>
      <div className="grid grid-cols-5 gap-2">
        {WRAP_COLORS.map((color) => {
          const isSelected = selectedColor === color.hex;
          const isLight = ['#f5f5f4', '#eab308'].includes(color.hex);
          return (
            <motion.button
              key={color.hex}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onColorChange(color.hex)}
              className="group flex flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all duration-300 cursor-pointer',
                  isSelected
                    ? 'border-rpm-red shadow-[0_0_12px_rgba(220,38,38,0.5)] scale-110'
                    : 'border-rpm-gray/50 hover:border-rpm-silver',
                  isLight && !isSelected && 'border-rpm-silver/30'
                )}
                style={{ backgroundColor: color.hex }}
              />
              <span
                className={cn(
                  'text-[9px] leading-tight text-center transition-colors duration-200',
                  isSelected ? 'text-rpm-white' : 'text-rpm-silver/60 group-hover:text-rpm-silver'
                )}
              >
                {color.name}
              </span>
            </motion.button>
          );
        })}
      </div>
      {/* Custom color input */}
      <div className="flex items-center gap-2 pt-1">
        <label className="text-[10px] text-rpm-silver uppercase tracking-wider">Custom</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 rounded-full border border-rpm-gray cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none"
        />
        <span className="text-[10px] text-rpm-silver font-mono">{selectedColor}</span>
      </div>
    </div>
  );
}
