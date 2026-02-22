"use client";

import { useUpdateCardStore } from "@/lib/stores/update-card-store";

interface PreviewLoaderProps {
  isStreaming: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  thinking: "Understanding your request...",
  researching: "Researching best approach...",
  building: "Building your app...",
  complete: "Almost there...",
};

export function PreviewLoader({ isStreaming }: PreviewLoaderProps) {
  const { sessionPhase } = useUpdateCardStore();
  const phaseLabel = isStreaming
    ? PHASE_LABELS[sessionPhase] ?? "Preparing..."
    : "";

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#0a0a10]">
      {/* Subtle radial glow behind the logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(236,72,153,0.3) 50%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated Logo — 4 overlapping circles */}
        <div className="relative h-[72px] w-[72px]">
          {/* Circle 1 — Pink top-left */}
          <div
            className="absolute h-[38px] w-[38px] rounded-full"
            style={{
              left: 4,
              top: 4,
              background: "#EC4899",
              opacity: 0.85,
              mixBlendMode: "screen",
              animation: isStreaming
                ? "loaderPulse1 2.4s ease-in-out infinite"
                : undefined,
            }}
          />
          {/* Circle 2 — Indigo top-right */}
          <div
            className="absolute h-[38px] w-[38px] rounded-full"
            style={{
              right: 4,
              top: 4,
              background: "#6366F1",
              opacity: 0.8,
              mixBlendMode: "screen",
              animation: isStreaming
                ? "loaderPulse2 2.4s ease-in-out infinite"
                : undefined,
            }}
          />
          {/* Circle 3 — Amber bottom-left */}
          <div
            className="absolute h-[38px] w-[38px] rounded-full"
            style={{
              left: 4,
              bottom: 4,
              background: "#F59E0B",
              opacity: 0.76,
              mixBlendMode: "screen",
              animation: isStreaming
                ? "loaderPulse3 2.4s ease-in-out infinite"
                : undefined,
            }}
          />
          {/* Circle 4 — Pink bottom-right */}
          <div
            className="absolute h-[38px] w-[38px] rounded-full"
            style={{
              right: 4,
              bottom: 4,
              background: "#EC4899",
              opacity: 0.68,
              mixBlendMode: "screen",
              animation: isStreaming
                ? "loaderPulse4 2.4s ease-in-out infinite"
                : undefined,
            }}
          />

          {/* Spinning ring behind the logo when streaming */}
          {isStreaming && (
            <div
              className="absolute -inset-3 rounded-full border border-white/[0.06]"
              style={{
                borderTopColor: "rgba(139,92,246,0.3)",
                animation: "spin 3s linear infinite",
              }}
            />
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          {isStreaming ? (
            <>
              <p className="text-sm font-medium text-white/70">{phaseLabel}</p>
              {/* Dot loader */}
              <div className="flex items-center gap-1">
                <div
                  className="h-1 w-1 rounded-full bg-violet-400"
                  style={{ animation: "loaderDot 1.4s ease-in-out infinite" }}
                />
                <div
                  className="h-1 w-1 rounded-full bg-violet-400"
                  style={{
                    animation: "loaderDot 1.4s ease-in-out 0.2s infinite",
                  }}
                />
                <div
                  className="h-1 w-1 rounded-full bg-violet-400"
                  style={{
                    animation: "loaderDot 1.4s ease-in-out 0.4s infinite",
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white/40">
                Preview will appear here
              </p>
              <p className="text-xs text-white/20">
                Ask Appmake to build something
              </p>
            </>
          )}
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes loaderPulse1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-3px, -3px) scale(1.08);
          }
        }
        @keyframes loaderPulse2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(3px, -3px) scale(1.08);
          }
        }
        @keyframes loaderPulse3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-3px, 3px) scale(1.08);
          }
        }
        @keyframes loaderPulse4 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(3px, 3px) scale(1.08);
          }
        }
        @keyframes loaderDot {
          0%,
          80%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
