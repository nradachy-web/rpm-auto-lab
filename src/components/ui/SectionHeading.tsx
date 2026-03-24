"use client";

import AnimatedSection from "./AnimatedSection";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  align?: "left" | "center";
  variant?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  badge,
  title,
  highlight,
  description,
  align = "center",
  variant,
  className,
}: SectionHeadingProps) {
  // variant overrides align for backwards compatibility
  const resolvedAlign = variant ?? align;

  return (
    <AnimatedSection
      className={cn(
        "mb-16",
        resolvedAlign === "center" && "text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5 badge-glow">
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-light text-rpm-white leading-tight">
        {title}{" "}
        {highlight && (
          <span className="font-bold text-gradient-red">{highlight}</span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-lg text-rpm-silver max-w-3xl leading-relaxed",
            resolvedAlign === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
      {/* M-stripe accent bar — 3 colored segments */}
      <div
        className={cn(
          "mt-6 flex h-[3px] w-24 rounded-full overflow-hidden",
          resolvedAlign === "center" && "mx-auto"
        )}
      >
        <div className="flex-1 bg-m-blue" />
        <div className="flex-1 bg-m-indigo" />
        <div className="flex-1 bg-m-red" />
      </div>
    </AnimatedSection>
  );
}
