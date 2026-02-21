"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Figma, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface FigmaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (description: string, imageUrl: string | null) => void;
}

export function FigmaImportDialog({ open, onOpenChange, onImport }: FigmaImportDialogProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = useCallback(async () => {
    if (!figmaUrl.trim() || !accessToken.trim()) {
      toast.error("Figma URL and access token required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/figma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl: figmaUrl.trim(), accessToken: accessToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import from Figma");
      }

      onImport(data.description, data.imageUrl);
      toast.success(`Imported "${data.fileName}" from Figma!`);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [figmaUrl, accessToken, onImport, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Figma className="h-4 w-4" />
            Import from Figma
          </DialogTitle>
          <DialogDescription>
            Paste a Figma frame URL to convert the design into code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Figma URL</label>
            <Input
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://figma.com/design/..."
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Right-click a frame in Figma → Copy link to selection
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Personal Access Token</label>
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="figd_..."
              className="text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Generate at figma.com → Settings → Personal Access Tokens
            </p>
          </div>

          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              "Import & Generate Code"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
