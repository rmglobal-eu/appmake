"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface InlineExplanationProps {
  code: string;
  explanation: string;
  line: number;
}

export default function InlineExplanation({
  code,
  explanation,
  line,
}: InlineExplanationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 320;

      let left = rect.left;
      if (left + tooltipWidth > viewportWidth - 16) {
        left = viewportWidth - tooltipWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setPosition({
        top: rect.bottom + 4,
        left,
      });
    }

    setIsVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  }, []);

  const handleTooltipMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="relative inline-block cursor-help border-b border-dashed border-zinc-600 hover:border-purple-400 transition-colors"
        role="button"
        tabIndex={0}
        aria-label={`Explanation for line ${line}`}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        <code className="text-sm font-mono text-zinc-300">{code}</code>
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          className="fixed z-50 w-80 max-h-64 overflow-auto animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          role="tooltip"
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl shadow-black/40">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 font-medium">
                Line {line}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI Explain
              </span>
            </div>

            {/* Code Preview */}
            <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50">
              <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap overflow-hidden">
                {code}
              </pre>
            </div>

            {/* Explanation */}
            <div className="px-3 py-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
