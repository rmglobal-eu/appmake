"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";

type PlanDef = {
  id: string;
  nameKey: string;
  icon: typeof Sparkles;
  descriptionKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  featureKeys: string[];
  ctaKey: string;
  highlighted: boolean;
  gradient: string;
  borderColor: string;
};

const plans: PlanDef[] = [
  {
    id: "free",
    nameKey: "free",
    icon: Sparkles,
    descriptionKey: "freeForever",
    monthlyPrice: 0,
    yearlyPrice: 0,
    featureKeys: [
      "free20Messages",
      "free3Projects",
      "basicAIModels",
      "communitySupport",
      "standardDeployment",
      "1GBStorage",
    ],
    ctaKey: "getStarted",
    highlighted: false,
    gradient: "from-zinc-800 to-zinc-900",
    borderColor: "border-zinc-700",
  },
  {
    id: "pro",
    nameKey: "pro",
    icon: Zap,
    descriptionKey: "pricingDescription",
    monthlyPrice: 19,
    yearlyPrice: Math.round(19 * 12 * 0.8) / 12,
    featureKeys: [
      "pro200Messages",
      "pro50Projects",
      "advancedAIModels",
      "prioritySupport",
      "customDeployments",
      "10GBStorage",
      "versionHistory",
      "exportToCode",
    ],
    ctaKey: "upgradeToPro",
    highlighted: true,
    gradient: "from-indigo-600 to-purple-700",
    borderColor: "border-indigo-500",
  },
  {
    id: "team",
    nameKey: "team",
    icon: Building2,
    descriptionKey: "teamCollaboration",
    monthlyPrice: 49,
    yearlyPrice: Math.round(49 * 12 * 0.8) / 12,
    featureKeys: [
      "team1000Messages",
      "teamUnlimitedProjects",
      "allAIModels",
      "teamCollaboration",
      "customDomain",
      "100GBStorage",
      "prioritySupportSLA",
      "ssoSecurity",
      "adminDashboard",
      "apiAccess",
    ],
    ctaKey: "contactSales",
    highlighted: false,
    gradient: "from-zinc-800 to-zinc-900",
    borderColor: "border-zinc-700",
  },
];

export function PricingTable({ currentPlan }: { currentPlan: string }) {
  const t = useTranslations("pricing");
  const [isAnnual, setIsAnnual] = useState(false);

  const formatPrice = (plan: PlanDef) => {
    if (plan.monthlyPrice === 0) return "0";
    if (isAnnual) {
      return plan.yearlyPrice.toFixed(0);
    }
    return plan.monthlyPrice.toString();
  };

  const getAnnualTotal = (plan: PlanDef) => {
    if (plan.monthlyPrice === 0) return null;
    return Math.round(plan.yearlyPrice * 12);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t("simplePricing")}
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
            {t("pricingDescription")}
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-zinc-500"}`}
            >
              {t("monthly")}
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
              {t("annual")}
            </span>
            {isAnnual && (
              <span className="ml-2 text-xs font-semibold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                {t("save20")}
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
                      {t("mostPopular")}
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
                      {t(plan.nameKey)}
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-400">{t(plan.descriptionKey)}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">
                      ${formatPrice(plan)}
                    </span>
                    <span className="text-zinc-400 mb-1.5">{t("pricePerMonth")}</span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-zinc-500 mt-1">
                      ${getAnnualTotal(plan)} {t("billedAnnually")}
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {t("freeForever")}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-indigo-300" : "text-green-400"}`}
                      />
                      <span className="text-sm text-zinc-300">{t(featureKey)}</span>
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
                  {t(plan.ctaKey)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
