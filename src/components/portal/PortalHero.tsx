'use client';

import { motion } from 'framer-motion';
import { BASE_PATH } from '@/lib/constants';

export default function PortalHero({
  imageFile,
  eyebrow,
  title,
  subtitle,
  height = 'md',
}: {
  imageFile: string;          // e.g. "customer-hero.jpg"
  eyebrow?: string;
  title: string;
  subtitle?: string;
  height?: 'sm' | 'md' | 'lg';
}) {
  const heightClass = height === 'lg' ? 'h-56 md:h-72' : height === 'sm' ? 'h-32 md:h-40' : 'h-40 md:h-56';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative overflow-hidden rounded-2xl border border-rpm-gray/40 ${heightClass}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${BASE_PATH}/portal-art/${imageFile}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-rpm-black via-rpm-black/55 to-rpm-black/15" />
      <div className="absolute inset-0 flex items-end p-5 md:p-7">
        <div>
          {eyebrow && (
            <div className="text-[10px] uppercase tracking-[0.22em] text-rpm-red font-bold mb-1.5">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-black text-rpm-white drop-shadow">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm md:text-base text-rpm-silver mt-1.5 max-w-xl">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
