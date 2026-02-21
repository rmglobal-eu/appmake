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
import { Link, Copy, Check, Plus, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Share {
  id: string;
  token: string;
  permission: "view" | "edit";
  createdAt: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [shares, setShares] = useState<Share[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    fetch(`/api/shares?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setShares(data.shares || []))
      .catch(() => {});
  }, [open, projectId]);

  const createShare = useCallback(async (permission: "view" | "edit") => {
    setCreating(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, permission }),
      });
      const data = await res.json();
      if (data.share) {
        setShares((prev) => [...prev, data.share]);
        navigator.clipboard.writeText(data.shareUrl);
        toast.success("Share link created and copied!");
      }
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  }, [projectId]);

  const deleteShare = useCallback(async (shareId: string) => {
    try {
      await fetch("/api/shares", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke share link");
    }
  }, []);

  const copyUrl = useCallback((token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      toast.success("Link copied!");
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Create share links to let others view or edit your project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Existing share links */}
          {shares.length > 0 && (
            <div className="space-y-2">
              {shares.map((share) => (
                <div key={share.id} className="flex items-center gap-2 rounded-md border p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate text-muted-foreground">
                      /share/{share.token.slice(0, 8)}...
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {share.permission === "edit" ? "Can edit" : "View only"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyUrl(share.token)}
                  >
                    {copied === share.token ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-destructive"
                    onClick={() => deleteShare(share.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Create new share link */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => createShare("view")}
              disabled={creating}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              View-only link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => createShare("edit")}
              disabled={creating}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Edit link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
