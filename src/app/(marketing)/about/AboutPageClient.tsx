"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";
import {
  Award,
  Target,
  Heart,
  Lightbulb,
  ArrowRight,
  Shield,
  Wrench,
  Clock,
  BadgeCheck,
  Phone,
} from "lucide-react";
import { BRAND } from "@/lib/constants";

const values = [
  {
    icon: Target,
    title: "Precision",
    accent: "border-l-m-blue",
    accentBg: "bg-m-blue/10",
    accentText: "text-m-blue",
    description:
      "Every cut, every application, every detail is executed with surgical accuracy. We measure twice and cut once — because your vehicle deserves nothing less than perfection.",
  },
  {
    icon: Award,
    title: "Quality",
    accent: "border-l-m-red",
    accentBg: "bg-m-red/10",
    accentText: "text-m-red",
    description:
      "We only use professional-grade materials from industry-leading brands. No shortcuts, no compromises — just results that speak for themselves years down the road.",
  },
  {
    icon: Heart,
    title: "Integrity",
    accent: "border-l-m-indigo",
    accentBg: "bg-m-indigo/10",
    accentText: "text-m-indigo",
    description:
      "Honest pricing, transparent timelines, and straightforward advice. We treat every vehicle like our own and every customer like family.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    accent: "border-l-rpm-red",
    accentBg: "bg-gradient-to-r from-m-blue/10 to-m-red/10",
    accentText: "text-rpm-red",
    description:
      "We stay ahead of the curve with the latest techniques, tools, and materials. From nano-ceramic coatings to self-healing films, we bring the future of protection to your garage.",
  },
];

const differentiators = [
  {
    icon: Shield,
    title: "Certified Installers",
    description:
      "Our team is factory-trained and certified by the brands we use. Every installation meets or exceeds manufacturer standards.",
  },
  {
    icon: Wrench,
    title: "Climate-Controlled Facility",
    description:
      "Our clean, dust-free workspace ensures flawless film application and coating adhesion — no contaminants, no imperfections.",
  },
  {
    icon: Clock,
    title: "Lifetime Support",
    description:
      "Our relationship doesn't end when you drive away. We offer maintenance programs and warranty support for the life of your protection.",
  },
  {
    icon: BadgeCheck,
    title: "Warranty-Backed Work",
    description:
      "Every service comes with a written warranty. From ceramic coatings to PPF, we stand behind our work with confidence.",
  },
];

const trustedBrands = [
  { name: "3M", size: "text-3xl md:text-4xl" },
  { name: "AVERY DENNISON", size: "text-lg md:text-xl" },
  { name: "XPEL", size: "text-3xl md:text-4xl" },
  { name: "CERAMIC PRO", size: "text-lg md:text-xl" },
  { name: "SUNTEK", size: "text-2xl md:text-3xl" },
];

const team = [
  {
    name: "Shop Owner",
    role: "Founder & Lead Installer",
    bio: "15+ years of experience in automotive protection and detailing.",
  },
  {
    name: "Lead Technician",
    role: "PPF & Wrap Specialist",
    bio: "Certified installer with a passion for precision and clean lines.",
  },
  {
    name: "Detail Lead",
    role: "Paint Correction & Coating",
    bio: "Obsessed with paint clarity and achieving that mirror finish.",
  },
];

export default function AboutPageClient() {
  return (
    <>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Asymmetric diagonal background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-rpm-black" />
          <div
            className="absolute top-0 left-0 w-[60%] h-full bg-rpm-charcoal"
            style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
          />
          <div
            className="absolute top-0 left-0 w-[60%] h-full bg-gradient-to-br from-m-blue/5 via-m-indigo/5 to-transparent"
            style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
          />
        </div>

        {/* M-stripe accent bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="m-stripe" aria-hidden="true">
            <div /><div /><div />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <span className="inline-block px-5 py-2 mb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-m-blue border border-m-blue/30 bg-m-blue/5">
              Our Story
            </span>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h1 className="leading-none">
              <span className="block text-4xl md:text-5xl font-extralight text-rpm-silver tracking-wide">
                About
              </span>
              <span className="block text-6xl md:text-7xl lg:text-8xl font-black text-rpm-white tracking-tight mt-1">
                RPM Auto Lab
              </span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="mt-8 text-lg md:text-xl text-rpm-silver max-w-xl leading-relaxed font-light">
              Where passion for automotive perfection meets cutting-edge
              protection technology. Every vehicle that leaves our shop is a
              testament to our craft.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ STORY ═══════════════════ */}
      <section className="py-24 bg-rpm-dark relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none" aria-hidden="true">
          <span className="text-[14rem] md:text-[20rem] font-black text-rpm-white/[0.02] leading-none whitespace-nowrap">
            RPM
          </span>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left column — badge + heading */}
            <div className="lg:col-span-2">
              <AnimatedSection direction="left">
                <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-rpm-red border border-rpm-red/30 bg-rpm-red/5">
                  Est. Michigan
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-rpm-white leading-tight tracking-tight">
                  Founded with a simple mission — to give every vehicle the
                  protection it deserves.
                </h2>
                {/* Large quotation mark */}
                <div className="mt-8 text-[8rem] leading-none font-black text-m-blue/10 select-none" aria-hidden="true">
                  &ldquo;
                </div>
              </AnimatedSection>
            </div>

            {/* Right column — glassmorphism card with story */}
            <div className="lg:col-span-3">
              <AnimatedSection direction="right">
                <div className="relative rounded-2xl border border-rpm-gray/50 bg-rpm-charcoal/60 backdrop-blur-sm p-8 md:p-12">
                  {/* Subtle top gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-m-blue via-m-indigo to-m-red" />

                  <div className="space-y-5 text-rpm-silver leading-relaxed font-light text-lg">
                    <p>
                      RPM Auto Lab was born out of a genuine obsession with
                      automotive care. What started as a passion for keeping our own
                      cars looking showroom-fresh quickly evolved into a mission to
                      bring that same level of care to every vehicle that rolls
                      through our doors.
                    </p>
                    <p>
                      We spent years learning the science behind paint protection —
                      studying ceramic molecular bonding, thermoplastic urethane
                      film technology, and the art of multi-stage paint correction.
                      That deep understanding of materials and technique is what sets
                      our work apart from the rest.
                    </p>
                    <p>
                      Today, we operate out of a purpose-built, climate-controlled
                      facility in Orion Township, Michigan, equipped with the tools
                      and environment needed to deliver results that exceed factory
                      standards. Every service we offer is backed by premium
                      materials, trained hands, and an uncompromising attention to
                      detail.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VALUES ═══════════════════ */}
      <section className="py-24 bg-rpm-black relative">
        {/* Subtle diagonal accent */}
        <div
          className="absolute top-0 right-0 w-[30%] h-full bg-rpm-charcoal/30"
          style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0 100%)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <div className="mb-16">
              <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-m-blue border border-m-blue/30 bg-m-blue/5">
                What We Stand For
              </span>
              <h2 className="leading-none">
                <span className="block text-3xl md:text-4xl font-extralight text-rpm-silver tracking-wide">
                  Our Core
                </span>
                <span className="block text-5xl md:text-6xl font-black text-rpm-white tracking-tight mt-1">
                  Values
                </span>
              </h2>
              <p className="mt-4 text-lg text-rpm-silver max-w-xl leading-relaxed font-light">
                These aren&apos;t just words on a wall. They&apos;re the standards we hold ourselves
                to on every single job.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <AnimatedSection key={value.title} delay={i * 0.1}>
                <div
                  className={`group h-full p-8 rounded-xl bg-rpm-dark/80 backdrop-blur-sm border border-rpm-gray/40 hover:border-rpm-gray/60 transition-all duration-500 border-l-4 ${value.accent}`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg ${value.accentBg} flex items-center justify-center mb-6`}
                  >
                    <value.icon className={`w-6 h-6 ${value.accentText}`} />
                  </div>
                  <h3 className="text-xl font-black text-rpm-white tracking-tight mb-3 uppercase">
                    {value.title}
                  </h3>
                  <p className="text-rpm-silver text-sm leading-relaxed font-light">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ M-STRIPE DIVIDER ═══════════════════ */}
      <div className="m-stripe" aria-hidden="true">
        <div /><div /><div />
      </div>

      {/* ═══════════════════ WHAT SETS US APART ═══════════════════ */}
      <section className="py-24 bg-rpm-dark relative overflow-hidden">
        {/* Subtle angled accent */}
        <div
          className="absolute top-0 left-0 w-[50%] h-full bg-rpm-black/40"
          style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <div className="mb-16">
              <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-rpm-red border border-rpm-red/30 bg-rpm-red/5">
                The RPM Advantage
              </span>
              <h2 className="leading-none">
                <span className="block text-3xl md:text-4xl font-extralight text-rpm-silver tracking-wide">
                  What Sets Us
                </span>
                <span className="block text-5xl md:text-6xl font-black text-gradient-red tracking-tight mt-1">
                  Apart
                </span>
              </h2>
              <p className="mt-4 text-lg text-rpm-silver max-w-xl leading-relaxed font-light">
                It&apos;s the details that make the difference. Here&apos;s why customers trust us
                with their most prized vehicles.
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-8 max-w-4xl">
            {differentiators.map((item, i) => {
              const num = String(i + 1).padStart(2, "0");
              return (
                <AnimatedSection key={item.title} delay={i * 0.1} direction="left">
                  <div className="flex gap-6 md:gap-10 items-start group">
                    {/* Large number */}
                    <div className="flex-shrink-0 w-16 md:w-20">
                      <span className="text-5xl md:text-6xl font-black text-rpm-white/10 group-hover:text-m-blue/30 transition-colors duration-500">
                        {num}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8 border-b border-rpm-gray/30">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-rpm-red/10 border border-rpm-red/20 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-rpm-red" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-rpm-white tracking-tight">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-rpm-silver leading-relaxed font-light ml-14">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TEAM ═══════════════════ */}
      <section className="py-24 bg-rpm-black relative">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <div className="mb-16">
              <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-m-blue border border-m-blue/30 bg-m-blue/5">
                The Team
              </span>
              <h2 className="leading-none">
                <span className="block text-3xl md:text-4xl font-extralight text-rpm-silver tracking-wide">
                  Meet the
                </span>
                <span className="block text-5xl md:text-6xl font-black text-rpm-white tracking-tight mt-1">
                  Crew
                </span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <AnimatedSection key={member.role} delay={i * 0.15}>
                <div className="group rounded-xl overflow-hidden bg-rpm-dark border border-rpm-gray/40 hover:border-rpm-gray/60 transition-all duration-500">
                  {/* Dark card with role as visual element */}
                  <div className="relative h-48 bg-rpm-charcoal overflow-hidden">
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rpm-gray/20 to-transparent" />
                    {/* Large role text as design element */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <span className="text-center text-lg font-black uppercase tracking-[0.15em] text-rpm-white/10 group-hover:text-rpm-white/15 transition-colors duration-500">
                        {member.role}
                      </span>
                    </div>
                    {/* M-stripe at bottom of card image area */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="m-stripe" aria-hidden="true">
                        <div /><div /><div />
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-black text-rpm-white tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-m-blue text-sm font-bold uppercase tracking-wider mb-3">
                      {member.role}
                    </p>
                    <p className="text-rpm-silver text-sm font-light leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUSTED BRANDS ═══════════════════ */}
      <section className="py-20 bg-rpm-dark relative">
        {/* Top M-stripe */}
        <div className="absolute top-0 left-0 right-0">
          <div className="m-stripe" aria-hidden="true">
            <div /><div /><div />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="inline-block px-5 py-2 mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-rpm-silver/60 border border-rpm-gray/30 bg-rpm-gray/5">
                Industry Leading
              </span>
              <h2 className="text-2xl md:text-3xl font-extralight text-rpm-silver tracking-wide">
                Trusted Products <span className="font-black text-rpm-white">We Use</span>
              </h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 lg:gap-20">
              {trustedBrands.map((brand) => (
                <span
                  key={brand.name}
                  className={`${brand.size} font-black text-rpm-silver/30 hover:text-rpm-silver/60 transition-colors duration-500 tracking-[0.1em] uppercase select-none`}
                >
                  {brand.name}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ BOTTOM CTA ═══════════════════ */}
      <section className="relative py-32 overflow-hidden">
        {/* Angular background */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-rpm-black" />
          <div
            className="absolute inset-0 bg-rpm-charcoal"
            style={{ clipPath: "polygon(0 20%, 100% 0, 100% 80%, 0 100%)" }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-m-blue/8 via-m-indigo/8 to-m-red/8"
            style={{ clipPath: "polygon(0 20%, 100% 0, 100% 80%, 0 100%)" }}
          />
        </div>

        {/* Top M-stripe */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="m-stripe" aria-hidden="true">
            <div /><div /><div />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="leading-none mb-6">
              <span className="block text-3xl md:text-4xl font-extralight text-rpm-silver tracking-wide">
                Experience the
              </span>
              <span className="block text-5xl md:text-6xl lg:text-7xl font-black text-gradient-red tracking-tight mt-2">
                RPM Difference
              </span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <p className="text-lg text-rpm-silver mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Ready to give your vehicle the protection and finish it deserves?
              Get in touch today for a free consultation and quote.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg" className="pulse-glow">
                Get Your Free Quote
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
    </>
  );
}
