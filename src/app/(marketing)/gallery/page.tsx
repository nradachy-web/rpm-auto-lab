"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SERVICES } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { ArrowRight, Eye } from "lucide-react";

// Gallery placeholder data
const GALLERY_ITEMS = [
  {
    id: 1,
    serviceId: "ceramic-coating",
    service: "Ceramic Coating",
    vehicle: "2024 BMW M4 Competition",
    gradient: "from-rpm-red/30 via-rpm-charcoal to-rpm-dark",
  },
  {
    id: 2,
    serviceId: "paint-protection-film",
    service: "Paint Protection Film",
    vehicle: "2023 Porsche 911 GT3",
    gradient: "from-rpm-charcoal via-rpm-gray to-rpm-red/20",
  },
  {
    id: 3,
    serviceId: "window-tint",
    service: "Window Tint",
    vehicle: "2024 Mercedes-AMG G63",
    gradient: "from-rpm-dark via-rpm-red/15 to-rpm-charcoal",
  },
  {
    id: 4,
    serviceId: "vehicle-wraps",
    service: "Vehicle Wraps",
    vehicle: "2023 Tesla Model 3 — Satin Black",
    gradient: "from-rpm-gray via-rpm-dark to-rpm-red/10",
  },
  {
    id: 5,
    serviceId: "paint-correction",
    service: "Paint Correction",
    vehicle: "2022 Audi RS7 — Stage 2 Polish",
    gradient: "from-rpm-red/20 via-rpm-dark to-rpm-charcoal",
  },
  {
    id: 6,
    serviceId: "detailing",
    service: "Detailing",
    vehicle: "2024 Range Rover Sport — Full Interior",
    gradient: "from-rpm-charcoal via-rpm-red/10 to-rpm-dark",
  },
  {
    id: 7,
    serviceId: "ceramic-coating",
    service: "Ceramic Coating",
    vehicle: "2023 Corvette C8 Z06",
    gradient: "from-rpm-dark via-rpm-charcoal to-rpm-red/25",
  },
  {
    id: 8,
    serviceId: "paint-protection-film",
    service: "Paint Protection Film",
    vehicle: "2024 Ford Mustang Dark Horse",
    gradient: "from-rpm-red/15 via-rpm-gray to-rpm-dark",
  },
  {
    id: 9,
    serviceId: "window-tint",
    service: "Window Tint",
    vehicle: "2023 Cadillac Escalade — 15% All Around",
    gradient: "from-rpm-dark via-rpm-charcoal to-rpm-gray",
  },
  {
    id: 10,
    serviceId: "vehicle-wraps",
    service: "Vehicle Wraps",
    vehicle: "2024 Dodge Charger — Matte Military Green",
    gradient: "from-rpm-charcoal via-rpm-dark to-rpm-red/20",
  },
  {
    id: 11,
    serviceId: "windshield-protection",
    service: "Windshield Protection",
    vehicle: "2023 Lexus LC 500",
    gradient: "from-rpm-gray via-rpm-red/10 to-rpm-dark",
  },
  {
    id: 12,
    serviceId: "detailing",
    service: "Detailing",
    vehicle: "2024 BMW X5 M — Full Exterior Restoration",
    gradient: "from-rpm-red/20 via-rpm-charcoal to-rpm-dark",
  },
];

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "ceramic-coating", label: "Ceramic Coating" },
  { id: "paint-protection-film", label: "PPF" },
  { id: "window-tint", label: "Window Tint" },
  { id: "vehicle-wraps", label: "Wraps" },
  { id: "paint-correction", label: "Paint Correction" },
  { id: "detailing", label: "Detailing" },
];

const BEFORE_AFTER_EXAMPLES = [
  {
    beforeGradient: "from-rpm-gray/60 via-zinc-700 to-rpm-charcoal",
    afterGradient: "from-rpm-red/25 via-rpm-charcoal to-rpm-dark",
    caption: "2024 BMW M4 — Full Paint Correction + Ceramic Coating",
  },
  {
    beforeGradient: "from-zinc-600 via-rpm-gray to-rpm-dark",
    afterGradient: "from-rpm-red/20 via-rpm-dark to-rpm-charcoal",
    caption: "2023 Porsche 911 — Multi-Stage Polish + PPF",
  },
  {
    beforeGradient: "from-rpm-charcoal via-zinc-700 to-rpm-gray/80",
    afterGradient: "from-rpm-red/30 via-rpm-charcoal to-rpm-dark",
    caption: "2024 Mercedes GLE — Full Interior Detail + Ceramic Tint",
  },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems =
    activeFilter === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.serviceId === activeFilter);

  return (
    <main>
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-rpm-red/5 via-rpm-black to-rpm-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rpm-red/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimatedSection>
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              Portfolio
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-rpm-white leading-tight">
              Our Work Speaks{" "}
              <span className="text-gradient-red">For Itself</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="mt-6 text-lg md:text-xl text-rpm-silver max-w-2xl mx-auto leading-relaxed">
              Every vehicle tells a story. Here are some of our favorites -- swirl-free
              finishes, invisible protection, and transformations that turn heads.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Before / After Section */}
      <section className="relative py-16 max-w-7xl mx-auto px-6">
        <SectionHeading
          badge="Transformations"
          title="Before &"
          highlight="After"
          description="Drag the slider to see the difference our work makes. These results speak louder than any sales pitch."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BEFORE_AFTER_EXAMPLES.map((example, index) => (
            <AnimatedSection key={index} delay={index * 0.15}>
              <BeforeAfterSlider
                beforeGradient={example.beforeGradient}
                afterGradient={example.afterGradient}
                caption={example.caption}
              />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Gallery Grid with Filters */}
      <section className="relative py-16 max-w-7xl mx-auto px-6">
        <SectionHeading
          badge="Gallery"
          title="Recent"
          highlight="Projects"
          description="Browse our latest work across every service we offer."
        />

        {/* Filter Tabs */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-rpm-red text-white glow-red"
                    : "bg-rpm-charcoal text-rpm-silver border border-rpm-gray hover:border-rpm-red/50 hover:text-rpm-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Gallery Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border border-rpm-gray/20 hover:border-rpm-red/30 transition-all duration-500">
                  {/* Gradient background placeholder */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-700 group-hover:scale-110`}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.08),transparent_70%)]" />
                  <div className="absolute inset-0 shimmer opacity-40" />

                  {/* Service tag */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-rpm-black/70 backdrop-blur-sm text-rpm-red border border-rpm-red/20">
                      {item.service}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-rpm-black/0 group-hover:bg-rpm-black/60 transition-all duration-500 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rpm-red/20 border border-rpm-red/40 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-rpm-red" />
                      </div>
                      <span className="text-sm font-semibold uppercase tracking-widest text-rpm-white">
                        View Details
                      </span>
                    </div>
                  </div>

                  {/* Bottom vehicle info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-rpm-black/80 via-rpm-black/40 to-transparent">
                    <p className="text-sm font-medium text-rpm-white truncate">
                      {item.vehicle}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-rpm-silver text-lg">
              No projects found for this category yet.
            </p>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-rpm-red/5 via-rpm-black to-rpm-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rpm-red/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <SectionHeading
            badge="Your Vehicle Next?"
            title="Ready for a"
            highlight="Transformation?"
            description="Whether you're protecting a brand-new purchase or restoring a daily driver, we'll make it look its absolute best."
          />
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" variant="primary" size="lg">
                Get a Free Quote
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href="/services" variant="outline" size="lg">
                Explore Services
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
