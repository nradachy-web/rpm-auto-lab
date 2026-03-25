"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { BASE_PATH } from "@/lib/constants";
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

        {/* RIGHT SIDE — 40% — Premium Tachometer with Logo */}
        <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
          <motion.div
            className="relative w-[360px] h-[360px] xl:w-[440px] xl:h-[440px]"
            initial={{ opacity: 0, scale: 0.85, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.08)_0%,transparent_70%)]" />

            {/* Outer M-stripe ring — slow rotate */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "conic-gradient(from 0deg, #0066B1, #1B1464, #DC2626, #0066B1)", opacity: 0.3 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner cutout */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />

            {/* Subtle inner ring */}
            <div className="absolute inset-[20px] rounded-full border border-rpm-gray/10" />

            {/* Gauge face — subtle radial gradient for depth */}
            <div className="absolute inset-[22px] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

            {/* Major tick marks with RPM numbers */}
            {Array.from({ length: 9 }).map((_, i) => {
              // 0-8 representing 0-8000 RPM
              // Gauge spans from 135° (0 RPM, 7:30 position) to -45° (8000 RPM, 1:30 position)
              // Total sweep: 180° over 9 marks
              const angle = 135 - i * 22.5;
              const isRedline = i >= 7; // 7000+ RPM
              const radius = 155; // xl size adjusted
              return (
                <div key={`major-${i}`}>
                  {/* Major tick */}
                  <div
                    className="absolute top-1/2 left-1/2 origin-left"
                    style={{
                      width: "14px",
                      height: isRedline ? "3px" : "2px",
                      transform: `rotate(${angle}deg) translateX(${radius - 14}px)`,
                      background: isRedline ? "rgba(220, 38, 38, 0.8)" : "rgba(200, 200, 200, 0.35)",
                      borderRadius: "1px",
                    }}
                  />
                  {/* Number label */}
                  <div
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{
                      transform: `rotate(${angle}deg) translateX(${radius - 30}px) rotate(${-angle}deg)`,
                      marginTop: "-6px",
                      marginLeft: "-6px",
                    }}
                  >
                    <span
                      className="text-[10px] font-bold block text-center w-3"
                      style={{ color: isRedline ? "rgba(220, 38, 38, 0.7)" : "rgba(180, 180, 180, 0.3)" }}
                    >
                      {i}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Minor tick marks between majors */}
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = 135 - i * 4.5;
              if (angle < -45) return null;
              // Skip positions where major ticks are
              if (i % 5 === 0) return null;
              const isRedline = angle < -112.5; // past 7000 RPM
              return (
                <div
                  key={`minor-${i}`}
                  className="absolute top-1/2 left-1/2 origin-left"
                  style={{
                    width: "6px",
                    height: "1px",
                    transform: `rotate(${angle}deg) translateX(${141}px)`,
                    background: isRedline ? "rgba(220, 38, 38, 0.4)" : "rgba(138, 138, 138, 0.15)",
                  }}
                />
              );
            })}

            {/* RPM x1000 label */}
            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[8px] uppercase tracking-[0.15em] text-rpm-silver/20 font-medium">
                rpm x1000
              </span>
            </div>

            {/* ── NEEDLE ── Tapered, dramatic sweep with bounce */}
            <motion.div
              className="absolute top-1/2 left-1/2 origin-left z-10"
              style={{ width: "38%", height: "0px", marginTop: "0px" }}
              initial={{ rotate: 135 }}
              animate={{ rotate: [135, 135, -55, -25, -48, -35, -42] }}
              transition={{
                duration: 3.5,
                delay: 0.8,
                ease: "easeOut",
                times: [0, 0.15, 0.55, 0.68, 0.78, 0.88, 1],
              }}
            >
              {/* Needle — tapered SVG for proper look */}
              <svg
                className="absolute -top-[6px] left-0"
                width="100%"
                height="12"
                viewBox="0 0 160 12"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="85%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Tapered needle shape: wide at base, thin at tip */}
                <polygon points="0,3 0,9 155,5.5 155,6.5" fill="url(#needleGrad)" />
              </svg>
              {/* Glow trail */}
              <div
                className="absolute -top-[4px] left-0 right-0 h-[8px] blur-[4px] rounded-full"
                style={{ background: "linear-gradient(to right, rgba(220,38,38,0.6) 0%, rgba(220,38,38,0.2) 60%, transparent 90%)" }}
              />
            </motion.div>

            {/* Center hub — layered for depth */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rpm-gray/60 to-rpm-dark shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
              <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-rpm-gray/20 to-transparent" />
            </div>

            {/* ── CENTER LOGO ── The actual RPM Auto Lab logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.12, scale: 1 }}
                transition={{ duration: 1.5, delay: 0.6 }}
              >
                <Image
                  src={`${BASE_PATH}/logo.png`}
                  alt=""
                  width={180}
                  height={180}
                  className="invert brightness-200 w-[140px] h-[140px] xl:w-[170px] xl:h-[170px]"
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            {/* Redline glow zone — pulses when needle hits */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "conic-gradient(from 285deg, transparent 0deg, rgba(220,38,38,0.12) 20deg, rgba(220,38,38,0.08) 50deg, transparent 75deg)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0, 1, 0.5, 0.9] }}
              transition={{ duration: 4, delay: 0.8, times: [0, 0.3, 0.5, 0.6, 0.8, 1] }}
            />

            {/* Redline flash — brief bright flash when needle first hits redline */}
            <motion.div
              className="absolute inset-[20px] rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.15, 0, 0] }}
              transition={{ duration: 3.5, delay: 0.8, times: [0, 0.5, 0.56, 0.7, 1] }}
              style={{ background: "radial-gradient(circle at 70% 25%, rgba(220,38,38,0.4), transparent 60%)" }}
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
