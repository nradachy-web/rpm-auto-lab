"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grain">
      {/* Diagonal gradient background — NOT flat black */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-rpm-dark to-[#0f0f0f]" />

      {/* Diagonal slash element */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: "polygon(60% 0, 100% 0, 100% 100%, 40% 100%)",
          background: "rgba(220, 38, 38, 0.03)",
        }}
      />

      {/* Subtle ambient glows */}
      <div className="absolute top-0 left-0 w-2/3 h-full bg-[radial-gradient(ellipse_at_20%_30%,rgba(0,102,177,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/2 h-2/3 bg-[radial-gradient(ellipse_at_80%_70%,rgba(220,38,38,0.04)_0%,transparent_60%)] pointer-events-none" />

      {/* Content — asymmetric layout */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        {/* LEFT SIDE — 60% */}
        <div className="lg:col-span-3">
          {/* Small label */}
          <motion.p
            className="text-rpm-silver/70 text-xs md:text-sm font-light uppercase tracking-[0.4em] mb-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Revive &bull; Protect &bull; Maintain
          </motion.p>

          {/* Main heading with dramatic weight contrast */}
          <h1 className="leading-[0.95] mb-8">
            <motion.span
              className="block text-4xl sm:text-5xl md:text-6xl font-thin text-rpm-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              YOUR VEHICLE
            </motion.span>
            <motion.span
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-rpm-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              DESERVES
            </motion.span>
            <motion.span
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-gradient-red tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
            >
              MORE.
            </motion.span>
          </h1>

          {/* M-stripe accent line */}
          <motion.div
            className="w-10 m-stripe h-[3px] rounded-full overflow-hidden mb-6"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ transformOrigin: "left" }}
          >
            <div /><div /><div />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-rpm-silver text-base md:text-lg max-w-xs leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Oakland County&apos;s premier auto protection lab.
            Ceramic coatings, PPF, tint &amp; wraps — done right.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95 }}
          >
            <Button href="/contact" variant="primary" size="lg">
              Get Your Free Quote
            </Button>
            <Button href="/services" variant="outline" size="lg">
              Explore Services
            </Button>
          </motion.div>
        </div>

        {/* RIGHT SIDE — 40% — abstract tachometer ring */}
        <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
          <motion.div
            className="relative w-[340px] h-[340px] xl:w-[420px] xl:h-[420px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            {/* Outer rotating ring with M-stripe gradient */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #0066B1, #1B1464, #DC2626, #0066B1)",
                opacity: 0.25,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner cutout to make it a ring */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#0d0d0d] to-rpm-dark" />

            {/* Inner decorative ring */}
            <div className="absolute inset-[30px] rounded-full border border-rpm-gray/20" />

            {/* Tick marks — tachometer style, redline in upper-right (1-2 o'clock) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = i * 15;
              // Redline zone: ticks from ~285° to 345° (roughly 19-23) = upper right quadrant
              const isRedline = angle >= 285 && angle <= 345;
              const isMajor = i % 3 === 0;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 origin-left"
                  style={{
                    width: isMajor ? "16px" : "8px",
                    height: isMajor ? "2.5px" : "1.5px",
                    transform: `rotate(${angle}deg) translateX(${135}px)`,
                    background: isRedline
                      ? "rgba(220, 38, 38, 0.7)"
                      : "rgba(138, 138, 138, 0.25)",
                    borderRadius: "1px",
                  }}
                />
              );
            })}

            {/* Tachometer needle — sweeps from idle (7:30) to redline (1:30) on load */}
            <motion.div
              className="absolute top-1/2 left-1/2 origin-left z-10"
              style={{ width: "36%", height: "2.5px", marginTop: "-1.25px" }}
              initial={{ rotate: 135 }}
              animate={{ rotate: [135, -50, -30, -48, -42] }}
              transition={{
                duration: 2.8,
                delay: 1.2,
                ease: "easeOut",
                times: [0, 0.55, 0.72, 0.86, 1],
              }}
            >
              {/* Needle body — tapers to a point */}
              <div className="w-full h-full rounded-full" style={{
                background: "linear-gradient(to right, #dc2626 0%, #dc2626 70%, transparent 100%)",
              }} />
              {/* Needle glow trail */}
              <div className="absolute inset-0 rounded-full blur-[3px]" style={{
                background: "linear-gradient(to right, rgba(220,38,38,0.5) 0%, transparent 80%)",
              }} />
            </motion.div>

            {/* Center hub cap — brushed metal look */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-rpm-gray to-rpm-dark border border-rpm-silver/20 z-20 shadow-[0_0_6px_rgba(0,0,0,0.5)]" />

            {/* Center RPM text — more visible */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span
                className="text-4xl xl:text-5xl font-black tracking-wider"
                style={{ color: "rgba(255,255,255,0.08)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              >
                RPM
              </motion.span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-rpm-silver/20 mt-0.5">
                Auto Lab
              </span>
            </div>

            {/* Red glow at the "redline" zone (upper right quadrant, ~1-2 o'clock) */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 270deg, transparent 0deg, rgba(220,38,38,0.1) 30deg, rgba(220,38,38,0.06) 60deg, transparent 90deg)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 0.5, 0.8] }}
              transition={{ duration: 3.5, delay: 1.2, times: [0, 0.4, 0.6, 0.8, 1] }}
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-8 h-8 text-rpm-silver/40" />
      </motion.div>
    </section>
  );
}
