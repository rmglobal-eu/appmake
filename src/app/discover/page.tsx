"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Heart, Loader2, Menu, FolderOpen } from "lucide-react";
import { MeshGradientBackground } from "@/components/dashboard/MeshGradientBackground";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { ShowcaseProject } from "@/lib/discover/showcase-projects";

interface Project {
  id: string;
  name: string;
  updatedAt?: string;
}

// ── Heart Button ────────────────────────────────────────────────────

function HeartButton({
  likes,
  liked,
  onToggle,
}: {
  likes: number;
  liked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-pink-400"
    >
      <Heart
        className={`h-3.5 w-3.5 ${liked ? "fill-pink-500 text-pink-500" : ""}`}
      />
      <span>{likes}</span>
    </button>
  );
}

// ── Thumbnail ───────────────────────────────────────────────────────

function Thumbnail({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all group-hover:border-white/20 group-hover:bg-white/10 ${className ?? ""}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <FolderOpen className="h-6 w-6 text-white/20" />
        </div>
      )}
    </div>
  );
}

// ── Featured Card ───────────────────────────────────────────────────

function FeaturedCard({ project }: { project: ShowcaseProject }) {
  return (
    <div className="group flex flex-col text-left">
      <Thumbnail
        src={project.thumbnail}
        alt={project.name}
        className="aspect-[16/10]"
      />
      <div className="pt-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{project.name}</h3>
            <p className="mt-0.5 text-xs text-white/40">{project.description}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">
              {project.authorName.charAt(0)}
            </div>
            <span className="text-xs text-white/50">{project.authorName}</span>
          </div>
          <HeartButton likes={project.likes} />
        </div>
      </div>
    </div>
  );
}

// ── Builder Card ────────────────────────────────────────────────────

function BuilderCard({ project }: { project: ShowcaseProject }) {
  return (
    <div className="group flex flex-col text-left">
      <Thumbnail
        src={project.thumbnail}
        alt={project.name}
        className="aspect-[16/9]"
      />
      <div className="pt-2.5">
        <h3 className="text-sm font-bold text-white">{project.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/40">
          {project.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-white/30">{project.authorName}</span>
          <HeartButton likes={project.likes} />
        </div>
      </div>
    </div>
  );
}

// ── Community Card ──────────────────────────────────────────────────

function CommunityCard({ project }: { project: ShowcaseProject }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
        <img
          src={project.thumbnail}
          alt={project.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{project.name}</p>
        <p className="truncate text-xs text-white/40">{project.description}</p>
      </div>
      <HeartButton likes={project.likes} />
    </div>
  );
}

// ── Standard Discover Card ──────────────────────────────────────────

function DiscoverCard({ project }: { project: ShowcaseProject }) {
  return (
    <div className="group flex flex-col text-left">
      <Thumbnail
        src={project.thumbnail}
        alt={project.name}
        className="aspect-[16/10]"
      />
      <div className="pt-2.5">
        <p className="truncate text-sm font-bold text-white">{project.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/40">
          {project.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-white/30">{project.authorName}</span>
          <HeartButton likes={project.likes} />
        </div>
      </div>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

export default function DiscoverPage() {
  const { data: session } = useSession();
  const [showcase, setShowcase] = useState<ShowcaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!session) return;

    fetch("/api/discover")
      .then((r) => r.json())
      .then((data) => setShowcase(data.showcase || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data ?? []))
      .catch(() => {});
  }, [session]);

  const featured = useMemo(
    () => showcase.filter((p) => p.section === "featured"),
    [showcase]
  );
  const builders = useMemo(
    () => showcase.filter((p) => p.section === "builders"),
    [showcase]
  );
  const community = useMemo(
    () => showcase.filter((p) => p.section === "community"),
    [showcase]
  );
  const personal = useMemo(
    () => showcase.filter((p) => p.section === "personal"),
    [showcase]
  );
  const marketing = useMemo(
    () => showcase.filter((p) => p.section === "marketing"),
    [showcase]
  );
  const business = useMemo(
    () => showcase.filter((p) => p.section === "business"),
    [showcase]
  );

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
        <div
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#141418]"
          style={{ contain: "paint" }}
        >
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
            {/* Header */}
            <h1 className="text-xl font-bold text-white">Discover</h1>
            <p className="mt-1 mb-8 text-sm text-white/40">
              Explore apps and projects built with AppMake
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-white/30" />
              </div>
            ) : (
              <div className="space-y-12">
                {/* Featured */}
                {featured.length > 0 && (
                  <section>
                    <SectionHeader
                      title="Featured Apps"
                      subtitle="Hand-picked projects we love"
                    />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {featured.map((p) => (
                        <FeaturedCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Builders */}
                {builders.length > 0 && (
                  <section>
                    <SectionHeader
                      title="Apps for Builders"
                      subtitle="Tools and utilities for developers"
                    />
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {builders.map((p) => (
                        <BuilderCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Community */}
                {community.length > 0 && (
                  <section>
                    <SectionHeader
                      title="Apps Loved by Community"
                      subtitle="Most liked by the AppMake community"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {community.map((p) => (
                        <CommunityCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Personal & Entertainment */}
                {personal.length > 0 && (
                  <section>
                    <SectionHeader title="Personal & Entertainment" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {personal.map((p) => (
                        <DiscoverCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Marketing & Content */}
                {marketing.length > 0 && (
                  <section>
                    <SectionHeader title="Marketing & Content" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {marketing.map((p) => (
                        <DiscoverCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Business */}
                {business.length > 0 && (
                  <section>
                    <SectionHeader title="Business" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {business.map((p) => (
                        <DiscoverCard key={p.id} project={p} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
