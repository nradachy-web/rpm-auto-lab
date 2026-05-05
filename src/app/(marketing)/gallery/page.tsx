"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_PATH } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { ArrowRight, Eye, Volume2, VolumeX } from "lucide-react";

const GALLERY_ITEMS = [
  { id: 1, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Chevrolet Corvette C8 - Full Ceramic Coating", image: "corvette-c8-black.jpg" },
  { id: 2, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Cadillac CT5-V Blackwing - Full Ceramic Coating", image: "ct5v-front.jpg" },
  { id: 3, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Cadillac CT5-V Blackwing - Full Ceramic Coating", image: "ct5v-shop-sign.jpg" },
  { id: 4, serviceId: "paint-correction", service: "Paint Correction", vehicle: "Cadillac CT5-V Blackwing - Paint Correction", image: "ct5v-reflection.jpg" },
  { id: 5, serviceId: "paint-correction", service: "Paint Correction", vehicle: "Cadillac CT5-V Blackwing - Paint Correction", image: "ct5v-edge-correction.jpg" },
  { id: 6, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Cadillac CT5-V Blackwing - Full Ceramic Coating", image: "ct5v-spoiler.jpg" },
  { id: 7, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "BMW M4 Competition - Full Ceramic Coating", image: "m4-shop-front.jpg" },
  { id: 8, serviceId: "window-tint", service: "Window Tint", vehicle: "BMW M4 Competition - Limo Tint", image: "m4-rear.jpg" },
  { id: 9, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Ford Bronco Wildtrak - Full Ceramic Coating", image: "bronco-green.jpg" },
  { id: 10, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Chevrolet Corvette C8 - Full Ceramic Coating", image: "corvette-c8-blue.jpg" },
  { id: 11, serviceId: "ceramic-coating", service: "Ceramic Coating", vehicle: "Chevrolet Corvette C6 Z06 - Full Ceramic Coating", image: "corvette-c6-z06.jpg" },
  { id: 12, serviceId: "paint-correction", service: "Paint Correction", vehicle: "Chevrolet Camaro SS - Paint Correction", image: "camaro-ss.jpg" },
  { id: 13, serviceId: "detailing", service: "Detailing", vehicle: "Lamborghini Aventador - Full Detail", image: "aventador-foam.jpg" },
  { id: 14, serviceId: "detailing", service: "Detailing", vehicle: "McLaren 720S Spider - Full Detail", image: "mclaren-720s-bath.jpg" },
  { id: 15, serviceId: "paint-correction", service: "Paint Correction", vehicle: "Cadillac CT5-V Blackwing - Paint Correction", image: "paint-correction-hex.jpg" },
  { id: 16, serviceId: "paint-correction", service: "Paint Correction", vehicle: "Porsche 911 - Paint Correction", image: "porsche-911-headlight.jpg" },
  { id: 17, serviceId: "detailing", service: "Detailing", vehicle: "Porsche 911 Cabriolet - Full Detail", image: "porsche-911-cabriolet.jpg" },
  { id: 18, serviceId: "vehicle-wraps", service: "Vehicle Wraps", vehicle: "BMW M235i - Custom Wrap", image: "m235i-front.jpg" },
  { id: 19, serviceId: "vehicle-wraps", service: "Vehicle Wraps", vehicle: "BMW M235i - Custom Wrap", image: "m235i-rear.jpg" },
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

const FEATURED_REEL = {
  video: "mclaren-night.mp4",
  poster: "mclaren-night.jpg",
  tag: "Featured Build",
  vehicle: "McLaren 720S Spider",
  caption: "Multi-stage correction + ceramic coating. Shot on a closed road after the final IPA wipedown.",
};

const VERTICAL_CLIPS = [
  { id: "v1", video: "m850-studio.mp4", poster: "m850-studio.jpg", tag: "Ceramic Coating", caption: "BMW M850i - Full Ceramic Coating" },
  { id: "v2", video: "ct5v-studio.mp4", poster: "ct5v-studio.jpg", tag: "Ceramic Coating", caption: "Cadillac CT5-V Blackwing - Full Ceramic Coating" },
  { id: "v3", video: "beading-macro.mp4", poster: "beading-macro.jpg", tag: "Ceramic Coating", caption: "Audi RS3 - Ceramic Coating" },
  { id: "v4", video: "rs3-foam.mp4", poster: "rs3-foam.jpg", tag: "Detailing", caption: "Audi RS3 - Full Detail" },
  { id: "v5", video: "g80-foam.mp4", poster: "g80-foam.jpg", tag: "Detailing", caption: "BMW M3 G80 - Full Detail" },
  { id: "v6", video: "ppf-bts.mp4", poster: "ppf-bts.jpg", tag: "PPF", caption: "Cadillac CT5-V Blackwing - Full PPF" },
];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [reelMuted, setReelMuted] = useState(true);

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
              Every vehicle tells a story. Foam baths, mirror finishes, invisible
              armor, pulled straight from the bay.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Featured Reel */}
      <section className="relative py-12 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="group relative aspect-video rounded-2xl overflow-hidden border border-rpm-gray/20 hover:border-rpm-red/40 transition-all duration-500">
            <video
              src={`${BASE_PATH}/videos/clips/${FEATURED_REEL.video}`}
              poster={`${BASE_PATH}/videos/posters/${FEATURED_REEL.poster}`}
              autoPlay
              loop
              muted={reelMuted}
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rpm-black via-rpm-black/30 to-transparent" />

            <button
              type="button"
              onClick={() => setReelMuted((m) => !m)}
              aria-label={reelMuted ? "Unmute" : "Mute"}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-rpm-black/60 backdrop-blur-sm border border-rpm-gray/30 hover:border-rpm-red/50 text-rpm-white flex items-center justify-center transition-all duration-300 cursor-pointer"
            >
              {reelMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <span className="inline-block px-3 py-1 mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-black/60 backdrop-blur-sm">
                {FEATURED_REEL.tag}
              </span>
              <h3 className="text-2xl md:text-4xl font-bold text-rpm-white">{FEATURED_REEL.vehicle}</h3>
              <p className="mt-2 text-sm md:text-base text-rpm-silver max-w-xl">{FEATURED_REEL.caption}</p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Vertical Reels — From the Lab */}
      <section className="relative py-20 max-w-7xl mx-auto px-6">
        <SectionHeading
          badge="From the Lab"
          title="In"
          highlight="Motion"
          description="Short clips from the bay. Coatings curing, foam baths, and the kind of finishes you can't capture in a still."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-12">
          {VERTICAL_CLIPS.map((clip, index) => (
            <AnimatedSection key={clip.id} delay={index * 0.06}>
              <div className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-rpm-gray/20 hover:border-rpm-red/40 transition-all duration-500">
                <video
                  src={`${BASE_PATH}/videos/clips/${clip.video}`}
                  poster={`${BASE_PATH}/videos/posters/${clip.poster}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rpm-black/85 via-rpm-black/10 to-rpm-black/30" />

                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest bg-rpm-black/70 backdrop-blur-sm text-rpm-red border border-rpm-red/20">
                    {clip.tag}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-medium text-rpm-white leading-snug">{clip.caption}</p>
                </div>
              </div>
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
                  <Image
                    src={`${BASE_PATH}/images/gallery/work/${item.image}`}
                    alt={item.vehicle}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rpm-black/60 via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-rpm-black/70 backdrop-blur-sm text-rpm-red border border-rpm-red/20">
                      {item.service}
                    </span>
                  </div>

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
