"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Layers,
  Sun,
  Paintbrush,
  Sparkles,
  Droplets,
  Eye,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimatedSection from "@/components/ui/AnimatedSection";

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Layers,
  Sun,
  Paintbrush,
  Sparkles,
  Droplets,
  Eye,
};

function ServiceCard({
  service,
  index,
}: {
  service: (typeof SERVICES)[number];
  index: number;
}) {
  const Icon = iconMap[service.icon];

  return (
    <AnimatedSection delay={0.1 * index} direction="up">
      <Link href={`/services#${service.id}`} className="block h-full group">
        <div className="relative h-full p-6 md:p-8 bg-rpm-dark border border-rpm-gray/50 rounded-2xl transition-all duration-500 hover:scale-[1.03] hover:border-rpm-red/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] overflow-hidden">
          {/* Shimmer overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-rpm-red/5 to-transparent" />

          <div className="relative z-10">
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center mb-5 group-hover:bg-rpm-red/20 transition-colors duration-300">
                <Icon className="w-6 h-6 text-rpm-red" />
              </div>
            )}

            <h3 className="text-xl font-bold text-rpm-white mb-2 group-hover:text-rpm-red-glow transition-colors duration-300">
              {service.name}
            </h3>

            <p className="text-rpm-silver text-sm leading-relaxed mb-4">
              {service.shortDesc}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-rpm-silver text-sm">
                From{" "}
                <span className="text-rpm-white font-bold text-lg">
                  ${service.startingPrice}
                </span>
              </span>
              <span className="text-rpm-red text-sm font-semibold group-hover:translate-x-1 transition-transform duration-300 inline-flex items-center gap-1">
                Learn More
                <span aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </AnimatedSection>
  );
}

export default function ServicesPreview() {
  return (
    <section className="relative py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          badge="Our Services"
          title="What We Do"
          highlight="Best"
          description="From ceramic coatings to full vehicle wraps, we deliver obsessive attention to detail on every project that enters our lab."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
