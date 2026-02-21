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
import { GitBranch, ExternalLink, Loader2, Check, Unplug } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEditorStore } from "@/lib/stores/editor-store";

interface GitPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GitConnection {
  id: string;
  repoFullName: string;
  branch: string;
  lastPushedAt: string | null;
}

export function GitPanel({ open, onOpenChange }: GitPanelProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [connection, setConnection] = useState<GitConnection | null>(null);
  const [repoName, setRepoName] = useState("");
  const [token, setToken] = useState("");
  const [branch, setBranch] = useState("main");
  const [commitMsg, setCommitMsg] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !projectId) return;
    fetch(`/api/git?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setConnection(data.connection))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const handleConnect = useCallback(async () => {
    if (!repoName.trim() || !token.trim()) {
      toast.error("Repository name and token required");
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoFullName: repoName.trim(),
          accessToken: token.trim(),
          branch: branch.trim() || "main",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConnection({ id: "", repoFullName: repoName, branch, lastPushedAt: null });
      toast.success("Repository connected!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setConnecting(false);
    }
  }, [projectId, repoName, token, branch]);

  const handlePush = useCallback(async () => {
    setPushing(true);
    try {
      const files = useEditorStore.getState().generatedFiles;
      const res = await fetch("/api/git", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          commitMessage: commitMsg.trim() || undefined,
          files,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Pushed to GitHub!");
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPushing(false);
    }
  }, [projectId, commitMsg]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Git Integration
          </DialogTitle>
          <DialogDescription>
            Connect to GitHub to push your project code.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : connection ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Connected</span>
              </div>
              <a
                href={`https://github.com/${connection.repoFullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs text-green-600 hover:underline"
              >
                {connection.repoFullName} ({connection.branch})
                <ExternalLink className="h-3 w-3" />
              </a>
              {connection.lastPushedAt && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Last pushed: {new Date(connection.lastPushedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Commit Message</label>
              <Input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Update from Appmake"
                className="text-xs"
              />
            </div>

            <Button onClick={handlePush} disabled={pushing} className="w-full">
              {pushing ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Pushing...
                </>
              ) : (
                "Push to GitHub"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Repository</label>
              <Input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="username/repository"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">GitHub Token</label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Create at github.com/settings/tokens with repo scope
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Branch</label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="text-xs"
              />
            </div>

            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Repository"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
