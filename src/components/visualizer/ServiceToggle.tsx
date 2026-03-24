'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ColorPicker from './ColorPicker';
import TintSlider from './TintSlider';

export interface VisualizerService {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: number;
  enabled: boolean;
}

interface ServiceToggleProps {
  service: VisualizerService;
  onToggle: (id: string) => void;
  // Service-specific options
  tintLevel?: number;
  onTintChange?: (level: number) => void;
  wrapColor?: string;
  onWrapColorChange?: (hex: string) => void;
}

export default function ServiceToggle({
  service,
  onToggle,
  tintLevel,
  onTintChange,
  wrapColor,
  onWrapColorChange,
}: ServiceToggleProps) {
  const hasOptions =
    (service.id === 'window-tint' && onTintChange) ||
    (service.id === 'vehicle-wraps' && onWrapColorChange);

  return (
    <div className="space-y-0">
      <motion.button
        onClick={() => onToggle(service.id)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group',
          service.enabled
            ? 'bg-rpm-red/10 border border-rpm-red/30'
            : 'bg-rpm-charcoal/50 border border-rpm-gray/20 hover:border-rpm-gray/40'
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300',
            service.enabled ? 'bg-rpm-red/20 text-rpm-red' : 'bg-rpm-gray/30 text-rpm-silver'
          )}
        >
          {service.icon}
        </div>

        {/* Name & price */}
        <div className="flex-1 text-left">
          <p
            className={cn(
              'text-sm font-semibold transition-colors duration-300',
              service.enabled ? 'text-rpm-white' : 'text-rpm-silver'
            )}
          >
            {service.name}
          </p>
          <p className="text-[10px] text-rpm-silver/60">
            From ${service.price.toLocaleString()}
          </p>
        </div>

        {/* Toggle switch */}
        <div
          className={cn(
            'w-10 h-5 rounded-full relative transition-colors duration-300 flex-shrink-0',
            service.enabled ? 'bg-rpm-red' : 'bg-rpm-gray'
          )}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-white absolute top-0.5"
            animate={{ left: service.enabled ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>

      {/* Service-specific options */}
      <AnimatePresence>
        {service.enabled && hasOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 ml-2 border-l-2 border-rpm-red/20">
              {service.id === 'window-tint' && onTintChange && tintLevel !== undefined && (
                <TintSlider tintLevel={tintLevel} onTintChange={onTintChange} />
              )}
              {service.id === 'vehicle-wraps' && onWrapColorChange && wrapColor && (
                <ColorPicker selectedColor={wrapColor} onColorChange={onWrapColorChange} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
