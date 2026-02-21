"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  LayoutGrid,
  MessageSquare,
  Compass,
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Rocket,
  Code2,
  Eye,
  Wand2,
  Layers,
  Terminal,
} from "lucide-react";
import { StepIndicator } from "./StepIndicator";

// ─── Step definitions ──────────────────────────────────────────────────

const STEP_IDS = [
  "welcome",
  "choose-template",
  "first-prompt",
  "explore-editor",
  "complete",
] as const;

type StepId = (typeof STEP_IDS)[number];

const STEP_LABELS = [
  "Welcome",
  "Template",
  "First Prompt",
  "Editor",
  "Complete",
];

// ─── Template options ──────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with an empty canvas",
    icon: <Code2 className="w-5 h-5" />,
    color: "from-slate-600 to-slate-700",
  },
  {
    id: "react",
    name: "React App",
    description: "React + TypeScript + Tailwind CSS",
    icon: <Layers className="w-5 h-5" />,
    color: "from-cyan-600 to-blue-600",
  },
  {
    id: "nextjs",
    name: "Next.js App",
    description: "Full-stack with API routes and SSR",
    icon: <Terminal className="w-5 h-5" />,
    color: "from-violet-600 to-indigo-600",
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Beautiful marketing page with sections",
    icon: <Rocket className="w-5 h-5" />,
    color: "from-fuchsia-600 to-pink-600",
  },
];

// ─── Props ─────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState("");

  // Persist progress to API
  const saveProgress = useCallback(async (stepId: string) => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_step", stepId }),
      });
    } catch {
      // Silently fail - onboarding should not block the user
    }
  }, []);

  const handleNext = useCallback(async () => {
    const stepId = STEP_IDS[currentStep];

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    await saveProgress(stepId);

    if (currentStep < STEP_IDS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, completedSteps, saveProgress]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
    } catch {
      // Silently fail
    }
    onSkip();
  }, [onSkip]);

  const handleFinish = useCallback(async () => {
    // Mark final step
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    await saveProgress("complete");

    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish" }),
      });
    } catch {
      // Silently fail
    }
    onComplete();
  }, [currentStep, completedSteps, saveProgress, onComplete]);

  // ─── Step content renderers ────────────────────────────────────────

  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center px-6">
      {/* Gradient icon */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-600/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 blur-xl -z-10" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Welcome to AppMake
      </h2>
      <p className="text-sm text-[#8a8a9a] max-w-md leading-relaxed mb-8">
        Let us show you around. In just a few steps, you will learn how to build
        full-stack applications with AI in minutes.
      </p>

      {/* Quick feature highlights */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
        {[
          { icon: <Wand2 className="w-4 h-4" />, label: "AI-Powered" },
          { icon: <Eye className="w-4 h-4" />, label: "Live Preview" },
          { icon: <Rocket className="w-4 h-4" />, label: "Instant Deploy" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#15151f] border border-[#1e1e2e]"
          >
            <div className="text-violet-400">{item.icon}</div>
            <span className="text-xs font-medium text-[#8a8a9a]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChooseTemplate = () => (
    <div className="px-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/15 text-violet-400 mx-auto mb-3">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          Choose a Starting Point
        </h2>
        <p className="text-sm text-[#7a7a8a]">
          Pick a template to kickstart your project, or start from scratch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`
              flex flex-col items-start p-4 rounded-xl border transition-all text-left
              ${
                selectedTemplate === template.id
                  ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-600/10"
                  : "border-[#1e1e2e] bg-[#15151f] hover:border-[#2a2a3a]"
              }
            `}
          >
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${template.color} mb-3`}
            >
              {template.icon}
            </div>
            <h3 className="text-sm font-semibold text-white mb-0.5">
              {template.name}
            </h3>
            <p className="text-[11px] text-[#6a6a7a] leading-snug">
              {template.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFirstPrompt = () => (
    <div className="px-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/15 text-violet-400 mx-auto mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          Write Your First Prompt
        </h2>
        <p className="text-sm text-[#7a7a8a]">
          Describe what you want to build. The more detail, the better the
          result.
        </p>
      </div>

      {/* Prompt input */}
      <div className="relative">
        <textarea
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          placeholder="Build a task management app with categories, due dates, and a beautiful dark theme..."
          rows={4}
          className="w-full px-4 py-3 text-sm text-white placeholder-[#4a4a5a] bg-[#15151f] border border-[#2a2a3a] rounded-xl resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400/50" />
          <span className="text-[10px] text-[#4a4a5a]">AI-powered</span>
        </div>
      </div>

      {/* Example prompts */}
      <div className="mt-4">
        <p className="text-[10px] font-medium text-[#5a5a6a] uppercase tracking-wider mb-2">
          Example prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "E-commerce dashboard",
            "Blog with CMS",
            "Chat application",
            "Portfolio site",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setPromptValue(example)}
              className="px-3 py-1.5 text-[11px] text-[#7a7a8a] bg-[#15151f] border border-[#1e1e2e] rounded-lg hover:border-[#2a2a3a] hover:text-white transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExploreEditor = () => (
    <div className="px-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/15 text-violet-400 mx-auto mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">
          Explore the Editor
        </h2>
        <p className="text-sm text-[#7a7a8a]">
          Here is a quick overview of the key areas you will use.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: <MessageSquare className="w-4 h-4" />,
            title: "AI Chat Panel",
            desc: "Ask the AI to add features, fix bugs, or refactor code. It understands your entire project.",
            color: "text-violet-400 bg-violet-600/15",
          },
          {
            icon: <Code2 className="w-4 h-4" />,
            title: "Code Editor",
            desc: "Full syntax highlighting, auto-complete, and multi-file editing with tab support.",
            color: "text-cyan-400 bg-cyan-600/15",
          },
          {
            icon: <Eye className="w-4 h-4" />,
            title: "Live Preview",
            desc: "See your app running in real-time. Changes are reflected instantly as you code.",
            color: "text-fuchsia-400 bg-fuchsia-600/15",
          },
          {
            icon: <Rocket className="w-4 h-4" />,
            title: "Deploy",
            desc: "When you are ready, deploy to Vercel or Netlify with a single click.",
            color: "text-amber-400 bg-amber-600/15",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-3 rounded-xl bg-[#15151f] border border-[#1e1e2e]"
          >
            <div
              className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${item.color}`}
            >
              {item.icon}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-0.5">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#6a6a7a] leading-snug">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="flex flex-col items-center text-center px-6">
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-600/30">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 blur-xl -z-10" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">You are All Set!</h2>
      <p className="text-sm text-[#8a8a9a] max-w-md leading-relaxed mb-6">
        You are ready to start building. Type a prompt in the chat or pick a
        template from the dashboard to create your first app.
      </p>

      {/* Summary card */}
      <div className="w-full max-w-sm p-4 rounded-xl bg-[#15151f] border border-[#1e1e2e]">
        <p className="text-xs font-medium text-[#5a5a6a] uppercase tracking-wider mb-3">
          Quick recap
        </p>
        <div className="space-y-2 text-left">
          {[
            "Describe your app in the chat",
            "Edit generated code in the editor",
            "Preview your app in real-time",
            "Deploy when ready",
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600/20 text-violet-400">
                <span className="text-[10px] font-bold">{i + 1}</span>
              </div>
              <span className="text-xs text-[#8a8a9a]">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Step renderer map ─────────────────────────────────────────────

  const stepRenderers: Record<StepId, () => React.ReactNode> = {
    welcome: renderWelcome,
    "choose-template": renderChooseTemplate,
    "first-prompt": renderFirstPrompt,
    "explore-editor": renderExploreEditor,
    complete: renderComplete,
  };

  const currentStepId = STEP_IDS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEP_IDS.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Wizard card */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0f0f14] border border-[#2a2a3a] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Top gradient line */}
        <div className="h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600" />

        {/* Progress indicator */}
        <div className="pt-5 pb-2">
          <StepIndicator
            steps={STEP_LABELS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step content */}
        <div className="py-6 min-h-[340px] flex flex-col justify-center">
          {stepRenderers[currentStepId]()}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a24]">
          {/* Left: Back */}
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#7a7a8a] hover:text-white disabled:opacity-0 disabled:pointer-events-none rounded-lg hover:bg-[#15151f] transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Center: Skip */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-[#5a5a6a] hover:text-[#8a8a9a] rounded-lg transition-colors"
            >
              <SkipForward className="w-3 h-3" />
              Skip Tour
            </button>
          )}

          {/* Right: Next / Finish */}
          {isLastStep ? (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/20 transition-all"
            >
              Start Building
              <Rocket className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
