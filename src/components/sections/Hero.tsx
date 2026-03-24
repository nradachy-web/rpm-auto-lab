"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";

function FloatingShape({
  size,
  x,
  y,
  delay,
  duration,
  rotate,
}: {
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
  rotate: number;
}) {
  return (
    <motion.div
      className="absolute border border-rpm-red/10 rounded-sm"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        y: [0, -30, 0],
        rotate: [0, rotate, 0],
        opacity: [0.15, 0.3, 0.15],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const shapes = [
  { size: 40, x: "10%", y: "20%", delay: 0, duration: 8, rotate: 90 },
  { size: 60, x: "80%", y: "15%", delay: 1.5, duration: 10, rotate: -120 },
  { size: 30, x: "70%", y: "60%", delay: 0.8, duration: 7, rotate: 180 },
  { size: 50, x: "15%", y: "70%", delay: 2, duration: 9, rotate: -90 },
  { size: 25, x: "50%", y: "30%", delay: 0.5, duration: 6, rotate: 60 },
  { size: 35, x: "90%", y: "45%", delay: 1, duration: 8, rotate: -150 },
  { size: 45, x: "30%", y: "80%", delay: 1.8, duration: 11, rotate: 120 },
  { size: 20, x: "60%", y: "85%", delay: 0.3, duration: 7, rotate: -60 },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grain">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-rpm-black via-rpm-dark to-rpm-black" />

      {/* Red radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08)_0%,transparent_70%)]" />

      {/* Floating geometric shapes */}
      {shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.p
            className="text-rpm-red text-sm md:text-base font-semibold uppercase tracking-[0.3em] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Orion Township, MI
          </motion.p>

          <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight mb-8">
            <motion.span
              className="block text-rpm-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Your Vehicle
            </motion.span>
            <motion.span
              className="block text-rpm-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Deserves
            </motion.span>
            <motion.span
              className="block text-gradient-red"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              More Than Stock
            </motion.span>
          </h1>

          <motion.p
            className="text-lg md:text-xl text-rpm-silver max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Oakland County&apos;s Premier Auto Protection Lab
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Button href="/contact" variant="primary" size="lg">
              Get Your Free Quote
            </Button>
            <Button href="/services" variant="outline" size="lg">
              Explore Services
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-8 h-8 text-rpm-silver/50" />
      </motion.div>
    </section>
  );
}
