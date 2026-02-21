"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MessageSquare,
  Code2,
  Eye,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  icon: React.ReactNode;
  instruction: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "type-prompt",
    title: "Write Your Prompt",
    description:
      "Start by describing what you want to build. The AI will generate a complete application from your description.",
    targetId: "chat-input",
    icon: <MessageSquare className="w-5 h-5" />,
    instruction:
      'Try typing something like "Build a todo app with categories and dark mode"',
  },
  {
    id: "ai-response",
    title: "See AI in Action",
    description:
      "Watch as the AI writes code in real-time. It generates components, styles, and logic based on your prompt.",
    targetId: "chat-messages",
    icon: <Sparkles className="w-5 h-5" />,
    instruction:
      "The AI will stream its response and generate files for your project",
  },
  {
    id: "edit-code",
    title: "Edit the Code",
    description:
      "You can directly edit any generated file. The editor supports TypeScript, JSX, CSS, and more with full syntax highlighting.",
    targetId: "code-editor",
    icon: <Code2 className="w-5 h-5" />,
    instruction:
      "Click on any file in the sidebar and make edits directly in the editor",
  },
  {
    id: "preview",
    title: "Live Preview",
    description:
      "See your changes instantly in the live preview panel. Every edit updates the preview in real-time.",
    targetId: "preview-panel",
    icon: <Eye className="w-5 h-5" />,
    instruction:
      "The preview updates automatically as you edit code or receive AI responses",
  },
];

interface InteractiveTutorialProps {
  onComplete: () => void;
}

export function InteractiveTutorial({ onComplete }: InteractiveTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  // Update highlight position when step changes
  useEffect(() => {
    const updateRect = () => {
      const target = document.getElementById(currentStep.targetId);
      if (target) {
        setHighlightRect(target.getBoundingClientRect());
      } else {
        setHighlightRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep.targetId]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.x - 6}
                y={highlightRect.y - 6}
                width={highlightRect.width + 12}
                height={highlightRect.height + 12}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: "all" }}
        />
      </svg>

      {/* Highlight border glow */}
      {highlightRect && (
        <div
          className="absolute rounded-xl border-2 border-violet-500/60 shadow-[0_0_30px_rgba(139,92,246,0.15)] pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: highlightRect.y - 6,
            left: highlightRect.x - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
          }}
        />
      )}

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8a8a9a] hover:text-white rounded-lg bg-[#1a1a24]/80 border border-[#2a2a3a] hover:border-[#3a3a4a] backdrop-blur-sm transition-all"
      >
        <X className="w-3.5 h-3.5" />
        Skip Tutorial
      </button>

      {/* Instruction card */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg">
        <div className="bg-[#13131d] border border-[#2a2a3a] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-[#1a1a24]">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500 ease-out"
              style={{
                width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%`,
              }}
            />
          </div>

          <div className="p-6">
            {/* Step header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/15 text-violet-400">
                {currentStep.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {currentStep.title}
                  </h3>
                  <span className="text-[10px] font-medium text-[#5a5a6a] bg-[#1a1a24] px-2 py-0.5 rounded-full">
                    {currentStepIndex + 1}/{TUTORIAL_STEPS.length}
                  </span>
                </div>
                <p className="text-xs text-[#7a7a8a] mt-0.5">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Instruction */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] mb-4">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#b0b0c0] leading-relaxed">
                {currentStep.instruction}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 text-xs font-medium text-[#7a7a8a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#1a1a24] transition-all"
              >
                Back
              </button>

              <div className="flex items-center gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStepIndex
                        ? "w-4 bg-violet-500"
                        : i < currentStepIndex
                          ? "bg-violet-600/40"
                          : "bg-[#2a2a3a]"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                {isLastStep ? "Finish" : "Next"}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
