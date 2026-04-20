"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VehicleConfig, VehicleCategory } from "./types";
import { BASE_PATH } from "@/lib/constants";

interface VehiclePickerProps {
  vehicles: VehicleConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const CATEGORY_LABEL: Record<VehicleCategory, string> = {
  sports: "Sports",
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  exotic: "Exotic",
  ev: "Electric",
};

// Tailwind gradient classes per category — restrained, premium palette
const CATEGORY_GRADIENT: Record<VehicleCategory, string> = {
  sports: "bg-gradient-to-br from-[#3a0808] via-[#0f0f10] to-[#0a0a0a]",
  sedan: "bg-gradient-to-br from-[#102035] via-[#0c0c10] to-[#0a0a0a]",
  suv: "bg-gradient-to-br from-[#0f2a22] via-[#0c0c10] to-[#0a0a0a]",
  truck: "bg-gradient-to-br from-[#1e1e24] via-[#0c0c10] to-[#0a0a0a]",
  exotic: "bg-gradient-to-br from-[#321428] via-[#0f0c10] to-[#0a0a0a]",
  ev: "bg-gradient-to-br from-[#0a2840] via-[#0c0c10] to-[#0a0a0a]",
};

// Silhouette SVGs per category — drawn simple enough to feel iconographic, not illustrative
function VehicleSilhouette({ category, className }: { category: VehicleCategory; className?: string }) {
  const common = {
    viewBox: "0 0 100 34",
    fill: "currentColor",
    className: cn("w-full h-auto", className),
  } as const;
  switch (category) {
    case "sports":
      return (
        <svg {...common}>
          <path d="M4 26 C 3 22, 8 20, 15 20 L 26 18 C 32 12, 46 10, 60 11 C 70 11, 78 14, 85 18 L 92 21 C 96 22, 97 24, 96 26 L 92 26 A 6 6 0 0 0 80 26 L 30 26 A 6 6 0 0 0 18 26 L 4 26 Z" />
          <circle cx="24" cy="27" r="4" fill="#0a0a0a" />
          <circle cx="86" cy="27" r="4" fill="#0a0a0a" />
        </svg>
      );
    case "sedan":
    case "ev":
      return (
        <svg {...common}>
          <path d="M3 26 C 2 22, 6 21, 11 20 L 22 18 C 30 13, 44 11, 58 12 C 70 12, 80 15, 88 19 L 94 22 C 97 23, 98 25, 97 26 L 91 26 A 6 6 0 0 0 79 26 L 29 26 A 6 6 0 0 0 17 26 L 3 26 Z" />
          <circle cx="23" cy="27" r="4" fill="#0a0a0a" />
          <circle cx="85" cy="27" r="4" fill="#0a0a0a" />
        </svg>
      );
    case "suv":
      return (
        <svg {...common}>
          <path d="M4 26 L 4 20 C 5 16, 10 14, 16 14 L 26 13 C 32 8, 48 6, 62 7 C 72 7, 82 9, 90 13 L 94 14 C 96 15, 97 17, 97 20 L 97 26 L 90 26 A 6 6 0 0 0 78 26 L 30 26 A 6 6 0 0 0 18 26 L 4 26 Z" />
          <circle cx="24" cy="27" r="4.2" fill="#0a0a0a" />
          <circle cx="84" cy="27" r="4.2" fill="#0a0a0a" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M4 26 L 4 16 C 5 12, 10 10, 18 10 L 44 10 L 44 18 L 60 18 L 66 12 C 68 10, 72 10, 76 10 L 88 10 C 94 10, 96 14, 96 18 L 96 26 L 90 26 A 6 6 0 0 0 78 26 L 30 26 A 6 6 0 0 0 18 26 L 4 26 Z" />
          <circle cx="24" cy="27" r="4.2" fill="#0a0a0a" />
          <circle cx="84" cy="27" r="4.2" fill="#0a0a0a" />
        </svg>
      );
    case "exotic":
      return (
        <svg {...common}>
          <path d="M3 26 C 2 23, 5 21, 9 20 L 20 17 C 26 10, 44 7, 60 9 C 72 10, 82 13, 90 17 L 95 20 C 98 21, 98 24, 97 26 L 91 26 A 6 6 0 0 0 79 26 L 29 26 A 6 6 0 0 0 17 26 L 3 26 Z" />
          <circle cx="22" cy="27" r="4" fill="#0a0a0a" />
          <circle cx="85" cy="27" r="4" fill="#0a0a0a" />
        </svg>
      );
  }
}

export default function VehiclePicker({ vehicles, selectedId, onSelect }: VehiclePickerProps) {
  return (
    <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
      {vehicles.map((v) => {
        const active = v.id === selectedId;
        return (
          <motion.button
            key={v.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(v.id)}
            className={cn(
              "relative flex-shrink-0 w-[228px] h-[104px] rounded-xl overflow-hidden border transition-all duration-300 group cursor-pointer",
              active
                ? "border-rpm-red/70 shadow-[0_0_28px_rgba(220,38,38,0.25)]"
                : "border-rpm-gray/40 hover:border-rpm-silver/40"
            )}
          >
            {/* Gradient background (per category) */}
            {v.thumbPath ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${BASE_PATH}${v.thumbPath}`}
                  alt={`${v.make} ${v.model}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              </>
            ) : (
              <div className={cn("absolute inset-0", CATEGORY_GRADIENT[v.category])}>
                {/* Subtle diagonal light sweep */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                  }}
                />
                {/* Silhouette — placed lower-right, understated */}
                <div className="absolute right-2 bottom-2 w-[60%] opacity-20 text-rpm-white">
                  <VehicleSilhouette category={v.category} />
                </div>
                {/* Radial red glow on active card */}
                {active && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.18)_0%,transparent_65%)]" />
                )}
              </div>
            )}

            {/* M-stripe corner */}
            <div className="absolute top-0 left-0 w-14 h-[3px] flex overflow-hidden">
              <div className="flex-1 bg-[#0066B1]" />
              <div className="flex-1 bg-[#1B1464]" />
              <div className="flex-1 bg-rpm-red" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-left">
                  <div className={cn(
                    "text-[8px] font-bold uppercase tracking-[0.22em] transition-colors",
                    active ? "text-rpm-red" : "text-rpm-silver/70"
                  )}>
                    {CATEGORY_LABEL[v.category]}
                  </div>
                </div>
                <div className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full border transition-all flex items-center justify-center",
                  active
                    ? "bg-rpm-red border-rpm-red shadow-[0_0_10px_rgba(220,38,38,0.6)]"
                    : "border-rpm-silver/30 bg-rpm-black/40"
                )}>
                  {active && (
                    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                      <path d="m5 10 3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="text-left">
                <div className="text-[11px] font-medium text-rpm-silver/80 leading-tight">
                  {v.year} {v.make}
                </div>
                <div className="text-[15px] font-black text-rpm-white leading-tight truncate">
                  {v.model}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
