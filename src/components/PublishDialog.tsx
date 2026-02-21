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
import { useEditorStore } from "@/lib/stores/editor-store";
import { Download, Globe, Rocket, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const params = useParams();
  const projectId = params.id as string;
  const { generatedFiles } = useEditorStore();
  const [vercelToken, setVercelToken] = useState("");
  const [netlifyToken, setNetlifyToken] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  const handleDownloadZip = useCallback(async () => {
    const fileEntries = Object.entries(generatedFiles);
    if (fileEntries.length === 0) {
      toast.error("No files to download");
      return;
    }

    try {
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
      toast.error("Failed to create ZIP.");
    }
  }, [generatedFiles]);

  const handleDeploy = useCallback(async (provider: "vercel" | "netlify") => {
    const token = provider === "vercel" ? vercelToken : netlifyToken;
    if (!token.trim()) {
      toast.error(`Please enter your ${provider === "vercel" ? "Vercel" : "Netlify"} API token`);
      return;
    }

    if (Object.keys(generatedFiles).length === 0) {
      toast.error("No files to deploy");
      return;
    }

    setDeploying(provider);
    setDeployUrl(null);

    try {
      const res = await fetch(`/api/deploy/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: generatedFiles,
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deploy failed");
      }

      setDeployUrl(data.url);
      toast.success(`Deployed to ${provider}!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeploying(null);
    }
  }, [projectId, generatedFiles, vercelToken, netlifyToken]);

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
          {/* Deploy success URL */}
          {deployUrl && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Deployed successfully!
              </p>
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-500 hover:underline"
              >
                {deployUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Download ZIP */}
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

          {/* Vercel Deploy */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-2">
                <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Deploy to Vercel</p>
                <p className="text-xs text-muted-foreground">One-click deploy</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Vercel API token"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={() => handleDeploy("vercel")}
                disabled={deploying !== null}
              >
                {deploying === "vercel" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Deploy"
                )}
              </Button>
            </div>
          </div>

          {/* Netlify Deploy */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-100 dark:bg-blue-900/30 p-2">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Deploy to Netlify</p>
                <p className="text-xs text-muted-foreground">One-click deploy</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Netlify API token"
                value={netlifyToken}
                onChange={(e) => setNetlifyToken(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                className="h-8 shrink-0"
                onClick={() => handleDeploy("netlify")}
                disabled={deploying !== null}
              >
                {deploying === "netlify" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Deploy"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
