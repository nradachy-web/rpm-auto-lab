"use client";

import Image from "next/image";
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
import { SERVICES, HIDE_PRICE_SERVICES } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  Shield,
  Layers,
  Sun,
  Paintbrush,
  Sparkles,
  Droplets,
  Eye,
};

/* Background image per service id (mirrors /services/[slug] hero) */
const cardImages: Record<string, string> = {
  "ceramic-coating": "/rpm-auto-lab/images/services/ceramic-coating.jpg",
  "paint-protection-film": "/rpm-auto-lab/images/services/ppf.jpg",
  "window-tint": "/rpm-auto-lab/images/services/window-tint.jpg",
  "vehicle-wraps": "/rpm-auto-lab/images/services/vehicle-wraps.jpg",
  "paint-correction": "/rpm-auto-lab/images/services/paint-correction.jpg",
  "detailing": "/rpm-auto-lab/images/services/detailing.jpg",
  "windshield-protection": "/rpm-auto-lab/images/services/windshield-protection.jpg",
};

function ServiceCard({
  service,
  index,
  featured,
}: {
  service: (typeof SERVICES)[number];
  index: number;
  featured?: boolean;
}) {
  const Icon = iconMap[service.icon];
  const num = String(index + 1).padStart(2, "0");
  const bgImage = cardImages[service.id];

  return (
    <AnimatedSection delay={0.08 * index} direction="up">
      <Link
        href={`/services/${service.id}`}
        className={`block h-full group ${featured ? "md:col-span-2" : ""}`}
      >
        <div
          className={`relative h-full rounded-2xl transition-all duration-500 overflow-hidden bg-rpm-dark
            hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.18),0_0_50px_rgba(0,102,177,0.08)]
            ${featured ? "p-8 md:p-10" : "p-6 md:p-8"}`}
        >
          {/* Background photo — scales up slightly on hover */}
          {bgImage && (
            <>
              <Image
                src={bgImage}
                alt=""
                fill
                sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-105 select-none pointer-events-none"
                priority={index === 0}
              />
              {/* Two-layer gradient overlay keeps text readable on any photo:
                  strong black wash at bottom for the price/CTA row, lighter
                  black wash at top so the photo shows through but headings
                  still sit on dark background. */}
              <div className="absolute inset-0 bg-gradient-to-t from-rpm-black via-rpm-black/80 to-rpm-black/55 group-hover:from-rpm-black/95 group-hover:to-rpm-black/45 transition-colors duration-500 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-rpm-red/10 via-transparent to-transparent pointer-events-none" />
            </>
          )}
          {/* Top red accent line — hidden by default, shows on hover */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rpm-red via-rpm-orange to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

          {/* Faded number in corner */}
          <span
            className={`absolute top-4 right-4 font-black text-rpm-white/[0.04] select-none pointer-events-none ${
              featured ? "text-8xl" : "text-6xl"
            }`}
          >
            {num}
          </span>

          {/* Large semi-transparent icon for featured card */}
          {featured && Icon && (
            <Icon className="absolute -bottom-4 -right-4 w-40 h-40 text-rpm-red/[0.06] pointer-events-none" />
          )}

          <div className="relative z-10">
            {Icon && (
              <div
                className={`rounded-xl bg-rpm-red/10 flex items-center justify-center mb-5 group-hover:bg-rpm-red/20 transition-colors duration-300 ${
                  featured ? "w-14 h-14" : "w-12 h-12"
                }`}
              >
                <Icon
                  className={`text-rpm-red ${featured ? "w-7 h-7" : "w-6 h-6"}`}
                />
              </div>
            )}

            <h3
              className={`font-bold text-rpm-white mb-2 group-hover:text-rpm-red-glow transition-colors duration-300 ${
                featured ? "text-2xl" : "text-xl"
              }`}
            >
              {service.name}
            </h3>

            <p
              className={`text-rpm-silver leading-relaxed mb-5 ${
                featured ? "text-base max-w-md" : "text-sm"
              }`}
            >
              {featured ? service.description : service.shortDesc}
            </p>

            <div className="flex items-center justify-between">
              {HIDE_PRICE_SERVICES.has(service.id) ? (
                <span className="text-rpm-silver text-sm">
                  <span className={`text-rpm-white font-bold ${featured ? "text-xl" : "text-base"}`}>
                    Custom Quote
                  </span>
                </span>
              ) : (
                <span className="text-rpm-silver text-sm">
                  From{" "}
                  <span
                    className={`text-rpm-white font-bold ${
                      featured ? "text-2xl" : "text-lg"
                    }`}
                  >
                    ${service.startingPrice}
                  </span>
                </span>
              )}
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
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle noise texture */}
      <div className="absolute inset-0 grain pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Custom heading — not using SectionHeading for uniqueness */}
        <AnimatedSection className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-rpm-red">
              What We Do
            </span>
            <div className="h-px flex-1 max-w-[60px] bg-rpm-red/30" />
            {/* Small tachometer icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-rpm-red/50"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="10"
                y1="10"
                x2="14"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl text-rpm-white leading-tight">
            <span className="font-light">Services Built for</span>{" "}
            <span className="font-black text-gradient-red">Perfection</span>
          </h2>
          <p className="mt-4 text-lg text-rpm-silver max-w-xl leading-relaxed">
            From ceramic coatings to full vehicle wraps, we deliver obsessive
            attention to detail on every project that enters our lab.
          </p>
        </AnimatedSection>

        {/* Bento grid: first card spans 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Featured first card — spans 2 columns */}
          <div className="md:col-span-2">
            <ServiceCard service={SERVICES[0]} index={0} featured />
          </div>
          {SERVICES.slice(1).map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
