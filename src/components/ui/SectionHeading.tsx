"use client";

import AnimatedSection from "./AnimatedSection";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  badge,
  title,
  highlight,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <AnimatedSection
      className={cn(
        "mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-rpm-white leading-tight">
        {title}{" "}
        {highlight && <span className="text-gradient-red">{highlight}</span>}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-rpm-silver max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
      <div className="mt-6 mx-auto h-1 w-20 bg-gradient-to-r from-rpm-red to-rpm-orange rounded-full" />
    </AnimatedSection>
  );
}
