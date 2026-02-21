"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What are the limits on the Free plan?",
    answer:
      "The Free plan includes 20 AI messages per day, up to 3 active projects, 1 GB of storage, and access to basic AI models. It's perfect for getting started and exploring the platform. There are no time limits — the Free plan is free forever.",
  },
  {
    question: "How do I upgrade my plan?",
    answer:
      "You can upgrade at any time from your billing settings or by clicking the upgrade button in the app. When you upgrade, you'll immediately get access to all the features of your new plan. We'll prorate the charge for the remainder of your current billing period.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, you can cancel your subscription at any time. When you cancel, your plan will remain active until the end of your current billing period. After that, your account will revert to the Free plan. You won't lose any of your projects, but you may lose access to premium features.",
  },
  {
    question: "How does the billing cycle work?",
    answer:
      "Billing cycles start on the day you subscribe. For monthly plans, you're billed on the same date each month. For annual plans, you're billed once per year. You'll receive an invoice via email for each payment. All prices are in USD.",
  },
  {
    question: "How many team members can I add on the Team plan?",
    answer:
      "The Team plan supports up to 25 team members. Each member gets their own account with full access to shared projects. You can manage roles and permissions from the admin dashboard. Need more seats? Contact our sales team for a custom Enterprise plan.",
  },
  {
    question: "Can I use my own API keys?",
    answer:
      "Currently, all AI requests go through our platform to ensure security, rate limiting, and usage tracking. We're exploring a bring-your-own-key option for Team and Enterprise plans. Join our waitlist to be notified when this feature launches.",
  },
  {
    question: "Do you offer Enterprise plans?",
    answer:
      "Yes! For organizations that need more than what the Team plan offers, we provide custom Enterprise plans with unlimited seats, dedicated infrastructure, custom SLAs, SSO integration, on-premise deployment options, and a dedicated account manager. Contact our sales team to discuss your needs.",
  },
  {
    question: "Is there a student or education discount?",
    answer:
      "Yes, we offer a 50% discount on the Pro plan for verified students and educators. You'll need to verify your status through our education verification partner. The discount applies for the duration of your enrollment or teaching position. Apply through your account settings.",
  },
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-zinc-400">
            Can&apos;t find what you&apos;re looking for? Reach out to our{" "}
            <a
              href="mailto:support@appmake.dev"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              support team
            </a>
            .
          </p>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 px-6">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
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
