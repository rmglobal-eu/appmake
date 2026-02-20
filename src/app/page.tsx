"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavHeader } from "@/components/NavHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, FolderOpen, MessageSquare } from "lucide-react";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

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

  if (!session) {
    return (
      <div className="flex h-screen flex-col">
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
            <p className="text-muted-foreground">
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
            >
              Dev Login
            </Button>
            <Button
              onClick={() => signIn("github")}
              size="lg"
              variant="outline"
            >
              GitHub
            </Button>
            <Button
              onClick={() => signIn("google")}
              size="lg"
              variant="outline"
            >
              Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <NavHeader />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.user?.name}
            </p>
          </div>
          <Button onClick={() => router.push("/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-medium">No projects yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first project to get started.
            </p>
            <Button className="mt-4" onClick={() => router.push("/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/chat/${project.id}`)}
                className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
              >
                <MessageSquare className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {project.template} &middot;{" "}
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
