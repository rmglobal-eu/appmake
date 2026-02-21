import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { codeReviews, projectFiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import { streamText } from "ai";
import { getModel } from "@/lib/llm/providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, files: clientFiles } = (await req.json()) as {
    projectId: string;
    files?: Record<string, string>;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use client-provided files first, fall back to DB
  let files: Record<string, string> | null = null;
  if (clientFiles && Object.keys(clientFiles).length > 0) {
    files = clientFiles;
  } else {
    const filesRow = await db.query.projectFiles.findFirst({
      where: eq(projectFiles.projectId, projectId),
    });
    if (filesRow) {
      files = JSON.parse(filesRow.files);
    }
  }

  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "No files to review" }, { status: 400 });
  }

  // Build file listing for AI
  const fileContext = Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  const model = getModel("gpt-4.1-mini", "openai");

  const result = await streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are an expert code reviewer. Review the provided codebase and return a JSON response with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary>",
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "file": "<filename>",
      "line": <approximate line number or null>,
      "title": "<short title>",
      "description": "<detailed explanation>",
      "suggestion": "<how to fix it>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"]
}

Review for: code quality, performance, security, accessibility, best practices, and maintainability.
Return ONLY valid JSON, no markdown fences or other text.`,
      },
      {
        role: "user",
        content: `Review this codebase:\n\n${fileContext}`,
      },
    ],
    maxOutputTokens: 4096,
  });

  // Collect full response
  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
  }

  // Parse JSON from response
  try {
    // Strip markdown fences if present
    const jsonStr = fullText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const review = JSON.parse(jsonStr);

    // Save to DB
    await db.insert(codeReviews).values({
      projectId,
      userId: session.user.id,
      summary: review.summary,
      issues: JSON.stringify(review.issues || []),
      score: review.score,
    });

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({
      review: {
        score: null,
        summary: fullText.slice(0, 500),
        issues: [],
        strengths: [],
      },
    });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ reviews: [] });
  }

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await db.select().from(codeReviews)
    .where(eq(codeReviews.projectId, projectId))
    .orderBy(desc(codeReviews.createdAt))
    .limit(10);

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      ...r,
      issues: JSON.parse(r.issues),
    })),
  });
}
