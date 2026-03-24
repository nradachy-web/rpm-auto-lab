"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function CTABanner() {
  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Dark background with red gradient accents */}
      <div className="absolute inset-0 bg-rpm-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,102,177,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.10)_0%,transparent_50%)]" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 shimmer" />

      {/* M-stripe accent at top */}
      <div className="absolute top-0 left-0 right-0 m-stripe h-[2px]">
        <div /><div /><div />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rpm-red/30 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-rpm-white leading-tight mb-6">
            Ready to{" "}
            <span className="text-gradient-red">Transform</span>{" "}
            Your Ride?
          </h2>

          <p className="text-lg md:text-xl text-rpm-silver max-w-2xl mx-auto mb-4 leading-relaxed">
            We book up fast — our install bays are limited and our calendar fills
            weeks in advance. Lock in your spot before the next opening is gone.
          </p>

          <p className="text-sm text-rpm-red font-semibold uppercase tracking-widest mb-10">
            Limited availability &mdash; book your consultation today
          </p>

          <Button href="/contact" variant="primary" size="lg">
            Schedule Your Free Consultation
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
