"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface JobPhoto {
  id: string;
  url: string;
  caption?: string | null;
  stage: "before" | "in_progress" | "after";
  uploadedAt: string;
}

const stageLabel: Record<JobPhoto["stage"], string> = {
  before: "Before",
  in_progress: "In Progress",
  after: "After",
};

const stagePillStyle: Record<JobPhoto["stage"], string> = {
  before: "bg-rpm-silver/15 text-rpm-silver",
  in_progress: "bg-amber-500/15 text-amber-400",
  after: "bg-emerald-500/15 text-emerald-400",
};

export default function PhotoGallery({
  photos,
  onDelete,
  emptyHint,
}: {
  photos: JobPhoto[];
  onDelete?: (photoId: string) => Promise<void> | void;
  emptyHint?: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-rpm-gray/40 p-6 text-center text-sm text-rpm-silver/70">
        {emptyHint ?? "No photos yet."}
      </div>
    );
  }

  const open = openIdx !== null ? photos[openIdx] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-rpm-charcoal border border-rpm-gray/40 hover:border-rpm-red/50 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? "Job photo"} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <span
              className={cn(
                "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                stagePillStyle[p.stage]
              )}
            >
              {stageLabel[p.stage]}
            </span>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpenIdx(null)}
        >
          <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt={open.caption ?? "Job photo"} className="max-h-[80vh] w-auto rounded-lg" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-rpm-silver">
                <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mr-2", stagePillStyle[open.stage])}>
                  {stageLabel[open.stage]}
                </span>
                {open.caption || new Date(open.uploadedAt).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {onDelete && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this photo?")) return;
                      await onDelete(open.id);
                      setOpenIdx(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-rpm-red border border-rpm-red/40 rounded-lg hover:bg-rpm-red/10"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setOpenIdx(null)}
                  className="px-3 py-1.5 text-xs font-bold text-rpm-white border border-rpm-gray rounded-lg hover:border-rpm-silver"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
