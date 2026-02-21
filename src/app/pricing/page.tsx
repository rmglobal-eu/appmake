"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NavHeader } from "@/components/NavHeader";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "20 messages per day",
      "Quick preview",
      "Download ZIP",
      "1 project",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/month",
    features: [
      "Unlimited messages",
      "Docker sandbox",
      "Deploy to Vercel/Netlify",
      "Custom domains",
      "Git integration",
      "AI code review",
      "Unlimited projects",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$50",
    period: "/month",
    features: [
      "Everything in Pro",
      "Real-time collaboration",
      "Team management",
      "Shared templates",
      "Audit tools",
      "Priority support",
      "Up to 10 team members",
    ],
    cta: "Upgrade to Team",
  },
];

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Subscription activated!");
    }
    if (searchParams.get("canceled")) {
      toast("Checkout canceled");
    }

    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => setCurrentPlan(data.subscription?.plan || "free"))
      .catch(() => {});
  }, [searchParams]);

  async function handleUpgrade(plan: string) {
    if (plan === "free") return;
    setLoading(plan);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-6 space-y-6 ${
              plan.popular ? "border-primary shadow-lg ring-1 ring-primary" : ""
            }`}
          >
            {plan.popular && (
              <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </span>
            )}
            <div>
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              disabled={plan.disabled || currentPlan === plan.id || loading !== null}
              onClick={() => handleUpgrade(plan.id)}
            >
              {loading === plan.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentPlan === plan.id ? (
                "Current Plan"
              ) : (
                plan.cta
              )}
            </Button>
          </div>
        ))}
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
