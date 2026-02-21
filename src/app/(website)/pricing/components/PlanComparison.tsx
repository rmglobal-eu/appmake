"use client";

import { Check, X, Minus } from "lucide-react";

type CellValue = boolean | string;

interface FeatureRow {
  name: string;
  free: CellValue;
  pro: CellValue;
  team: CellValue;
}

interface FeatureCategory {
  category: string;
  features: FeatureRow[];
}

const comparisonData: FeatureCategory[] = [
  {
    category: "AI Features",
    features: [
      { name: "Messages per day", free: "20", pro: "200", team: "1,000" },
      { name: "Basic models (GPT-3.5)", free: true, pro: true, team: true },
      {
        name: "Advanced models (GPT-4, Claude)",
        free: false,
        pro: true,
        team: true,
      },
      { name: "Custom model fine-tuning", free: false, pro: false, team: true },
      {
        name: "AI code generation",
        free: "Basic",
        pro: "Advanced",
        team: "Advanced",
      },
      {
        name: "Context window",
        free: "4K tokens",
        pro: "32K tokens",
        team: "128K tokens",
      },
    ],
  },
  {
    category: "Projects",
    features: [
      { name: "Active projects", free: "3", pro: "50", team: "Unlimited" },
      { name: "Storage", free: "1 GB", pro: "10 GB", team: "100 GB" },
      {
        name: "Max file size",
        free: "5 MB",
        pro: "50 MB",
        team: "500 MB",
      },
      { name: "Version history", free: false, pro: true, team: true },
      { name: "Project templates", free: "5", pro: "All", team: "All + Custom" },
      { name: "Export to code", free: false, pro: true, team: true },
    ],
  },
  {
    category: "Collaboration",
    features: [
      { name: "Team members", free: "1", pro: "1", team: "Up to 25" },
      {
        name: "Shared projects",
        free: false,
        pro: false,
        team: true,
      },
      {
        name: "Real-time collaboration",
        free: false,
        pro: false,
        team: true,
      },
      {
        name: "Role-based access control",
        free: false,
        pro: false,
        team: true,
      },
      { name: "Activity log", free: false, pro: false, team: true },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Community forum", free: true, pro: true, team: true },
      { name: "Email support", free: false, pro: true, team: true },
      {
        name: "Priority support",
        free: false,
        pro: true,
        team: true,
      },
      {
        name: "Dedicated account manager",
        free: false,
        pro: false,
        team: true,
      },
      {
        name: "SLA guarantee",
        free: false,
        pro: false,
        team: "99.9%",
      },
    ],
  },
  {
    category: "Deployment",
    features: [
      { name: "Subdomain hosting", free: true, pro: true, team: true },
      { name: "Custom domain", free: false, pro: false, team: true },
      { name: "SSL certificate", free: true, pro: true, team: true },
      { name: "Auto-scaling", free: false, pro: true, team: true },
      { name: "API access", free: false, pro: false, team: true },
      { name: "CI/CD integration", free: false, pro: false, team: true },
    ],
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-green-400 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-zinc-600 mx-auto" />
    );
  }
  return (
    <span className="text-sm text-zinc-300 font-medium">{value}</span>
  );
}

export function PlanComparison() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Compare plans in detail
          </h2>
          <p className="text-zinc-400">
            See exactly what you get with each plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm w-[40%]">
                  Feature
                </th>
                <th className="text-center py-4 px-4 text-zinc-300 font-semibold text-sm w-[20%]">
                  Free
                </th>
                <th className="text-center py-4 px-4 text-indigo-400 font-semibold text-sm w-[20%]">
                  Pro
                </th>
                <th className="text-center py-4 px-4 text-zinc-300 font-semibold text-sm w-[20%]">
                  Team
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category) => (
                <>
                  <tr key={category.category}>
                    <td
                      colSpan={4}
                      className="pt-8 pb-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider"
                    >
                      {category.category}
                    </td>
                  </tr>
                  {category.features.map((feature, featureIndex) => (
                    <tr
                      key={`${category.category}-${feature.name}`}
                      className={`${
                        featureIndex % 2 === 0
                          ? "bg-zinc-900/50"
                          : "bg-transparent"
                      } border-b border-zinc-800/50`}
                    >
                      <td className="py-3.5 px-4 text-sm text-zinc-300">
                        {feature.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <CellContent value={feature.free} />
                      </td>
                      <td className="py-3.5 px-4 text-center bg-indigo-500/5">
                        <CellContent value={feature.pro} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <CellContent value={feature.team} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
