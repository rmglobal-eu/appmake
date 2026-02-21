"use client";

import { useState } from "react";
import { Heart, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

export interface GalleryProject {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  author: {
    name: string;
    avatar?: string;
  };
  likes: number;
  views: number;
  createdAt: Date;
}

interface ProjectCardProps {
  project: GalleryProject;
  onLike?: (projectId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ProjectCard({ project, onLike }: ProjectCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes);
  const [isHovered, setIsHovered] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
      onLike?.(project.id);
    }
    setIsLiked(!isLiked);
  }

  return (
    <Link
      href={`/share/${project.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="text-center">
              <div className="text-3xl font-bold text-zinc-600">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="mt-1 text-[10px] text-zinc-600">No preview</div>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg">
            <ExternalLink className="h-4 w-4" />
            Open
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="p-3">
        {/* Project name */}
        <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
          {project.name}
        </h3>

        {/* Description */}
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {project.description}
          </p>
        )}

        {/* Footer: author + stats */}
        <div className="mt-3 flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-1.5">
            {project.author.avatar ? (
              <img
                src={project.author.avatar}
                alt={project.author.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-300">
                {project.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-xs text-zinc-400">
              {project.author.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            {/* Views */}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Eye className="h-3.5 w-3.5" />
              <span>{formatCount(project.views)}</span>
            </div>

            {/* Likes */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked
                  ? "text-rose-400"
                  : "text-zinc-500 hover:text-rose-400"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
              />
              <span>{formatCount(likeCount)}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
