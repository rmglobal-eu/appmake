"use client";

import { useState, useEffect, useCallback } from "react";
import { X, RotateCcw, FileCode, Clock } from "lucide-react";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { useEditorStore } from "@/lib/stores/editor-store";

interface Snapshot {
  id: string;
  title: string;
  files: Record<string, string>;
  createdAt: string;
}

interface VersionHistoryProps {
  chatId: string;
}

export function VersionHistory({ chatId }: VersionHistoryProps) {
  const { versionHistoryOpen, setVersionHistoryOpen } = useBuilderStore();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!versionHistoryOpen) return;
    setLoading(true);
    fetch(`/api/snapshots?chatId=${chatId}`)
      .then((r) => r.json())
      .then((data) => setSnapshots(data.snapshots ?? []))
      .catch(() => setSnapshots([]))
      .finally(() => setLoading(false));
  }, [versionHistoryOpen, chatId]);

  const handleRestore = useCallback(
    (snapshot: Snapshot) => {
      const store = useEditorStore.getState();
      // Replace all files with snapshot
      store.clearGeneratedFiles();
      store.addGeneratedFiles(snapshot.files);
      const firstPath = Object.keys(snapshot.files)[0];
      if (firstPath) {
        store.openFile(firstPath, snapshot.files[firstPath]);
      }
      setVersionHistoryOpen(false);
    },
    [setVersionHistoryOpen]
  );

  if (!versionHistoryOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/20"
        onClick={() => setVersionHistoryOpen(false)}
      />

      {/* Panel */}
      <div className="w-80 bg-background border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold flex-1">Version History</span>
          <button
            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setVersionHistoryOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading snapshots...
            </div>
          )}
          {!loading && snapshots.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No snapshots yet. Snapshots are created automatically after each AI update.
            </div>
          )}
          {snapshots.map((snapshot) => {
            const fileCount = Object.keys(snapshot.files).length;
            const date = new Date(snapshot.createdAt);
            return (
              <div
                key={snapshot.id}
                className="rounded-lg border border-border/60 bg-card/50 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{snapshot.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {fileCount} file{fileCount > 1 ? "s" : ""}
                      </span>
                      <span>
                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <button
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                    onClick={() => handleRestore(snapshot)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
