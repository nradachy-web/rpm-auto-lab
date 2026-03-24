"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import {
  Award,
  Target,
  Heart,
  Lightbulb,
  Users,
  BadgeCheck,
  ArrowRight,
  Shield,
  Wrench,
  Clock,
} from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Precision",
    description:
      "Every cut, every application, every detail is executed with surgical accuracy. We measure twice and cut once — because your vehicle deserves nothing less than perfection.",
  },
  {
    icon: Award,
    title: "Quality",
    description:
      "We only use professional-grade materials from industry-leading brands. No shortcuts, no compromises — just results that speak for themselves years down the road.",
  },
  {
    icon: Heart,
    title: "Integrity",
    description:
      "Honest pricing, transparent timelines, and straightforward advice. We treat every vehicle like our own and every customer like family.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
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

const trustedBrands = ["3M", "Avery Dennison", "XPEL", "Ceramic Pro", "SunTek"];

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
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rpm-red/5 via-rpm-black to-rpm-black" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              Our Story
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-rpm-white leading-tight">
              About{" "}
              <span className="text-gradient-red">RPM Auto Lab</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-rpm-silver max-w-3xl mx-auto leading-relaxed">
              Where passion for automotive perfection meets cutting-edge
              protection technology. Every vehicle that leaves our shop is a
              testament to our craft.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-rpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-rpm-charcoal border border-rpm-gray">
                <div className="absolute inset-0 bg-gradient-to-br from-rpm-red/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-rpm-silver text-sm uppercase tracking-widest">
                    Shop Photo Coming Soon
                  </span>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="right">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
                Est. Michigan
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-rpm-white mb-6">
                Founded with a simple mission — to give every vehicle the
                protection it deserves.
              </h2>
              <div className="space-y-4 text-rpm-silver leading-relaxed">
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
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-rpm-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="What We Stand For"
            title="Our Core"
            highlight="Values"
            description="These aren't just words on a wall. They're the standards we hold ourselves to on every single job."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <AnimatedSection key={value.title} delay={i * 0.1}>
                <div className="group p-8 rounded-2xl bg-rpm-dark border border-rpm-gray hover:border-rpm-red/40 transition-all duration-500 h-full">
                  <div className="w-14 h-14 rounded-xl bg-rpm-red/10 flex items-center justify-center mb-6 group-hover:bg-rpm-red/20 transition-colors">
                    <value.icon className="w-7 h-7 text-rpm-red" />
                  </div>
                  <h3 className="text-xl font-bold text-rpm-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-rpm-silver text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-24 bg-rpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="The RPM Advantage"
            title="What Sets Us"
            highlight="Apart"
            description="It's the details that make the difference. Here's why customers trust us with their most prized vehicles."
          />
          <div className="grid sm:grid-cols-2 gap-8">
            {differentiators.map((item, i) => (
              <AnimatedSection
                key={item.title}
                delay={i * 0.1}
                direction={i % 2 === 0 ? "left" : "right"}
              >
                <div className="flex gap-6 p-8 rounded-2xl bg-rpm-charcoal border border-rpm-gray hover:border-rpm-red/30 transition-all duration-500">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-rpm-red/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-rpm-red" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-rpm-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-rpm-silver text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-rpm-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="The Team"
            title="Meet the"
            highlight="Crew"
            description="The skilled hands behind every flawless installation."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <AnimatedSection key={member.role} delay={i * 0.15}>
                <div className="group rounded-2xl overflow-hidden bg-rpm-dark border border-rpm-gray hover:border-rpm-red/40 transition-all duration-500">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-rpm-charcoal to-rpm-gray">
                    <div className="absolute inset-0 bg-gradient-to-t from-rpm-dark via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="w-16 h-16 text-rpm-gray" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-rpm-white">
                      {member.name}
                    </h3>
                    <p className="text-rpm-red text-sm font-medium mb-2">
                      {member.role}
                    </p>
                    <p className="text-rpm-silver text-sm">{member.bio}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="py-24 bg-rpm-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Industry Leading"
            title="Trusted Products"
            highlight="We Use"
            description="We partner with the most respected names in automotive protection to deliver results that last."
          />
          <AnimatedSection>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
              {trustedBrands.map((brand) => (
                <div
                  key={brand}
                  className="flex items-center justify-center px-8 py-6 rounded-xl bg-rpm-charcoal border border-rpm-gray hover:border-rpm-red/30 transition-all duration-300"
                >
                  <span className="text-xl md:text-2xl font-bold text-rpm-silver hover:text-rpm-white transition-colors tracking-wide">
                    {brand}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-rpm-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-rpm-red/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-rpm-white mb-6">
              Experience the{" "}
              <span className="text-gradient-red">RPM Difference</span>
            </h2>
            <p className="text-lg text-rpm-silver mb-10 max-w-2xl mx-auto">
              Ready to give your vehicle the protection and finish it deserves?
              Get in touch today for a free consultation and quote.
            </p>
            <Button href="/contact" size="lg">
              Get Your Free Quote <ArrowRight className="w-5 h-5" />
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
