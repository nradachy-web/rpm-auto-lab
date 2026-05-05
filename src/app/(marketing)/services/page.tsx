import type { Metadata } from "next";
import Image from "next/image";
import { SERVICES, BRAND, HIDE_PRICE_SERVICES } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";
import {
  Shield,
  Layers,
  Sun,
  Paintbrush,
  Sparkles,
  Droplets,
  Eye,
  Check,
  ArrowRight,
  Phone,
} from "lucide-react";

const serviceImages: Record<string, string> = {
  "ceramic-coating": "/rpm-auto-lab/images/services/ceramic-coating.jpg",
  "paint-protection-film": "/rpm-auto-lab/images/services/ppf.jpg",
  "window-tint": "/rpm-auto-lab/images/services/window-tint.jpg",
  "vehicle-wraps": "/rpm-auto-lab/images/services/vehicle-wraps.jpg",
  "paint-correction": "/rpm-auto-lab/images/services/paint-correction.jpg",
  "detailing": "/rpm-auto-lab/images/services/detailing.jpg",
  "windshield-protection": "/rpm-auto-lab/images/services/windshield-protection.jpg",
};

export const metadata: Metadata = {
  title: "Services",
  description:
    "Professional ceramic coating, paint protection film, window tint, vehicle wraps, paint correction, and detailing services in Orion Township, MI.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Layers,
  Sun,
  Paintbrush,
  Sparkles,
  Droplets,
  Eye,
};

export default function ServicesPage() {
  return (
    <main className="relative">
      {/* Vertical M-Stripe running down left margin */}
      <div className="hidden lg:block fixed left-8 top-0 bottom-0 z-40 pointer-events-none">
        <div className="m-stripe-vertical h-full opacity-20" aria-hidden="true">
          <div /><div /><div />
        </div>
      </div>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-24">
        {/* Diagonal slash background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-rpm-black" />
          <div
            className="absolute top-0 right-0 w-[70%] h-full bg-rpm-charcoal"
            style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 10% 100%)" }}
          />
          <div
            className="absolute top-0 right-0 w-[70%] h-full bg-gradient-to-br from-rpm-red/5 to-transparent"
            style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 10% 100%)" }}
          />
        </div>

        {/* M-stripe accent line */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="m-stripe" aria-hidden="true">
            <div /><div /><div />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <span className="inline-block px-5 py-2 mb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-m-blue border border-m-blue/30 bg-m-blue/5">
              Premium Automotive Protection
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="leading-none">
              <span className="block text-4xl md:text-5xl font-extralight text-rpm-silver tracking-wide">
                Our
              </span>
              <span className="block text-6xl md:text-7xl lg:text-8xl font-black text-gradient-red tracking-tight mt-1">
                Services
              </span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="mt-8 text-lg md:text-xl text-rpm-silver max-w-xl leading-relaxed font-light">
              A complete suite of premium automotive protection and enhancement —
              from molecular-level coatings to full vehicle transformations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ SERVICES ═══════════════════ */}
      <section className="relative">
        {SERVICES.map((service, index) => {
          const Icon = iconMap[service.icon];
          const isEven = index % 2 !== 0;
          const num = String(index + 1).padStart(2, "0");

          // Alternate subtle background treatments
          const bgClasses = [
            "bg-rpm-black",
            "bg-rpm-dark",
            "bg-gradient-to-br from-rpm-black to-rpm-dark",
            "bg-rpm-dark",
            "bg-rpm-black",
            "bg-gradient-to-bl from-rpm-dark to-rpm-black",
            "bg-rpm-dark",
          ][index] ?? "bg-rpm-black";

          return (
            <div key={service.id}>
              <section className={`relative py-20 md:py-28 overflow-hidden ${bgClasses}`}>
                {/* Large faded number */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isEven ? "right-6 md:right-16" : "left-6 md:left-16"
                  } select-none pointer-events-none`}
                  aria-hidden="true"
                >
                  <span className="text-[12rem] md:text-[18rem] font-black text-rpm-white/[0.03] leading-none">
                    {num}
                  </span>
                </div>

                {/* Subtle diagonal accent for even sections */}
                {isEven && (
                  <div
                    className="absolute top-0 left-0 w-[40%] h-full bg-rpm-red/[0.02]"
                    style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-16">
                  <AnimatedSection direction={isEven ? "right" : "left"} delay={0.1}>
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${isEven ? "direction-rtl" : ""}`}>
                      {/* Service Image */}
                      {serviceImages[service.id] && (
                        <div className={`relative aspect-[16/10] rounded-2xl overflow-hidden ${isEven ? "lg:order-2" : ""}`}>
                          <Image
                            src={serviceImages[service.id]}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-rpm-black/40 to-transparent" />
                        </div>
                      )}

                      {/* Service Content */}
                      <div className={`flex flex-col ${isEven ? "items-end text-right lg:order-1" : "items-start text-left"}`} style={{ direction: "ltr" }}>
                      {/* Service number + icon row */}
                      <div className={`flex items-center gap-4 mb-6 ${isEven ? "flex-row-reverse" : ""}`}>
                        <span className="text-sm font-mono font-bold text-m-blue tracking-widest">
                          {num}
                        </span>
                        <div className="w-px h-6 bg-rpm-gray" />
                        {Icon && (
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-rpm-red/10 border border-rpm-red/20">
                            <Icon className="w-6 h-6 text-rpm-red" />
                          </div>
                        )}
                      </div>

                      {/* Service name */}
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-rpm-white tracking-tight mb-2">
                        {service.name}
                      </h2>
                      <p className="text-sm uppercase tracking-[0.15em] text-rpm-silver font-medium mb-6">
                        {service.shortDesc}
                      </p>

                      {/* Description */}
                      <p className={`text-rpm-silver text-lg leading-relaxed font-light max-w-2xl mb-8 ${isEven ? "ml-auto" : ""}`}>
                        {service.description}
                      </p>

                      {/* Features — 2 col grid */}
                      <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-10 ${isEven ? "ml-auto" : ""}`}>
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className={`flex items-center gap-3 text-rpm-light ${isEven ? "flex-row-reverse" : ""}`}
                          >
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-m-blue/15 flex items-center justify-center">
                              <Check className="w-3 h-3 text-m-blue" />
                            </div>
                            <span className="text-sm font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Price + CTAs — primary goes to the dedicated service detail page,
                          secondary goes straight to the quote form for decided buyers */}
                      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 ${isEven ? "sm:flex-row-reverse" : ""}`}>
                        <div className={isEven ? "text-right" : ""}>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-rpm-silver font-bold block mb-1">
                            {HIDE_PRICE_SERVICES.has(service.id) ? "Pricing" : "Starting At"}
                          </span>
                          <p className="text-4xl font-black text-rpm-white">
                            {HIDE_PRICE_SERVICES.has(service.id)
                              ? "Custom"
                              : `$${service.startingPrice.toLocaleString()}`}
                          </p>
                        </div>
                        <div className={`flex flex-col sm:flex-row gap-3 ${isEven ? "sm:flex-row-reverse" : ""}`}>
                          <Button href={`/services/${service.id}`} variant="primary" size="md">
                            Learn More
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <Button href="/contact" variant="outline" size="md">
                            Get a Quote
                          </Button>
                        </div>
                      </div>
                      </div>
                    </div>
                  </AnimatedSection>
                </div>
              </section>

              {/* M-stripe divider between services */}
              {index < SERVICES.length - 1 && (
                <div className="m-stripe" aria-hidden="true">
                  <div /><div /><div />
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ═══════════════════ BOTTOM CTA ═══════════════════ */}
      <section className="relative py-32 overflow-hidden">
        {/* Angular background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-rpm-black" />
          <div
            className="absolute inset-0 bg-rpm-charcoal"
            style={{ clipPath: "polygon(0 15%, 100% 0, 100% 85%, 0 100%)" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-m-blue/10 via-m-indigo/10 to-m-red/10"
            style={{ clipPath: "polygon(0 15%, 100% 0, 100% 85%, 0 100%)" }}
          />
        </div>

        {/* M-stripe top */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="m-stripe" aria-hidden="true">
            <div /><div /><div />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-rpm-red border border-rpm-red/30 bg-rpm-red/5">
              Ready to Get Started?
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="leading-none mb-6">
              <span className="block text-3xl md:text-4xl font-extralight text-rpm-silver tracking-wide">
                Your Vehicle Deserves
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-gradient-red tracking-tight mt-2">
                The Best
              </span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-lg text-rpm-silver max-w-2xl mx-auto leading-relaxed font-light mb-10">
              Every service begins with a free consultation. Tell us about your vehicle and goals,
              and we&apos;ll craft a custom protection plan tailored to your needs and budget.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" variant="primary" size="lg" className="pulse-glow">
                Request a Free Quote
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href={`tel:${BRAND.phone.replace(/\D/g, "")}`} variant="outline" size="lg">
                <Phone className="w-4 h-4" />
                {BRAND.phone}
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
