"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/NavHeader";
import { Globe, Server, FileCode } from "lucide-react";

const TEMPLATES = [
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

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<string>("node");
  const [loading, setLoading] = useState(false);

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
      toast.success("Project created!");
      router.push(`/chat/${data.project.id}`);
    } catch {
      toast.error("Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <NavHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">Create New Project</h1>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome App"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Template</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => (
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
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
