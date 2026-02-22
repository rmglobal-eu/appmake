"use client";

import { useEffect, useState } from "react";
import type { PreviewStatus } from "@/lib/stores/preview-store";

interface PreviewLoadingScreenProps {
  status: PreviewStatus | "generating" | "idle";
  progressMessage?: string | null;
}

const STEPS = [
  { key: "generating", label: "Generating code" },
  { key: "booting", label: "Starting environment" },
  { key: "mounting", label: "Preparing files" },
  { key: "installing", label: "Installing packages" },
  { key: "starting", label: "Starting dev server" },
  { key: "bundling", label: "Bundling" },
] as const;

function getActiveStep(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function PreviewLoadingScreen({
  status,
  progressMessage,
}: PreviewLoadingScreenProps) {
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const activeStep = getActiveStep(status);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a12] overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Radial glow behind logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, #EC4899 0%, #6366F1 40%, transparent 70%)",
        }}
      />

      {/* Logo with SVG draw animation */}
      <div className="relative mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 96 96"
          width="80"
          height="80"
          className="logo-svg"
        >
          <defs>
            <style>{`.cl{mix-blend-mode:screen}`}</style>
          </defs>
          {/* Circle 1 - Pink top-left */}
          <circle
            cx="34"
            cy="34"
            r="25"
            fill="none"
            stroke="#EC4899"
            strokeWidth="2"
            opacity=".85"
            className="logo-circle logo-circle-1"
          />
          <circle
            cx="34"
            cy="34"
            r="25"
            fill="#EC4899"
            className="cl logo-fill logo-fill-1"
            opacity="0"
          />
          {/* Circle 2 - Indigo top-right */}
          <circle
            cx="62"
            cy="34"
            r="25"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            opacity=".8"
            className="logo-circle logo-circle-2"
          />
          <circle
            cx="62"
            cy="34"
            r="25"
            fill="#6366F1"
            className="cl logo-fill logo-fill-2"
            opacity="0"
          />
          {/* Circle 3 - Amber bottom-left */}
          <circle
            cx="34"
            cy="62"
            r="25"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity=".76"
            className="logo-circle logo-circle-3"
          />
          <circle
            cx="34"
            cy="62"
            r="25"
            fill="#F59E0B"
            className="cl logo-fill logo-fill-3"
            opacity="0"
          />
          {/* Circle 4 - Pink bottom-right */}
          <circle
            cx="62"
            cy="62"
            r="25"
            fill="none"
            stroke="#EC4899"
            strokeWidth="2"
            opacity=".68"
            className="logo-circle logo-circle-4"
          />
          <circle
            cx="62"
            cy="62"
            r="25"
            fill="#EC4899"
            className="cl logo-fill logo-fill-4"
            opacity="0"
          />
        </svg>

        {/* Orbiting particle */}
        <div className="absolute inset-0 logo-orbit">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" />
        </div>
      </div>

      {/* Brand name */}
      <h1 className="text-2xl font-medium tracking-tight text-white/90 mb-1 font-[system-ui]">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-indigo-400 to-amber-400">
          AppMake
        </span>
      </h1>

      {/* Status text */}
      <p className="text-sm text-white/50 mb-8 h-5">
        {status === "idle"
          ? "Klar til at bygge"
          : (progressMessage || STEPS[activeStep]?.label || "Building") + dots}
      </p>

      {/* Step indicators — hide when idle */}
      {status !== "idle" && (
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < activeStep
                  ? "w-6 bg-gradient-to-r from-pink-500 to-indigo-500"
                  : i === activeStep
                    ? "w-8 bg-gradient-to-r from-pink-500 to-indigo-500 animate-pulse"
                    : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        /* SVG circle draw animation */
        .logo-circle {
          stroke-dasharray: 157;
          stroke-dashoffset: 157;
          animation: draw 1.2s ease-out forwards;
        }
        .logo-circle-1 { animation-delay: 0s; }
        .logo-circle-2 { animation-delay: 0.15s; }
        .logo-circle-3 { animation-delay: 0.3s; }
        .logo-circle-4 { animation-delay: 0.45s; }

        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }

        /* Fill fade in after draw */
        .logo-fill {
          animation: fillIn 0.6s ease-out forwards;
        }
        .logo-fill-1 { animation-delay: 0.8s; }
        .logo-fill-2 { animation-delay: 0.95s; }
        .logo-fill-3 { animation-delay: 1.1s; }
        .logo-fill-4 { animation-delay: 1.25s; }

        @keyframes fillIn {
          from { opacity: 0; }
          to { opacity: 0.75; }
        }

        /* Orbiting particle */
        .logo-orbit {
          animation: orbit 3s linear infinite;
        }

        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Gentle float on the whole logo */
        .logo-svg {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
