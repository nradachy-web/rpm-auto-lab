"use client";

import { motion } from "framer-motion";
import { Award, Gem, ShieldCheck, Car } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const features = [
  {
    icon: Award,
    title: "Certified Installers",
    description:
      "Factory-trained and brand-certified technicians who treat every vehicle like their own.",
  },
  {
    icon: Gem,
    title: "Premium Materials Only",
    description:
      "We never cut corners. Only top-tier products from trusted manufacturers make it into our lab.",
  },
  {
    icon: ShieldCheck,
    title: "Lifetime Warranties",
    description:
      "Our work speaks for itself — backed by warranties that prove we stand behind every install.",
  },
  {
    icon: Car,
    title: "Convenient Drop-off",
    description:
      "Easy scheduling, complimentary vehicle pickup, and a comfortable lounge while you wait.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rpm-red/[0.03] to-transparent pointer-events-none" />

      {/* LARGE "RPM" watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <span className="text-[20vw] font-black text-rpm-white/[0.02] leading-none tracking-wider">
          RPM
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - text with dramatic typography */}
          <AnimatedSection direction="left">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              Why Us
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl text-rpm-white leading-tight mb-6">
              <span className="font-thin">Why</span>{" "}
              <span className="font-black text-gradient-red">RPM</span>{" "}
              <span className="font-thin">Auto Lab?</span>
            </h2>
            <p className="text-lg text-rpm-silver leading-relaxed mb-6 max-w-lg">
              Your vehicle is more than transportation — it&apos;s a statement.
              Most shops treat protection like an afterthought. We built an
              entire lab around it.
            </p>
            <p className="text-rpm-silver leading-relaxed max-w-lg">
              Every coating, film, and wrap that leaves our facility is installed
              in a controlled environment with proper lighting, climate control,
              and zero shortcuts. That&apos;s the RPM difference.
            </p>

            {/* Decorative element — checkered flag + M-stripe */}
            <div className="mt-10 flex items-center gap-4">
              <div className="w-20 m-stripe h-[3px] rounded-full overflow-hidden">
                <div /><div /><div />
              </div>
              {/* Checkered flag icon */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                className="text-rpm-silver/30"
              >
                <rect x="2" y="2" width="6" height="6" fill="currentColor" />
                <rect x="8" y="2" width="6" height="6" fill="currentColor" opacity="0.3" />
                <rect x="14" y="2" width="6" height="6" fill="currentColor" />
                <rect x="2" y="8" width="6" height="6" fill="currentColor" opacity="0.3" />
                <rect x="8" y="8" width="6" height="6" fill="currentColor" />
                <rect x="14" y="8" width="6" height="6" fill="currentColor" opacity="0.3" />
                <rect x="2" y="14" width="6" height="6" fill="currentColor" />
                <rect x="8" y="14" width="6" height="6" fill="currentColor" opacity="0.3" />
                <rect x="14" y="14" width="6" height="6" fill="currentColor" />
              </svg>
            </div>
          </AnimatedSection>

          {/* Right side - feature cards with red accent bar */}
          <div className="space-y-5">
            {features.map((feature, i) => {
              const num = String(i + 1).padStart(2, "0");
              return (
                <AnimatedSection
                  key={feature.title}
                  delay={0.15 * i}
                  direction="right"
                >
                  <div className="relative flex gap-5 p-5 rounded-xl bg-rpm-dark/50 overflow-hidden group cursor-default transition-all duration-300 hover:bg-rpm-dark/80">
                    {/* Left red accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-rpm-red transition-all duration-300" />

                    {/* Red fill on hover */}
                    <div className="absolute inset-0 bg-rpm-red/0 group-hover:bg-rpm-red/[0.05] transition-colors duration-300 pointer-events-none" />

                    {/* Faded number */}
                    <span className="absolute top-3 right-4 text-3xl font-black text-rpm-white/[0.04] select-none pointer-events-none">
                      {num}
                    </span>

                    <div className="relative z-10 shrink-0 w-12 h-12 rounded-xl bg-rpm-red/10 flex items-center justify-center group-hover:bg-rpm-red/20 transition-colors duration-300">
                      <feature.icon className="w-6 h-6 text-rpm-red" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-rpm-white mb-1 group-hover:text-rpm-red-glow transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-rpm-silver text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
