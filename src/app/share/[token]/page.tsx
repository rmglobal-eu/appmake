"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LivePreview } from "@/components/preview/LivePreview";
import { useEditorStore } from "@/lib/stores/editor-store";
import { MessageParser } from "@/lib/parser/message-parser";
import type { ChatMessage } from "@/types/chat";

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Shared Project");

  useEffect(() => {
    async function loadShare() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Share link not found or expired" : "Failed to load");
          return;
        }

        const data = await res.json();
        setProjectName(data.projectName || "Shared Project");

        // Load files into editor store
        if (data.files && Object.keys(data.files).length > 0) {
          const store = useEditorStore.getState();
          store.addGeneratedFiles(data.files);

          // Open the first file
          const firstPath = Object.keys(data.files)[0];
          if (firstPath) {
            store.openFile(firstPath, data.files[firstPath]);
          }
        }
      } catch {
        setError("Failed to load shared project");
      } finally {
        setLoading(false);
      }
    }

    loadShare();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">{error}</h1>
        <p className="text-muted-foreground">This share link may have expired or been revoked.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-11 shrink-0 items-center border-b bg-background px-4">
        <span className="text-sm font-medium">{projectName}</span>
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          Shared view
        </span>
      </header>
      <div className="flex-1">
        <LivePreview />
      </div>
    </div>
  );
}
