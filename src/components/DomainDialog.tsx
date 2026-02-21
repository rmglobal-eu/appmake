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
import { Globe, Loader2, Check, X, RefreshCw, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Domain {
  id: string;
  domain: string;
  status: "pending" | "verified" | "failed";
  verificationToken: string;
}

interface DomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainDialog({ open, onOpenChange }: DomainDialogProps) {
  const params = useParams();
  const projectId = params.id as string;
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;
    fetch(`/api/domains?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setDomains(data.domains || []))
      .catch(() => {});
  }, [open, projectId]);

  const handleAdd = useCallback(async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, domain: newDomain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDomains((prev) => [...prev, data.domain]);
      setNewDomain("");
      toast.success("Domain added! Add the TXT record shown below to verify.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  }, [projectId, newDomain]);

  const handleVerify = useCallback(async (domainId: string) => {
    setVerifying(domainId);
    try {
      const res = await fetch("/api/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? { ...d, status: data.status } : d))
      );
      if (data.status === "verified") {
        toast.success("Domain verified!");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(null);
    }
  }, []);

  const handleDelete = useCallback(async (domainId: string) => {
    try {
      await fetch("/api/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      toast.success("Domain removed");
    } catch {
      toast.error("Failed to remove domain");
    }
  }, []);

  const statusIcon = (status: string) => {
    if (status === "verified") return <Check className="h-3.5 w-3.5 text-green-500" />;
    if (status === "failed") return <X className="h-3.5 w-3.5 text-red-500" />;
    return <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Custom Domains
          </DialogTitle>
          <DialogDescription>
            Connect your own domain to your deployed project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {domains.map((d) => (
            <div key={d.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(d.status)}
                  <span className="text-sm font-medium">{d.domain}</span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                    d.status === "verified" ? "bg-green-100 text-green-700" :
                    d.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {d.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  {d.status !== "verified" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleVerify(d.id)}
                      disabled={verifying === d.id}
                    >
                      {verifying === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {d.status !== "verified" && (
                <div className="rounded bg-muted p-2 text-[10px] font-mono">
                  <p className="text-muted-foreground mb-1">Add this TXT record to your DNS:</p>
                  <p>Name: <span className="text-foreground">_appmake.{d.domain}</span></p>
                  <p>Value: <span className="text-foreground break-all">{d.verificationToken}</span></p>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="yourdomain.com"
              className="text-xs"
            />
            <Button onClick={handleAdd} disabled={adding} size="sm" className="shrink-0">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add Domain"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
