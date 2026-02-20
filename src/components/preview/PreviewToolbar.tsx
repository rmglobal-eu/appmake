"use client";

import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PreviewToolbarProps {
  url: string;
  onRefresh: () => void;
}

export function PreviewToolbar({ url, onRefresh }: PreviewToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b bg-muted/50 px-2 py-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onRefresh}
      >
        <RefreshCw className="h-3 w-3" />
      </Button>
      <Input
        value={url}
        readOnly
        className="h-6 flex-1 rounded-sm border-0 bg-background px-2 text-xs"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        asChild
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
