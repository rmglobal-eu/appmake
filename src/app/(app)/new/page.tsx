"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/NavHeader";
import { Globe, Server, FileCode, Sparkles, LayoutDashboard, ShoppingCart, User, BookOpen, Loader2 } from "lucide-react";

const RUNTIME_TEMPLATES = [
  {
    id: "node",
    name: "Node.js",
    description: "React, Next.js, Express — anything JavaScript/TypeScript",
    icon: Server,
  },
  {
    id: "python",
    name: "Python",
    description: "Flask, FastAPI, Django — Python web apps",
    icon: FileCode,
  },
  {
    id: "static",
    name: "Static",
    description: "HTML, CSS, JS — simple static websites",
    icon: Globe,
  },
] as const;

const CATEGORY_ICONS: Record<string, typeof Globe> = {
  saas: Sparkles,
  dashboard: LayoutDashboard,
  ecommerce: ShoppingCart,
  portfolio: User,
  blog: BookOpen,
  landing: Globe,
  other: FileCode,
};

interface StarterTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  files: Record<string, string>;
  prompt?: string;
  isBuiltIn: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<string>("node");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"blank" | "starter">("blank");
  const [starters, setStarters] = useState<StarterTemplate[]>([]);
  const [startersLoading, setStartersLoading] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "starter" && starters.length === 0) {
      setStartersLoading(true);
      fetch("/api/templates")
        .then((r) => r.json())
        .then((data) => setStarters(data.templates || []))
        .catch(() => {})
        .finally(() => setStartersLoading(false));
    }
  }, [tab, starters.length]);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });
      const data = await res.json();
      const projectId = data.project.id;

      // If a starter template is selected, save its files
      if (tab === "starter" && selectedStarter) {
        const starter = starters.find((s) => s.slug === selectedStarter);
        if (starter?.files) {
          await fetch(`/api/projects/${projectId}/files`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: starter.files }),
          });
        }
      }

      toast.success("Project created!");
      router.push(`/chat/${projectId}`);
    } catch {
      toast.error("Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <NavHeader />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">Create New Project</h1>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              autoFocus
            />
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 rounded-lg border bg-muted/50 p-0.5 w-fit">
            <button
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "blank" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => { setTab("blank"); setSelectedStarter(null); }}
            >
              Blank Project
            </button>
            <button
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "starter" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab("starter")}
            >
              Start from Template
            </button>
          </div>

          {tab === "blank" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">Runtime</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {RUNTIME_TEMPLATES.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-colors hover:border-primary ${
                      template === t.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setTemplate(t.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <t.icon className="h-4 w-4" />
                        {t.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : startersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">Choose a Template</label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {starters.map((s) => {
                  const Icon = CATEGORY_ICONS[s.category] || Globe;
                  return (
                    <Card
                      key={s.slug}
                      className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                        selectedStarter === s.slug ? "border-primary bg-primary/5 shadow-md" : ""
                      }`}
                      onClick={() => setSelectedStarter(s.slug)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4" />
                          {s.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                        <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {s.category}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || loading || (tab === "starter" && !selectedStarter)}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
