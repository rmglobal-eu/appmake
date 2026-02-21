"use client";

import { useState, useMemo } from "react";
import { FileCode, ChevronLeft, ChevronRight } from "lucide-react";

interface DiffEntry {
  filePath: string;
  before: string;
  after: string;
}

interface MultiFileDiffProps {
  diffs: DiffEntry[];
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function computeDiff(before: string, after: string): DiffLine[] {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const diffItems: { type: "added" | "removed" | "unchanged"; line: string }[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffItems.unshift({ type: "unchanged", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffItems.unshift({ type: "added", line: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      diffItems.unshift({ type: "removed", line: oldLines[i - 1] });
      i--;
    }
  }

  let oldNum = 1;
  let newNum = 1;

  for (const item of diffItems) {
    if (item.type === "unchanged") {
      result.push({
        type: "unchanged",
        content: item.line,
        oldLineNum: oldNum,
        newLineNum: newNum,
      });
      oldNum++;
      newNum++;
    } else if (item.type === "removed") {
      result.push({
        type: "removed",
        content: item.line,
        oldLineNum: oldNum,
      });
      oldNum++;
    } else {
      result.push({
        type: "added",
        content: item.line,
        newLineNum: newNum,
      });
      newNum++;
    }
  }

  return result;
}

export default function MultiFileDiff({ diffs }: MultiFileDiffProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeDiff = diffs[activeIndex];

  const diffLines = useMemo(() => {
    if (!activeDiff) return [];
    return computeDiff(activeDiff.before, activeDiff.after);
  }, [activeDiff]);

  const stats = useMemo(() => {
    const added = diffLines.filter((l) => l.type === "added").length;
    const removed = diffLines.filter((l) => l.type === "removed").length;
    return { added, removed };
  }, [diffLines]);

  if (diffs.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-white/30 bg-[#0f0f14] rounded-lg border border-[#2a2a35]">
        No file changes to display
      </div>
    );
  }

  const fileName =
    activeDiff?.filePath.split("/").pop() || activeDiff?.filePath;

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#0f0f14] overflow-hidden">
      {/* File tabs */}
      <div className="flex items-center border-b border-[#2a2a35] bg-[#1a1a22] overflow-x-auto">
        <div className="flex items-center">
          {diffs.length > 3 && (
            <button
              onClick={() =>
                setActiveIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={activeIndex === 0}
              className="p-2 text-white/30 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0 flex-1 overflow-x-auto scrollbar-hide">
          {diffs.map((diff, index) => {
            const name = diff.filePath.split("/").pop() || diff.filePath;
            return (
              <button
                key={diff.filePath}
                onClick={() => setActiveIndex(index)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                  index === activeIndex
                    ? "border-violet-500 text-white/90 bg-white/[0.03]"
                    : "border-transparent text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                {name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center">
          {diffs.length > 3 && (
            <button
              onClick={() =>
                setActiveIndex((prev) =>
                  Math.min(diffs.length - 1, prev + 1)
                )
              }
              disabled={activeIndex === diffs.length - 1}
              className="p-2 text-white/30 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* File path and stats */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a35] bg-[#1a1a22]/50">
        <span className="text-xs text-white/40 font-mono truncate">
          {activeDiff?.filePath}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {stats.added > 0 && (
            <span className="text-xs text-emerald-400">
              +{stats.added}
            </span>
          )}
          {stats.removed > 0 && (
            <span className="text-xs text-red-400">
              -{stats.removed}
            </span>
          )}
          <span className="text-xs text-white/20">
            {fileName}
          </span>
        </div>
      </div>

      {/* Diff content */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full font-mono text-xs">
          <tbody>
            {diffLines.map((line, index) => (
              <tr
                key={index}
                className={`${
                  line.type === "added"
                    ? "bg-emerald-500/[0.07]"
                    : line.type === "removed"
                    ? "bg-red-500/[0.07]"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Old line number */}
                <td className="px-3 py-0.5 text-right text-white/15 select-none w-[1%] whitespace-nowrap border-r border-[#2a2a35]">
                  {line.oldLineNum ?? ""}
                </td>
                {/* New line number */}
                <td className="px-3 py-0.5 text-right text-white/15 select-none w-[1%] whitespace-nowrap border-r border-[#2a2a35]">
                  {line.newLineNum ?? ""}
                </td>
                {/* Indicator */}
                <td
                  className={`px-2 py-0.5 select-none w-[1%] ${
                    line.type === "added"
                      ? "text-emerald-400"
                      : line.type === "removed"
                      ? "text-red-400"
                      : "text-white/10"
                  }`}
                >
                  {line.type === "added"
                    ? "+"
                    : line.type === "removed"
                    ? "-"
                    : " "}
                </td>
                {/* Content */}
                <td
                  className={`px-3 py-0.5 whitespace-pre ${
                    line.type === "added"
                      ? "text-emerald-300/80"
                      : line.type === "removed"
                      ? "text-red-300/80"
                      : "text-white/50"
                  }`}
                >
                  {line.content}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
