"use client";

import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { STATS } from "@/lib/constants";

function StatCard({
  value,
  suffix,
  label,
  index,
  progressPercent,
}: {
  value: number;
  suffix: string;
  label: string;
  index: number;
  progressPercent: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return controls.stop;
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      className="relative group"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.7,
        delay: 0.15 * index,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="relative p-6 md:p-8 rounded-xl bg-rpm-dark/60 border border-rpm-gray/20 overflow-hidden">
        {/* M-stripe vertical accent on left */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] m-stripe-vertical">
          <div />
          <div />
          <div />
        </div>

        <div className="pl-4">
          {/* Large number */}
          <div className="text-5xl md:text-6xl lg:text-7xl font-black text-rpm-white leading-none mb-2">
            {displayValue}
            <span className="text-rpm-red">{suffix}</span>
          </div>

          {/* Label */}
          <div className="text-rpm-silver text-sm uppercase tracking-[0.15em] mb-4">
            {label}
          </div>

          {/* Progress bar */}
          <div className="h-[2px] w-full bg-rpm-gray/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-m-blue via-m-indigo to-m-red rounded-full"
              initial={{ width: 0 }}
              animate={isInView ? { width: `${progressPercent}%` } : { width: 0 }}
              transition={{ duration: 1.5, delay: 0.3 + 0.15 * index, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsBar() {
  /* Map each stat to a "progress" percentage for the bar visual */
  const progressMap = [85, 75, 99, 100]; // Vehicles, Years, Satisfaction, Rating

  return (
    <section className="relative py-20 md:py-24 px-6 overflow-hidden">
      {/* Diagonal background slash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: "polygon(0 10%, 100% 0, 100% 90%, 0 100%)",
          background: "linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(17,17,17,0.9) 100%)",
        }}
      />

      {/* Subtle red ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat, i) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              index={i}
              progressPercent={progressMap[i]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
