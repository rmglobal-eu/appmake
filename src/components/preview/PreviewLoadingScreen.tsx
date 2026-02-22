"use client";

import { useEffect, useState, useMemo } from "react";
import type { PreviewStatus } from "@/lib/stores/preview-store";

interface PreviewLoadingScreenProps {
  status: PreviewStatus | "generating" | "idle";
  progressMessage?: string | null;
}

const STEPS = [
  { key: "generating", label: "Skriver kode", emoji: "~" },
  { key: "booting", label: "Starter miljø", emoji: "~" },
  { key: "mounting", label: "Forbereder filer", emoji: "~" },
  { key: "installing", label: "Installerer pakker", emoji: "~" },
  { key: "starting", label: "Starter dev server", emoji: "~" },
  { key: "bundling", label: "Bundler", emoji: "~" },
] as const;

const FRIENDLY_MESSAGES = [
  "Vi bygger noget fedt sammen",
  "Din app tager form",
  "Magien sker lige nu",
  "Snart klar til dig",
  "Hvert pixel tæller",
];

function getActiveStep(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function PreviewLoadingScreen({
  status,
  progressMessage,
}: PreviewLoadingScreenProps) {
  const [dots, setDots] = useState("");

  const friendlyMessage = useMemo(
    () => FRIENDLY_MESSAGES[Math.floor(Math.random() * FRIENDLY_MESSAGES.length)],
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const activeStep = getActiveStep(status);
  const isIdle = status === "idle";
  const progress = isIdle ? 0 : Math.round(((activeStep + 1) / STEPS.length) * 100);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden">
      {/* Mesh gradient background — matches brand dashboard */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,20,147,0.15) 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, rgba(194,24,91,0.1) 0%, transparent 40%), #0a1628",
        }}
      />

      {/* Subtle animated grain */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay loader-grain" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[100px] loader-orb-1"
          style={{ background: "rgba(236,72,153,0.08)" }}
        />
        <div
          className="absolute w-[250px] h-[250px] rounded-full blur-[90px] loader-orb-2"
          style={{ background: "rgba(99,102,241,0.06)" }}
        />
        <div
          className="absolute w-[200px] h-[200px] rounded-full blur-[80px] loader-orb-3"
          style={{ background: "rgba(245,158,11,0.05)" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center loader-fade-in">
        {/* Logo with draw animation */}
        <div className="relative mb-6 loader-logo-float">
          {/* Glow behind logo */}
          <div
            className="absolute inset-[-20px] rounded-full blur-[40px] opacity-30 loader-logo-glow"
            style={{
              background:
                "radial-gradient(circle, #EC4899 0%, #6366F1 50%, transparent 70%)",
            }}
          />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 96 96"
            width="64"
            height="64"
            className="relative"
          >
            <defs>
              <style>{`.cl{mix-blend-mode:screen}`}</style>
            </defs>
            <circle cx="34" cy="34" r="25" fill="none" stroke="#EC4899" strokeWidth="1.5" opacity=".85" className="loader-circle loader-circle-1" />
            <circle cx="34" cy="34" r="25" fill="#EC4899" className="cl loader-fill loader-fill-1" opacity="0" />
            <circle cx="62" cy="34" r="25" fill="none" stroke="#6366F1" strokeWidth="1.5" opacity=".8" className="loader-circle loader-circle-2" />
            <circle cx="62" cy="34" r="25" fill="#6366F1" className="cl loader-fill loader-fill-2" opacity="0" />
            <circle cx="34" cy="62" r="25" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity=".76" className="loader-circle loader-circle-3" />
            <circle cx="34" cy="62" r="25" fill="#F59E0B" className="cl loader-fill loader-fill-3" opacity="0" />
            <circle cx="62" cy="62" r="25" fill="none" stroke="#EC4899" strokeWidth="1.5" opacity=".68" className="loader-circle loader-circle-4" />
            <circle cx="62" cy="62" r="25" fill="#EC4899" className="cl loader-fill loader-fill-4" opacity="0" />
          </svg>
        </div>

        {/* Wordmark */}
        <h1
          className="text-[28px] font-medium tracking-[-0.04em] text-white/90 mb-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          appmake
        </h1>

        {/* Friendly handwritten accent */}
        <p
          className="text-[15px] text-white/35 mb-8 loader-handwriting"
          style={{ fontFamily: "var(--font-hand)" }}
        >
          {isIdle ? "Klar til at skabe noget fedt" : friendlyMessage}
        </p>

        {/* Glass card with status */}
        {!isIdle && (
          <div className="loader-card-appear">
            <div
              className="relative rounded-2xl border border-white/[0.08] px-6 py-4 min-w-[240px]"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Shimmer edge */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 loader-shimmer" />
              </div>

              {/* Current step */}
              <div className="relative flex items-center gap-3 mb-3">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500" />
                </div>
                <span className="text-[13px] text-white/70" style={{ fontFamily: "var(--font-sans)" }}>
                  {progressMessage || STEPS[activeStep]?.label || "Bygger"}{dots}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out loader-progress-bar"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #EC4899, #6366F1, #F59E0B)",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {STEPS.map((step, i) => (
                  <div
                    key={step.key}
                    className={`rounded-full transition-all duration-500 ${
                      i < activeStep
                        ? "w-1.5 h-1.5 bg-pink-500/60"
                        : i === activeStep
                          ? "w-2 h-2 bg-gradient-to-r from-pink-500 to-indigo-500"
                          : "w-1.5 h-1.5 bg-white/[0.08]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Idle state — warm invitation */}
        {isIdle && (
          <div className="flex items-center gap-2 loader-card-appear">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            <span className="text-[12px] text-white/25" style={{ fontFamily: "var(--font-sans)" }}>
              Skriv en besked for at komme i gang
            </span>
          </div>
        )}
      </div>

      {/* CSS Animations — scoped with loader- prefix */}
      <style>{`
        /* Circle draw animation */
        .loader-circle {
          stroke-dasharray: 157;
          stroke-dashoffset: 157;
          animation: loaderDraw 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .loader-circle-1 { animation-delay: 0s; }
        .loader-circle-2 { animation-delay: 0.2s; }
        .loader-circle-3 { animation-delay: 0.4s; }
        .loader-circle-4 { animation-delay: 0.6s; }

        @keyframes loaderDraw {
          to { stroke-dashoffset: 0; }
        }

        /* Fill fade */
        .loader-fill {
          animation: loaderFillIn 0.8s ease-out forwards;
        }
        .loader-fill-1 { animation-delay: 1s; }
        .loader-fill-2 { animation-delay: 1.15s; }
        .loader-fill-3 { animation-delay: 1.3s; }
        .loader-fill-4 { animation-delay: 1.45s; }

        @keyframes loaderFillIn {
          from { opacity: 0; }
          to { opacity: 0.7; }
        }

        /* Logo float */
        .loader-logo-float {
          animation: loaderFloat 5s ease-in-out infinite;
        }

        @keyframes loaderFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Logo glow pulse */
        .loader-logo-glow {
          animation: loaderGlowPulse 3s ease-in-out infinite;
        }

        @keyframes loaderGlowPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }

        /* Fade in on mount */
        .loader-fade-in {
          animation: loaderFadeInUp 0.8s ease-out both;
        }

        @keyframes loaderFadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Card appear */
        .loader-card-appear {
          animation: loaderFadeInUp 0.6s ease-out 0.3s both;
        }

        /* Handwriting text */
        .loader-handwriting {
          animation: loaderFadeInUp 0.7s ease-out 0.15s both;
        }

        /* Shimmer on card border */
        .loader-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.04) 40%,
            rgba(236,72,153,0.06) 50%,
            rgba(255,255,255,0.04) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: loaderShimmer 3s ease-in-out infinite;
        }

        @keyframes loaderShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Progress bar gradient animation */
        .loader-progress-bar {
          animation: loaderGradientX 2s linear infinite;
        }

        @keyframes loaderGradientX {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }

        /* Floating orbs */
        .loader-orb-1 {
          top: 10%;
          left: -10%;
          animation: loaderOrbFloat1 8s ease-in-out infinite;
        }
        .loader-orb-2 {
          bottom: 20%;
          right: -5%;
          animation: loaderOrbFloat2 10s ease-in-out infinite;
        }
        .loader-orb-3 {
          top: 60%;
          left: 30%;
          animation: loaderOrbFloat3 12s ease-in-out infinite;
        }

        @keyframes loaderOrbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, 20px); }
          66% { transform: translate(-10px, -15px); }
        }
        @keyframes loaderOrbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-20px, -25px); }
          66% { transform: translate(15px, 10px); }
        }
        @keyframes loaderOrbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }

        /* Grain texture */
        .loader-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }
      `}</style>
    </div>
  );
}
