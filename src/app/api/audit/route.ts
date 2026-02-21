import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projectFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import { streamText } from "ai";
import { getModel } from "@/lib/llm/providers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, type, files: clientFiles } = (await req.json()) as {
    projectId: string;
    type: "performance" | "accessibility" | "both";
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
    return NextResponse.json({ error: "No files to audit" }, { status: 400 });
  }
  const fileContext = Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  const auditTypes = type === "both" ? "performance AND accessibility" : type;

  const model = getModel("gpt-4.1-mini", "openai");

  const result = await streamText({
    model,
    messages: [
      {
        role: "system",
        content: `You are a web ${auditTypes} expert. Audit the provided code and return JSON:
{
  "overallScore": <0-100>,
  "categories": {
    "performance": { "score": <0-100>, "issues": [...] },
    "accessibility": { "score": <0-100>, "issues": [...] }
  },
  "issues": [
    {
      "category": "performance" | "accessibility",
      "severity": "critical" | "warning" | "info",
      "file": "<filename>",
      "title": "<short title>",
      "description": "<explanation>",
      "fix": "<suggested fix>"
    }
  ]
}

Check for:
${type !== "accessibility" ? `Performance: unnecessary re-renders, missing keys, large bundle imports, inline styles, unoptimized images, missing lazy loading, heavy computations in render.` : ""}
${type !== "performance" ? `Accessibility: missing alt text, missing ARIA labels, color contrast issues, missing form labels, missing heading hierarchy, keyboard navigation, focus management, missing lang attribute.` : ""}

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Audit this code:\n\n${fileContext}`,
      },
    ],
    maxOutputTokens: 4096,
  });

  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
  }

  try {
    const jsonStr = fullText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const audit = JSON.parse(jsonStr);
    return NextResponse.json({ audit });
  } catch {
    return NextResponse.json({
      audit: {
        overallScore: null,
        issues: [],
        categories: {},
      },
    });
  }
}
