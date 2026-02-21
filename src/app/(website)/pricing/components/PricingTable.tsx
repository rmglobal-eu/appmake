"use client";

import { useState } from "react";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    description: "Perfect for exploring and personal projects",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "20 messages per day",
      "3 projects",
      "Basic AI models",
      "Community support",
      "Standard deployment",
      "1 GB storage",
    ],
    cta: "Get Started",
    highlighted: false,
    gradient: "from-zinc-800 to-zinc-900",
    borderColor: "border-zinc-700",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    description: "For serious builders who need more power",
    monthlyPrice: 19,
    yearlyPrice: Math.round(19 * 12 * 0.8) / 12,
    features: [
      "200 messages per day",
      "50 projects",
      "Advanced AI models (GPT-4, Claude)",
      "Priority support",
      "Custom deployments",
      "10 GB storage",
      "Version history",
      "Export to code",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    gradient: "from-indigo-600 to-purple-700",
    borderColor: "border-indigo-500",
  },
  {
    id: "team",
    name: "Team",
    icon: Building2,
    description: "For teams building together at scale",
    monthlyPrice: 49,
    yearlyPrice: Math.round(49 * 12 * 0.8) / 12,
    features: [
      "1,000 messages per day",
      "Unlimited projects",
      "All AI models",
      "Team collaboration features",
      "Custom domain",
      "100 GB storage",
      "Priority support & SLA",
      "SSO & advanced security",
      "Admin dashboard",
      "API access",
    ],
    cta: "Contact Sales",
    highlighted: false,
    gradient: "from-zinc-800 to-zinc-900",
    borderColor: "border-zinc-700",
  },
];

export function PricingTable({ currentPlan }: { currentPlan: string }) {
  const [isAnnual, setIsAnnual] = useState(false);

  const formatPrice = (plan: (typeof plans)[number]) => {
    if (plan.monthlyPrice === 0) return "0";
    if (isAnnual) {
      return plan.yearlyPrice.toFixed(0);
    }
    return plan.monthlyPrice.toString();
  };

  const getAnnualTotal = (plan: (typeof plans)[number]) => {
    if (plan.monthlyPrice === 0) return null;
    return Math.round(plan.yearlyPrice * 12);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-zinc-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isAnnual ? "bg-indigo-600" : "bg-zinc-700"
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                  isAnnual ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${isAnnual ? "text-white" : "text-zinc-500"}`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="ml-2 text-xs font-semibold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${plan.borderColor} bg-gradient-to-b ${plan.gradient} p-8 flex flex-col ${
                  plan.highlighted
                    ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02] md:scale-105"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-2 rounded-lg ${plan.highlighted ? "bg-white/20" : "bg-zinc-700/50"}`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-400">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">
                      ${formatPrice(plan)}
                    </span>
                    <span className="text-zinc-400 mb-1.5">/mo</span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-zinc-500 mt-1">
                      ${getAnnualTotal(plan)} billed annually
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <p className="text-sm text-zinc-500 mt-1">
                      Free forever
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-indigo-300" : "text-green-400"}`}
                      />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-white text-indigo-700 hover:bg-zinc-100 shadow-lg"
                      : "bg-zinc-700 text-white hover:bg-zinc-600 border border-zinc-600"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
