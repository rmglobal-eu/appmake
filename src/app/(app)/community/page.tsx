import { Suspense } from "react";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import CommunityPageClient from "./community-client";

export const metadata = {
  title: "Community - AppMake",
  description: "Explore and discover projects built by the AppMake community.",
};

const CATEGORIES = [
  "All",
  "Landing Pages",
  "Dashboards",
  "E-commerce",
  "Portfolios",
  "SaaS",
  "Blogs",
  "Other",
] as const;

interface SearchParams {
  search?: string;
  category?: string;
  page?: string;
}

async function fetchProjects(searchParams: SearchParams) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const limit = 12;
  const offset = (page - 1) * limit;
  const search = searchParams.search?.trim();
  const category = searchParams.category;

  const conditions = [eq(projects.isPublic, 1)];

  if (search) {
    conditions.push(like(projects.name, `%${search}%`));
  }

  if (category && category !== "All") {
    conditions.push(eq(projects.category, category));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [projectRows, countResult] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        authorName: users.name,
        authorAvatar: users.image,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .where(whereClause)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  const galleryProjects = projectRows.map((row) => ({
    id: row.id,
    name: row.name ?? "Untitled",
    description: row.description ?? undefined,
    thumbnail: undefined,
    author: {
      name: row.authorName ?? "Anonymous",
      avatar: row.authorAvatar ?? undefined,
    },
    likes: 0,
    views: 0,
    createdAt: row.createdAt ?? new Date(),
  }));

  return { projects: galleryProjects, total, page, totalPages: Math.ceil(total / limit) };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await fetchProjects(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
        </div>
      }
    >
      <CommunityPageClient
        initialProjects={data.projects}
        total={data.total}
        currentPage={data.page}
        totalPages={data.totalPages}
        categories={CATEGORIES as unknown as string[]}
        currentSearch={params.search ?? ""}
        currentCategory={params.category ?? "All"}
      />
    </Suspense>
  );
}
