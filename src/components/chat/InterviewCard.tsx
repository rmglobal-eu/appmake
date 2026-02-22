"use client";

import { useState } from "react";
import { Send, MessageCircleQuestion } from "lucide-react";
import type { InterviewData } from "@/lib/parser/types";

interface InterviewCardProps {
  interview: InterviewData;
  onSubmit: (answers: string) => void;
}

export function InterviewCard({ interview, onSubmit }: InterviewCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = interview.questions.every((q) => {
    if (q.type === "text") return true; // text is optional
    return answers[q.id] !== undefined;
  });

  function handleChoiceSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleTextChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);

    // Format answers as readable text for the AI
    const parts: string[] = [];
    for (const q of interview.questions) {
      const answer = answers[q.id];
      if (answer) {
        // Find label for choice answers
        if (q.type === "choice" && q.options) {
          const option = q.options.find((o) => o.value === answer);
          parts.push(`${q.text}: ${option?.label ?? answer}`);
        } else {
          parts.push(`${q.text}: ${answer}`);
        }
      }
    }

    const formattedAnswers = `Here are my answers:\n${parts.join("\n")}`;
    onSubmit(formattedAnswers);
  }

  return (
    <div className="mx-4 my-3 overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-violet-500/10 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20">
          <MessageCircleQuestion className="h-4 w-4 text-violet-300" />
        </div>
        <h3 className="text-sm font-semibold text-violet-200">
          {interview.title}
        </h3>
      </div>

      {/* Questions */}
      <div className="space-y-4 p-4">
        {interview.questions.map((question, qi) => (
          <div
            key={question.id}
            className="animate-in fade-in slide-in-from-top-2"
            style={{ animationDelay: `${qi * 100}ms`, animationFillMode: "both" }}
          >
            <p className="mb-2 text-sm font-medium text-white/80">
              {question.text}
            </p>

            {question.type === "choice" && question.options && (
              <div className="flex flex-wrap gap-2">
                {question.options.map((option) => {
                  const isSelected = answers[question.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        !submitted &&
                        handleChoiceSelect(question.id, option.value)
                      }
                      disabled={submitted}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? "border-violet-500/50 bg-violet-500/20 text-violet-200 shadow-sm shadow-violet-500/10"
                          : submitted
                          ? "border-white/5 bg-white/[0.02] text-white/30"
                          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white/80"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === "text" && (
              <input
                type="text"
                placeholder="Type your answer..."
                disabled={submitted}
                value={answers[question.id] ?? ""}
                onChange={(e) =>
                  handleTextChange(question.id, e.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 disabled:opacity-50"
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="border-t border-violet-500/10 px-4 py-3">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              allAnswered
                ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-violet-500/20"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Send answers
          </button>
        </div>
      )}

      {submitted && (
        <div className="border-t border-emerald-500/10 px-4 py-2.5">
          <p className="text-center text-xs font-medium text-emerald-400/70">
            Answers sent — building your project...
          </p>
        </div>
      )}
    </div>
  );
}
