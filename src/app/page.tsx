"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MeshGradientBackground } from "@/components/dashboard/MeshGradientBackground";
import { TypingHeading } from "@/components/dashboard/TypingHeading";
import { DashboardChatInput } from "@/components/dashboard/DashboardChatInput";
import { ProjectTabs } from "@/components/dashboard/ProjectTabs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface Project {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => setProjects(data ?? []))
        .catch(() => toast.error("Failed to load projects"));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Unauthenticated — gradient background with login buttons
  if (!session) {
    return (
      <div className="relative flex h-screen flex-col">
        <MeshGradientBackground />
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo-dark.svg"
              alt="AppMake"
              width={260}
              height={50}
              priority
              className="hidden dark:block"
            />
            <Image
              src="/logo-light.svg"
              alt="AppMake"
              width={260}
              height={50}
              priority
              className="block dark:hidden"
            />
            <p className="text-white/70">
              Build apps with AI. Describe what you want, we build it.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() =>
                signIn("credentials", {
                  email: "dev@appmake.dk",
                  callbackUrl: "/",
                })
              }
              size="lg"
              className="bg-white text-black hover:bg-white/90"
            >
              Dev Login
            </Button>
            <Button
              onClick={() => signIn("github")}
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              GitHub
            </Button>
            <Button
              onClick={() => signIn("google")}
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="relative flex min-w-0 flex-1 flex-col">
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

        {/* Central hero area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
          <TypingHeading name={firstName} />
          <DashboardChatInput />
        </div>

        {/* Project tabs */}
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-8">
          <ProjectTabs projects={projects} />
        </div>
      </div>
    </div>
  );
}
