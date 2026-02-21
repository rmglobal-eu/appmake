"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface FeatureTooltipProps {
  targetId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  onDismiss: () => void;
  step?: number;
  totalSteps?: number;
}

export function FeatureTooltip({
  targetId,
  title,
  description,
  position = "bottom",
  onDismiss,
  step,
  totalSteps,
}: FeatureTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !tooltipRef.current) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = targetRect.top - tooltipRect.height - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - gap;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

    setCoords({ top, left });

    // Fade in after positioning
    requestAnimationFrame(() => setVisible(true));
  }, [targetId, position]);

  // Arrow styles per position
  const arrowClass: Record<string, string> = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[#1e1e2e]",
    bottom:
      "top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[#1e1e2e]",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[#1e1e2e]",
    right:
      "left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[#1e1e2e]",
  };

  return (
    <div
      ref={tooltipRef}
      className={`
        fixed z-[9999] w-72 rounded-xl border border-[#2a2a3a] bg-[#1e1e2e]
        shadow-2xl shadow-black/40 transition-all duration-300 ease-out
        ${visible && coords ? "opacity-100 scale-100" : "opacity-0 scale-95"}
      `}
      style={
        coords
          ? { top: coords.top, left: coords.left }
          : { top: -9999, left: -9999 }
      }
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-[6px] ${arrowClass[position]}`}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-white pr-4">{title}</h4>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-0.5 rounded-md text-[#6a6a7a] hover:text-white hover:bg-[#2a2a3a] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-[#8a8a9a] leading-relaxed mb-3">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {step !== undefined && totalSteps !== undefined ? (
            <span className="text-[10px] text-[#5a5a6a] font-medium">
              {step} of {totalSteps}
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
