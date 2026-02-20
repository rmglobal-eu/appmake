"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSandboxStore } from "@/lib/stores/sandbox-store";

export function usePreview(sandboxId: string | null, containerId: string | null) {
  const { setPreviewUrl, previewUrl } = useSandboxStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForPorts = useCallback(async () => {
    if (!containerId || !sandboxId) return;

    try {
      const res = await fetch("/api/sandbox/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sandboxId,
          containerId,
          command:
            "ss -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | grep -oP '\\d+$' | head -1",
        }),
      });
      const data = await res.json();
      if (data.stdout?.trim()) {
        const port = parseInt(data.stdout.trim(), 10);
        if (port > 0) {
          const domain =
            process.env.NEXT_PUBLIC_PREVIEW_DOMAIN || "preview.appmake.dk";
          setPreviewUrl(`https://${sandboxId}.${domain}`);
        }
      }
    } catch {
      // Ignore errors during polling
    }
  }, [sandboxId, containerId, setPreviewUrl]);

  useEffect(() => {
    if (!sandboxId || !containerId) return;

    // Poll every 3 seconds for port availability
    pollingRef.current = setInterval(checkForPorts, 3000);
    checkForPorts(); // Initial check

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sandboxId, containerId, checkForPorts]);

  return { previewUrl };
}
