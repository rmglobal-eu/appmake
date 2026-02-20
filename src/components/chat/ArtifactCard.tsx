"use client";

import { useCallback } from "react";
import { FileCode, Terminal, Play, Check, Loader2, Package } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";
import type { ActionState } from "@/types/actions";

interface ArtifactCardProps {
  title: string;
  actions: ActionState[];
  status: "streaming" | "executing" | "completed" | "error";
}

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case "file":
      return <FileCode className="h-3 w-3 text-blue-400" />;
    case "shell":
      return <Terminal className="h-3 w-3 text-yellow-400" />;
    case "start":
      return <Play className="h-3 w-3 text-green-400" />;
    default:
      return null;
  }
}

function StatusIcon({ status }: { status: ActionState["status"] }) {
  switch (status) {
    case "completed":
      return <Check className="h-3 w-3 text-green-500" />;
    case "running":
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    default:
      return null;
  }
}

function getLabel(action: ActionState): string {
  switch (action.action.type) {
    case "file":
      return action.action.filePath;
    case "shell":
    case "start":
      return action.action.command;
    default:
      return "Unknown";
  }
}

export function ArtifactCard({ title, actions, status }: ArtifactCardProps) {
  const { openFile, generatedFiles } = useEditorStore();

  const handleClick = useCallback(
    (actionState: ActionState) => {
      if (actionState.action.type === "file") {
        const path = actionState.action.filePath;
        const content = actionState.action.content || generatedFiles[path] || "";
        openFile(path, content);
      }
    },
    [openFile, generatedFiles]
  );

  const fileCount = actions.filter((a) => a.action.type === "file").length;
  const shellCount = actions.filter((a) => a.action.type !== "file").length;

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <Package className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">{title}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {fileCount > 0 && `${fileCount} file${fileCount > 1 ? "s" : ""}`}
          {fileCount > 0 && shellCount > 0 && " · "}
          {shellCount > 0 && `${shellCount} command${shellCount > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Actions list */}
      <div className="divide-y divide-border/30">
        {actions.map((actionState, i) => (
          <button
            key={i}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] ${
              actionState.action.type === "file"
                ? "cursor-pointer hover:bg-accent/50"
                : "cursor-default"
            }`}
            onClick={() => handleClick(actionState)}
          >
            <StatusIcon status={actionState.status} />
            <ActionIcon type={actionState.action.type} />
            <span className="truncate font-mono text-muted-foreground">
              {getLabel(actionState)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
