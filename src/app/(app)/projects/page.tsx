"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Menu,
  Search,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  Check,
  X,
  Loader2,
  Star,
  Trash2,
  Sparkles,
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

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: "updatedAt", labelKey: "lastEdited" },
  { key: "createdAt", labelKey: "createdDate" },
  { key: "name", labelKey: "nameSort" },
];

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters & view
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Creating
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data) => setProjects(data ?? []))
        .catch(() => toast.error(t("failedToLoadProjects")))
        .finally(() => setLoading(false));
    }
  }, [session]);

  const filtered = useMemo(() => {
    let list = projects;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Sort
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
  }, [projects, search, sortKey, sortDir]);

  const selectionActive = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  }

  function cancelSelection() {
    setSelectedIds(new Set());
  }

  async function handleCreateProject() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled project" }),
      });
      if (!res.ok) throw new Error();
      const { project, chatId } = await res.json();
      router.push(`/chat/${project.id}`);
    } catch {
      toast.error(t("failedToCreateProject"));
      setCreating(false);
    }
  }

  async function toggleStar(e: React.MouseEvent, projectId: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${projectId}/star`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const { starred } = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, starred } : p))
      );
    } catch {
      toast.error(t("failedToUpdateStar"));
    }
  }

  // Delete
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteSelected() {
    if (deleting) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/projects/${id}`, { method: "DELETE" })
        )
      );
      setProjects((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
      toast.success(t("projectDeleted", { count: ids.length }));
    } catch {
      toast.error(t("failedToDeleteProjects"));
    } finally {
      setDeleting(false);
    }
  }

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();
  const hasNoProjects = !loading && projects.length === 0;

  return (
    <div className="flex h-screen">
      <DashboardSidebar
        user={session.user!}
        projects={projects}
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
              <h1 className="text-2xl font-bold text-white">{t("projectsPage")}</h1>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchProjects")}
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
                    {t(SORT_OPTIONS.find((o) => o.key === sortKey)?.labelKey ?? "lastEdited")}
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
                                setSortDir(sortDir === "desc" ? "asc" : "desc");
                              } else {
                                setSortKey(opt.key);
                                setSortDir(opt.key === "name" ? "asc" : "desc");
                              }
                              setSortDropdownOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5"
                          >
                            <span>{t(opt.labelKey)}</span>
                            {sortKey === opt.key && (
                              <span className="text-xs text-white/40">
                                {sortDir === "desc"
                                  ? opt.key === "name"
                                    ? t("zA")
                                    : t("newestFirst")
                                  : opt.key === "name"
                                    ? t("aZ")
                                    : t("oldestFirst")}
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
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
              </div>
            ) : hasNoProjects ? (
              /* Empty state — visual mockup of project creation */
              <div className="flex flex-col items-center justify-center py-10">
                {/* Animated project builder illustration */}
                <div className="relative mb-10 h-64 w-96">
                  {/* Background glow */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-15 blur-3xl"
                    style={{ background: "radial-gradient(ellipse at center, #6366f1 0%, #ff1493 40%, transparent 70%)" }}
                  />

                  {/* Browser mockup — main */}
                  <div
                    className="absolute left-1/2 top-2 z-10 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1e] shadow-2xl shadow-black/40"
                    style={{ animation: "fadeInUp 700ms ease-out 100ms both" }}
                  >
                    {/* Browser chrome */}
                    <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
                      <div className="h-2 w-2 rounded-full bg-red-400/40" />
                      <div className="h-2 w-2 rounded-full bg-yellow-400/40" />
                      <div className="h-2 w-2 rounded-full bg-green-400/40" />
                      <div className="ml-2 h-4 flex-1 rounded-md bg-white/[0.06]" />
                    </div>
                    {/* Page content mockup */}
                    <div className="p-4">
                      {/* Nav */}
                      <div className="flex items-center justify-between">
                        <div className="h-2.5 w-14 rounded-full bg-white/10" />
                        <div className="flex gap-2">
                          <div className="h-2 w-8 rounded-full bg-white/[0.06]" />
                          <div className="h-2 w-8 rounded-full bg-white/[0.06]" />
                          <div className="h-5 w-12 rounded-md bg-violet-600/40" />
                        </div>
                      </div>
                      {/* Hero */}
                      <div className="mt-5 flex flex-col items-center">
                        <div className="h-3 w-32 rounded-full bg-white/10" />
                        <div className="mt-1.5 h-2 w-24 rounded-full bg-white/[0.05]" />
                        <div className="mt-3 h-6 w-20 rounded-lg bg-gradient-to-r from-violet-600/50 to-pink-600/50" />
                      </div>
                      {/* Cards grid */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="h-10 rounded-md bg-white/[0.04]" />
                        <div className="h-10 rounded-md bg-white/[0.04]" />
                        <div className="h-10 rounded-md bg-white/[0.04]" />
                      </div>
                    </div>
                  </div>

                  {/* Floating code snippet — left */}
                  <div
                    className="absolute left-0 top-16 w-32 rounded-lg border border-white/[0.06] bg-[#1a1a1e]/90 p-2.5 font-mono text-[8px] leading-relaxed backdrop-blur-sm"
                    style={{
                      transform: "rotate(-4deg)",
                      animation: "fadeInUp 700ms ease-out 300ms both",
                    }}
                  >
                    <span className="text-pink-400/60">{"<"}</span>
                    <span className="text-violet-400/60">Button</span>
                    <span className="text-pink-400/60">{">"}</span>
                    <br />
                    <span className="text-white/30 ml-2">Get started</span>
                    <br />
                    <span className="text-pink-400/60">{"</"}</span>
                    <span className="text-violet-400/60">Button</span>
                    <span className="text-pink-400/60">{">"}</span>
                  </div>

                  {/* Floating AI sparkle — right */}
                  <div
                    className="absolute right-2 top-12 flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-[#1a1a1e]/90 px-2.5 py-2 backdrop-blur-sm"
                    style={{
                      transform: "rotate(3deg)",
                      animation: "fadeInUp 700ms ease-out 400ms both",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-400/60" style={{ animation: "logoPulse 2s ease-in-out infinite" }} />
                    <span className="text-[9px] font-medium text-white/30">AI Building...</span>
                  </div>

                  {/* Floating component block — bottom right */}
                  <div
                    className="absolute bottom-4 right-4 w-28 rounded-lg border border-white/[0.06] bg-[#1a1a1e]/90 p-2 backdrop-blur-sm"
                    style={{
                      transform: "rotate(2deg)",
                      animation: "fadeInUp 700ms ease-out 500ms both",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-600/40 to-pink-600/40" />
                      <div>
                        <div className="h-1.5 w-12 rounded-full bg-white/10" />
                        <div className="mt-0.5 h-1 w-8 rounded-full bg-white/[0.05]" />
                      </div>
                    </div>
                  </div>
                </div>

                <h2
                  className="text-xl font-semibold text-white/80"
                  style={{ animation: "fadeInUp 600ms ease-out 600ms both" }}
                >
                  {t("startBuildingSomethingAmazing")}
                </h2>
                <p
                  className="mt-2 max-w-md text-center text-sm text-white/40"
                  style={{ animation: "fadeInUp 600ms ease-out 700ms both" }}
                >
                  {t("createFirstProjectDesc")}
                </p>
                <button
                  onClick={handleCreateProject}
                  disabled={creating}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
                  style={{ animation: "fadeInUp 600ms ease-out 800ms both" }}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("createFirstProject")}
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid view */
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Create new project card */}
                <button
                  onClick={handleCreateProject}
                  disabled={creating}
                  className="group flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
                >
                  {creating ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white/30" />
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                        <Plus className="h-6 w-6 text-white/40 group-hover:text-white/60" />
                      </div>
                      <span className="text-sm font-medium text-white/40 group-hover:text-white/60">
                        {t("createNewProject")}
                      </span>
                    </>
                  )}
                </button>

                {/* Project cards */}
                {filtered.map((project) => (
                  <div
                    key={project.id}
                    className="group relative flex cursor-pointer flex-col"
                    onClick={() => {
                      if (selectionActive) {
                        toggleSelect(project.id);
                      } else {
                        router.push(`/chat/${project.id}`);
                      }
                    }}
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

                      {/* Checkbox overlay */}
                      <div
                        className={`absolute left-2.5 top-2.5 ${
                          selectedIds.has(project.id)
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        } transition-opacity`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(project.id);
                          }}
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            selectedIds.has(project.id)
                              ? "border-violet-500 bg-violet-600 text-white"
                              : "border-white/30 bg-black/40 text-transparent hover:border-white/50"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Star overlay */}
                      <div
                        className={`absolute right-2.5 top-2.5 ${
                          project.starred
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        } transition-opacity`}
                      >
                        <button
                          onClick={(e) => toggleStar(e, project.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 transition-colors hover:bg-black/60"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              project.starred
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-white/70"
                            }`}
                          />
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
                          {t("edited")} {timeAgo(project.updatedAt)}
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
                      <th className="w-10 px-3 py-3">
                        <span className="sr-only">Select</span>
                      </th>
                      <th className="w-16 px-3 py-3">
                        <span className="sr-only">Thumbnail</span>
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white/40">
                        {t("name")}
                      </th>
                      <th className="hidden px-3 py-3 text-left text-xs font-medium text-white/40 md:table-cell">
                        {t("createdAt")}
                      </th>
                      <th className="hidden px-3 py-3 text-left text-xs font-medium text-white/40 sm:table-cell">
                        {t("createdBy")}
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
                        onClick={() => {
                          if (selectionActive) {
                            toggleSelect(project.id);
                          } else {
                            router.push(`/chat/${project.id}`);
                          }
                        }}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(project.id);
                            }}
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              selectedIds.has(project.id)
                                ? "border-violet-500 bg-violet-600 text-white"
                                : "border-white/20 text-transparent hover:border-white/40"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </td>
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
                            {t("edited")} {timeAgo(project.updatedAt)}
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
                            <Star
                              className={`h-3.5 w-3.5 ${
                                project.starred
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-white/20 hover:text-white/50"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-white/30">
                    {t("noProjectsFound")}
                  </div>
                )}
              </div>
            )}

            {/* Empty state for grid */}
            {!loading &&
              viewMode === "grid" &&
              filtered.length === 0 &&
              search && (
                <div className="py-12 text-center text-sm text-white/30">
                  {t("noProjectsMatch")} &ldquo;{search}&rdquo;
                </div>
              )}
          </div>

          {/* Selection bar */}
          {selectionActive && (
            <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#1a1a1e]/95 px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {selectedIds.size} {t("selected")}
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-sm text-violet-400 transition-colors hover:text-violet-300"
                  >
                    {t("selectAll")} ({filtered.length})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("deleteSelected")}
                  </button>
                  <button
                    onClick={cancelSelection}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {t("cancelSelection")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation dialog */}
          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !deleting && setDeleteConfirmOpen(false)}
              />
              <div
                className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1c20] p-6 shadow-2xl"
                style={{ animation: "fadeInUp 200ms ease-out" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <Trash2 className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {t("deleteProjectConfirm", { count: selectedIds.size })}
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  {t("deleteConfirmMessage")}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deleting}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    {tc("cancel")}
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      tc("delete")
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
