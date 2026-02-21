import { NextRequest, NextResponse } from "next/server";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";

/**
 * GET /api/community?page=1&limit=12&search=todo&category=Dashboards
 *
 * List public projects with pagination, search, and category filtering.
 * Returns { projects: GalleryProject[], total: number, page: number, totalPages: number }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10) || 12)
  );
  const offset = (page - 1) * limit;
  const search = searchParams.get("search")?.trim() || null;
  const category = searchParams.get("category") || null;

  try {
    // Build where conditions
    const conditions = [eq(projects.isPublic, 1)];

    if (search) {
      conditions.push(like(projects.name, `%${search}%`));
    }

    if (category && category !== "All") {
      conditions.push(eq(projects.category, category));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    // Execute query and count in parallel
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

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

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

    return NextResponse.json({
      projects: galleryProjects,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("[API] Community projects fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
