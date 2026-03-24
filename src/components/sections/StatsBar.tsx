"use client";

import { STATS } from "@/lib/constants";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default function StatsBar() {
  return (
    <section className="relative py-16 bg-rpm-charcoal">
      {/* M-stripe accent line on top */}
      <div className="absolute top-0 left-0 right-0 m-stripe h-[2px]">
        <div /><div /><div />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((stat) => (
            <AnimatedCounter
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>

      {/* M-stripe accent line on bottom */}
      <div className="absolute bottom-0 left-0 right-0 m-stripe h-[2px] opacity-40">
        <div /><div /><div />
      </div>
    </section>
  );
}
