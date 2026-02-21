"use client";

import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { CheckCircle2 } from "lucide-react";

export function SessionComplete() {
  const { sessionPhase, sessionStartedAt, filesTotal } = useUpdateCardStore();

  if (sessionPhase !== "complete" || !sessionStartedAt) return null;

  const elapsed = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000));

  return (
    <div className="px-4 py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-emerald-400/70">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-medium">Done</span>
        <span className="text-white/20">·</span>
        <span>{elapsed}s</span>
        {filesTotal > 0 && (
          <>
            <span className="text-white/20">·</span>
            <span>
              {filesTotal} {filesTotal === 1 ? "file" : "files"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
