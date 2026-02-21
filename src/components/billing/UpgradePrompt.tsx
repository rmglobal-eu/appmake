"use client";

import { useRouter } from "next/navigation";
import { X, Zap, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  requiredPlan: string;
  onClose: () => void;
}

const planUpgrades: Record<string, string[]> = {
  pro: [
    "200 messages per day",
    "50 projects",
    "Advanced AI models (GPT-4, Claude)",
    "Priority support",
    "10 GB storage",
    "Version history & code export",
  ],
  team: [
    "1,000 messages per day",
    "Unlimited projects",
    "All AI models",
    "Team collaboration",
    "Custom domain",
    "100 GB storage",
    "SSO & admin dashboard",
  ],
};

export default function UpgradePrompt({
  feature,
  currentPlan,
  requiredPlan,
  onClose,
}: UpgradePromptProps) {
  const router = useRouter();
  const benefits = planUpgrades[requiredPlan] ?? planUpgrades.pro;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 bg-indigo-500/20 rounded-xl mb-6">
          <Zap className="w-7 h-7 text-indigo-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">
          Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
        </h3>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-6">
          You&apos;ve reached the {feature} limit on your{" "}
          <span className="text-zinc-300 font-medium capitalize">
            {currentPlan}
          </span>{" "}
          plan. Upgrade to unlock more:
        </p>

        {/* Benefits list */}
        <ul className="space-y-3 mb-8">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <span className="text-sm text-zinc-300">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/pricing")}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View Plans
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors border border-zinc-700"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
