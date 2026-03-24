"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function CTABanner() {
  return (
    <section className="relative py-28 md:py-36 px-6 overflow-hidden">
      {/* Angular clipped background */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: "polygon(0 8%, 100% 0, 100% 92%, 0 100%)",
          background: "linear-gradient(135deg, #111111 0%, #0d0d0d 50%, #111111 100%)",
        }}
      />

      {/* M-stripe along top diagonal edge */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          clipPath: "polygon(0 100%, 100% 0, 100% 100%)",
          background: "linear-gradient(90deg, #0066B1, #1B1464, #DC2626)",
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <AnimatedSection>
          {/* Dramatic heading with weight contrast */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl text-rpm-white leading-[1.05] mb-6">
            <span className="font-thin">READY TO</span>
            <br />
            <span className="font-black text-gradient-red text-5xl md:text-7xl lg:text-8xl">
              TRANSFORM
            </span>
            <br />
            <span className="font-thin">YOUR RIDE?</span>
          </h2>

          <p className="text-lg md:text-xl text-rpm-silver max-w-2xl mx-auto mb-4 leading-relaxed">
            We book up fast — our install bays are limited and our calendar fills
            weeks in advance. Lock in your spot before the next opening is gone.
          </p>

          {/* Urgency text */}
          <p className="text-sm text-rpm-red font-semibold uppercase tracking-[0.2em] mb-10">
            Limited booking slots available this month
          </p>

          {/* Pulsing CTA button */}
          <div className="relative inline-block">
            {/* Pulsing glow behind button */}
            <motion.div
              className="absolute -inset-3 rounded-xl bg-rpm-red/20 blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <Button href="/contact" variant="primary" size="lg" className="px-10 py-5 text-lg">
                Schedule Your Free Consultation
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* M-stripe along bottom diagonal edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
          background: "linear-gradient(90deg, #DC2626, #1B1464, #0066B1)",
        }}
      />
    </section>
  );
}
