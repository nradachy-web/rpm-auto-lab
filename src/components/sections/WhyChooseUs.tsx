"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
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

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - text */}
          <AnimatedSection direction="left">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              Why Us
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-rpm-white leading-tight mb-6">
              Why{" "}
              <span className="text-gradient-red">RPM Auto Lab</span>?
            </h2>
            <p className="text-lg text-rpm-silver leading-relaxed mb-6">
              Your vehicle is more than transportation — it&apos;s a statement.
              Most shops treat protection like an afterthought. We built an
              entire lab around it.
            </p>
            <p className="text-rpm-silver leading-relaxed">
              Every coating, film, and wrap that leaves our facility is installed
              in a controlled environment with proper lighting, climate control,
              and zero shortcuts. That&apos;s the RPM difference.
            </p>
            <div className="mt-8 h-1 w-20 bg-gradient-to-r from-rpm-red to-rpm-orange rounded-full" />
          </AnimatedSection>

          {/* Right side - feature list */}
          <div className="space-y-6">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={0.15 * i} direction="right">
                <div className="flex gap-5 p-5 rounded-xl bg-rpm-dark/50 border border-rpm-gray/30 hover:border-rpm-red/30 transition-colors duration-300 group">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center group-hover:bg-rpm-red/20 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-rpm-red" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rpm-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-rpm-silver text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
