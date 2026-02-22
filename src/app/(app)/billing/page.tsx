"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Zap,
  Building2,
  Sparkles,
  Crown,
} from "lucide-react";
import UsageMeter from "@/components/billing/UsageMeter";
import BillingHistory from "@/components/billing/BillingHistory";

interface UsageData {
  plan: string;
  usage: {
    messages: { used: number; limit: number; resetsAt: string };
    projects: { used: number; limit: number };
    storage: { used: number; limit: number };
  };
}

const planIcons: Record<string, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  team: Building2,
};

const planColors: Record<string, string> = {
  free: "text-zinc-400",
  pro: "text-indigo-400",
  team: "text-purple-400",
};

const planBadgeColors: Record<string, string> = {
  free: "bg-zinc-800 text-zinc-300 border-zinc-700",
  pro: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  team: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function BillingPage() {
  const router = useRouter();
  const t = useTranslations("billing");
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/billing/usage");
        if (res.ok) {
          const data = await res.json();
          setUsageData(data);
        }
      } catch (err) {
        console.error("Failed to fetch usage data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t("loadingBilling")}</span>
        </div>
      </div>
    );
  }

  const plan = usageData?.plan ?? "free";
  const PlanIcon = planIcons[plan] ?? Sparkles;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("billingAndUsage")}
          </h1>
          <p className="text-zinc-400">
            {t("billingDesc")}
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-zinc-800 ${planColors[plan]}`}
              >
                <PlanIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    {t("currentPlan")}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${planBadgeColors[plan]}`}
                  >
                    {plan}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {plan === "free"
                    ? t("freeForever")
                    : plan === "pro"
                      ? t("proDesc")
                      : t("teamDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {plan !== "free" && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {t("manageSubscription")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              {plan === "free" && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  {t("upgradePlan")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage Meters */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {t("currentUsage")}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UsageMeter
              used={usageData?.usage?.messages?.used ?? 0}
              limit={usageData?.usage?.messages?.limit ?? 20}
              label={t("messagesDay")}
              resetAt={
                usageData?.usage?.messages?.resetsAt
                  ? new Date(usageData.usage.messages.resetsAt)
                  : undefined
              }
            />
            <UsageMeter
              used={usageData?.usage?.projects?.used ?? 0}
              limit={usageData?.usage?.projects?.limit ?? 3}
              label={t("projectsLabel")}
            />
            <UsageMeter
              used={usageData?.usage?.storage?.used ?? 0}
              limit={usageData?.usage?.storage?.limit ?? 1073741824}
              label={t("storage")}
            />
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {t("billingHistory")}
          </h3>
          <BillingHistory />
        </div>
      </div>
    </div>
  );
}
