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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Loader2, Trash2, Plus } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Collaborator {
  id: string;
  role: "editor" | "viewer";
  userName: string | null;
  userEmail: string;
  userImage: string | null;
}

interface CollabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollabDialog({ open, onOpenChange }: CollabDialogProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    fetch(`/api/collab?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setCollabs(data.collaborators || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId]);

  const handleAdd = useCallback(async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCollabs((prev) => [...prev, data.collaborator]);
      setEmail("");
      toast.success("Collaborator added!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  }, [projectId, email, role]);

  const handleRemove = useCallback(async (collaboratorId: string) => {
    try {
      await fetch("/api/collab", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId, projectId }),
      });
      setCollabs((prev) => prev.filter((c) => c.id !== collaboratorId));
      toast.success("Collaborator removed");
    } catch {
      toast.error("Failed to remove collaborator");
    }
  }, [projectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Collaboration
          </DialogTitle>
          <DialogDescription>
            Add team members to collaborate on this project in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Collaborator list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : collabs.length > 0 ? (
            <div className="space-y-2">
              {collabs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={c.userImage ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {(c.userName || c.userEmail).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.userName || c.userEmail}</p>
                    <p className="text-[10px] text-muted-foreground">{c.role}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive shrink-0"
                    onClick={() => handleRemove(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-2">No collaborators yet</p>
          )}

          {/* Add collaborator */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="text-xs"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="rounded-md border bg-background px-2 text-xs"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <Button onClick={handleAdd} disabled={adding} size="sm" className="w-full">
              {adding ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Add Collaborator
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
