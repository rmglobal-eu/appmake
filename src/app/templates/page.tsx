"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Loader2, FolderOpen, Menu } from "lucide-react";
import { MeshGradientBackground } from "@/components/dashboard/MeshGradientBackground";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TemplateDetailModal } from "@/components/dashboard/TemplateDetailModal";

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  type?: "website" | "app";
  thumbnail?: string;
  files?: Record<string, string>;
  prompt?: string;
}

interface Project {
  id: string;
  name: string;
  updatedAt?: string;
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: (t: Template) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="group flex flex-col text-left"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all group-hover:border-white/20 group-hover:bg-white/10">
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderOpen className="h-6 w-6 text-white/20" />
          </div>
        )}
      </div>
      <div className="min-w-0 pt-2.5">
        <p className="truncate text-sm font-bold text-white">
          {template.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/40">
          {template.description}
        </p>
      </div>
    </button>
  );
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!session) return;

    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data ?? []))
      .catch(() => {});
  }, [session]);

  const websites = useMemo(
    () => templates.filter((t) => t.type !== "app"),
    [templates]
  );
  const apps = useMemo(
    () => templates.filter((t) => t.type === "app"),
    [templates]
  );

  function handleSelect(t: Template) {
    setSelectedTemplate(t);
    setModalOpen(true);
  }

  if (!session) return null;

  return (
    <div className="flex h-screen">
      <DashboardSidebar
        user={session.user!}
        projects={projects}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-black p-2">
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#141418]" style={{ contain: "paint" }}>
          <MeshGradientBackground />
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-8 py-8">
            {/* Header — flush left */}
            <h1 className="text-xl font-bold text-white">Templates</h1>
            <p className="mt-1 mb-8 text-sm text-white/40">
              Start from a template to build your next project
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-white/30" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FolderOpen className="mb-3 h-10 w-10 text-white/30" />
                <p className="text-sm text-white/50">No templates available</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Websites */}
                {websites.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-lg font-bold text-white">Websites</h2>
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {websites.map((tmpl) => (
                        <TemplateCard
                          key={tmpl.slug}
                          template={tmpl}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Apps */}
                {apps.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-lg font-bold text-white">Apps</h2>
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {apps.map((tmpl) => (
                        <TemplateCard
                          key={tmpl.slug}
                          template={tmpl}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <TemplateDetailModal
        template={selectedTemplate}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
