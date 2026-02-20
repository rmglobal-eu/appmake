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
import { Link, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Share this project with others. Collaborative sharing is coming soon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="text-sm font-mono" />
            <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
            <p className="text-sm font-medium">Team sharing coming soon</p>
            <p className="mt-1 text-xs">
              Invite collaborators to view and edit your project in real-time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
