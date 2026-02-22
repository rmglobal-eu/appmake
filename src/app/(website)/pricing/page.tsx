"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import { PricingTable } from "./components/PricingTable";
import { PlanComparison } from "./components/PlanComparison";
import { FAQSection } from "./components/FAQSection";

function PricingContent() {
  const t = useTranslations("pricing");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Subscription activated!");
    }
    if (searchParams.get("canceled")) {
      toast("Checkout canceled");
    }

    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setCurrentPlan(data.plan || "free"))
      .catch(() => {});
  }, [searchParams]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("simplePricing")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("pricingDescription")}
        </p>
      </div>

      <PricingTable currentPlan={currentPlan} />

      <div className="mt-24">
        <h2 className="text-2xl font-bold text-center mb-8">{t("comparePlans")}</h2>
        <PlanComparison />
      </div>

      <div className="mt-24">
        <FAQSection />
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <PricingContent />
      </Suspense>
    </div>
  );
}
