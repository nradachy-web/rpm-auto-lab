"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeLabel?: string;
  afterLabel?: string;
  beforeGradient?: string;
  afterGradient?: string;
  caption?: string;
  className?: string;
}

export default function BeforeAfterSlider({
  beforeLabel = "Before",
  afterLabel = "After",
  beforeGradient = "from-rpm-gray via-rpm-charcoal to-rpm-dark",
  afterGradient = "from-rpm-red/30 via-rpm-charcoal to-rpm-dark",
  caption,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={containerRef}
        className="relative aspect-[16/10] rounded-xl overflow-hidden cursor-col-resize select-none border border-rpm-gray/30"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
      >
        {/* After (full background) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${afterGradient}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(220,38,38,0.15),transparent_60%)]" />
          <div className="absolute inset-0 shimmer opacity-30" />
        </div>

        {/* Before (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${beforeGradient}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_60%,rgba(100,100,100,0.1),transparent_60%)]" />
          </div>
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-rpm-white z-10 transition-shadow"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rpm-white border-2 border-rpm-red shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-rpm-red/60 rounded-full" />
              <div className="w-0.5 h-4 bg-rpm-red/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div
          className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rpm-black/70 backdrop-blur-sm text-xs font-semibold uppercase tracking-widest text-rpm-silver border border-rpm-gray/30 z-20"
          style={{ opacity: position > 15 ? 1 : 0, transition: "opacity 0.2s" }}
        >
          {beforeLabel}
        </div>
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full bg-rpm-red/80 backdrop-blur-sm text-xs font-semibold uppercase tracking-widest text-white border border-rpm-red/30 z-20"
          style={{ opacity: position < 85 ? 1 : 0, transition: "opacity 0.2s" }}
        >
          {afterLabel}
        </div>
      </div>

      {caption && (
        <p className="text-sm text-rpm-silver text-center">{caption}</p>
      )}
    </div>
  );
}
