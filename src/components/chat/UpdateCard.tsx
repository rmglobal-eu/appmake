"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Check,
  Loader2,
  FileCode,
  Terminal,
  Play,
  ChevronDown,
  ChevronRight,
  Undo2,
  Eye,
  Sparkles,
  FilePlus2,
  FilePenLine,
} from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useBuilderStore } from "@/lib/stores/builder-store";
import type { UpdateCard as UpdateCardType, UpdateCardSubtask } from "@/types/update-card";
import type { Action } from "@/types/actions";

interface UpdateCardProps {
  /** Live card from store (streaming) */
  card?: UpdateCardType;
  /** Fallback for historical messages */
  title?: string;
  actions?: { action: Action; status: "completed" | "pending" | "running" }[];
  previousFiles?: Record<string, string>;
}

function SubtaskIcon({ type }: { type: string }) {
  switch (type) {
    case "file":
      return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
    case "shell":
      return <Terminal className="h-3.5 w-3.5 text-amber-400" />;
    case "start":
      return <Play className="h-3.5 w-3.5 text-green-400" />;
    default:
      return null;
  }
}

function SubtaskStatus({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="h-2.5 w-2.5 text-emerald-500" />
      </div>
    );
  }
  return (
    <div className="flex h-4 w-4 items-center justify-center">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
    </div>
  );
}

/** Minimal LCS diff */
function computeDiff(oldLines: string[], newLines: string[]): { type: "same" | "added" | "removed"; line: string }[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: { type: "same" | "added" | "removed"; line: string }[] = [];
  let i = m, j = n;
  const stack: { type: "same" | "added" | "removed"; line: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: "same", line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", line: newLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", line: oldLines[i - 1] });
      i--;
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

export function UpdateCard({ card, title, actions, previousFiles }: UpdateCardProps) {
  const { openFile, generatedFiles } = useEditorStore();
  const { setViewMode } = useBuilderStore();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const cardTitle = card?.title ?? title ?? "Update";
  const isStreaming = card?.status === "streaming";

  const subtasks: { id: string; label: string; type: string; status: string; filePath?: string }[] = useMemo(() => {
    if (card) return card.subtasks;
    if (actions) {
      return actions.map((a, i) => ({
        id: `action-${i}`,
        label: a.action.type === "file" ? a.action.filePath : a.action.type === "search-replace" ? a.action.filePath : a.action.type === "shell" ? a.action.command : a.action.command,
        type: a.action.type,
        status: a.status === "completed" ? "completed" : "streaming",
        filePath: a.action.type === "file" ? a.action.filePath : undefined,
      }));
    }
    return [];
  }, [card, actions]);

  const filesCreated = card?.filesCreated ?? 0;
  const filesModified = card?.filesModified ?? 0;
  const prevFiles = card?.previousFiles ?? previousFiles ?? {};
  const completedCount = subtasks.filter((s) => s.status === "completed").length;
  const totalCount = subtasks.length;

  const handleSubtaskClick = useCallback(
    (subtask: { type: string; filePath?: string; label: string }) => {
      if (subtask.type === "file") {
        const path = subtask.filePath ?? subtask.label;
        const content = generatedFiles[path] ?? "";
        openFile(path, content);
        setViewMode("code");
      }
    },
    [openFile, generatedFiles, setViewMode]
  );

  const handleRevert = useCallback(() => {
    if (Object.keys(prevFiles).length === 0) return;
    const store = useEditorStore.getState();
    store.addGeneratedFiles(prevFiles);
    const firstPath = Object.keys(prevFiles)[0];
    if (firstPath) store.openFile(firstPath, prevFiles[firstPath]);
  }, [prevFiles]);

  const handlePreview = useCallback(() => {
    setViewMode("preview");
  }, [setViewMode]);

  const fileDiffs = useMemo(() => {
    if (!detailsOpen) return [];
    const diffs: {
      path: string;
      isNew: boolean;
      diff: { type: "same" | "added" | "removed"; line: string }[];
      newContent: string;
    }[] = [];

    for (const subtask of subtasks) {
      if (subtask.type !== "file") continue;
      const path = subtask.filePath ?? subtask.label;
      const newContent = generatedFiles[path] ?? "";
      const oldContent = prevFiles[path];

      if (oldContent === undefined) {
        diffs.push({ path, isNew: true, diff: [], newContent });
      } else {
        const oldLines = oldContent.split("\n");
        const newLines = newContent.split("\n");
        const diff = computeDiff(oldLines, newLines);
        diffs.push({ path, isNew: false, diff, newContent });
      }
    }
    return diffs;
  }, [detailsOpen, subtasks, generatedFiles, prevFiles]);

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 backdrop-blur-sm ${
        isStreaming
          ? "border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-white/5 shadow-lg shadow-violet-500/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      {/* Animated top border during streaming */}
      {isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            style={{ animation: "progress-indeterminate 1.5s ease-in-out infinite" }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        {isStreaming ? (
          <div className="relative flex h-6 w-6 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/15" />
            <Sparkles className="relative h-4 w-4 text-violet-400 animate-pulse" />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{cardTitle}</span>
          {/* Stats summary */}
          <div className="flex items-center gap-2 mt-0.5">
            {filesCreated > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <FilePlus2 className="h-2.5 w-2.5" />
                {filesCreated} created
              </span>
            )}
            {filesModified > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                <FilePenLine className="h-2.5 w-2.5" />
                {filesModified} modified
              </span>
            )}
            {isStreaming && totalCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {completedCount}/{totalCount} done
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar during streaming */}
      {isStreaming && totalCount > 0 && (
        <div className="mx-4 mb-2 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, (completedCount / totalCount) * 100)}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      {subtasks.length > 0 && (
        <div className="border-t border-white/10 mx-2">
          {subtasks.map((subtask) => (
            <button
              key={subtask.id}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-xs transition-colors ${
                subtask.type === "file"
                  ? "cursor-pointer hover:bg-white/10"
                  : "cursor-default"
              } ${subtask.status === "streaming" ? "bg-violet-500/10" : ""}`}
              onClick={() => handleSubtaskClick(subtask)}
            >
              <SubtaskStatus status={subtask.status} />
              <SubtaskIcon type={subtask.type} />
              <span className="truncate font-mono text-[11px] text-white/60">
                {subtask.label}
              </span>
              {subtask.status === "streaming" && (
                <span className="ml-auto shrink-0 text-[9px] font-medium text-violet-400">
                  writing...
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Footer buttons */}
      {!isStreaming && subtasks.length > 0 && (
        <div className="flex items-center gap-1 border-t border-white/10 px-3 py-2">
          <button
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setDetailsOpen(!detailsOpen)}
          >
            {detailsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Details
          </button>
          <button
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            onClick={handlePreview}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
          {Object.keys(prevFiles).length > 0 && (
            <button
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/40 hover:bg-white/10 hover:text-white transition-colors ml-auto"
              onClick={handleRevert}
            >
              <Undo2 className="h-3 w-3" />
              Revert
            </button>
          )}
        </div>
      )}

      {/* Diff details panel */}
      {detailsOpen && fileDiffs.length > 0 && (
        <div className="border-t border-white/10 bg-white/[0.02]">
          {fileDiffs.map((fd) => (
            <div key={fd.path} className="border-b border-white/5 last:border-b-0">
              <div className="flex items-center gap-2 px-3 py-2">
                <FileCode className="h-3 w-3 text-white/40" />
                <span className="text-[11px] font-mono text-white/50">{fd.path}</span>
                {fd.isNew && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                    New
                  </span>
                )}
              </div>
              <div className="max-h-[200px] overflow-auto px-3 pb-2">
                {fd.isNew ? (
                  <pre className="text-[10px] font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {fd.newContent.slice(0, 500)}
                    {fd.newContent.length > 500 && "\n..."}
                  </pre>
                ) : (
                  <div className="text-[10px] font-mono leading-relaxed">
                    {fd.diff.slice(0, 100).map((d, i) => (
                      <div
                        key={i}
                        className={
                          d.type === "added"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : d.type === "removed"
                            ? "bg-red-500/10 text-red-700 dark:text-red-400"
                            : "text-muted-foreground"
                        }
                      >
                        <span className="select-none opacity-50 inline-block w-4 text-right mr-2">
                          {d.type === "added" ? "+" : d.type === "removed" ? "-" : " "}
                        </span>
                        {d.line}
                      </div>
                    ))}
                    {fd.diff.length > 100 && (
                      <div className="text-muted-foreground opacity-50 mt-1">
                        ...{fd.diff.length - 100} more lines
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
