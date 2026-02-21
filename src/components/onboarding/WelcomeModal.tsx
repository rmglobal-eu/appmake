"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, Eye, Rocket, ArrowRight } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStarted: () => void;
  onSkip: () => void;
}

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI Code Generation",
    description:
      "Describe what you want to build and watch as AI creates your entire application in seconds.",
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Live Preview",
    description:
      "See every change reflected instantly in a real-time preview. Edit and iterate at the speed of thought.",
    gradient: "from-fuchsia-600 to-pink-600",
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "One-Click Deploy",
    description:
      "Ship your app to production in one click. Deploy to Vercel or Netlify with zero configuration.",
    gradient: "from-amber-500 to-orange-600",
  },
];

export function WelcomeModal({
  open,
  onOpenChange,
  onGetStarted,
  onSkip,
}: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl bg-[#0f0f14] border-[#2a2a3a] p-0 overflow-hidden"
      >
        {/* Gradient header */}
        <div className="relative px-8 pt-10 pb-6">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-fuchsia-600/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/15 blur-3xl rounded-full pointer-events-none" />

          <DialogHeader className="relative">
            {/* Logo / Icon */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/25">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold text-white text-center">
              Welcome to AppMake
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8a8a9a] text-center max-w-sm mx-auto">
              Build full-stack applications with AI. Describe your idea and get
              production-ready code in seconds.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature cards */}
        <div className="px-6 pb-2 space-y-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-4 rounded-xl bg-[#15151f] border border-[#1e1e2e] hover:border-[#2a2a3a] transition-colors"
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}
              >
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-[#7a7a8a] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 flex flex-col gap-2.5">
          <button
            onClick={onGetStarted}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-600/20 transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2.5 text-xs font-medium text-[#6a6a7a] hover:text-white rounded-xl hover:bg-[#15151f] transition-all"
          >
            Skip Tour
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
