"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full px-8 py-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isFuture = !isCompleted && !isCurrent;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative flex items-center justify-center w-9 h-9 rounded-full
                  transition-all duration-300 ease-out
                  ${
                    isCompleted
                      ? "bg-violet-600 shadow-lg shadow-violet-600/30"
                      : isCurrent
                        ? "bg-violet-600/20 border-2 border-violet-500 shadow-lg shadow-violet-500/20"
                        : "bg-[#1a1a24] border-2 border-[#2a2a3a]"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? "text-violet-400" : "text-[#4a4a5a]"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}

                {/* Pulse animation for current step */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-violet-500/20" />
                )}
              </div>

              {/* Step label */}
              <span
                className={`
                  mt-2 text-[11px] font-medium whitespace-nowrap
                  transition-colors duration-300
                  ${
                    isCompleted
                      ? "text-violet-400"
                      : isCurrent
                        ? "text-white"
                        : "text-[#4a4a5a]"
                  }
                `}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-12 h-[2px] mx-2 mt-[-1.25rem] rounded-full
                  transition-colors duration-300
                  ${
                    isCompleted && completedSteps.includes(index + 1)
                      ? "bg-violet-600"
                      : isCompleted
                        ? "bg-gradient-to-r from-violet-600 to-[#2a2a3a]"
                        : "bg-[#2a2a3a]"
                  }
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
