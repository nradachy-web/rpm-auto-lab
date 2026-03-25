import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, SERVICE_DETAILS, BRAND, BASE_PATH } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";
import {
  Shield, Layers, Sun, Paintbrush, Sparkles, Droplets, Eye,
  Check, ArrowRight, Phone, ChevronRight, Clock, Star,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Layers, Sun, Paintbrush, Sparkles, Droplets, Eye,
};

// Generate all service pages at build time
export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  if (!service) return {};

  return {
    title: `${service.name} | RPM Auto Lab`,
    description: `Professional ${service.name.toLowerCase()} services in Orion Township, MI. ${service.shortDesc}. Starting at $${service.startingPrice}.`,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id === slug);
  const details = SERVICE_DETAILS[slug];

  if (!service || !details) notFound();

  const Icon = iconMap[service.icon];
  const serviceIndex = SERVICES.findIndex((s) => s.id === slug);
  const prevService = serviceIndex > 0 ? SERVICES[serviceIndex - 1] : null;
  const nextService = serviceIndex < SERVICES.length - 1 ? SERVICES[serviceIndex + 1] : null;

  return (
    <main className="relative">
      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-rpm-dark via-rpm-black to-rpm-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(220,38,38,0.06)_0%,transparent_60%)]" />

        {/* Diagonal slash */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: "polygon(65% 0, 100% 0, 100% 100%, 35% 100%)", background: "rgba(220,38,38,0.02)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <AnimatedSection>
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-rpm-silver mb-6">
                  <Link href="/services" className="hover:text-rpm-red transition-colors">Services</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-rpm-white">{service.name}</span>
                </nav>

                <div className="flex items-center gap-4 mb-6">
                  {Icon && (
                    <div className="w-14 h-14 rounded-xl bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-rpm-red" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-rpm-white tracking-tight">
                      {service.name}
                    </h1>
                  </div>
                </div>

                <p className="text-xl md:text-2xl text-rpm-silver font-light leading-relaxed mb-8 max-w-lg">
                  {details.heroSubtitle}
                </p>

                {/* M-stripe */}
                <div className="w-16 m-stripe h-[3px] rounded-full overflow-hidden mb-8">
                  <div /><div /><div />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button href="/contact" variant="primary" size="lg">
                    Get Your Free Quote
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button href={`tel:${BRAND.phone.replace(/\D/g, "")}`} variant="outline" size="lg">
                    <Phone className="w-4 h-4" />
                    Call {BRAND.phone}
                  </Button>
                </div>
              </AnimatedSection>
            </div>

            {/* Hero Image */}
            <AnimatedSection direction="right" delay={0.2}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src={details.image}
                  alt={service.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rpm-black/30 to-transparent" />
                {/* Price badge */}
                <div className="absolute bottom-4 right-4 bg-rpm-dark/90 backdrop-blur-md border border-rpm-gray/50 rounded-xl px-5 py-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-rpm-silver block">Starting at</span>
                  <span className="text-2xl font-black text-rpm-white">${service.startingPrice.toLocaleString()}</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════ OVERVIEW ═══════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
              <div className="hidden md:flex flex-col items-center">
                <div className="w-px h-full bg-gradient-to-b from-rpm-red via-rpm-gray/30 to-transparent" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-rpm-white mb-6">
                  What is <span className="text-gradient-red">{service.name}</span>?
                </h2>
                <p className="text-lg text-rpm-silver leading-relaxed font-light">
                  {details.longDescription}
                </p>

                {/* Features grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                  {service.features.map((feature, i) => (
                    <AnimatedSection key={feature} delay={0.05 * i}>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-rpm-dark/50 border border-rpm-gray/20">
                        <div className="w-8 h-8 rounded-lg bg-rpm-red/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-rpm-red" />
                        </div>
                        <span className="text-rpm-white font-medium text-sm">{feature}</span>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ OUR PROCESS ═══════ */}
      <section className="py-20 px-6 bg-rpm-dark/50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
                Our Process
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-rpm-white">
                How We <span className="text-gradient-red">Do It</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="space-y-0">
            {details.process.map((step, i) => (
              <AnimatedSection key={i} delay={0.1 * i} direction={i % 2 === 0 ? "left" : "right"}>
                <div className="relative flex gap-6 md:gap-10 pb-12 last:pb-0">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-rpm-red/10 border-2 border-rpm-red/40 flex items-center justify-center flex-shrink-0 relative z-10">
                      <span className="text-sm font-black text-rpm-red">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    {i < details.process.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-rpm-red/30 to-rpm-gray/10 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-8">
                    <h3 className="text-xl font-bold text-rpm-white mb-2">{step.step}</h3>
                    <p className="text-rpm-silver leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY RPM ═══════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection direction="left">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
                Why RPM Auto Lab
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-rpm-white mb-6">
                The RPM <span className="text-gradient-red">Difference</span>
              </h2>
              <p className="text-rpm-silver leading-relaxed mb-8">
                We don&apos;t cut corners, rush installs, or use anything less than the best products on the market.
                Every {service.name.toLowerCase()} that leaves our lab is a reflection of our obsession with quality.
              </p>
              <div className="w-12 m-stripe h-[3px] rounded-full overflow-hidden">
                <div /><div /><div />
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right" delay={0.15}>
              <div className="space-y-4">
                {details.whyUs.map((point, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-rpm-dark border border-rpm-gray/20 hover:border-rpm-red/30 transition-colors duration-300">
                    <div className="w-8 h-8 rounded-lg bg-rpm-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-4 h-4 text-rpm-red" />
                    </div>
                    <span className="text-rpm-white font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-20 px-6 bg-rpm-dark/50">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-rpm-white">
                Common <span className="text-gradient-red">Questions</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="space-y-4">
            {details.faqs.map((faq, i) => (
              <AnimatedSection key={i} delay={0.08 * i}>
                <div className="p-6 rounded-xl bg-rpm-dark border border-rpm-gray/20 hover:border-rpm-red/20 transition-colors duration-300">
                  <h3 className="text-lg font-bold text-rpm-white mb-3 flex items-start gap-3">
                    <span className="text-rpm-red font-mono text-sm mt-1">Q.</span>
                    {faq.question}
                  </h3>
                  <p className="text-rpm-silver leading-relaxed pl-7">
                    {faq.answer}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rpm-black via-rpm-dark to-rpm-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.06)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-black text-rpm-white mb-4">
              Ready for <span className="text-gradient-red">{service.name}</span>?
            </h2>
            <p className="text-lg text-rpm-silver mb-8 max-w-lg mx-auto">
              Get a free, no-obligation quote for your vehicle.
              We&apos;ll inspect, recommend, and deliver — on your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button href="/contact" variant="primary" size="lg">
                Get Your Free Quote
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button href={`tel:${BRAND.phone.replace(/\D/g, "")}`} variant="outline" size="lg">
                <Phone className="w-4 h-4" />
                {BRAND.phone}
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-rpm-silver">
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-rpm-red" /> Free Estimates</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-rpm-red" /> Response in 24hrs</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-rpm-red" /> Warranty Included</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ PREV/NEXT NAVIGATION ═══════ */}
      <section className="border-t border-rpm-gray/20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 divide-x divide-rpm-gray/20">
          {/* Previous */}
          <div className="py-8 pr-6">
            {prevService ? (
              <Link href={`/services/${prevService.id}`} className="group block">
                <span className="text-xs uppercase tracking-wider text-rpm-silver mb-1 block">Previous Service</span>
                <span className="text-lg font-bold text-rpm-white group-hover:text-rpm-red transition-colors">
                  &larr; {prevService.name}
                </span>
              </Link>
            ) : (
              <Link href="/services" className="group block">
                <span className="text-xs uppercase tracking-wider text-rpm-silver mb-1 block">Back to</span>
                <span className="text-lg font-bold text-rpm-white group-hover:text-rpm-red transition-colors">
                  &larr; All Services
                </span>
              </Link>
            )}
          </div>

          {/* Next */}
          <div className="py-8 pl-6 text-right">
            {nextService ? (
              <Link href={`/services/${nextService.id}`} className="group block">
                <span className="text-xs uppercase tracking-wider text-rpm-silver mb-1 block">Next Service</span>
                <span className="text-lg font-bold text-rpm-white group-hover:text-rpm-red transition-colors">
                  {nextService.name} &rarr;
                </span>
              </Link>
            ) : (
              <Link href="/contact" className="group block">
                <span className="text-xs uppercase tracking-wider text-rpm-silver mb-1 block">Ready?</span>
                <span className="text-lg font-bold text-rpm-white group-hover:text-rpm-red transition-colors">
                  Get a Quote &rarr;
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
