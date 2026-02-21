"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, FolderOpen, Loader2, ArrowRight } from "lucide-react";
import { TemplateDetailModal } from "./TemplateDetailModal";

interface Project {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
}

interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  files?: Record<string, string>;
  prompt?: string;
}

interface ProjectTabsProps {
  projects: Project[];
  userName?: string;
  activeTab?: (typeof TABS)[number];
  onTabChange?: (tab: (typeof TABS)[number]) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TABS = ["Recently viewed", "My projects", "Templates"] as const;

export type TabName = (typeof TABS)[number];

export function ProjectTabs({ projects, userName, activeTab: controlledTab, onTabChange }: ProjectTabsProps) {
  const [internalTab, setInternalTab] = useState<TabName>("Recently viewed");
  const activeTab = controlledTab ?? internalTab;
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesFetched, setTemplatesFetched] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const setActiveTab = useCallback((tab: TabName) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  }, [onTabChange]);

  useEffect(() => {
    if (activeTab === "Templates" && !templatesFetched) {
      setTemplatesLoading(true);
      fetch("/api/templates")
        .then((r) => r.json())
        .then((data) => {
          setTemplates(data.templates || []);
          setTemplatesFetched(true);
        })
        .catch(() => {})
        .finally(() => setTemplatesLoading(false));
    }
  }, [activeTab, templatesFetched]);

  const showProjects = activeTab !== "Templates" ? projects : [];
  const initial = userName?.charAt(0).toUpperCase() || "U";

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push(activeTab === "Templates" ? "/templates" : "/dashboard")}
          className="flex items-center gap-1 text-[13px] font-medium text-white/40 transition-colors hover:text-white/60"
        >
          Browse all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Templates grid */}
      {activeTab === "Templates" ? (
        templatesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/40">No templates available</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.slug}
                  onClick={() => {
                    setSelectedTemplate(tmpl);
                    setModalOpen(true);
                  }}
                  className="group flex flex-col text-left"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#252529]">
                    {tmpl.thumbnail ? (
                      <img
                        src={tmpl.thumbnail}
                        alt={tmpl.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pt-2.5">
                    <p className="truncate text-sm font-semibold text-white">{tmpl.name}</p>
                    <p className="mt-0.5 truncate text-xs text-white/40">{tmpl.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <TemplateDetailModal
              template={selectedTemplate}
              open={modalOpen}
              onOpenChange={setModalOpen}
            />
          </>
        )
      ) : showProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">No projects yet</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {showProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/chat/${project.id}`)}
              className="group flex flex-col text-left"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3a]">
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <img src="/logo-dark.svg" alt="" className="h-12" />
                  <p className="max-w-[80%] truncate text-sm font-semibold text-white/30">{project.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                  <p className="text-[11px] text-white/30">Viewed {timeAgo(project.updatedAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
