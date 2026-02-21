"use client";

import { useEffect, useState, type ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

const DEMOS = [
  { prompt: "Build me a SaaS dashboard with analytics and charts" },
  { prompt: "Create a modern landing page for my AI startup" },
  { prompt: "Design a team chat app with real-time channels" },
];

type Phase = "typing" | "building" | "reveal" | "hold" | "fadeout";

export function LoginShowcase() {
  const [GradientComp, setGradientComp] = useState<AnyComponent | null>(null);
  const [demoIdx, setDemoIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [charIdx, setCharIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const demo = DEMOS[demoIdx];
  const typedText = demo.prompt.slice(0, charIdx);

  // Load mesh gradient
  useEffect(() => {
    import("@paper-design/shaders-react")
      .then((mod) => {
        const Comp = (mod as unknown as Record<string, AnyComponent>).MeshGradient;
        if (Comp) setGradientComp(() => Comp);
      })
      .catch(() => {});
  }, []);

  // Typing
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIdx >= demo.prompt.length) {
      const t = setTimeout(() => setPhase("building"), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setCharIdx((i) => i + 1),
      30 + Math.random() * 30
    );
    return () => clearTimeout(t);
  }, [phase, charIdx, demo.prompt]);

  // Building
  useEffect(() => {
    if (phase !== "building") return;
    if (progress >= 100) {
      const t = setTimeout(() => setPhase("reveal"), 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setProgress((p) => Math.min(100, p + 1.5 + Math.random() * 2.5)),
      25
    );
    return () => clearTimeout(t);
  }, [phase, progress]);

  // Reveal → hold
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => setPhase("hold"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Hold → fadeout
  useEffect(() => {
    if (phase !== "hold") return;
    const t = setTimeout(() => setPhase("fadeout"), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Fadeout → next demo
  useEffect(() => {
    if (phase !== "fadeout") return;
    const t = setTimeout(() => {
      setDemoIdx((i) => (i + 1) % DEMOS.length);
      setCharIdx(0);
      setProgress(0);
      setPhase("typing");
    }, 700);
    return () => clearTimeout(t);
  }, [phase]);

  const showMockUI =
    (phase === "building" && progress >= 50) ||
    phase === "reveal" ||
    phase === "hold";
  const mockProgress =
    phase === "building" ? (progress - 50) * 2 : 100;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        {GradientComp ? (
          <GradientComp
            color1="#1a0533"
            color2="#0a1628"
            color3="#ff1493"
            color4="#c2185b"
            speed={0.3}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #ff1493 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, #c2185b 0%, transparent 40%), #0a1628",
            }}
          />
        )}
      </div>

      {/* Animated showcase */}
      <div
        className={`relative w-full max-w-md px-6 transition-all duration-700 ease-out ${
          phase === "fadeout"
            ? "scale-95 opacity-0"
            : "scale-100 opacity-100"
        }`}
      >
        {/* Browser window */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <div className="mx-auto rounded-md bg-white/[0.04] px-10 py-1 font-mono text-[10px] text-white/25">
              myapp.appmake.dk
            </div>
          </div>

          {/* Content area */}
          <div className="relative min-h-[280px] p-3">
            {phase === "typing" && !showMockUI && (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-xs italic text-white/15">
                  Waiting for your prompt...
                </p>
              </div>
            )}

            {phase === "building" && progress < 50 && (
              <div className="flex h-[280px] flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                <span className="text-xs text-white/40">
                  Building your app...
                </span>
                <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {showMockUI && (
              <MockApp type={demoIdx} progress={mockProgress} />
            )}
          </div>
        </div>

        {/* Prompt input */}
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm text-white/70">{typedText}</span>
              {phase === "typing" && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-violet-400" />
              )}
            </div>
            {charIdx > 0 && (
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                  phase !== "typing"
                    ? "bg-violet-600"
                    : "bg-white/10"
                }`}
              >
                <svg
                  className="h-3 w-3 text-white/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Demo indicator dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {DEMOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === demoIdx
                  ? "w-6 bg-violet-400/60"
                  : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mock App Previews ── */

function MockApp({ type, progress }: { type: number; progress: number }) {
  const s = (threshold: number): React.CSSProperties => ({
    opacity: progress >= threshold ? 1 : 0,
    transform: progress >= threshold ? "translateY(0)" : "translateY(8px)",
    transition: "all 0.4s ease-out",
  });

  if (type === 0) return <DashboardMock s={s} />;
  if (type === 1) return <LandingMock s={s} />;
  return <ChatMock s={s} />;
}

type StyleFn = (t: number) => React.CSSProperties;

function DashboardMock({ s }: { s: StyleFn }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div style={s(0)} className="flex items-center justify-between">
        <div className="h-4 w-16 rounded bg-white/15" />
        <div className="flex gap-1.5">
          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-4 w-4 rounded-full bg-violet-500/40" />
        </div>
      </div>

      {/* Stats */}
      <div style={s(15)} className="grid grid-cols-3 gap-2 pt-2">
        <div className="rounded-lg bg-violet-500/10 p-2.5">
          <div className="mb-1.5 h-2 w-8 rounded bg-white/20" />
          <div className="h-5 w-12 rounded bg-violet-400/40" />
        </div>
        <div className="rounded-lg bg-pink-500/10 p-2.5">
          <div className="mb-1.5 h-2 w-10 rounded bg-white/20" />
          <div className="h-5 w-10 rounded bg-pink-400/40" />
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2.5">
          <div className="mb-1.5 h-2 w-6 rounded bg-white/20" />
          <div className="h-5 w-14 rounded bg-emerald-400/40" />
        </div>
      </div>

      {/* Chart */}
      <div style={s(35)} className="rounded-lg bg-white/[0.03] p-3">
        <div className="mb-3 h-2 w-16 rounded bg-white/15" />
        <div className="flex h-24 items-end gap-1">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-violet-500/30 to-violet-500/10"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div style={s(60)} className="space-y-1.5 pt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md bg-white/[0.02] px-2.5 py-2"
          >
            <div className="h-3 w-3 rounded-full bg-white/10" />
            <div className="h-2 flex-1 rounded bg-white/10" />
            <div className="h-2 w-10 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingMock({ s }: { s: StyleFn }) {
  return (
    <div className="space-y-3">
      {/* Nav */}
      <div style={s(0)} className="flex items-center justify-between">
        <div className="h-4 w-14 rounded bg-white/15" />
        <div className="flex gap-3">
          <div className="h-2 w-8 rounded bg-white/10" />
          <div className="h-2 w-8 rounded bg-white/10" />
          <div className="h-5 w-14 rounded-md bg-violet-500/40" />
        </div>
      </div>

      {/* Hero */}
      <div style={s(15)} className="flex flex-col items-center py-4 text-center">
        <div className="mb-2 h-4 w-48 rounded bg-white/15" />
        <div className="mb-1 h-3 w-36 rounded bg-white/10" />
        <div className="mb-4 h-2 w-52 rounded bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-md bg-gradient-to-r from-violet-500/50 to-pink-500/50" />
          <div className="h-6 w-20 rounded-md border border-white/10 bg-white/[0.03]" />
        </div>
      </div>

      {/* Features */}
      <div style={s(40)} className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] p-3 text-center"
          >
            <div className="mx-auto mb-2 h-6 w-6 rounded-lg bg-violet-500/20" />
            <div className="mx-auto mb-1 h-2 w-12 rounded bg-white/15" />
            <div className="mx-auto h-1.5 w-16 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div style={s(65)} className="rounded-xl bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-pink-500/30" />
          <div>
            <div className="h-2 w-16 rounded bg-white/15" />
            <div className="mt-1 h-1.5 w-10 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded bg-white/[0.06]" />
          <div className="h-1.5 w-3/4 rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function ChatMock({ s }: { s: StyleFn }) {
  return (
    <div className="flex h-[280px] gap-2">
      {/* Sidebar */}
      <div
        style={s(0)}
        className="w-20 shrink-0 space-y-1.5 rounded-lg bg-white/[0.03] p-2"
      >
        <div className="mb-3 h-4 w-full rounded bg-white/10" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 rounded-md p-1.5 ${
              i === 0 ? "bg-violet-500/15" : ""
            }`}
          >
            <div className="h-4 w-4 shrink-0 rounded-full bg-white/15" />
            <div className="h-1.5 w-full rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-lg bg-white/[0.02]">
        {/* Header */}
        <div
          style={s(10)}
          className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2"
        >
          <div className="h-5 w-5 rounded-full bg-violet-500/30" />
          <div>
            <div className="h-2 w-16 rounded bg-white/15" />
            <div className="mt-0.5 h-1.5 w-8 rounded bg-green-400/30" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2 p-3">
          <div style={s(25)} className="flex justify-start">
            <div className="max-w-[70%] rounded-xl rounded-tl-sm bg-white/[0.06] px-3 py-2">
              <div className="h-1.5 w-24 rounded bg-white/15" />
              <div className="mt-1 h-1.5 w-16 rounded bg-white/10" />
            </div>
          </div>
          <div style={s(40)} className="flex justify-end">
            <div className="max-w-[70%] rounded-xl rounded-tr-sm bg-violet-500/20 px-3 py-2">
              <div className="h-1.5 w-20 rounded bg-white/20" />
            </div>
          </div>
          <div style={s(55)} className="flex justify-start">
            <div className="max-w-[70%] rounded-xl rounded-tl-sm bg-white/[0.06] px-3 py-2">
              <div className="h-1.5 w-28 rounded bg-white/15" />
              <div className="mt-1 h-1.5 w-20 rounded bg-white/10" />
              <div className="mt-1 h-1.5 w-12 rounded bg-white/10" />
            </div>
          </div>
          <div style={s(70)} className="flex justify-end">
            <div className="max-w-[70%] rounded-xl rounded-tr-sm bg-violet-500/20 px-3 py-2">
              <div className="h-1.5 w-32 rounded bg-white/20" />
              <div className="mt-1 h-1.5 w-16 rounded bg-white/15" />
            </div>
          </div>
        </div>

        {/* Input */}
        <div
          style={s(85)}
          className="border-t border-white/[0.05] px-3 py-2"
        >
          <div className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2 py-1.5">
            <div className="h-1.5 flex-1 rounded bg-white/10" />
            <div className="h-4 w-4 rounded bg-violet-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
