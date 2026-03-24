import type { Metadata } from "next";
import { SERVICES, BRAND } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
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
} from "lucide-react";

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
    <main>
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-rpm-red/5 via-rpm-black to-rpm-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rpm-red/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <AnimatedSection>
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              What We Do
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-rpm-white leading-tight">
              Our{" "}
              <span className="text-gradient-red">Services</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="mt-6 text-lg md:text-xl text-rpm-silver max-w-2xl mx-auto leading-relaxed">
              From full-body ceramic coatings to meticulous interior detailing, we offer
              a complete suite of premium automotive protection and enhancement services.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Service Cards */}
      <section className="relative py-16 max-w-7xl mx-auto px-6">
        <div className="space-y-32">
          {SERVICES.map((service, index) => {
            const Icon = iconMap[service.icon];
            const isReversed = index % 2 !== 0;

            return (
              <AnimatedSection
                key={service.id}
                direction={isReversed ? "right" : "left"}
                delay={0.1}
              >
                <div
                  className={`flex flex-col ${
                    isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                  } gap-12 items-center`}
                >
                  {/* Image Placeholder */}
                  <div className="w-full lg:w-1/2 aspect-[4/3] relative rounded-2xl overflow-hidden group">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        index % 3 === 0
                          ? "from-rpm-red/20 via-rpm-charcoal to-rpm-dark"
                          : index % 3 === 1
                          ? "from-rpm-charcoal via-rpm-gray to-rpm-red/10"
                          : "from-rpm-dark via-rpm-red/15 to-rpm-charcoal"
                      }`}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent_70%)]" />
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 shimmer opacity-50" />
                    {/* Icon centered */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {Icon && (
                        <Icon className="w-20 h-20 text-rpm-red/40 group-hover:text-rpm-red/60 transition-colors duration-500" />
                      )}
                    </div>
                    {/* Border glow on hover */}
                    <div className="absolute inset-0 border border-rpm-gray/30 rounded-2xl group-hover:border-rpm-red/30 transition-colors duration-500" />
                  </div>

                  {/* Content */}
                  <div className="w-full lg:w-1/2 space-y-6">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-4">
                      {Icon && (
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-rpm-red/10 border border-rpm-red/20">
                          <Icon className="w-7 h-7 text-rpm-red" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-rpm-white">
                          {service.name}
                        </h2>
                        <p className="text-sm text-rpm-silver mt-1">{service.shortDesc}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-rpm-silver text-lg leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-rpm-light"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-rpm-red/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-rpm-red" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Price + CTA */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
                      <div>
                        <span className="text-xs uppercase tracking-widest text-rpm-silver">
                          Starting at
                        </span>
                        <p className="text-3xl font-bold text-rpm-white">
                          ${service.startingPrice.toLocaleString()}
                        </p>
                      </div>
                      <Button href="/contact" variant="primary" size="md">
                        Get a Quote
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Separator line */}
                {index < SERVICES.length - 1 && (
                  <div className="mt-32 h-px bg-gradient-to-r from-transparent via-rpm-gray to-transparent" />
                )}
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-rpm-red/5 via-rpm-black to-rpm-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rpm-red/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <SectionHeading
            badge="Ready to Get Started?"
            title="Your Vehicle Deserves"
            highlight="The Best"
            description="Every service begins with a free consultation. Tell us about your vehicle and goals, and we'll craft a custom protection plan tailored to your needs and budget."
          />
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" variant="primary" size="lg">
                Request a Free Quote
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href={`tel:${BRAND.phone.replace(/\D/g, "")}`} variant="outline" size="lg">
                Call {BRAND.phone}
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
