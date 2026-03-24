"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
import { BRAND, SERVICES, NAV_LINKS } from "@/lib/constants";

const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-rpm-charcoal border-t border-rpm-gray/30 diagonal-bg overflow-hidden">
      {/* M-stripe accent line at top — more prominent */}
      <div className="m-stripe h-[4px]">
        <div /><div /><div />
      </div>

      {/* Large faded RPM watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span className="text-[200px] font-black tracking-tighter text-rpm-white/[0.02] leading-none">
          RPM
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 py-16">
          {/* Column 1: Brand */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt={BRAND.name}
                width={40}
                height={40}
                className="invert brightness-200 transition-transform duration-300 group-hover:scale-105"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-rpm-white">
                  RPM
                </span>
                <span className="text-lg text-thin tracking-wide text-rpm-silver ml-1.5">
                  Auto Lab
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-rpm-silver/80 leading-relaxed max-w-xs">
              {BRAND.tagline}
            </p>
            <p className="mt-2 text-sm text-rpm-silver/60 leading-relaxed max-w-xs">
              Southeast Michigan&apos;s premier destination for automotive
              detailing, ceramic coatings, paint protection film, and custom
              wraps.
            </p>

            {/* Social icons with M-stripe glow colors */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href={BRAND.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-rpm-gray/40 text-rpm-silver hover:bg-m-blue hover:text-white transition-all duration-300 social-glow-blue"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-rpm-gray/40 text-rpm-silver hover:bg-m-red hover:text-white transition-all duration-300 social-glow-red"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Column 2: Services */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
          >
            <h3 className="text-sm font-bold tracking-widest uppercase text-rpm-white mb-5">
              Services
            </h3>
            <ul className="space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services#${service.id}`}
                    className="group flex items-center gap-2 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200 footer-link-hover"
                  >
                    <ChevronRight className="w-3 h-3 text-rpm-red/50 group-hover:text-rpm-red transition-colors duration-200" />
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Quick Links */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
          >
            <h3 className="text-sm font-bold tracking-widest uppercase text-rpm-white mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200 footer-link-hover"
                  >
                    <ChevronRight className="w-3 h-3 text-rpm-red/50 group-hover:text-rpm-red transition-colors duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="group flex items-center gap-2 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200 footer-link-hover"
                >
                  <ChevronRight className="w-3 h-3 text-rpm-red/50 group-hover:text-rpm-red transition-colors duration-200" />
                  Client Portal
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 4: Contact Info */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}
          >
            <h3 className="text-sm font-bold tracking-widest uppercase text-rpm-white mb-5">
              Contact
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${BRAND.phone.replace(/\D/g, "")}`}
                  className="group flex items-start gap-3 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200"
                >
                  <Phone className="w-4 h-4 mt-0.5 text-rpm-red/70 group-hover:text-rpm-red shrink-0" />
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="group flex items-start gap-3 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200"
                >
                  <Mail className="w-4 h-4 mt-0.5 text-rpm-red/70 group-hover:text-rpm-red shrink-0" />
                  {BRAND.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(BRAND.address.full)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-sm text-rpm-silver/70 hover:text-rpm-white transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-rpm-red/70 group-hover:text-rpm-red shrink-0" />
                  <span>
                    {BRAND.address.street}
                    <br />
                    {BRAND.address.city}, {BRAND.address.state}{" "}
                    {BRAND.address.zip}
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-rpm-silver/70">
                <Clock className="w-4 h-4 mt-0.5 text-rpm-red/70 shrink-0" />
                <div className="space-y-0.5">
                  <p>{BRAND.hours.weekdays}</p>
                  <p>{BRAND.hours.saturday}</p>
                  <p>{BRAND.hours.sunday}</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar — enhanced */}
        <div className="border-t border-rpm-gray/20 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <p className="text-xs text-rpm-silver/40">
              &copy; {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <span className="hidden sm:inline text-xs text-rpm-silver/20">|</span>
            <p className="text-xs text-rpm-silver/30 italic">
              Crafted with precision in Southeast Michigan
            </p>
          </div>
          <div className="flex items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-rpm-silver/40 hover:text-rpm-silver transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-xs text-rpm-silver/30">|</span>
            <a
              href="https://app.modernapexstrategies.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 text-xs text-rpm-silver/40 hover:text-rpm-red transition-colors duration-200"
            >
              Powered by Modern Apex Strategies
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
