"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/stores/editor-store";
import { Download, Globe, Rocket } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const { generatedFiles } = useEditorStore();

  const handleDownloadZip = useCallback(async () => {
    const fileEntries = Object.entries(generatedFiles);
    if (fileEntries.length === 0) {
      toast.error("No files to download");
      return;
    }

    try {
      // Dynamic import JSZip
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const [path, content] of fileEntries) {
        zip.file(path, content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project.zip";
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Project downloaded!");
    } catch {
      toast.error("Failed to create ZIP. Make sure jszip is installed.");
    }
  }, [generatedFiles]);

  const comingSoon = () => toast("Coming soon!", { duration: 1500 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Publish Project
          </DialogTitle>
          <DialogDescription>
            Deploy your project or download the source code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Download ZIP — functional */}
          <button
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            onClick={handleDownloadZip}
          >
            <div className="rounded-md bg-green-100 dark:bg-green-900/30 p-2">
              <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Download ZIP</p>
              <p className="text-xs text-muted-foreground">
                Download all project files as a ZIP archive
              </p>
            </div>
          </button>

          {/* Netlify — placeholder */}
          <button
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            onClick={comingSoon}
          >
            <div className="rounded-md bg-blue-100 dark:bg-blue-900/30 p-2">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Deploy to Netlify
                <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Coming soon
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                One-click deploy to Netlify
              </p>
            </div>
          </button>

          {/* Vercel — placeholder */}
          <button
            className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
            onClick={comingSoon}
          >
            <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-2">
              <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Deploy to Vercel
                <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Coming soon
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                One-click deploy to Vercel
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
