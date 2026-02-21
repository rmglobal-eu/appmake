"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/stores/editor-store";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [platform, setPlatform] = useState<"ios" | "android" | "both">("both");
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const files = useEditorStore.getState().generatedFiles;
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, platform, files }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Download as ZIP
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const [path, content] of Object.entries(data.files)) {
        zip.file(path, content as string);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.appName}-mobile.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Mobile project exported! Unzip and run npm install.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setExporting(false);
    }
  }, [projectId, platform]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Export as Mobile App
          </DialogTitle>
          <DialogDescription>
            Export your project as a Capacitor app for iOS and Android.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-2 block">Target Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {(["ios", "android", "both"] as const).map((p) => (
                <button
                  key={p}
                  className={`rounded-lg border p-3 text-center text-xs font-medium transition-colors ${
                    platform === p
                      ? "border-primary bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:border-primary/50"
                  }`}
                  onClick={() => setPlatform(p)}
                >
                  {p === "ios" ? "iOS" : p === "android" ? "Android" : "Both"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium">What you'll get:</p>
            <ul className="text-[10px] text-muted-foreground space-y-0.5">
              <li>- Complete Capacitor project with your app code</li>
              <li>- Vite build configuration</li>
              <li>- Platform-specific setup scripts</li>
              <li>- README with build instructions</li>
            </ul>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export & Download"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
