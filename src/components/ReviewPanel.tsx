"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle, FileCode, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/stores/editor-store";

interface ReviewIssue {
  severity: "error" | "warning" | "info";
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}

interface Review {
  score: number | null;
  summary: string;
  issues: ReviewIssue[];
  strengths?: string[];
}

interface ReviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewPanel({ open, onOpenChange }: ReviewPanelProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const runReview = useCallback(async () => {
    setLoading(true);
    setReview(null);
    setExpandedIssue(null);
    try {
      const files = useEditorStore.getState().generatedFiles;
      if (Object.keys(files).length === 0) {
        toast.error("No files to review — generate some code first.");
        return;
      }
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data.review);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleGoToFile = useCallback((file: string) => {
    const editorStore = useEditorStore.getState();
    const content = editorStore.generatedFiles[file];
    if (content !== undefined) {
      editorStore.openFile(file, content);
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const severityIcon = (sev: string) => {
    if (sev === "error") return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
    if (sev === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  };

  const severityBadge = (sev: string) => {
    const colors = {
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[sev as keyof typeof colors] || colors.info;
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const scoreRing = (score: number) => {
    if (score >= 80) return "ring-green-500/30";
    if (score >= 60) return "ring-amber-500/30";
    return "ring-red-500/30";
  };

  const errorCount = review?.issues.filter((i) => i.severity === "error").length ?? 0;
  const warningCount = review?.issues.filter((i) => i.severity === "warning").length ?? 0;
  const infoCount = review?.issues.filter((i) => i.severity === "info").length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            AI Code Review
          </DialogTitle>
          <DialogDescription>
            Get AI-powered feedback on code quality, performance, and best practices.
          </DialogDescription>
        </DialogHeader>

        {/* Initial state — no review yet */}
        {!review && !loading && (
          <div className="py-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileCode className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Ready to review your code</p>
              <p className="text-xs text-muted-foreground mt-1">
                The AI will analyze your project for quality, performance, security, and best practices.
              </p>
            </div>
            <Button onClick={runReview}>Start Review</Button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your code...</p>
            <p className="text-[10px] text-muted-foreground">This usually takes 10-20 seconds</p>
          </div>
        )}

        {/* Review results */}
        {review && (
          <div className="space-y-5 py-2">
            {/* Score card */}
            <div className="flex items-center gap-4 rounded-xl border p-4">
              {review.score !== null ? (
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ring-4 ${scoreRing(review.score)}`}>
                  <span className={`text-2xl font-bold ${scoreColor(review.score)}`}>
                    {review.score}
                  </span>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-muted">
                  <span className="text-lg font-bold text-muted-foreground">—</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {review.score !== null
                    ? review.score >= 80 ? "Looking good!" : review.score >= 60 ? "Needs improvement" : "Needs attention"
                    : "Review complete"
                  }
                </p>
                {review.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{review.summary}</p>
                )}
              </div>
            </div>

            {/* Issue counts */}
            {review.issues.length > 0 && (
              <div className="flex gap-3">
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-medium">{errorCount} error{errorCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-medium">{warningCount} warning{warningCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {infoCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium">{infoCount} suggestion{infoCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            )}

            {/* Strengths */}
            {review.strengths && review.strengths.length > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Strengths</p>
                {review.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Issues list */}
            {review.issues.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Issues to fix ({review.issues.length})
                </p>
                {review.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 space-y-2 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                  >
                    <div className="flex items-start gap-2.5">
                      {severityIcon(issue.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold">{issue.title}</p>
                          <span className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 ${severityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <button
                          className="text-[10px] text-primary hover:underline mt-0.5 flex items-center gap-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToFile(issue.file);
                          }}
                        >
                          <FileCode className="h-2.5 w-2.5" />
                          {issue.file}{issue.line ? `:${issue.line}` : ""}
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>

                    {expandedIssue === i && (
                      <div className="ml-6.5 space-y-2">
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                        {issue.suggestion && (
                          <div className="rounded-md bg-primary/5 border border-primary/10 p-2.5">
                            <p className="text-[10px] font-semibold text-primary mb-1">Suggested fix:</p>
                            <p className="text-xs text-foreground">{issue.suggestion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">No issues found!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Your code looks great.</p>
              </div>
            )}

            <Button onClick={runReview} variant="outline" size="sm" className="w-full">
              Re-run Review
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
