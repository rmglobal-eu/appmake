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
import { Database, ExternalLink } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface SupabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (url: string, anonKey: string) => void;
}

export function SupabaseDialog({ open, onOpenChange, onConnect }: SupabaseDialogProps) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");

  const handleConnect = useCallback(() => {
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      toast.error("Both URL and anon key are required");
      return;
    }
    if (!supabaseUrl.includes("supabase")) {
      toast.error("Invalid Supabase URL");
      return;
    }
    onConnect(supabaseUrl.trim(), anonKey.trim());
    toast.success("Supabase connected! You can now ask the AI to add auth, database, or storage.");
    onOpenChange(false);
  }, [supabaseUrl, anonKey, onConnect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Connect Supabase
          </DialogTitle>
          <DialogDescription>
            Connect your Supabase project to add authentication, database, and storage to your app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Project URL</label>
            <Input
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxx.supabase.co"
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Anon Key</label>
            <Input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1..."
              className="text-xs"
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Find these in your Supabase dashboard under Settings &rarr; API.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Open Supabase Dashboard <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConnect} className="flex-1">
              Connect
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
