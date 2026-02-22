"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const faqKeys = [
  { questionKey: "faqLimitsTitle", answerKey: "faqLimitsAnswer" },
  { questionKey: "faqUpgradeTitle", answerKey: "faqUpgradeAnswer" },
  { questionKey: "faqCancelTitle", answerKey: "faqCancelAnswer" },
  { questionKey: "faqBillingTitle", answerKey: "faqBillingAnswer" },
  { questionKey: "faqTeamTitle", answerKey: "faqTeamAnswer" },
  { questionKey: "faqApiTitle", answerKey: "faqApiAnswer" },
  { questionKey: "faqEnterpriseTitle", answerKey: "faqEnterpriseAnswer" },
  { questionKey: "faqStudentTitle", answerKey: "faqStudentAnswer" },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-indigo-400" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-sm text-zinc-400 leading-relaxed px-1">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const t = useTranslations("pricing");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("freqAsked")}
          </h2>
          <p className="text-zinc-400">
            {t("cantFind")}{" "}
            <a
              href="mailto:support@appmake.dev"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {t("supportTeam")}
            </a>
            .
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 px-6">
          {faqKeys.map((faq, index) => (
            <FAQItem
              key={index}
              question={t(faq.questionKey)}
              answer={t(faq.answerKey)}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
