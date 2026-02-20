"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/lib/stores/chat-store";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";
import { useEditorStore } from "@/lib/stores/editor-store";

const STATUS_MESSAGES = [
  "Building your app",
  "Writing components",
  "Generating code",
  "Setting up the interface",
  "Putting things together",
  "Almost there",
];

export function PreviewLoadingOverlay() {
  const { isStreaming } = useChatStore();
  const { currentStreamingFile, activeCardId, thinkingStartedAt } = useUpdateCardStore();
  const previewHealthy = usePreviewErrorStore((s) => s.previewHealthy);
  const ghostFixStatus = usePreviewErrorStore((s) => s.ghostFixStatus);
  const fileCount = Object.keys(useEditorStore((s) => s.generatedFiles)).length;
  const [msgIndex, setMsgIndex] = useState(0);

  // Cycle status messages while streaming
  useEffect(() => {
    if (!isStreaming) return;
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Hide overlay when preview is healthy, not streaming, and not ghost-fixing
  const isGhostFixing = ghostFixStatus === "fixing" || ghostFixStatus === "verifying";
  const shouldShow = isStreaming || !previewHealthy || isGhostFixing;

  if (!shouldShow) return null;

  const isThinking = !!thinkingStartedAt && !activeCardId;
  // "Idle" = not streaming and no files, or files but preview not ready yet
  const isIdle = !isStreaming && !isGhostFixing;

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm transition-opacity duration-500 ${
        shouldShow ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Animated logo */}
      <div className="relative mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 96 96"
          width="72"
          height="72"
          className="drop-shadow-lg"
        >
          <circle
            cx="34" cy="34" r="25"
            fill="#EC4899"
            opacity="0.85"
            className="origin-center"
            style={{ animation: "logoPulse 2.5s ease-in-out infinite", animationDelay: "0ms" }}
          />
          <circle
            cx="62" cy="34" r="25"
            fill="#6366F1"
            opacity="0.8"
            className="origin-center"
            style={{ animation: "logoPulse 2.5s ease-in-out infinite", animationDelay: "300ms" }}
          />
          <circle
            cx="34" cy="62" r="25"
            fill="#F59E0B"
            opacity="0.76"
            className="origin-center"
            style={{ animation: "logoPulse 2.5s ease-in-out infinite", animationDelay: "600ms" }}
          />
          <circle
            cx="62" cy="62" r="25"
            fill="#EC4899"
            opacity="0.68"
            className="origin-center"
            style={{ animation: "logoPulse 2.5s ease-in-out infinite", animationDelay: "900ms" }}
          />
        </svg>

        {/* Orbit ring — only spin when actively working */}
        {!isIdle && (
          <div className="absolute -inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_8s_linear_infinite]" />
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-3">
        {isStreaming ? (
          <>
            <p
              className="text-lg font-semibold text-foreground transition-opacity duration-300"
              key={msgIndex}
              style={{ animation: "fadeInUp 0.4s ease-out" }}
            >
              {STATUS_MESSAGES[msgIndex]}
              <span className="inline-flex ml-0.5">
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "200ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "400ms" }}>.</span>
              </span>
            </p>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {isThinking
                ? "AI is analyzing your request and planning the best approach"
                : currentStreamingFile
                ? (
                  <>
                    Currently writing{" "}
                    <span className="font-mono text-xs text-primary/80">{currentStreamingFile}</span>
                  </>
                )
                : "Your preview will update automatically when ready"
              }
            </p>
            {/* Progress bar */}
            <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500"
                style={{ animation: "progress-indeterminate 1.5s ease-in-out infinite" }}
              />
            </div>
          </>
        ) : isGhostFixing ? (
          <>
            <p className="text-base font-medium text-foreground">
              Fixing preview
              <span className="inline-flex ml-0.5">
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "200ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "400ms" }}>.</span>
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Automatically resolving an issue
            </p>
          </>
        ) : fileCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Describe your app to get started
          </p>
        ) : (
          <>
            <p className="text-base font-medium text-foreground">
              Loading preview
              <span className="inline-flex ml-0.5">
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "200ms" }}>.</span>
                <span style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: "400ms" }}>.</span>
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
