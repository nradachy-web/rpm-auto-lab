import { Metadata } from "next";
import { BRAND } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionHeading from "@/components/ui/SectionHeading";
import QuoteForm from "@/components/forms/QuoteForm";

export const metadata: Metadata = {
  title: "Get a Quote | RPM Auto Lab",
  description:
    "Request a free quote for ceramic coating, paint protection film, window tint, vehicle wraps, and more at RPM Auto Lab in Orion Township, MI.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <SectionHeading
          badge="Free Estimates"
          title="Get Your Free"
          highlight="Quote"
          description="Tell us about your vehicle and we'll craft a custom protection plan"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Quote Form - 60% */}
          <AnimatedSection className="lg:col-span-3" direction="left">
            <div className="rounded-2xl bg-rpm-dark border border-rpm-gray/50 p-6 sm:p-8">
              <QuoteForm />
            </div>
          </AnimatedSection>

          {/* Contact Info - 40% */}
          <AnimatedSection
            className="lg:col-span-2"
            direction="right"
            delay={0.2}
          >
            <div className="space-y-8">
              {/* Address / Map */}
              <div className="rounded-2xl bg-rpm-dark border border-rpm-gray/50 p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-rpm-white mb-4">
                  Visit Our Shop
                </h3>
                {/* Map placeholder */}
                <div className="rounded-lg bg-rpm-charcoal border border-rpm-gray h-48 flex items-center justify-center mb-4 overflow-hidden">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-rpm-silver/40 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    <p className="text-xs text-rpm-silver/40">
                      Map coming soon
                    </p>
                  </div>
                </div>
                <address className="not-italic text-rpm-silver text-sm leading-relaxed">
                  <p className="text-rpm-white font-medium">
                    {BRAND.name}
                  </p>
                  <p>{BRAND.address.street}</p>
                  <p>
                    {BRAND.address.city}, {BRAND.address.state}{" "}
                    {BRAND.address.zip}
                  </p>
                </address>
              </div>

              {/* Phone & Email */}
              <div className="rounded-2xl bg-rpm-dark border border-rpm-gray/50 p-6 space-y-5">
                <h3 className="text-lg font-bold text-rpm-white">
                  Get in Touch
                </h3>

                <a
                  href={`tel:${BRAND.phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rpm-red/10 border border-rpm-red/20 group-hover:bg-rpm-red/20 transition-colors">
                    <svg
                      className="h-5 w-5 text-rpm-red"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-rpm-silver">Call Us</p>
                    <p className="text-rpm-white font-medium group-hover:text-rpm-red transition-colors">
                      {BRAND.phone}
                    </p>
                  </div>
                </a>

                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rpm-red/10 border border-rpm-red/20 group-hover:bg-rpm-red/20 transition-colors">
                    <svg
                      className="h-5 w-5 text-rpm-red"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-rpm-silver">Email Us</p>
                    <p className="text-rpm-white font-medium group-hover:text-rpm-red transition-colors">
                      {BRAND.email}
                    </p>
                  </div>
                </a>
              </div>

              {/* Hours */}
              <div className="rounded-2xl bg-rpm-dark border border-rpm-gray/50 p-6">
                <h3 className="text-lg font-bold text-rpm-white mb-4">
                  Business Hours
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-rpm-silver">Mon - Fri</span>
                    <span className="text-rpm-white">8:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-rpm-silver">Saturday</span>
                    <span className="text-rpm-white">9:00 AM - 3:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-rpm-silver">Sunday</span>
                    <span className="text-rpm-silver/50">Closed</span>
                  </li>
                </ul>
              </div>

              {/* Social Links */}
              <div className="rounded-2xl bg-rpm-dark border border-rpm-gray/50 p-6">
                <h3 className="text-lg font-bold text-rpm-white mb-4">
                  Follow Us
                </h3>
                <div className="flex gap-3">
                  <a
                    href={BRAND.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-rpm-charcoal border border-rpm-gray hover:border-rpm-red hover:bg-rpm-red/10 transition-all"
                    aria-label="Instagram"
                  >
                    <svg
                      className="h-5 w-5 text-rpm-silver hover:text-rpm-red"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                  <a
                    href={BRAND.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-rpm-charcoal border border-rpm-gray hover:border-rpm-red hover:bg-rpm-red/10 transition-all"
                    aria-label="Facebook"
                  >
                    <svg
                      className="h-5 w-5 text-rpm-silver hover:text-rpm-red"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Trust Badges */}
        <AnimatedSection className="mt-20" delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "Free Estimates",
                desc: "No cost to get a detailed quote",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                ),
                title: "No Obligation",
                desc: "Zero pressure, just expert advice",
              },
              {
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "Response Within 24hrs",
                desc: "We get back to you fast",
              },
            ].map((badge) => (
              <div
                key={badge.title}
                className="text-center rounded-xl bg-rpm-dark border border-rpm-gray/50 p-6"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rpm-red/10 text-rpm-red border border-rpm-red/20">
                  {badge.icon}
                </div>
                <h4 className="text-sm font-bold text-rpm-white uppercase tracking-wider">
                  {badge.title}
                </h4>
                <p className="mt-1 text-xs text-rpm-silver">{badge.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
