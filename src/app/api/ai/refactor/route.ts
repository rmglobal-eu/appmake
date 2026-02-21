import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { analyzeForRefactoring } from "@/lib/llm/refactoring-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, filePath } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'code' field" },
        { status: 400 }
      );
    }

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'filePath' field" },
        { status: 400 }
      );
    }

    const suggestions = analyzeForRefactoring(code, filePath);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[API /ai/refactor] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
