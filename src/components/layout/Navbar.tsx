"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, ChevronRight } from "lucide-react";
import { NAV_LINKS, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-rpm-dark/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-rpm-gray/30"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt={BRAND.name}
                width={48}
                height={48}
                className="invert brightness-200 transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-wider text-rpm-white">
                  RPM
                </span>
                <span className="text-lg font-light tracking-wider text-rpm-silver ml-1">
                  Auto Lab
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.filter((l) => l.label !== "Get a Quote").map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors duration-300",
                      isActive
                        ? "text-rpm-white"
                        : "text-rpm-silver hover:text-rpm-white"
                    )}
                  >
                    {link.label}
                    {/* Underline indicator */}
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-rpm-red transition-all duration-300",
                        isActive ? "w-6" : "w-0 group-hover:w-0"
                      )}
                    />
                    {/* Hover underline */}
                    {!isActive && (
                      <motion.span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-rpm-red/60"
                        initial={{ width: 0 }}
                        whileHover={{ width: "60%" }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side: Login + CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden lg:inline-flex text-sm font-medium text-rpm-silver hover:text-rpm-white transition-colors duration-300 tracking-wide uppercase"
              >
                Login
              </Link>

              <Link
                href="/contact"
                className="hidden lg:inline-flex items-center gap-2 bg-rpm-red hover:bg-rpm-red-dark text-white text-sm font-semibold px-5 py-2.5 rounded tracking-wide uppercase transition-all duration-300 glow-red-hover"
              >
                <Phone className="w-4 h-4" />
                Get a Quote
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center text-rpm-white"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-rpm-dark border-l border-rpm-gray/30 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Drawer header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-rpm-gray/30">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo.png"
                      alt={BRAND.name}
                      width={36}
                      height={36}
                      className="invert brightness-200"
                    />
                    <span className="text-sm font-bold tracking-wider text-rpm-white uppercase">
                      {BRAND.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-rpm-silver hover:text-rpm-white transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium tracking-wide uppercase transition-all duration-200",
                            isActive
                              ? "bg-rpm-red/10 text-rpm-red border border-rpm-red/20"
                              : "text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/30"
                          )}
                        >
                          {link.label}
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 transition-colors",
                              isActive ? "text-rpm-red" : "text-rpm-gray"
                            )}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: NAV_LINKS.length * 0.05 + 0.1 }}
                  >
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium tracking-wide uppercase text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/30 transition-all duration-200"
                    >
                      Login
                      <ChevronRight className="w-4 h-4 text-rpm-gray" />
                    </Link>
                  </motion.div>
                </nav>

                {/* Drawer footer */}
                <div className="px-6 py-5 border-t border-rpm-gray/30">
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-rpm-red hover:bg-rpm-red-dark text-white text-sm font-semibold px-5 py-3 rounded tracking-wide uppercase transition-all duration-300 glow-red"
                  >
                    <Phone className="w-4 h-4" />
                    Get a Quote
                  </Link>
                  <p className="text-center text-xs text-rpm-silver/50 mt-3">
                    {BRAND.tagline}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
