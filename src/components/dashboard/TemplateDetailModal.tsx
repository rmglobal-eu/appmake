"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  files?: Record<string, string>;
  prompt?: string;
}

interface TemplateDetailModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateDetailModal({
  template,
  open,
  onOpenChange,
}: TemplateDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!template) return null;

  const screenshots = [
    template.thumbnail || "https://placehold.co/600x400/1a1a2e/ffffff?text=Preview",
    `https://placehold.co/600x400/16213e/ffffff?text=${encodeURIComponent(template.name)}+Mobile`,
    `https://placehold.co/600x400/0f3460/ffffff?text=${encodeURIComponent(template.name)}+Dark`,
  ];

  async function handleUseTemplate() {
    if (!template) return;
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          template: "node",
        }),
      });
      const data = await res.json();
      const projectId = data.project.id;

      // Save template files if they exist
      if (template.files && Object.keys(template.files).length > 0) {
        await fetch(`/api/projects/${projectId}/files`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: template.files }),
        });
      }

      // Store the template prompt so it gets sent as the first message
      if (template.prompt) {
        sessionStorage.setItem(
          `appmake_initial_prompt_${projectId}`,
          template.prompt
        );
      }

      toast.success("Project created from template!");
      router.push(`/chat/${projectId}`);
    } catch {
      toast.error("Failed to create project");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-4xl border-white/10 bg-[#0f0f14] p-0 text-white sm:max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <DialogTitle className="text-lg font-semibold text-white">
              {template.name}
            </DialogTitle>
            <p className="mt-0.5 text-sm text-white/40">by AppMake</p>
          </div>
          <Button
            onClick={handleUseTemplate}
            disabled={loading}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Use template"
            )}
          </Button>
        </div>

        {/* Body: thumbnails left, preview right */}
        <div className="flex gap-4 p-6">
          {/* Left: thumbnail list */}
          <div className="flex w-20 shrink-0 flex-col gap-2">
            {screenshots.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`overflow-hidden rounded-lg border transition-all ${
                  selectedImage === i
                    ? "border-violet-500 ring-1 ring-violet-500"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <img
                  src={src}
                  alt={`${template.name} screenshot ${i + 1}`}
                  className="h-14 w-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Right: large preview */}
          <div className="flex-1">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img
                src={screenshots[selectedImage]}
                alt={template.name}
                className="h-[400px] w-full object-cover"
              />
            </div>
            <p className="mt-4 text-sm text-white/50">{template.description}</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-white/40">
                {template.category}
              </span>
              {template.files && Object.keys(template.files).length > 0 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-white/40">
                  {Object.keys(template.files).length} files
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
