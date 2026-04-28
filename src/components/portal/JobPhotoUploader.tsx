"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Stage = "before" | "in_progress" | "after";

const STAGES: { value: Stage; label: string }[] = [
  { value: "before", label: "Before" },
  { value: "in_progress", label: "In Progress" },
  { value: "after", label: "After" },
];

export default function JobPhotoUploader({
  jobId,
  onUploaded,
}: {
  jobId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>("in_progress");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setErr(null);
    setBusy(true);
    try {
      // Upload sequentially so failures surface and we don't blast the API.
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("stage", stage);
        if (caption) fd.append("caption", caption);
        const res = await api.post(`/api/admin/jobs/${jobId}/photos`, fd);
        if (!res.ok) throw new Error(res.error || "Upload failed");
      }
      setCaption("");
      onUploaded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-rpm-gray/50 bg-rpm-charcoal/40 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {STAGES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStage(s.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border transition",
                stage === s.value
                  ? "bg-rpm-red/20 border-rpm-red text-rpm-red"
                  : "border-rpm-gray text-rpm-silver hover:text-rpm-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional caption"
          className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg bg-rpm-dark border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/50 focus:outline-none focus:border-rpm-red"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark disabled:opacity-50"
        >
          {busy ? "Uploading…" : "+ Upload Photos"}
        </button>
      </div>
      {err && <div className="text-xs text-rpm-red">{err}</div>}
    </div>
  );
}
