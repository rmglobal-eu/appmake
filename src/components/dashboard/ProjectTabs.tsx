"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
}

interface ProjectTabsProps {
  projects: Project[];
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

export function ProjectTabs({ projects }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Recently viewed");
  const router = useRouter();

  // For now, both "Recently viewed" and "My projects" show the same list
  // Templates tab shows empty state
  const showProjects = activeTab !== "Templates" ? projects : [];

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Project grid */}
      {showProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-white/30" />
          <p className="text-sm text-white/50">
            {activeTab === "Templates" ? "Templates coming soon" : "No projects yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {showProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/chat/${project.id}`)}
              className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex h-20 items-center justify-center rounded-lg bg-white/5">
                <MessageSquare className="h-6 w-6 text-white/30" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{project.name}</p>
                <p className="text-xs text-white/40">{timeAgo(project.updatedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
