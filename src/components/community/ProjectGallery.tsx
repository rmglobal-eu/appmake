"use client";

import { useState } from "react";
import ProjectCard, { type GalleryProject } from "./ProjectCard";
import { LayoutGrid } from "lucide-react";

interface ProjectGalleryProps {
  projects: GalleryProject[];
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  async function handleLike(projectId: string) {
    if (likedIds.has(projectId)) return;

    setLikedIds((prev) => new Set(prev).add(projectId));

    try {
      await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
    } catch {
      // Revert optimistic update on failure
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16">
        <LayoutGrid className="mb-3 h-10 w-10 text-zinc-600" />
        <h3 className="text-sm font-medium text-zinc-400">
          No projects found
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Be the first to publish a project to the community.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onLike={handleLike}
        />
      ))}
    </div>
  );
}
