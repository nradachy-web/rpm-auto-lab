'use client';

import { motion } from 'framer-motion';
import { BASE_PATH } from '@/lib/constants';

// Replaces dashed-border placeholder boxes with a moody photo + caption.
// Use sparingly — at most one per page so it stays atmospheric.
export default function EmptyState({
  message,
  action,
  imageFile = 'empty-state-garage.jpg',
}: {
  message: string;
  action?: React.ReactNode;
  imageFile?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-xl border border-rpm-gray/40"
    >
      <div
        className="aspect-[16/7] md:aspect-[16/5] bg-cover bg-center"
        style={{ backgroundImage: `url("${BASE_PATH}/portal-art/${imageFile}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-rpm-black via-rpm-black/70 to-rpm-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm md:text-base text-rpm-silver max-w-sm">{message}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </motion.div>
  );
}
