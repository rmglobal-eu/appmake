"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gauge, Loader2, AlertTriangle, AlertCircle, Info, Accessibility, CheckCircle, FileCode, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/stores/editor-store";

interface AuditIssue {
  category: "performance" | "accessibility";
  severity: "critical" | "warning" | "info";
  file: string;
  title: string;
  description: string;
  fix: string;
}

interface AuditResult {
  overallScore: number | null;
  categories: {
    performance?: { score: number; issues: AuditIssue[] };
    accessibility?: { score: number; issues: AuditIssue[] };
  };
  issues: AuditIssue[];
}

interface AuditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditPanel({ open, onOpenChange }: AuditPanelProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "performance" | "accessibility">("all");
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setAudit(null);
    setExpandedIssue(null);
    try {
      const files = useEditorStore.getState().generatedFiles;
      if (Object.keys(files).length === 0) {
        toast.error("No files to audit — generate some code first.");
        return;
      }
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "both", files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAudit(data.audit);
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
    if (sev === "critical") return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
    if (sev === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  };

  const severityBadge = (sev: string) => {
    const colors = {
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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

  const filteredIssues = audit?.issues.filter(
    (i) => tab === "all" || i.category === tab
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance & Accessibility Audit
          </DialogTitle>
          <DialogDescription>
            Check your app for performance bottlenecks and accessibility issues.
          </DialogDescription>
        </DialogHeader>

        {/* Initial state */}
        {!audit && !loading && (
          <div className="py-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Gauge className="h-5 w-5 text-blue-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Accessibility className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Ready to audit your code</p>
              <p className="text-xs text-muted-foreground mt-1">
                Checks performance, accessibility, and best practices.
              </p>
            </div>
            <Button onClick={runAudit}>Run Audit</Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Auditing your code...</p>
            <p className="text-[10px] text-muted-foreground">This usually takes 10-20 seconds</p>
          </div>
        )}

        {/* Results */}
        {audit && (
          <div className="space-y-5 py-2">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-3">
              {audit.categories.performance ? (
                <div className="rounded-xl border p-4 text-center space-y-1">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ring-4 ${scoreRing(audit.categories.performance.score)}`}>
                    <span className={`text-xl font-bold ${scoreColor(audit.categories.performance.score)}`}>
                      {audit.categories.performance.score}
                    </span>
                  </div>
                  <p className="text-xs font-medium flex items-center justify-center gap-1">
                    <Gauge className="h-3 w-3 text-blue-500" />
                    Performance
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border p-4 text-center space-y-1">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-muted">
                    <span className="text-xl font-bold text-muted-foreground">—</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Performance</p>
                </div>
              )}
              {audit.categories.accessibility ? (
                <div className="rounded-xl border p-4 text-center space-y-1">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ring-4 ${scoreRing(audit.categories.accessibility.score)}`}>
                    <span className={`text-xl font-bold ${scoreColor(audit.categories.accessibility.score)}`}>
                      {audit.categories.accessibility.score}
                    </span>
                  </div>
                  <p className="text-xs font-medium flex items-center justify-center gap-1">
                    <Accessibility className="h-3 w-3 text-purple-500" />
                    Accessibility
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border p-4 text-center space-y-1">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-muted">
                    <span className="text-xl font-bold text-muted-foreground">—</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Accessibility</p>
                </div>
              )}
            </div>

            {/* Tab filter */}
            <div className="flex gap-1 rounded-lg border bg-muted/50 p-0.5">
              {(["all", "performance", "accessibility"] as const).map((t) => (
                <button
                  key={t}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setTab(t); setExpandedIssue(null); }}
                >
                  {t === "all" ? `All (${audit.issues.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Issues */}
            {filteredIssues.length > 0 ? (
              <div className="space-y-2">
                {filteredIssues.map((issue, i) => (
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
                          <span className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 ${
                            issue.category === "performance"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}>
                            {issue.category}
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
                          {issue.file}
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>

                    {expandedIssue === i && (
                      <div className="ml-6.5 space-y-2">
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                        {issue.fix && (
                          <div className="rounded-md bg-primary/5 border border-primary/10 p-2.5">
                            <p className="text-[10px] font-semibold text-primary mb-1">How to fix:</p>
                            <p className="text-xs text-foreground">{issue.fix}</p>
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
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {tab === "all" ? "No issues found!" : `No ${tab} issues found!`}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Your code looks great.</p>
              </div>
            )}

            <Button onClick={runAudit} variant="outline" size="sm" className="w-full">
              Re-run Audit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
