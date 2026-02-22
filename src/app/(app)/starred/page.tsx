"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Menu,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Loader2,
  Star,
  StickyNote,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface Project {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

type SortKey = "updatedAt" | "createdAt" | "name";
type SortDir = "desc" | "asc";
type ViewMode = "grid" | "list";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updatedAt", label: "Last edited" },
  { key: "createdAt", label: "Created" },
  { key: "name", label: "Name" },
];

export default function StarredPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => setAllProjects(data ?? []))
        .catch(() => toast.error("Failed to load projects"))
        .finally(() => setLoading(false));
    }
  }, [session]);

  const starredProjects = useMemo(
    () => allProjects.filter((p) => p.starred),
    [allProjects]
  );

  const filtered = useMemo(() => {
    let list = starredProjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const aVal = new Date(a[sortKey]).getTime();
      const bVal = new Date(b[sortKey]).getTime();
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    return list;
  }, [starredProjects, search, sortKey, sortDir]);

  async function toggleStar(e: React.MouseEvent, projectId: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${projectId}/star`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const { starred } = await res.json();
      setAllProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, starred } : p))
      );
    } catch {
      toast.error("Failed to update star");
    }
  }

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();

  const isEmpty = !loading && starredProjects.length === 0;

  return (
    <div className="flex h-screen">
      <DashboardSidebar
        user={session.user!}
        projects={allProjects}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-black p-2">
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#141418]">
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
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-bold text-white">Starred</h1>

              {!isEmpty && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search starred..."
                      className="h-9 w-60 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/20 focus:bg-white/[0.08]"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/30 hover:text-white/60"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors hover:bg-white/[0.08]"
                    >
                      {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
                      <ChevronDown className="h-3.5 w-3.5 text-white/40" />
                    </button>
                    {sortDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSortDropdownOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-white/10 bg-[#1e1e22] py-1 shadow-xl">
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => {
                                if (sortKey === opt.key) {
                                  setSortDir(
                                    sortDir === "desc" ? "asc" : "desc"
                                  );
                                } else {
                                  setSortKey(opt.key);
                                  setSortDir(
                                    opt.key === "name" ? "asc" : "desc"
                                  );
                                }
                                setSortDropdownOpen(false);
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
                            >
                              <span>{opt.label}</span>
                              {sortKey === opt.key && (
                                <span className="text-xs text-white/40">
                                  {sortDir === "desc"
                                    ? opt.key === "name"
                                      ? "Z-A"
                                      : "Newest first"
                                    : opt.key === "name"
                                      ? "A-Z"
                                      : "Oldest first"}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* View toggle */}
                  <div className="flex h-9 items-center rounded-lg border border-white/10 bg-white/5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex h-full items-center justify-center rounded-l-lg px-2.5 transition-colors ${
                        viewMode === "grid"
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex h-full items-center justify-center rounded-r-lg px-2.5 transition-colors ${
                        viewMode === "list"
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
              </div>
            ) : isEmpty ? (
              /* Empty state — visual mockup */
              <div className="flex flex-col items-center justify-center py-10">
                {/* Floating project cards illustration */}
                <div className="relative mb-10 h-56 w-80">
                  {/* Background glow */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-20 blur-3xl"
                    style={{ background: "radial-gradient(ellipse at center, #6366f1 0%, transparent 70%)" }}
                  />

                  {/* Card 1 — back left, tilted */}
                  <div
                    className="absolute left-2 top-8 w-40 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-sm"
                    style={{
                      transform: "rotate(-6deg)",
                      animation: "fadeInUp 700ms ease-out 100ms both",
                    }}
                  >
                    <div className="h-16 rounded-lg bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3a]" />
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="h-2 w-16 rounded-full bg-white/10" />
                        <div className="mt-1 h-1.5 w-10 rounded-full bg-white/5" />
                      </div>
                      <Star className="h-3.5 w-3.5 text-white/10" />
                    </div>
                  </div>

                  {/* Card 2 — center front, featured with star */}
                  <div
                    className="absolute left-1/2 top-4 z-10 w-44 -translate-x-1/2 rounded-xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-black/30 backdrop-blur-sm"
                    style={{ animation: "fadeInUp 700ms ease-out 200ms both" }}
                  >
                    <div className="relative h-20 rounded-lg bg-gradient-to-br from-violet-900/40 to-pink-900/30">
                      <div className="flex h-full items-center justify-center">
                        <img src="/logo-dark.svg" alt="" className="h-6 opacity-20" />
                      </div>
                      {/* Animated star */}
                      <div className="absolute right-1.5 top-1.5">
                        <Star
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          style={{ animation: "logoPulse 2s ease-in-out infinite" }}
                        />
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-violet-600" />
                      <div>
                        <div className="h-2 w-20 rounded-full bg-white/15" />
                        <div className="mt-1 h-1.5 w-12 rounded-full bg-white/5" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3 — back right, tilted */}
                  <div
                    className="absolute right-2 top-8 w-40 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 backdrop-blur-sm"
                    style={{
                      transform: "rotate(6deg)",
                      animation: "fadeInUp 700ms ease-out 300ms both",
                    }}
                  >
                    <div className="h-16 rounded-lg bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3a]" />
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <div className="h-2 w-14 rounded-full bg-white/10" />
                        <div className="mt-1 h-1.5 w-9 rounded-full bg-white/5" />
                      </div>
                      <Star className="h-3.5 w-3.5 text-white/10" />
                    </div>
                  </div>

                  {/* Floating star particles */}
                  <div
                    className="absolute left-12 top-2 text-yellow-400/30"
                    style={{ animation: "bounce 2s ease-in-out infinite" }}
                  >
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                  <div
                    className="absolute right-14 top-0 text-yellow-400/20"
                    style={{ animation: "bounce 2.5s ease-in-out infinite 0.5s" }}
                  >
                    <Star className="h-2.5 w-2.5 fill-current" />
                  </div>
                  <div
                    className="absolute bottom-10 left-8 text-yellow-400/15"
                    style={{ animation: "bounce 3s ease-in-out infinite 1s" }}
                  >
                    <Star className="h-2 w-2 fill-current" />
                  </div>
                </div>

                <h2
                  className="text-lg font-semibold text-white/80"
                  style={{ animation: "fadeInUp 600ms ease-out 400ms both" }}
                >
                  No starred projects yet
                </h2>
                <p
                  className="mt-2 max-w-sm text-center text-sm text-white/40"
                  style={{ animation: "fadeInUp 600ms ease-out 500ms both" }}
                >
                  Star your favorite projects for quick access. Click the star icon on any project card to pin it here.
                </p>
                <button
                  onClick={() => router.push("/projects")}
                  className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
                  style={{ animation: "fadeInUp 600ms ease-out 600ms both" }}
                >
                  Browse projects
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid view */
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((project) => (
                  <div
                    key={project.id}
                    className="group relative flex cursor-pointer flex-col"
                    onClick={() => router.push(`/chat/${project.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3a]">
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <img
                          src="/logo-dark.svg"
                          alt=""
                          className="h-10 opacity-30"
                        />
                      </div>

                      {/* Star overlay */}
                      <div className="absolute right-2.5 top-2.5 opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleStar(e, project.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 transition-colors hover:bg-black/60"
                        >
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-2 pt-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {project.name}
                        </p>
                        <p className="text-[11px] text-white/30">
                          Edited {timeAgo(project.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List view */
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="w-16 px-3 py-3">
                        <span className="sr-only">Thumbnail</span>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white/40">
                        Name
                      </th>
                      <th className="hidden px-3 py-3 text-left text-xs font-medium text-white/40 md:table-cell">
                        Created at
                      </th>
                      <th className="hidden px-3 py-3 text-left text-xs font-medium text-white/40 sm:table-cell">
                        Created by
                      </th>
                      <th className="w-10 px-3 py-3">
                        <span className="sr-only">Star</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => router.push(`/chat/${project.id}`)}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-3">
                          <div className="h-9 w-14 overflow-hidden rounded-md bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3a]">
                            <div className="flex h-full items-center justify-center">
                              <img
                                src="/logo-dark.svg"
                                alt=""
                                className="h-5 opacity-30"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-white">
                            {project.name}
                          </p>
                          <p className="text-xs text-white/30">
                            Edited {timeAgo(project.updatedAt)}
                          </p>
                        </td>
                        <td className="hidden px-3 py-3 text-sm text-white/40 md:table-cell">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="hidden px-3 py-3 sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white">
                              {initial}
                            </div>
                            <span className="text-sm text-white/50">
                              {session.user?.name || firstName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => toggleStar(e, project.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                          >
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && starredProjects.length > 0 && (
                  <div className="py-12 text-center text-sm text-white/30">
                    No starred projects match &ldquo;{search}&rdquo;
                  </div>
                )}
              </div>
            )}

            {/* Search empty state for grid */}
            {!loading &&
              viewMode === "grid" &&
              filtered.length === 0 &&
              starredProjects.length > 0 &&
              search && (
                <div className="py-12 text-center text-sm text-white/30">
                  No starred projects match &ldquo;{search}&rdquo;
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
