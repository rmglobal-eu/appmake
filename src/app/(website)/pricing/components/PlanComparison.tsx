"use client";

import { useTranslations } from "next-intl";
import { Check, X, Minus } from "lucide-react";

type CellValue = boolean | string;

interface FeatureRow {
  nameKey: string;
  free: CellValue;
  pro: CellValue;
  team: CellValue;
}

interface FeatureCategory {
  categoryKey: string;
  features: FeatureRow[];
}

const comparisonData: FeatureCategory[] = [
  {
    categoryKey: "AI Features",
    features: [
      { nameKey: "messagesPerDay", free: "20", pro: "200", team: "1,000" },
      { nameKey: "basicModels", free: true, pro: true, team: true },
      {
        nameKey: "advancedModels",
        free: false,
        pro: true,
        team: true,
      },
      { nameKey: "customFineTuning", free: false, pro: false, team: true },
      {
        nameKey: "codeGeneration",
        free: "Basic",
        pro: "Advanced",
        team: "Advanced",
      },
      {
        nameKey: "contextWindow",
        free: "4K tokens",
        pro: "32K tokens",
        team: "128K tokens",
      },
    ],
  },
  {
    categoryKey: "Projects",
    features: [
      { nameKey: "activeProjects", free: "3", pro: "50", team: "Unlimited" },
      { nameKey: "storage", free: "1 GB", pro: "10 GB", team: "100 GB" },
      {
        nameKey: "maxFileSize",
        free: "5 MB",
        pro: "50 MB",
        team: "500 MB",
      },
      { nameKey: "versionHistory", free: false, pro: true, team: true },
      { nameKey: "projectTemplates", free: "5", pro: "All", team: "All + Custom" },
      { nameKey: "exportToCode", free: false, pro: true, team: true },
    ],
  },
  {
    categoryKey: "Collaboration",
    features: [
      { nameKey: "teamMembers", free: "1", pro: "1", team: "Up to 25" },
      {
        nameKey: "sharedProjects",
        free: false,
        pro: false,
        team: true,
      },
      {
        nameKey: "realTimeCollaboration",
        free: false,
        pro: false,
        team: true,
      },
      {
        nameKey: "roleBasedAccess",
        free: false,
        pro: false,
        team: true,
      },
      { nameKey: "activityLog", free: false, pro: false, team: true },
    ],
  },
  {
    categoryKey: "Support",
    features: [
      { nameKey: "communityForum", free: true, pro: true, team: true },
      { nameKey: "emailSupport", free: false, pro: true, team: true },
      {
        nameKey: "prioritySupport",
        free: false,
        pro: true,
        team: true,
      },
      {
        nameKey: "dedicatedManager",
        free: false,
        pro: false,
        team: true,
      },
      {
        nameKey: "slaGuarantee",
        free: false,
        pro: false,
        team: "99.9%",
      },
    ],
  },
  {
    categoryKey: "Deployment",
    features: [
      { nameKey: "subdomainHosting", free: true, pro: true, team: true },
      { nameKey: "customDomain", free: false, pro: false, team: true },
      { nameKey: "sslCertificate", free: true, pro: true, team: true },
      { nameKey: "autoScaling", free: false, pro: true, team: true },
      { nameKey: "apiAccess", free: false, pro: false, team: true },
      { nameKey: "cicdIntegration", free: false, pro: false, team: true },
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
  const t = useTranslations("pricing");

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("compareDetail")}
          </h2>
          <p className="text-zinc-400">
            {t("compareDetailDesc")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm w-[40%]">
                  {t("feature")}
                </th>
                <th className="text-center py-4 px-4 text-zinc-300 font-semibold text-sm w-[20%]">
                  {t("free")}
                </th>
                <th className="text-center py-4 px-4 text-indigo-400 font-semibold text-sm w-[20%]">
                  {t("pro")}
                </th>
                <th className="text-center py-4 px-4 text-zinc-300 font-semibold text-sm w-[20%]">
                  {t("team")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category) => (
                <>
                  <tr key={category.categoryKey}>
                    <td
                      colSpan={4}
                      className="pt-8 pb-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider"
                    >
                      {category.categoryKey}
                    </td>
                  </tr>
                  {category.features.map((feature, featureIndex) => (
                    <tr
                      key={`${category.categoryKey}-${feature.nameKey}`}
                      className={`${
                        featureIndex % 2 === 0
                          ? "bg-zinc-900/50"
                          : "bg-transparent"
                      } border-b border-zinc-800/50`}
                    >
                      <td className="py-3.5 px-4 text-sm text-zinc-300">
                        {t(feature.nameKey)}
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
