"use client";

import { useState, useRef, useCallback } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { Globe } from "lucide-react";

interface PreviewPanelProps {
  url: string | null;
}

export function PreviewPanel({ url }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setKey((k) => k + 1);
  }, []);

  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Globe className="mb-2 h-8 w-8" />
        <p className="text-sm">Preview will appear here</p>
        <p className="text-xs">Start a dev server to see your app</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PreviewToolbar url={url} onRefresh={handleRefresh} />
      <iframe
        key={key}
        ref={iframeRef}
        src={url}
        className="flex-1 w-full bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
