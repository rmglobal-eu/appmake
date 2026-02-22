"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { MeshGradientBackground } from "@/components/dashboard/MeshGradientBackground";
import { TypingHeading } from "@/components/dashboard/TypingHeading";
import { DashboardChatInput } from "@/components/dashboard/DashboardChatInput";
import { IdeaCards } from "@/components/dashboard/IdeaCards";
import { ProjectTabs } from "@/components/dashboard/ProjectTabs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface Project {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => setProjects(data ?? []))
        .catch(() => toast.error("Failed to load projects"));
    }
  }, [session]);

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <DashboardSidebar
        user={session.user!}
        projects={projects}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col bg-black p-2">
        <div
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#141418]"
          style={{ contain: "paint" }}
        >
          <MeshGradientBackground />

          {/* Mobile header with hamburger */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Hero area */}
            <div className="flex flex-col items-center px-4 pt-[18vh] pb-12 gap-8">
              <TypingHeading name={firstName} />
              <DashboardChatInput
                externalPrompt={selectedIdea}
                onPromptConsumed={() => setSelectedIdea(null)}
              />
              <IdeaCards onSelect={setSelectedIdea} />
            </div>

            {/* Project tabs in dark container */}
            <div className="relative z-10 w-full px-10 pb-10">
              <div className="rounded-2xl bg-[#1a1a1e] p-5 shadow-2xl">
                <ProjectTabs projects={projects} userName={session.user?.name || firstName} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
