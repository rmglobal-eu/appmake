"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import ProjectGallery from "@/components/community/ProjectGallery";
import type { GalleryProject } from "@/components/community/ProjectCard";

interface CommunityPageClientProps {
  initialProjects: GalleryProject[];
  total: number;
  currentPage: number;
  totalPages: number;
  categories: string[];
  currentSearch: string;
  currentCategory: string;
}

export default function CommunityPageClient({
  initialProjects,
  total,
  currentPage,
  totalPages,
  categories,
  currentSearch,
  currentCategory,
}: CommunityPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "All" && value !== "1") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/community?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchValue, page: "1" });
  }

  function handleCategoryChange(category: string) {
    updateParams({ category, page: "1" });
  }

  function handlePageChange(page: number) {
    updateParams({ page: page.toString() });
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Compass className="h-7 w-7 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Community</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Explore projects built by the AppMake community. Get inspired, remix, and share your own.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </form>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                currentCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="mb-4 text-xs text-zinc-500">
          {total} {total === 1 ? "project" : "projects"} found
          {currentSearch && (
            <span>
              {" "}
              for &ldquo;{currentSearch}&rdquo;
            </span>
          )}
        </div>

        {/* Gallery */}
        <ProjectGallery projects={initialProjects} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const showEllipsis =
                    idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-xs text-zinc-600">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
